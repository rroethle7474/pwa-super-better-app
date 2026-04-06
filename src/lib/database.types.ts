export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string
          user_id: string
          title: string
          prompt: string
          follow_up_label: string
          type: 'yesno' | 'number'
          unit: string | null
          positive_answer: boolean
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          prompt: string
          follow_up_label: string
          type: 'yesno' | 'number'
          unit?: string | null
          positive_answer?: boolean
          active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['questions']['Insert']>
      }
      entries: {
        Row: {
          id: string
          user_id: string
          date: string
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          completed_at: string
        }
        Update: Partial<Database['public']['Tables']['entries']['Insert']>
      }
      answers: {
        Row: {
          id: string
          entry_id: string
          question_id: string
          answer: boolean
          details: string
          numeric_value: number | null
        }
        Insert: {
          id?: string
          entry_id: string
          question_id: string
          answer: boolean
          details?: string
          numeric_value?: number | null
        }
        Update: Partial<Database['public']['Tables']['answers']['Insert']>
      }
      goals: {
        Row: {
          id: string
          user_id: string
          description: string
          target_value: number
          target_date: string
          question_id: string
          created_at: string
          completed_at: string | null
          active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          target_value: number
          target_date: string
          question_id: string
          created_at?: string
          completed_at?: string | null
          active?: boolean
        }
        Update: Partial<Database['public']['Tables']['goals']['Insert']>
      }
    }
  }
}

// Convenience type aliases
export type QuestionRow = Database['public']['Tables']['questions']['Row']
export type EntryRow = Database['public']['Tables']['entries']['Row']
export type AnswerRow = Database['public']['Tables']['answers']['Row']
export type GoalRow = Database['public']['Tables']['goals']['Row']

// Entry with nested answers (from a joined query)
export type EntryWithAnswers = EntryRow & { answers: AnswerRow[] }
