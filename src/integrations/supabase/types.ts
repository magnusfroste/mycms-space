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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          order_index: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          order_index?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          order_index?: number | null
          slug?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_avatar_url: string | null
          author_name: string | null
          content: string
          cover_image_path: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          featured: boolean | null
          id: string
          order_index: number | null
          published_at: string | null
          reading_time_minutes: number | null
          scheduled_for: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string | null
          content?: string
          cover_image_path?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          order_index?: number | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string | null
          content?: string
          cover_image_path?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          id?: string
          order_index?: number | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_analytics: {
        Row: {
          created_at: string
          id: string
          message_count: number
          session_end: string | null
          session_start: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          session_end?: string | null
          session_start?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          session_end?: string | null
          session_start?: string
          visitor_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      github_repo_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_path: string | null
          image_url: string
          order_index: number | null
          repo_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_path?: string | null
          image_url: string
          order_index?: number | null
          repo_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_path?: string | null
          image_url?: string
          order_index?: number | null
          repo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "github_repo_images_repo_id_fkey"
            columns: ["repo_id"]
            isOneToOne: false
            referencedRelation: "github_repos"
            referencedColumns: ["id"]
          },
        ]
      }
      github_repos: {
        Row: {
          created_at: string | null
          created_at_github: string | null
          description: string | null
          enabled: boolean | null
          enriched_description: string | null
          enriched_title: string | null
          forks: number | null
          full_name: string
          github_id: string
          homepage: string | null
          id: string
          is_archived: boolean | null
          is_fork: boolean | null
          language: string | null
          last_synced_at: string | null
          name: string
          order_index: number | null
          problem_statement: string | null
          pushed_at: string | null
          stars: number | null
          topics: string[] | null
          updated_at: string | null
          url: string
          why_it_matters: string | null
        }
        Insert: {
          created_at?: string | null
          created_at_github?: string | null
          description?: string | null
          enabled?: boolean | null
          enriched_description?: string | null
          enriched_title?: string | null
          forks?: number | null
          full_name: string
          github_id: string
          homepage?: string | null
          id?: string
          is_archived?: boolean | null
          is_fork?: boolean | null
          language?: string | null
          last_synced_at?: string | null
          name: string
          order_index?: number | null
          problem_statement?: string | null
          pushed_at?: string | null
          stars?: number | null
          topics?: string[] | null
          updated_at?: string | null
          url: string
          why_it_matters?: string | null
        }
        Update: {
          created_at?: string | null
          created_at_github?: string | null
          description?: string | null
          enabled?: boolean | null
          enriched_description?: string | null
          enriched_title?: string | null
          forks?: number | null
          full_name?: string
          github_id?: string
          homepage?: string | null
          id?: string
          is_archived?: boolean | null
          is_fork?: boolean | null
          language?: string | null
          last_synced_at?: string | null
          name?: string
          order_index?: number | null
          problem_statement?: string | null
          pushed_at?: string | null
          stars?: number | null
          topics?: string[] | null
          updated_at?: string | null
          url?: string
          why_it_matters?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          module_config: Json | null
          module_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          module_config?: Json | null
          module_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          module_config?: Json | null
          module_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nav_links: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          is_external: boolean
          label: string
          order_index: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          is_external?: boolean
          label: string
          order_index: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          is_external?: boolean
          label?: string
          order_index?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          click_count: number | null
          content: string
          created_at: string
          id: string
          open_count: number | null
          recipient_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          click_count?: number | null
          content: string
          created_at?: string
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          click_count?: number | null
          content?: string
          created_at?: string
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_blocks: {
        Row: {
          block_config: Json | null
          block_type: string
          created_at: string | null
          enabled: boolean | null
          id: string
          order_index: number
          page_slug: string
          updated_at: string | null
        }
        Insert: {
          block_config?: Json | null
          block_type: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          order_index: number
          page_slug: string
          updated_at?: string | null
        }
        Update: {
          block_config?: Json | null
          block_type?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          order_index?: number
          page_slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_slug: string
          referrer: string | null
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_slug: string
          referrer?: string | null
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_slug?: string
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          is_main_landing: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_main_landing?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_main_landing?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          old_data: Json
          record_id: string
          table_name: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          old_data: Json
          record_id: string
          table_name: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          old_data?: Json
          record_id?: string
          table_name?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
