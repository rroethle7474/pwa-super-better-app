export interface Database {
  // Required by @supabase/supabase-js >= 2.46 for type inference.
  // Without this the schema fails the GenericSchema check and Insert/Update
  // types silently resolve to `never`.
  __InternalSupabase: {
    PostgrestVersion: '12'
  }
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
        Update: {
          id?: string
          user_id?: string
          title?: string
          prompt?: string
          follow_up_label?: string
          type?: 'yesno' | 'number'
          unit?: string | null
          positive_answer?: boolean
          active?: boolean
          created_at?: string
        }
        Relationships: []
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
        Update: {
          id?: string
          user_id?: string
          date?: string
          completed_at?: string
        }
        Relationships: []
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
        Update: {
          id?: string
          entry_id?: string
          question_id?: string
          answer?: boolean
          details?: string
          numeric_value?: number | null
        }
        Relationships: []
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
        Update: {
          id?: string
          user_id?: string
          description?: string
          target_value?: number
          target_date?: string
          question_id?: string
          created_at?: string
          completed_at?: string | null
          active?: boolean
        }
        Relationships: []
      }
      future_self_notes: {
        Row: {
          id: string
          user_id: string
          content: string
          sentiment_score: number
          sentiment_label: 'positive' | 'neutral' | 'negative'
          fitness_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          sentiment_score: number
          sentiment_label: 'positive' | 'neutral' | 'negative'
          fitness_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          sentiment_score?: number
          sentiment_label?: 'positive' | 'neutral' | 'negative'
          fitness_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

// Convenience type aliases
export type QuestionRow = Database['public']['Tables']['questions']['Row']
export type EntryRow = Database['public']['Tables']['entries']['Row']
export type AnswerRow = Database['public']['Tables']['answers']['Row']
export type GoalRow = Database['public']['Tables']['goals']['Row']
export type FutureSelfNoteRow = Database['public']['Tables']['future_self_notes']['Row']

// Entry with nested answers (from a joined query)
export type EntryWithAnswers = EntryRow & { answers: AnswerRow[] }
