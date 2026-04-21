import { supabase } from '../lib/supabase'
import type { FutureSelfNoteRow } from '../lib/database.types'
import type { MascotMood, MascotBody } from '../components/MonkeyMascot'

export type SentimentLabel = 'positive' | 'neutral' | 'negative'

export interface FutureSelfNote {
  id: string
  content: string
  sentimentScore: number
  sentimentLabel: SentimentLabel
  /** null means the note isn't fitness-relevant */
  fitnessScore: number | null
  createdAt: string
  updatedAt: string
}

export interface WeekMood {
  mood: MascotMood
  body: MascotBody
  averageScore: number
  fitnessSum: number
  noteCount: number
  fitnessNoteCount: number
  weekStart: string // ISO string of Monday 00:00 local
}

interface SentimentResult {
  score: number
  label: SentimentLabel
  fitness_relevant: boolean
  fitness_score: number
}

function toFutureSelfNote(row: FutureSelfNoteRow): FutureSelfNote {
  return {
    id: row.id,
    content: row.content,
    sentimentScore: row.sentiment_score,
    sentimentLabel: row.sentiment_label,
    fitnessScore: row.fitness_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  return session.user.id
}

/**
 * Get the current user's access_token to pass as Authorization header.
 * Required because supabase.functions.invoke() auto-attaches the publishable
 * key (sb_publishable_*) to Authorization by default, which is NOT a valid JWT
 * and fails edge function JWT verification. We override with the session JWT.
 */
async function getAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return session.access_token
}

/**
 * Monday 00:00 local time of the current week.
 */
export function getWeekStart(now: Date = new Date()): Date {
  const d = new Date(now)
  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat. Shift so Monday = 0.
  const day = d.getDay()
  const daysSinceMonday = (day + 6) % 7
  d.setDate(d.getDate() - daysSinceMonday)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Call the score-sentiment edge function to classify a note.
 *
 * We use raw fetch instead of supabase.functions.invoke() because the
 * functions client has internal header-merging behavior with the new
 * publishable key format (sb_publishable_*) that overrides our custom
 * Authorization header. The edge function runs with verify_jwt=false and
 * validates the JWT internally via the service-role client.
 */
async function scoreSentiment(text: string): Promise<SentimentResult> {
  const accessToken = await getAccessToken()
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

  const response = await fetch(`${supabaseUrl}/functions/v1/score-sentiment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': anonKey,
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    let message = `Sentiment scoring failed (${response.status})`
    try {
      const body = await response.json()
      if (body?.error) message = `${message}: ${body.error}`
      else if (body?.message) message = `${message}: ${body.message}`
    } catch {
      // Body wasn't JSON; use the generic message.
    }
    throw new Error(message)
  }

  const data = (await response.json()) as SentimentResult
  if (
    typeof data.score !== 'number' ||
    !data.label ||
    typeof data.fitness_relevant !== 'boolean' ||
    typeof data.fitness_score !== 'number'
  ) {
    throw new Error('Sentiment scoring returned invalid data')
  }
  return data
}

/**
 * Convert a scoring result to the fitness_score column value.
 * Non-fitness-relevant notes store null so we can distinguish from
 * fitness-relevant notes that happen to score 0.
 */
function fitnessColumnValue(result: SentimentResult): number | null {
  return result.fitness_relevant ? result.fitness_score : null
}

/**
 * Create a new future self note. Scores the sentiment via the edge function,
 * then writes the row to Supabase.
 */
export async function addNote(content: string): Promise<FutureSelfNote> {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('Note content is required')

  const userId = await getUserId()
  const sentiment = await scoreSentiment(trimmed)

  const { data, error } = await supabase
    .from('future_self_notes')
    .insert({
      user_id: userId,
      content: trimmed,
      sentiment_score: sentiment.score,
      sentiment_label: sentiment.label,
      fitness_score: fitnessColumnValue(sentiment),
    })
    .select()
    .single()

  if (error) throw error
  return toFutureSelfNote(data as FutureSelfNoteRow)
}

/**
 * Update an existing note's content and re-score both sentiment and fitness.
 */
export async function updateNote(id: string, content: string): Promise<FutureSelfNote> {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('Note content is required')

  const sentiment = await scoreSentiment(trimmed)

  const { data, error } = await supabase
    .from('future_self_notes')
    .update({
      content: trimmed,
      sentiment_score: sentiment.score,
      sentiment_label: sentiment.label,
      fitness_score: fitnessColumnValue(sentiment),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toFutureSelfNote(data as FutureSelfNoteRow)
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('future_self_notes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

/**
 * Fetch notes from the current calendar week (Monday 00:00 local onward),
 * sorted newest first.
 */
export async function getNotesThisWeek(): Promise<FutureSelfNote[]> {
  const weekStart = getWeekStart().toISOString()
  const { data, error } = await supabase
    .from('future_self_notes')
    .select('*')
    .gte('created_at', weekStart)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => toFutureSelfNote(row as FutureSelfNoteRow))
}

/**
 * Compute the current week's mood and body state from this week's notes.
 *
 * MOOD (general sentiment axis): average of all notes' sentiment scores.
 *   average >= 0.25 → happy
 *   average <= -0.25 → sad
 *   otherwise → neutral
 *
 * BODY (fitness axis): cumulative sum of fitness scores for fitness-relevant
 * notes only (non-relevant notes don't contribute). Aggressive thresholds so
 * individual fitness choices have visible impact. Sum is clamped to [-3, 3]
 * to prevent extreme edge cases.
 *   sum >= +1.5 → very-slim
 *   sum >= +0.4 → slim
 *   sum >  -0.4 → normal
 *   sum >  -1.5 → wide
 *   otherwise   → very-wide
 *
 * Both axes default to the neutral/normal state when there are no relevant notes.
 */
export function computeWeekMood(notes: FutureSelfNote[]): WeekMood {
  const weekStart = getWeekStart().toISOString()

  // Mood axis
  let mood: MascotMood = 'neutral'
  let avg = 0
  if (notes.length > 0) {
    avg = notes.reduce((acc, n) => acc + n.sentimentScore, 0) / notes.length
    if (avg >= 0.25) mood = 'happy'
    else if (avg <= -0.25) mood = 'sad'
  }

  // Body axis (fitness-relevant notes only)
  const fitnessNotes = notes.filter((n) => n.fitnessScore !== null)
  const rawSum = fitnessNotes.reduce((acc, n) => acc + (n.fitnessScore ?? 0), 0)
  const fitnessSum = Math.max(-3, Math.min(3, rawSum))

  let body: MascotBody = 'normal'
  if (fitnessSum >= 1.5) body = 'very-slim'
  else if (fitnessSum >= 0.4) body = 'slim'
  else if (fitnessSum <= -1.5) body = 'very-wide'
  else if (fitnessSum <= -0.4) body = 'wide'

  return {
    mood,
    body,
    averageScore: avg,
    fitnessSum,
    noteCount: notes.length,
    fitnessNoteCount: fitnessNotes.length,
    weekStart,
  }
}

/**
 * Convenience: fetch this week's notes and compute both mood and body aggregates.
 */
export async function getCurrentWeekMood(): Promise<WeekMood> {
  const notes = await getNotesThisWeek()
  return computeWeekMood(notes)
}
