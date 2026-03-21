export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          display_name?: string
          avatar_url?: string | null
        }
      }
      events: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          start_date: string | null
          end_date: string | null
          invite_code: string
          status: 'draft' | 'live' | 'ended'
          discord_webhook_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          start_date?: string | null
          end_date?: string | null
          invite_code: string
          status?: 'draft' | 'live' | 'ended'
          discord_webhook_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: 'draft' | 'live' | 'ended'
          discord_webhook_url?: string | null
        }
      }
      event_members: {
        Row: {
          id: string
          event_id: string
          user_id: string
          role: 'owner' | 'moderator' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          role?: 'owner' | 'moderator' | 'member'
          joined_at?: string
        }
        Update: {
          role?: 'owner' | 'moderator' | 'member'
        }
      }
      teams: {
        Row: {
          id: string
          event_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          event_member_id: string
        }
        Insert: {
          id?: string
          team_id: string
          event_member_id: string
        }
        Update: never
      }
      tiles: {
        Row: {
          id: string
          event_id: string
          name: string
          source_raid: string | null
          is_purple: boolean
          sprite_url: string | null
          points: number
          position: number
          free_space: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          source_raid?: string | null
          is_purple?: boolean
          sprite_url?: string | null
          points?: number
          position: number
          free_space?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          source_raid?: string | null
          is_purple?: boolean
          sprite_url?: string | null
          points?: number
          position?: number
          free_space?: boolean
        }
      }
      tile_completions: {
        Row: {
          id: string
          tile_id: string
          team_id: string
          submitted_by: string
          proof_url: string
          status: 'pending' | 'approved' | 'rejected'
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          tile_id: string
          team_id: string
          submitted_by: string
          proof_url: string
          status?: 'pending' | 'approved' | 'rejected'
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventMember = Database['public']['Tables']['event_members']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type TeamMember = Database['public']['Tables']['team_members']['Row']
export type Tile = Database['public']['Tables']['tiles']['Row']
export type TileCompletion = Database['public']['Tables']['tile_completions']['Row']

export type EventRole = 'owner' | 'moderator' | 'member'
export type EventStatus = 'draft' | 'live' | 'ended'
export type CompletionStatus = 'pending' | 'approved' | 'rejected'

// Extended types with joins
export type TileWithCompletions = Tile & {
  tile_completions: TileCompletion[]
}

export type TeamWithMembers = Team & {
  team_members: (TeamMember & {
    event_members: EventMember & {
      users: User
    }
  })[]
}

export type EventWithDetails = Event & {
  event_members: (EventMember & { users: User })[]
  teams: Team[]
}
