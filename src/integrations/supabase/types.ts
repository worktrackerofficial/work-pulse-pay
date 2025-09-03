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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          job_id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          worker_id: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          worker_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string
          deliverable_date: string
          id: string
          job_id: string
          notes: string | null
          quantity: number
          worker_id: string
        }
        Insert: {
          created_at?: string
          deliverable_date: string
          id?: string
          job_id: string
          notes?: string | null
          quantity?: number
          worker_id: string
        }
        Update: {
          created_at?: string
          deliverable_date?: string
          id?: string
          job_id?: string
          notes?: string | null
          quantity?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      job_workers: {
        Row: {
          assigned_date: string
          created_at: string
          id: string
          is_active: boolean
          job_id: string
          worker_id: string
        }
        Insert: {
          assigned_date?: string
          created_at?: string
          id?: string
          is_active?: boolean
          job_id: string
          worker_id: string
        }
        Update: {
          assigned_date?: string
          created_at?: string
          id?: string
          is_active?: boolean
          job_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_workers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_workers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          commission_per_item: number | null
          created_at: string
          deliverable_frequency: Database["public"]["Enums"]["deliverable_frequency"]
          deliverable_type: string
          description: string | null
          end_date: string
          excluded_days: string[] | null
          flat_rate: number | null
          hourly_rate: number | null
          id: string
          industry: string
          name: string
          pay_structure: Database["public"]["Enums"]["pay_structure"]
          payment_frequency: string | null
          start_date: string
          status: Database["public"]["Enums"]["job_status"]
          target_deliverable: number
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_per_item?: number | null
          created_at?: string
          deliverable_frequency?: Database["public"]["Enums"]["deliverable_frequency"]
          deliverable_type: string
          description?: string | null
          end_date: string
          excluded_days?: string[] | null
          flat_rate?: number | null
          hourly_rate?: number | null
          id?: string
          industry: string
          name: string
          pay_structure?: Database["public"]["Enums"]["pay_structure"]
          payment_frequency?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["job_status"]
          target_deliverable?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_per_item?: number | null
          created_at?: string
          deliverable_frequency?: Database["public"]["Enums"]["deliverable_frequency"]
          deliverable_type?: string
          description?: string | null
          end_date?: string
          excluded_days?: string[] | null
          flat_rate?: number | null
          hourly_rate?: number | null
          id?: string
          industry?: string
          name?: string
          pay_structure?: Database["public"]["Enums"]["pay_structure"]
          payment_frequency?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["job_status"]
          target_deliverable?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          base_pay: number
          bonus: number | null
          commission: number
          created_at: string
          days_worked: number
          deductions: number | null
          deliverables: number
          id: string
          job_id: string
          payment_type: string
          period_end: string
          period_start: string
          status: string
          target_deliverables: number
          total_days: number
          total_payout: number
          updated_at: string
          worker_id: string
        }
        Insert: {
          base_pay?: number
          bonus?: number | null
          commission?: number
          created_at?: string
          days_worked?: number
          deductions?: number | null
          deliverables?: number
          id?: string
          job_id: string
          payment_type: string
          period_end: string
          period_start: string
          status?: string
          target_deliverables?: number
          total_days?: number
          total_payout?: number
          updated_at?: string
          worker_id: string
        }
        Update: {
          base_pay?: number
          bonus?: number | null
          commission?: number
          created_at?: string
          days_worked?: number
          deductions?: number | null
          deliverables?: number
          id?: string
          job_id?: string
          payment_type?: string
          period_end?: string
          period_start?: string
          status?: string
          target_deliverables?: number
          total_days?: number
          total_payout?: number
          updated_at?: string
          worker_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string
          id: string
          priority: string
          related_id: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          priority?: string
          related_id?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          priority?: string
          related_id?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          created_at: string
          department: string
          email: string | null
          id: string
          join_date: string
          name: string
          phone: string | null
          role: string
          status: Database["public"]["Enums"]["worker_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          email?: string | null
          id?: string
          join_date?: string
          name: string
          phone?: string | null
          role: string
          status?: Database["public"]["Enums"]["worker_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string | null
          id?: string
          join_date?: string
          name?: string
          phone?: string | null
          role?: string
          status?: Database["public"]["Enums"]["worker_status"]
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
      [_ in never]: never
    }
    Enums: {
      attendance_status: "present" | "absent" | "partial"
      deliverable_frequency: "daily" | "weekly" | "monthly"
      job_status: "active" | "completed" | "paused" | "cancelled"
      pay_structure: "commission" | "flat" | "commission_adjusted" | "hourly"
      worker_status: "active" | "inactive" | "terminated"
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
      attendance_status: ["present", "absent", "partial"],
      deliverable_frequency: ["daily", "weekly", "monthly"],
      job_status: ["active", "completed", "paused", "cancelled"],
      pay_structure: ["commission", "flat", "commission_adjusted", "hourly"],
      worker_status: ["active", "inactive", "terminated"],
    },
  },
} as const
