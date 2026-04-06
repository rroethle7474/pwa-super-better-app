import { supabase } from '../lib/supabase'
import type { EntryWithAnswers } from '../lib/database.types'
import { clearQuestions } from './questions'
import { clearGoals } from './goals'

export interface AnswerEntry {
  questionId: string;
  answer: boolean;
  details: string;
  numericValue?: number | null;
}

export interface DailyEntry {
  date: string;
  answers: AnswerEntry[];
  completedAt: string;
}

// Convert DB rows to app DailyEntry shape
function toDailyEntry(row: EntryWithAnswers): DailyEntry {
  return {
    date: row.date,
    completedAt: row.completed_at,
    answers: (row.answers ?? []).map((a) => ({
      questionId: a.question_id,
      answer: a.answer,
      details: a.details,
      numericValue: a.numeric_value,
    })),
  }
}

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  return session.user.id
}

export function getTodayKey(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function saveEntry(entry: DailyEntry): Promise<void> {
  const userId = await getUserId()

  // Insert the entry
  const { data: entryRow, error: entryError } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      date: entry.date,
      completed_at: entry.completedAt,
    })
    .select()
    .single()

  if (entryError) throw entryError

  // Insert all answers
  const answerRows = entry.answers.map((a) => ({
    entry_id: entryRow.id,
    question_id: a.questionId,
    answer: a.answer,
    details: a.details,
    numeric_value: a.numericValue ?? null,
  }))

  if (answerRows.length > 0) {
    const { error: answersError } = await supabase
      .from('answers')
      .insert(answerRows)

    if (answersError) throw answersError
  }
}

export async function getEntry(date: string): Promise<DailyEntry | null> {
  const { data, error } = await supabase
    .from('entries')
    .select('*, answers(*)')
    .eq('date', date)
    .maybeSingle()

  if (error) throw error
  return data ? toDailyEntry(data as EntryWithAnswers) : null
}

export async function getTodayEntry(): Promise<DailyEntry | null> {
  return getEntry(getTodayKey())
}

export async function getAllEntries(): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*, answers(*)')
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => toDailyEntry(row as EntryWithAnswers))
}

export async function searchEntries(query: string): Promise<DailyEntry[]> {
  const all = await getAllEntries()
  if (!query.trim()) return all

  const lower = query.toLowerCase()
  return all.filter((entry) => {
    return (
      entry.date.toLowerCase().includes(lower) ||
      entry.answers.some((a) => a.details.toLowerCase().includes(lower))
    )
  })
}

export async function getEntriesInRange(start: string, end: string): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*, answers(*)')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => toDailyEntry(row as EntryWithAnswers))
}

export async function deleteEntry(date: string): Promise<void> {
  // CASCADE will delete answers too
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('date', date)

  if (error) throw error
}

export async function purgeAllData(): Promise<void> {
  // Delete all user data from cloud (RLS scopes to current user)
  await supabase.from('entries').delete().neq('id', '')
  await supabase.from('goals').delete().neq('id', '')
  await supabase.from('questions').delete().neq('id', '')

  // Clear local caches
  localStorage.removeItem('daily_quote')
  localStorage.removeItem('daily_image')
}

export async function exportAllEntries(): Promise<string> {
  const [questions, goals, entries] = await Promise.all([
    supabase.from('questions').select('*').order('created_at'),
    supabase.from('goals').select('*').order('created_at'),
    getAllEntries(),
  ])

  return JSON.stringify({
    questions: questions.data ?? [],
    goals: goals.data ?? [],
    entries,
  }, null, 2)
}
