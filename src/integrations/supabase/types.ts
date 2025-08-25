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
      api_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          is_blocked: boolean
          request_count: number
          updated_at: string
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          is_blocked?: boolean
          request_count?: number
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          is_blocked?: boolean
          request_count?: number
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      care_tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          family_group_id: string
          id: string
          priority: string
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          family_group_id: string
          id?: string
          priority?: string
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          family_group_id?: string
          id?: string
          priority?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          created_at: string
          delivered_at: string | null
          family_group_id: string
          id: string
          is_emergency: boolean
          message_content: string | null
          message_data: Json | null
          message_type: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          family_group_id: string
          id?: string
          is_emergency?: boolean
          message_content?: string | null
          message_data?: Json | null
          message_type: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          family_group_id?: string
          id?: string
          is_emergency?: boolean
          message_content?: string | null
          message_data?: Json | null
          message_type?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      device_tokens: {
        Row: {
          app_version: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          platform: string
          token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string
          priority: number
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone: string
          priority?: number
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          priority?: number
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      family_activity_log: {
        Row: {
          activity_data: Json
          activity_type: string
          created_at: string
          family_group_id: string
          id: string
          priority: string
          user_id: string
        }
        Insert: {
          activity_data?: Json
          activity_type: string
          created_at?: string
          family_group_id: string
          id?: string
          priority?: string
          user_id: string
        }
        Update: {
          activity_data?: Json
          activity_type?: string
          created_at?: string
          family_group_id?: string
          id?: string
          priority?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_activity_log_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_appointments: {
        Row: {
          appointment_date: string
          appointment_type: string
          created_at: string
          created_by: string
          description: string | null
          duration_minutes: number | null
          family_group_id: string
          id: string
          location: string | null
          patient_id: string
          provider_contact: string | null
          provider_name: string | null
          reminder_sent: boolean
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          family_group_id: string
          id?: string
          location?: string | null
          patient_id: string
          provider_contact?: string | null
          provider_name?: string | null
          reminder_sent?: boolean
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          family_group_id?: string
          id?: string
          location?: string | null
          patient_id?: string
          provider_contact?: string | null
          provider_name?: string | null
          reminder_sent?: boolean
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_appointments_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      family_health_insights: {
        Row: {
          created_at: string
          expires_at: string | null
          family_group_id: string
          id: string
          insight_data: Json
          insight_type: string
          is_actionable: boolean
          priority: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          family_group_id: string
          id?: string
          insight_data?: Json
          insight_type: string
          is_actionable?: boolean
          priority?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          family_group_id?: string
          id?: string
          insight_data?: Json
          insight_type?: string
          is_actionable?: boolean
          priority?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_health_insights_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
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
      location_sharing: {
        Row: {
          accuracy: number | null
          address: string | null
          created_at: string
          expires_at: string | null
          family_group_id: string
          id: string
          is_emergency: boolean
          latitude: number | null
          longitude: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          address?: string | null
          created_at?: string
          expires_at?: string | null
          family_group_id: string
          id?: string
          is_emergency?: boolean
          latitude?: number | null
          longitude?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          address?: string | null
          created_at?: string
          expires_at?: string | null
          family_group_id?: string
          id?: string
          is_emergency?: boolean
          latitude?: number | null
          longitude?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_sharing_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_sharing_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_adherence_log: {
        Row: {
          created_at: string
          id: string
          medication_id: string
          notes: string | null
          reported_by: string | null
          scheduled_time: string
          status: string
          taken_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medication_id: string
          notes?: string | null
          reported_by?: string | null
          scheduled_time: string
          status?: string
          taken_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medication_id?: string
          notes?: string | null
          reported_by?: string | null
          scheduled_time?: string
          status?: string
          taken_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_adherence_log_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "user_medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_adherence_log_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_adherence_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      notification_preferences: {
        Row: {
          created_at: string
          emergency_notifications: boolean | null
          family_invitations: boolean | null
          health_alerts: boolean | null
          id: string
          medication_reminders: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emergency_notifications?: boolean | null
          family_invitations?: boolean | null
          health_alerts?: boolean | null
          id?: string
          medication_reminders?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emergency_notifications?: boolean | null
          family_invitations?: boolean | null
          health_alerts?: boolean | null
          id?: string
          medication_reminders?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          entitlements: Json | null
          id: string
          is_trial_eligible: boolean | null
          last_seen: string | null
          medical_conditions: string[] | null
          notification_preferences: Json | null
          phone: string | null
          plan: string | null
          preferred_language: string | null
          stripe_customer_id: string | null
          timezone: string | null
          trial_expires_at: string | null
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          entitlements?: Json | null
          id: string
          is_trial_eligible?: boolean | null
          last_seen?: string | null
          medical_conditions?: string[] | null
          notification_preferences?: Json | null
          phone?: string | null
          plan?: string | null
          preferred_language?: string | null
          stripe_customer_id?: string | null
          timezone?: string | null
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          entitlements?: Json | null
          id?: string
          is_trial_eligible?: boolean | null
          last_seen?: string | null
          medical_conditions?: string[] | null
          notification_preferences?: Json | null
          phone?: string | null
          plan?: string | null
          preferred_language?: string | null
          stripe_customer_id?: string | null
          timezone?: string | null
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          delivered_at: string | null
          device_token: string | null
          error_message: string | null
          id: string
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          device_token?: string | null
          error_message?: string | null
          id?: string
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          device_token?: string | null
          error_message?: string | null
          id?: string
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      real_time_channels: {
        Row: {
          channel_name: string
          channel_type: string
          created_at: string
          family_group_id: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          channel_name: string
          channel_type?: string
          created_at?: string
          family_group_id: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          channel_name?: string
          channel_type?: string
          created_at?: string
          family_group_id?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "real_time_channels_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          additional_context: Json | null
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          sensitive_data_accessed: boolean
          session_id: string | null
          success: boolean
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          additional_context?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          sensitive_data_accessed?: boolean
          session_id?: string | null
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          additional_context?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          sensitive_data_accessed?: boolean
          session_id?: string | null
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_sub_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan: string
          status?: string
          stripe_sub_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_sub_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_settings: {
        Row: {
          created_at: string
          dashboard_preferences: Json | null
          fab_positions: Json | null
          id: string
          notification_preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_preferences?: Json | null
          fab_positions?: Json | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_preferences?: Json | null
          fab_positions?: Json | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_invite_to_group: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_limit?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_user_by_email: {
        Args: { user_email: string }
        Returns: string
      }
      get_family_member_profile: {
        Args: { member_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          last_seen: string
        }[]
      }
      get_family_member_status: {
        Args: { group_uuid: string; member_uuid: string }
        Returns: Json
      }
      get_profile: {
        Args: { user_uuid: string }
        Returns: {
          avatar_url: string
          display_name: string
          email: string
          id: string
        }[]
      }
      get_user_entitlements: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_family_groups: {
        Args: { user_uuid: string }
        Returns: {
          family_group_id: string
        }[]
      }
      is_family_member: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_user_in_trial: {
        Args: { user_uuid: string }
        Returns: boolean
      }
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
