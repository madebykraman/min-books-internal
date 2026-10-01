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
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          workspace_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          workspace_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          address: Json
          created_at: string
          default_payment_terms_days: number
          default_tax_rate: number
          display_name: string | null
          email: string | null
          gstin: string | null
          id: string
          invoice_prefix: string
          legal_name: string
          logo_url: string | null
          next_invoice_number: number
          payment_details: Json
          phone: string | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          address?: Json
          created_at?: string
          default_payment_terms_days?: number
          default_tax_rate?: number
          display_name?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          invoice_prefix?: string
          legal_name: string
          logo_url?: string | null
          next_invoice_number?: number
          payment_details?: Json
          phone?: string | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          address?: Json
          created_at?: string
          default_payment_terms_days?: number
          default_tax_rate?: number
          display_name?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          invoice_prefix?: string
          legal_name?: string
          logo_url?: string | null
          next_invoice_number?: number
          payment_details?: Json
          phone?: string | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived_at: string | null
          billing_address: Json
          company: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          place_of_supply: string | null
          preferred_currency: string
          preferred_language: string
          tax_treatment: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          billing_address?: Json
          company?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          place_of_supply?: string | null
          preferred_currency?: string
          preferred_language?: string
          tax_treatment?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          billing_address?: Json
          company?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          place_of_supply?: string | null
          preferred_currency?: string
          preferred_language?: string
          tax_treatment?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          document_id: string
          event_type: string
          id: string
          metadata: Json
          workspace_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          document_id: string
          event_type: string
          id?: string
          metadata?: Json
          workspace_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          document_id?: string
          event_type?: string
          id?: string
          metadata?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          immutable: boolean
          issued_at: string | null
          layout_version: string
          payload: Json
          snapshot: Json
          template_version: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          immutable?: boolean
          issued_at?: string | null
          layout_version?: string
          payload: Json
          snapshot: Json
          template_version?: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          immutable?: boolean
          issued_at?: string | null
          layout_version?: string
          payload?: Json
          snapshot?: Json
          template_version?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          current_version: number
          document_number: string
          draft_payload: Json
          due_date: string | null
          id: string
          issue_date: string
          issued_at: string | null
          public_token: string | null
          status: Database["public"]["Enums"]["document_status"]
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          current_version?: number
          document_number: string
          draft_payload?: Json
          due_date?: string | null
          id?: string
          issue_date?: string
          issued_at?: string | null
          public_token?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          current_version?: number
          document_number?: string
          draft_payload?: Json
          due_date?: string | null
          id?: string
          issue_date?: string
          issued_at?: string | null
          public_token?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      monitored_accounts: {
        Row: {
          active: boolean
          handle: string
          id: string
          last_checked_at: string | null
        }
        Insert: {
          active?: boolean
          handle: string
          id?: string
          last_checked_at?: string | null
        }
        Update: {
          active?: boolean
          handle?: string
          id?: string
          last_checked_at?: string | null
        }
        Relationships: []
      }
      price_observations: {
        Row: {
          canonical_key: string
          id: string
          observed_at: string
          price: number
        }
        Insert: {
          canonical_key: string
          id?: string
          observed_at?: string
          price: number
        }
        Update: {
          canonical_key?: string
          id?: string
          observed_at?: string
          price?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          archived_at: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          tax_rate: number
          unit: string
          unit_price_minor: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          tax_rate?: number
          unit?: string
          unit_price_minor?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          tax_rate?: number
          unit?: string
          unit_price_minor?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          high_priority_threshold: number
          id: string
          pincode: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          high_priority_threshold?: number
          id: string
          pincode?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          high_priority_threshold?: number
          id?: string
          pincode?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      verified_deals: {
        Row: {
          canonical_key: string
          claimed_price: number
          expires_at: string | null
          first_seen_at: string
          history_note: string
          id: string
          is_high_priority: boolean
          pincode_checked: string
          product_title: string
          product_url: string
          source_handle: string | null
          verified_price: number
          x_post_url: string | null
        }
        Insert: {
          canonical_key: string
          claimed_price: number
          expires_at?: string | null
          first_seen_at?: string
          history_note: string
          id?: string
          is_high_priority?: boolean
          pincode_checked: string
          product_title: string
          product_url: string
          source_handle?: string | null
          verified_price: number
          x_post_url?: string | null
        }
        Update: {
          canonical_key?: string
          claimed_price?: number
          expires_at?: string | null
          first_seen_at?: string
          history_note?: string
          id?: string
          is_high_priority?: boolean
          pincode_checked?: string
          product_title?: string
          product_url?: string
          source_handle?: string | null
          verified_price?: number
          x_post_url?: string | null
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          name: string
          owner_user_id: string
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_workspace_member: {
        Args: { target_workspace: string }
        Returns: boolean
      }
      issue_document: {
        Args: {
          issued_payload: Json
          issued_snapshot: Json
          target_document: string
        }
        Returns: {
          client_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          current_version: number
          document_number: string
          draft_payload: Json
          due_date: string | null
          id: string
          issue_date: string
          issued_at: string | null
          public_token: string | null
          status: Database["public"]["Enums"]["document_status"]
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      document_status:
        | "DRAFT"
        | "SENT"
        | "VIEWED"
        | "PARTIALLY_PAID"
        | "PAID"
        | "OVERDUE"
        | "CANCELLED"
        | "VOID"
      document_type:
        | "QUOTE"
        | "INVOICE"
        | "CREDIT_NOTE"
        | "RECEIPT"
        | "PURCHASE_ORDER"
      workspace_role: "OWNER" | "ADMIN" | "MEMBER" | "ACCOUNTANT" | "VIEWER"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      document_status: [
        "DRAFT",
        "SENT",
        "VIEWED",
        "PARTIALLY_PAID",
        "PAID",
        "OVERDUE",
        "CANCELLED",
        "VOID",
      ],
      document_type: [
        "QUOTE",
        "INVOICE",
        "CREDIT_NOTE",
        "RECEIPT",
        "PURCHASE_ORDER",
      ],
      workspace_role: ["OWNER", "ADMIN", "MEMBER", "ACCOUNTANT", "VIEWER"],
    },
  },
} as const
