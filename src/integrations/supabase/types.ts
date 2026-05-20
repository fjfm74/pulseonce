export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          lineup_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          lineup_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          lineup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "lineups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      league_members: {
        Row: {
          joined_at: string
          league_id: string
          role: Database["public"]["Enums"]["league_role"]
          user_id: string
        }
        Insert: {
          joined_at?: string
          league_id: string
          role?: Database["public"]["Enums"]["league_role"]
          user_id: string
        }
        Update: {
          joined_at?: string
          league_id?: string
          role?: Database["public"]["Enums"]["league_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          active_mode_ids: string[]
          code: string
          created_at: string
          created_by: string | null
          crest_id: string
          id: string
          name: string
        }
        Insert: {
          active_mode_ids?: string[]
          code: string
          created_at?: string
          created_by?: string | null
          crest_id?: string
          id?: string
          name: string
        }
        Update: {
          active_mode_ids?: string[]
          code?: string
          created_at?: string
          created_by?: string | null
          crest_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lineups: {
        Row: {
          author_id: string | null
          code: string
          created_at: string
          forked_from: string | null
          forks_count: number
          formation: string
          id: string
          is_public: boolean
          mode_id: string
          players: Json
          pulses_count: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          code: string
          created_at?: string
          forked_from?: string | null
          forks_count?: number
          formation?: string
          id?: string
          is_public?: boolean
          mode_id: string
          players?: Json
          pulses_count?: number
          title?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          code?: string
          created_at?: string
          forked_from?: string | null
          forks_count?: number
          formation?: string
          id?: string
          is_public?: boolean
          mode_id?: string
          players?: Json
          pulses_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineups_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_forked_from_fkey"
            columns: ["forked_from"]
            isOneToOne: false
            referencedRelation: "lineups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_mode_id_fkey"
            columns: ["mode_id"]
            isOneToOne: false
            referencedRelation: "modes"
            referencedColumns: ["id"]
          },
        ]
      }
      modes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          rules: Json
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          rules?: Json
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rules?: Json
          slug?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          birth_year: number | null
          created_at: string
          id: number
          name: string
          nationality: string | null
          position: Database["public"]["Enums"]["player_position"]
          team_id: number | null
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          id?: number
          name: string
          nationality?: string | null
          position: Database["public"]["Enums"]["player_position"]
          team_id?: number | null
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          id?: number
          name?: string
          nationality?: string | null
          position?: Database["public"]["Enums"]["player_position"]
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_id: string
          birth_year: number
          created_at: string
          email_notifications_enabled: boolean
          favorite_team_id: number | null
          id: string
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
          username: string
        }
        Insert: {
          avatar_id?: string
          birth_year: number
          created_at?: string
          email_notifications_enabled?: boolean
          favorite_team_id?: number | null
          id: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          username: string
        }
        Update: {
          avatar_id?: string
          birth_year?: number
          created_at?: string
          email_notifications_enabled?: boolean
          favorite_team_id?: number | null
          id?: string
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_team_id_fkey"
            columns: ["favorite_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pulses: {
        Row: {
          created_at: string
          lineup_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          lineup_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          lineup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulses_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "lineups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          country: string
          created_at: string
          id: number
          league_external_id: string | null
          name: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: number
          league_external_id?: string | null
          name: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: number
          league_external_id?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_league_member: {
        Args: { _league_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      league_role: "admin" | "member"
      player_position: "GK" | "DF" | "MF" | "FW"
      profile_status: "active" | "deleted" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      league_role: ["admin", "member"],
      player_position: ["GK", "DF", "MF", "FW"],
      profile_status: ["active", "deleted", "suspended"],
    },
  },
} as const
