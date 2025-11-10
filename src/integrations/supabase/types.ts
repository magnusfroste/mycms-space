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
      about_me_settings: {
        Row: {
          additional_text: string
          created_at: string
          id: string
          image_url: string | null
          intro_text: string
          name: string
          skill1_description: string
          skill1_icon: string
          skill1_title: string
          skill2_description: string
          skill2_icon: string
          skill2_title: string
          skill3_description: string
          skill3_icon: string
          skill3_title: string
          updated_at: string
        }
        Insert: {
          additional_text?: string
          created_at?: string
          id?: string
          image_url?: string | null
          intro_text?: string
          name?: string
          skill1_description?: string
          skill1_icon?: string
          skill1_title?: string
          skill2_description?: string
          skill2_icon?: string
          skill2_title?: string
          skill3_description?: string
          skill3_icon?: string
          skill3_title?: string
          updated_at?: string
        }
        Update: {
          additional_text?: string
          created_at?: string
          id?: string
          image_url?: string | null
          intro_text?: string
          name?: string
          skill1_description?: string
          skill1_icon?: string
          skill1_title?: string
          skill2_description?: string
          skill2_icon?: string
          skill2_title?: string
          skill3_description?: string
          skill3_icon?: string
          skill3_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          name: string
          order_index: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          order_index: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_settings: {
        Row: {
          active_placeholder: string
          created_at: string
          id: string
          initial_placeholder: string
          updated_at: string
          webhook_url: string
        }
        Insert: {
          active_placeholder?: string
          created_at?: string
          id?: string
          initial_placeholder?: string
          updated_at?: string
          webhook_url?: string
        }
        Update: {
          active_placeholder?: string
          created_at?: string
          id?: string
          initial_placeholder?: string
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      expertise_areas: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          icon: string
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          enabled?: boolean
          icon?: string
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          icon?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_in: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          id: string
          image_path: string | null
          image_url: string | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          enabled?: boolean
          id?: string
          image_path?: string | null
          image_url?: string | null
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          image_path?: string | null
          image_url?: string | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_settings: {
        Row: {
          animation_style: string
          created_at: string
          enable_animations: boolean
          feature1: string
          feature1_icon: string
          feature2: string
          feature2_icon: string
          feature3: string
          feature3_icon: string
          id: string
          name: string
          tagline: string
          updated_at: string
        }
        Insert: {
          animation_style?: string
          created_at?: string
          enable_animations?: boolean
          feature1?: string
          feature1_icon?: string
          feature2?: string
          feature2_icon?: string
          feature3?: string
          feature3_icon?: string
          id?: string
          name?: string
          tagline?: string
          updated_at?: string
        }
        Update: {
          animation_style?: string
          created_at?: string
          enable_animations?: boolean
          feature1?: string
          feature1_icon?: string
          feature2?: string
          feature2_icon?: string
          feature3?: string
          feature3_icon?: string
          id?: string
          name?: string
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_images: {
        Row: {
          created_at: string
          id: string
          image_path: string
          image_url: string
          order_index: number
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          image_url: string
          order_index?: number
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          image_url?: string
          order_index?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          demo_link: string
          description: string
          enabled: boolean
          id: string
          order_index: number
          problem_statement: string | null
          title: string
          updated_at: string
          why_built: string | null
        }
        Insert: {
          created_at?: string
          demo_link?: string
          description: string
          enabled?: boolean
          id?: string
          order_index: number
          problem_statement?: string | null
          title: string
          updated_at?: string
          why_built?: string | null
        }
        Update: {
          created_at?: string
          demo_link?: string
          description?: string
          enabled?: boolean
          id?: string
          order_index?: number
          problem_statement?: string | null
          title?: string
          updated_at?: string
          why_built?: string | null
        }
        Relationships: []
      }
      quick_actions: {
        Row: {
          created_at: string
          enabled: boolean
          icon: string
          id: string
          label: string
          message: string
          order_index: number
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          icon: string
          id?: string
          label: string
          message: string
          order_index: number
        }
        Update: {
          created_at?: string
          enabled?: boolean
          icon?: string
          id?: string
          label?: string
          message?: string
          order_index?: number
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
