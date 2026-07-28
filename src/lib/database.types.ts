import type { CareScheduleEntry, DogSize, TaskStatus, TaskType } from '../types'

// Hand-written types matching supabase/schema.sql.
// If the schema changes, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
// (and reconcile with the hand-tuned bits below, e.g. care_schedule's JSON shape).

export interface Database {
  public: {
    Tables: {
      dogs: {
        Relationships: []
        Row: {
          id: string
          owner_id: string
          name: string
          breed: string
          size: DogSize
          owner_name: string
          owner_contact: string
          photo_url: string | null
          behavior_notes: string
          food_notes: string
          medication_notes: string
          walk_notes: string
          emergency_notes: string
          care_schedule: CareScheduleEntry[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          breed?: string
          size?: DogSize
          owner_name?: string
          owner_contact?: string
          photo_url?: string | null
          behavior_notes?: string
          food_notes?: string
          medication_notes?: string
          walk_notes?: string
          emergency_notes?: string
          care_schedule?: CareScheduleEntry[]
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['dogs']['Insert']>
      }
      stays: {
        Relationships: []
        Row: {
          id: string
          owner_id: string
          dog_id: string
          start_date: string
          end_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          dog_id: string
          start_date: string
          end_date: string
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['stays']['Insert']>
      }
      tasks: {
        Relationships: []
        Row: {
          id: string
          owner_id: string
          stay_id: string
          dog_id: string
          dog_name: string
          type: TaskType
          title: string
          scheduled_time: string
          note: string | null
          status: TaskStatus
          completed_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          stay_id: string
          dog_id: string
          dog_name: string
          type: TaskType
          title: string
          scheduled_time: string
          note?: string | null
          status?: TaskStatus
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
