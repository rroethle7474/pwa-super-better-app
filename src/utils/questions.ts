import { supabase } from '../lib/supabase'
import type { QuestionRow } from '../lib/database.types'

export type QuestionType = 'yesno' | 'number';

export interface Question {
  id: string;
  title: string;
  prompt: string;
  followUpLabel: string;
  type: QuestionType;
  unit?: string;
  positiveAnswer: boolean;
  active: boolean;
  createdAt: string;
}

// Convert DB row to app Question shape
function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    followUpLabel: row.follow_up_label,
    type: row.type as QuestionType,
    unit: row.unit ?? undefined,
    positiveAnswer: row.positive_answer,
    active: row.active,
    createdAt: row.created_at,
  }
}

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  return session.user.id
}

export async function getQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at')

  if (error) throw error
  return (data ?? []).map(toQuestion)
}

export async function getActiveQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .order('created_at')

  if (error) throw error
  return (data ?? []).map(toQuestion)
}

export async function getQuestionById(id: string): Promise<Question | undefined> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? toQuestion(data) : undefined
}

export async function addQuestion(
  title: string,
  prompt: string,
  followUpLabel: string,
  type: QuestionType = 'yesno',
  unit?: string,
  positiveAnswer: boolean = true,
): Promise<Question> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('questions')
    .insert({
      user_id: userId,
      title,
      prompt,
      follow_up_label: followUpLabel,
      type,
      unit: unit ?? null,
      positive_answer: positiveAnswer,
      active: true,
    })
    .select()
    .single()

  if (error) throw error
  return toQuestion(data)
}

export async function updateQuestion(
  id: string,
  title: string,
  prompt: string,
  followUpLabel: string,
  type: QuestionType = 'yesno',
  unit?: string,
  positiveAnswer: boolean = true,
): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .update({
      title,
      prompt,
      follow_up_label: followUpLabel,
      type,
      unit: unit ?? null,
      positive_answer: positiveAnswer,
    })
    .eq('id', id)

  if (error) throw error
}

export async function archiveQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
}

export async function restoreQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .update({ active: true })
    .eq('id', id)

  if (error) throw error
}

export async function deleteQuestion(id: string): Promise<boolean> {
  // Check if any answers reference this question
  const { count } = await supabase
    .from('answers')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', id)

  if (count && count > 0) return false

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function clearQuestions(): Promise<void> {
  await supabase.from('questions').delete().neq('id', '')
}
