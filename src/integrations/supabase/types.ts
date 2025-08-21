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
          atc_code: string | null
          barcode: string | null
          brand_name: string
          country_code: string
          created_at: string
          form: string | null
          generic_name: string | null
          id: string
          manufacturer: string | null
          strength: string | null
          updated_at: string
        }
        Insert: {
          atc_code?: string | null
          barcode?: string | null
          brand_name: string
          country_code?: string
          created_at?: string
          form?: string | null
          generic_name?: string | null
          id?: string
          manufacturer?: string | null
          strength?: string | null
          updated_at?: string
        }
        Update: {
          atc_code?: string | null
          barcode?: string | null
          brand_name?: string
          country_code?: string
          created_at?: string
          form?: string | null
          generic_name?: string | null
          id?: string
          manufacturer?: string | null
          strength?: string | null
          updated_at?: string
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
