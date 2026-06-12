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
      addresses: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          landmark: string | null
          lat: number | null
          line1: string
          lng: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          landmark?: string | null
          lat?: number | null
          line1: string
          lng?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          landmark?: string | null
          lat?: number | null
          line1?: string
          lng?: number | null
          user_id?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      customer_terms_acceptances: {
        Row: {
          accepted_at: string
          id: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          user_id: string
          version?: string
        }
        Update: {
          accepted_at?: string
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      driver_applications: {
        Row: {
          aadhaar_number: string
          aadhaar_url: string
          address: string
          created_at: string
          dl_url: string
          email: string
          full_name: string
          id: string
          mobile: string
          pan_number: string
          pan_url: string
          rc_url: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          terms_accepted_at: string
          updated_at: string
          user_id: string
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          aadhaar_number: string
          aadhaar_url: string
          address: string
          created_at?: string
          dl_url: string
          email: string
          full_name: string
          id?: string
          mobile: string
          pan_number: string
          pan_url: string
          rc_url: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          terms_accepted_at: string
          updated_at?: string
          user_id: string
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          aadhaar_number?: string
          aadhaar_url?: string
          address?: string
          created_at?: string
          dl_url?: string
          email?: string
          full_name?: string
          id?: string
          mobile?: string
          pan_number?: string
          pan_url?: string
          rc_url?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          terms_accepted_at?: string
          updated_at?: string
          user_id?: string
          vehicle_number?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      driver_earnings: {
        Row: {
          amount: number
          created_at: string
          driver_id: string
          earned_on: string
          id: string
          order_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          driver_id: string
          earned_on?: string
          id?: string
          order_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          driver_id?: string
          earned_on?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          current_lat: number | null
          current_lng: number | null
          license_no: string | null
          name: string
          phone: string
          rating: number | null
          status: Database["public"]["Enums"]["driver_status"]
          total_deliveries: number
          total_earnings: number
          updated_at: string
          user_id: string
          vehicle_no: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          license_no?: string | null
          name: string
          phone: string
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_deliveries?: number
          total_earnings?: number
          updated_at?: string
          user_id: string
          vehicle_no?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          license_no?: string | null
          name?: string
          phone?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_deliveries?: number
          total_earnings?: number
          updated_at?: string
          user_id?: string
          vehicle_no?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      invoices: {
        Row: {
          data: Json
          id: string
          invoice_no: string
          issued_at: string
          order_id: string
          pdf_url: string | null
        }
        Insert: {
          data?: Json
          id?: string
          invoice_no: string
          issued_at?: string
          order_id: string
          pdf_url?: string | null
        }
        Update: {
          data?: Json
          id?: string
          invoice_no?: string
          issued_at?: string
          order_id?: string
          pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_tracking: {
        Row: {
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_text: string
          base_price: number
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          delivery_charge: number
          delivery_date: string
          delivery_slot: string
          distance_km: number
          driver_id: string | null
          gst: number
          id: string
          landmark: string | null
          lat: number | null
          lng: number | null
          note: string | null
          order_code: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          size_l: number
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          wallet_discount: number
          water_type: Database["public"]["Enums"]["water_type"]
        }
        Insert: {
          address_text: string
          base_price: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_charge?: number
          delivery_date: string
          delivery_slot: string
          distance_km?: number
          driver_id?: string | null
          gst?: number
          id?: string
          landmark?: string | null
          lat?: number | null
          lng?: number | null
          note?: string | null
          order_code: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          size_l: number
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at?: string
          wallet_discount?: number
          water_type: Database["public"]["Enums"]["water_type"]
        }
        Update: {
          address_text?: string
          base_price?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_charge?: number
          delivery_date?: string
          delivery_slot?: string
          distance_km?: number
          driver_id?: string | null
          gst?: number
          id?: string
          landmark?: string | null
          lat?: number | null
          lng?: number | null
          note?: string | null
          order_code?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          size_l?: number
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          wallet_discount?: number
          water_type?: Database["public"]["Enums"]["water_type"]
        }
        Relationships: []
      }
      pricing: {
        Row: {
          active: boolean
          base_price: number
          id: string
          size_l: number
          updated_at: string
          water_type: Database["public"]["Enums"]["water_type"]
        }
        Insert: {
          active?: boolean
          base_price: number
          id?: string
          size_l: number
          updated_at?: string
          water_type: Database["public"]["Enums"]["water_type"]
        }
        Update: {
          active?: boolean
          base_price?: number
          id?: string
          size_l?: number
          updated_at?: string
          water_type?: Database["public"]["Enums"]["water_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_recharge_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string
          status: Database["public"]["Enums"]["recharge_status"]
          updated_at: string
          upi_ref: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url: string
          status?: Database["public"]["Enums"]["recharge_status"]
          updated_at?: string
          upi_ref?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string
          status?: Database["public"]["Enums"]["recharge_status"]
          updated_at?: string
          upi_ref?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          reference: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["wallet_txn_status"]
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          reference?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["wallet_txn_status"]
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          reference?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["wallet_txn_status"]
          type?: Database["public"]["Enums"]["wallet_txn_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          low_balance_threshold: number
          total_savings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          low_balance_threshold?: number
          total_savings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          low_balance_threshold?: number
          total_savings?: number
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
      approve_wallet_recharge: {
        Args: { _note?: string; _request_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_wallet_recharge: {
        Args: { _note?: string; _request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "driver" | "admin"
      application_status: "pending" | "approved" | "rejected" | "suspended"
      driver_status: "available" | "busy" | "offline"
      order_status:
        | "pending"
        | "confirmed"
        | "assigned"
        | "on_the_way"
        | "reached"
        | "delivered"
        | "cancelled"
      payment_method: "cod" | "online" | "wallet"
      recharge_status: "pending" | "approved" | "rejected"
      vehicle_type: "water_tanker" | "mini_tanker" | "large_tanker" | "other"
      wallet_txn_status: "pending" | "approved" | "rejected"
      wallet_txn_type: "deposit" | "debit" | "refund" | "bonus" | "referral"
      water_type: "drinking" | "non-drinking" | "construction"
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
      app_role: ["customer", "driver", "admin"],
      application_status: ["pending", "approved", "rejected", "suspended"],
      driver_status: ["available", "busy", "offline"],
      order_status: [
        "pending",
        "confirmed",
        "assigned",
        "on_the_way",
        "reached",
        "delivered",
        "cancelled",
      ],
      payment_method: ["cod", "online", "wallet"],
      recharge_status: ["pending", "approved", "rejected"],
      vehicle_type: ["water_tanker", "mini_tanker", "large_tanker", "other"],
      wallet_txn_status: ["pending", "approved", "rejected"],
      wallet_txn_type: ["deposit", "debit", "refund", "bonus", "referral"],
      water_type: ["drinking", "non-drinking", "construction"],
    },
  },
} as const
