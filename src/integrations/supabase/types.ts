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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          paper_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          paper_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          paper_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_papers: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          paper_id: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          paper_id: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          paper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_papers_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "paper_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_papers_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_upvotes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_upvotes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "paper_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_events: {
        Row: {
          board: string | null
          class_level: string | null
          color: string | null
          created_at: string | null
          description: string | null
          exam_date: string
          id: string
          reminder_days: number[] | null
          subject: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          board?: string | null
          class_level?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          exam_date: string
          id?: string
          reminder_days?: number[] | null
          subject?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          board?: string | null
          class_level?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          exam_date?: string
          id?: string
          reminder_days?: number[] | null
          subject?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exam_reminders: {
        Row: {
          created_at: string | null
          exam_event_id: string
          id: string
          is_sent: boolean | null
          reminder_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_event_id: string
          id?: string
          is_sent?: boolean | null
          reminder_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_event_id?: string
          id?: string
          is_sent?: boolean | null
          reminder_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_reminders_exam_event_id_fkey"
            columns: ["exam_event_id"]
            isOneToOne: false
            referencedRelation: "exam_events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_collections: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          papers_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          papers_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          papers_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      paper_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_solution: boolean | null
          paper_id: string
          parent_id: string | null
          updated_at: string | null
          upvotes_count: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          paper_id: string
          parent_id?: string | null
          updated_at?: string | null
          upvotes_count?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          paper_id?: string
          parent_id?: string | null
          updated_at?: string | null
          upvotes_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_comments_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "paper_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_metric_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          identifier_hash: string
          paper_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          identifier_hash: string
          paper_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          identifier_hash?: string
          paper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_metric_events_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_ratings: {
        Row: {
          created_at: string | null
          difficulty: string
          id: string
          paper_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          difficulty: string
          id?: string
          paper_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          difficulty?: string
          id?: string
          paper_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_ratings_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_requests: {
        Row: {
          board: string
          class_level: string
          created_at: string | null
          description: string | null
          exam_type: string | null
          fulfilled_by_paper_id: string | null
          id: string
          status: string | null
          subject: string
          title: string
          updated_at: string | null
          upvotes_count: number | null
          user_id: string
          year: number | null
        }
        Insert: {
          board: string
          class_level: string
          created_at?: string | null
          description?: string | null
          exam_type?: string | null
          fulfilled_by_paper_id?: string | null
          id?: string
          status?: string | null
          subject: string
          title: string
          updated_at?: string | null
          upvotes_count?: number | null
          user_id: string
          year?: number | null
        }
        Update: {
          board?: string
          class_level?: string
          created_at?: string | null
          description?: string | null
          exam_type?: string | null
          fulfilled_by_paper_id?: string | null
          id?: string
          status?: string | null
          subject?: string
          title?: string
          updated_at?: string | null
          upvotes_count?: number | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paper_requests_fulfilled_by_paper_id_fkey"
            columns: ["fulfilled_by_paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          board: string | null
          class_level: string | null
          course: string | null
          created_at: string | null
          full_name: string | null
          id: string
          semester: number | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          board?: string | null
          class_level?: string | null
          course?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          semester?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          board?: string | null
          class_level?: string | null
          course?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          semester?: number | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          board: string | null
          class_level: string | null
          course: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          board?: string | null
          class_level?: string | null
          course?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          board?: string | null
          class_level?: string | null
          course?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_papers: {
        Row: {
          additional_file_urls: string[] | null
          avg_difficulty: string | null
          board: string
          class_level: string
          created_at: string | null
          description: string | null
          downloads_count: number | null
          exam_type: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          institute_name: string | null
          internal_number: number | null
          ratings_count: number | null
          semester: number | null
          status: string | null
          subject: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
          year: number
        }
        Insert: {
          additional_file_urls?: string[] | null
          avg_difficulty?: string | null
          board: string
          class_level: string
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          exam_type: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          institute_name?: string | null
          internal_number?: number | null
          ratings_count?: number | null
          semester?: number | null
          status?: string | null
          subject: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
          year: number
        }
        Update: {
          additional_file_urls?: string[] | null
          avg_difficulty?: string | null
          board?: string
          class_level?: string
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          exam_type?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          institute_name?: string | null
          internal_number?: number | null
          ratings_count?: number | null
          semester?: number | null
          status?: string | null
          subject?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
          year?: number
        }
        Relationships: []
      }
      request_upvotes: {
        Row: {
          created_at: string | null
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_upvotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "paper_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      solution_papers: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_verified: boolean | null
          question_paper_id: string
          solution_file_name: string
          solution_file_url: string
          updated_at: string | null
          uploaded_by: string
          upvotes_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          question_paper_id: string
          solution_file_name: string
          solution_file_url: string
          updated_at?: string | null
          uploaded_by: string
          upvotes_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          question_paper_id?: string
          solution_file_name?: string
          solution_file_url?: string
          updated_at?: string | null
          uploaded_by?: string
          upvotes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solution_papers_question_paper_id_fkey"
            columns: ["question_paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      solution_upvotes: {
        Row: {
          created_at: string | null
          id: string
          solution_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          solution_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          solution_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solution_upvotes_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solution_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      study_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          paper_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          paper_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          paper_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_downloads: {
        Row: {
          downloaded_at: string | null
          id: string
          paper_id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          paper_id: string
          user_id: string
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          paper_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_downloads_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_paper_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          paper_id: string
          score: number | null
          status: string
          time_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paper_id: string
          score?: number | null
          status: string
          time_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paper_id?: string
          score?: number | null
          status?: string
          time_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_paper_progress_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "question_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_trending_score: {
        Args: { p_paper_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_downloads: { Args: { _paper_id: string }; Returns: undefined }
      increment_views: { Args: { _paper_id: string }; Returns: undefined }
      verify_admin_access: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
