import { supabase } from '../lib/supabase'
import type { GoalRow } from '../lib/database.types'
import type { DailyEntry } from './storage'

export interface Goal {
  id: string
  description: string
  targetValue: number
  targetDate: string
  questionId: string
  createdAt: string
  completedAt?: string
  active: boolean
}

export interface GoalProgress {
  current: number
  target: number
  percentage: number
  daysRemaining: number
}

function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    description: row.description,
    targetValue: row.target_value,
    targetDate: row.target_date,
    questionId: row.question_id,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    active: row.active,
  }
}

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')
  return session.user.id
}

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at')

  if (error) throw error
  return (data ?? []).map(toGoal)
}

export async function getActiveGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('active', true)
    .order('created_at')

  if (error) throw error
  return (data ?? []).map(toGoal)
}

export async function addGoal(
  description: string,
  targetValue: number,
  targetDate: string,
  questionId: string,
): Promise<Goal> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      description,
      target_value: targetValue,
      target_date: targetDate,
      question_id: questionId,
      active: true,
    })
    .select()
    .single()

  if (error) throw error
  return toGoal(data)
}

export async function updateGoal(
  id: string,
  description: string,
  targetValue: number,
  targetDate: string,
  questionId: string,
): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update({
      description,
      target_value: targetValue,
      target_date: targetDate,
      question_id: questionId,
    })
    .eq('id', id)

  if (error) throw error
}

export async function archiveGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
}

export async function restoreGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update({ active: true })
    .eq('id', id)

  if (error) throw error
}

export async function markGoalCompleted(id: string): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
    .is('completed_at', null)

  if (error) throw error
}

// Accept entries as parameter to avoid redundant fetches
export function getGoalProgress(goal: Goal, entries: DailyEntry[]): GoalProgress {
  const createdDate = goal.createdAt.split('T')[0]

  let current = 0
  for (const entry of entries) {
    if (entry.date >= createdDate && entry.date <= goal.targetDate) {
      const answer = entry.answers.find((a) => a.questionId === goal.questionId)
      if (answer?.numericValue != null) {
        current += answer.numericValue
      }
    }
  }

  const percentage = goal.targetValue > 0
    ? Math.min(Math.round((current / goal.targetValue) * 100), 100)
    : 0

  const today = new Date()
  const target = new Date(goal.targetDate + 'T00:00:00')
  const diffMs = target.getTime() - today.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  return { current, target: goal.targetValue, percentage, daysRemaining }
}

export async function clearGoals(): Promise<void> {
  await supabase.from('goals').delete().neq('id', '')
}
