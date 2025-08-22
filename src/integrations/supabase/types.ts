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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      crash_reports: {
        Row: {
          app_version: string
          crash_id: string
          created_at: string
          device_info: Json
          id: string
          platform: string
          stack_trace: string
          timestamp: string
          user_actions: string[] | null
          user_id: string | null
        }
        Insert: {
          app_version: string
          crash_id: string
          created_at?: string
          device_info: Json
          id?: string
          platform: string
          stack_trace: string
          timestamp?: string
          user_actions?: string[] | null
          user_id?: string | null
        }
        Update: {
          app_version?: string
          crash_id?: string
          created_at?: string
          device_info?: Json
          id?: string
          platform?: string
          stack_trace?: string
          timestamp?: string
          user_actions?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      error_reports: {
        Row: {
          context: Json | null
          created_at: string
          error_message: string
          error_type: string
          id: string
          resolved: boolean
          session_id: string
          severity: string
          stack_trace: string | null
          timestamp: string
          updated_at: string
          url: string
          user_agent: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          resolved?: boolean
          session_id: string
          severity: string
          stack_trace?: string | null
          timestamp?: string
          updated_at?: string
          url: string
          user_agent: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          resolved?: boolean
          session_id?: string
          severity?: string
          stack_trace?: string | null
          timestamp?: string
          updated_at?: string
          url?: string
          user_agent?: string
          user_id?: string | null
        }
        Relationships: []
      }
      extractions: {
        Row: {
          created_at: string
          extracted_json: Json
          id: string
          label_id: string | null
          model_version: string
          quality_score: number | null
          risk_flags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          extracted_json: Json
          id?: string
          label_id?: string | null
          model_version?: string
          quality_score?: number | null
          risk_flags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          extracted_json?: Json
          id?: string
          label_id?: string | null
          model_version?: string
          quality_score?: number | null
          risk_flags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extractions_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      family_groups: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          family_group_id: string
          id: string
          invitation_status: string
          invited_at: string
          invited_by: string | null
          permissions: Json
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          family_group_id: string
          id?: string
          invitation_status?: string
          invited_at?: string
          invited_by?: string | null
          permissions?: Json
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          family_group_id?: string
          id?: string
          invitation_status?: string
          invited_at?: string
          invited_by?: string | null
          permissions?: Json
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          issue_type: string | null
          rating: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          issue_type?: string | null
          rating?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          issue_type?: string | null
          rating?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          checksum: string | null
          created_at: string
          id: string
          language: string
          product_id: string | null
          raw_text: string | null
          region: string
          source_name: string | null
          source_url: string | null
          updated_at: string
          version_date: string | null
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          id?: string
          language?: string
          product_id?: string | null
          raw_text?: string | null
          region?: string
          source_name?: string | null
          source_url?: string | null
          updated_at?: string
          version_date?: string | null
        }
        Update: {
          checksum?: string | null
          created_at?: string
          id?: string
          language?: string
          product_id?: string | null
          raw_text?: string | null
          region?: string
          source_name?: string | null
          source_url?: string | null
          updated_at?: string
          version_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_interactions: {
        Row: {
          created_at: string
          description: string
          evidence_level: string | null
          id: string
          interaction_type: string
          management_advice: string | null
          medication_a_id: string | null
          medication_b_id: string | null
          severity_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          evidence_level?: string | null
          id?: string
          interaction_type: string
          management_advice?: string | null
          medication_a_id?: string | null
          medication_b_id?: string | null
          severity_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          evidence_level?: string | null
          id?: string
          interaction_type?: string
          management_advice?: string | null
          medication_a_id?: string | null
          medication_b_id?: string | null
          severity_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_interactions_medication_a_id_fkey"
            columns: ["medication_a_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_interactions_medication_b_id_fkey"
            columns: ["medication_b_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_reminders: {
        Row: {
          created_at: string
          days_of_week: number[]
          id: string
          is_active: boolean
          medication_id: string
          notification_settings: Json
          reminder_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_active?: boolean
          medication_id: string
          notification_settings?: Json
          reminder_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          id?: string
          is_active?: boolean
          medication_id?: string
          notification_settings?: Json
          reminder_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_reminders_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "user_medications"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_labels: {
        Row: {
          created_at: string
          id: string
          label_file_url: string | null
          partner_id: string | null
          product_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label_file_url?: string | null
          partner_id?: string | null
          product_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label_file_url?: string | null
          partner_id?: string | null
          product_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_labels_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_labels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          metric_name: string
          metric_value: number
          session_id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          metric_name: string
          metric_value: number
          session_id: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: number
          session_id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pharmacy_partners: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          name: string
          verified: boolean | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          verified?: boolean | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active_ingredients: string[] | null
          atc_code: string | null
          barcode: string | null
          brand_name: string
          country_code: string
          created_at: string
          data_source: string | null
          dosage_forms: string[] | null
          expiry_monitoring: boolean | null
          form: string | null
          generic_name: string | null
          id: string
          image_url: string | null
          leaflet_url: string | null
          manufacturer: string | null
          prescription_required: boolean | null
          safety_warnings: string[] | null
          search_keywords: string[] | null
          storage_conditions: string | null
          strength: string | null
          therapeutic_class: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          active_ingredients?: string[] | null
          atc_code?: string | null
          barcode?: string | null
          brand_name: string
          country_code?: string
          created_at?: string
          data_source?: string | null
          dosage_forms?: string[] | null
          expiry_monitoring?: boolean | null
          form?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          leaflet_url?: string | null
          manufacturer?: string | null
          prescription_required?: boolean | null
          safety_warnings?: string[] | null
          search_keywords?: string[] | null
          storage_conditions?: string | null
          strength?: string | null
          therapeutic_class?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          active_ingredients?: string[] | null
          atc_code?: string | null
          barcode?: string | null
          brand_name?: string
          country_code?: string
          created_at?: string
          data_source?: string | null
          dosage_forms?: string[] | null
          expiry_monitoring?: boolean | null
          form?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          leaflet_url?: string | null
          manufacturer?: string | null
          prescription_required?: boolean | null
          safety_warnings?: string[] | null
          search_keywords?: string[] | null
          storage_conditions?: string | null
          strength?: string | null
          therapeutic_class?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          barcode_value: string | null
          created_at: string
          extraction_id: string | null
          id: string
          images: string[] | null
          language: string
          region: string
          selected_product_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          barcode_value?: string | null
          created_at?: string
          extraction_id?: string | null
          id?: string
          images?: string[] | null
          language?: string
          region?: string
          selected_product_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          barcode_value?: string | null
          created_at?: string
          extraction_id?: string | null
          id?: string
          images?: string[] | null
          language?: string
          region?: string
          selected_product_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_selected_product_id_fkey"
            columns: ["selected_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_medications: {
        Row: {
          created_at: string
          family_group_id: string
          id: string
          medication_id: string
          shared_by: string
          sharing_permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_group_id: string
          id?: string
          medication_id: string
          shared_by: string
          sharing_permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_group_id?: string
          id?: string
          medication_id?: string
          shared_by?: string
          sharing_permissions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_medications_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "user_medications"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_analytics: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          platform: string | null
          session_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          platform?: string | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          platform?: string | null
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      user_medications: {
        Row: {
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          generic_name: string | null
          id: string
          is_active: boolean
          medication_name: string
          notes: string | null
          prescriber: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          generic_name?: string | null
          id?: string
          is_active?: boolean
          medication_name: string
          notes?: string | null
          prescriber?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          generic_name?: string | null
          id?: string
          is_active?: boolean
          medication_name?: string
          notes?: string | null
          prescriber?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      error_summary: {
        Row: {
          count: number | null
          date: string | null
          error_type: string | null
          severity: string | null
          unique_sessions: number | null
        }
        Relationships: []
      }
      performance_summary: {
        Row: {
          avg_value: number | null
          hour: string | null
          max_value: number | null
          metric_name: string | null
          min_value: number | null
          sample_count: number | null
        }
        Relationships: []
      }
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
