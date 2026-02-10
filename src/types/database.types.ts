/**
 * Supabase auto-generated types placeholder.
 *
 * After applying the migration, run:
 *   pnpm supabase:types
 *
 * This will overwrite this file with actual generated types.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          subscription_tier: Database["public"]["Enums"]["subscription_tier"];
          ls_customer_id: string | null;
          ls_subscription_id: string | null;
          ls_variant_id: string | null;
          telegram_chat_id: string | null;
          discord_webhook_url: string | null;
          phone_number: string | null;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          max_alerts_per_hour: number;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"];
          ls_customer_id?: string | null;
          ls_subscription_id?: string | null;
          ls_variant_id?: string | null;
          telegram_chat_id?: string | null;
          discord_webhook_url?: string | null;
          phone_number?: string | null;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          max_alerts_per_hour?: number;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"];
          ls_customer_id?: string | null;
          ls_subscription_id?: string | null;
          ls_variant_id?: string | null;
          telegram_chat_id?: string | null;
          discord_webhook_url?: string | null;
          phone_number?: string | null;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          max_alerts_per_hour?: number;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      watchlist_items: {
        Row: {
          id: string;
          user_id: string;
          token_symbol: string;
          token_name: string;
          token_address: string;
          chain: Database["public"]["Enums"]["chain_type"];
          is_muted: boolean;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_symbol: string;
          token_name: string;
          token_address: string;
          chain: Database["public"]["Enums"]["chain_type"];
          is_muted?: boolean;
          added_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_symbol?: string;
          token_name?: string;
          token_address?: string;
          chain?: Database["public"]["Enums"]["chain_type"];
          is_muted?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "watchlist_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      alert_rules: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: Database["public"]["Enums"]["alert_type"];
          conditions: Json;
          delivery_channels: Json;
          is_active: boolean;
          cooldown_minutes: number;
          last_triggered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: Database["public"]["Enums"]["alert_type"];
          conditions?: Json;
          delivery_channels?: Json;
          is_active?: boolean;
          cooldown_minutes?: number;
          last_triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: Database["public"]["Enums"]["alert_type"];
          conditions?: Json;
          delivery_channels?: Json;
          is_active?: boolean;
          cooldown_minutes?: number;
          last_triggered_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alert_rules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      alert_events: {
        Row: {
          id: string;
          rule_id: string | null;
          user_id: string;
          type: Database["public"]["Enums"]["alert_type"];
          severity: Database["public"]["Enums"]["severity"];
          title: string;
          description: string;
          metadata: Json;
          is_read: boolean;
          is_bookmarked: boolean;
          delivered_via: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          rule_id?: string | null;
          user_id: string;
          type: Database["public"]["Enums"]["alert_type"];
          severity: Database["public"]["Enums"]["severity"];
          title: string;
          description?: string;
          metadata?: Json;
          is_read?: boolean;
          is_bookmarked?: boolean;
          delivered_via?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          rule_id?: string | null;
          user_id?: string;
          type?: Database["public"]["Enums"]["alert_type"];
          severity?: Database["public"]["Enums"]["severity"];
          title?: string;
          description?: string;
          metadata?: Json;
          is_read?: boolean;
          is_bookmarked?: boolean;
          delivered_via?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "alert_events_rule_id_fkey";
            columns: ["rule_id"];
            isOneToOne: false;
            referencedRelation: "alert_rules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alert_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      trading_signals: {
        Row: {
          id: string;
          token_symbol: string;
          token_name: string;
          chain: Database["public"]["Enums"]["chain_type"];
          signal_type: Database["public"]["Enums"]["signal_type"];
          confidence: number;
          entry_low: number;
          entry_high: number;
          target_1: number;
          target_2: number | null;
          stop_loss: number;
          basis_tags: string[];
          timeframe: Database["public"]["Enums"]["timeframe"];
          status: Database["public"]["Enums"]["signal_status"];
          result_pnl: number | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          token_symbol: string;
          token_name: string;
          chain: Database["public"]["Enums"]["chain_type"];
          signal_type: Database["public"]["Enums"]["signal_type"];
          confidence: number;
          entry_low: number;
          entry_high: number;
          target_1: number;
          target_2?: number | null;
          stop_loss: number;
          basis_tags?: string[];
          timeframe: Database["public"]["Enums"]["timeframe"];
          status?: Database["public"]["Enums"]["signal_status"];
          result_pnl?: number | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          token_symbol?: string;
          token_name?: string;
          chain?: Database["public"]["Enums"]["chain_type"];
          signal_type?: Database["public"]["Enums"]["signal_type"];
          confidence?: number;
          entry_low?: number;
          entry_high?: number;
          target_1?: number;
          target_2?: number | null;
          stop_loss?: number;
          basis_tags?: string[];
          timeframe?: Database["public"]["Enums"]["timeframe"];
          status?: Database["public"]["Enums"]["signal_status"];
          result_pnl?: number | null;
          expires_at?: string;
        };
        Relationships: [];
      };
      token_unlocks: {
        Row: {
          id: string;
          token_symbol: string;
          token_name: string;
          unlock_date: string;
          unlock_amount: number;
          unlock_value_usd: number;
          pct_of_circulating: number;
          unlock_type: Database["public"]["Enums"]["unlock_type"];
          vesting_info: string | null;
          impact_score: number;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          token_symbol: string;
          token_name: string;
          unlock_date: string;
          unlock_amount: number;
          unlock_value_usd: number;
          pct_of_circulating: number;
          unlock_type: Database["public"]["Enums"]["unlock_type"];
          vesting_info?: string | null;
          impact_score: number;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          token_symbol?: string;
          token_name?: string;
          unlock_date?: string;
          unlock_amount?: number;
          unlock_value_usd?: number;
          pct_of_circulating?: number;
          unlock_type?: Database["public"]["Enums"]["unlock_type"];
          vesting_info?: string | null;
          impact_score?: number;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      defi_protocol_health: {
        Row: {
          id: string;
          protocol_name: string;
          chain: Database["public"]["Enums"]["chain_type"];
          tvl_usd: number;
          tvl_change_24h: number;
          risk_level: Database["public"]["Enums"]["risk_level"];
          last_audit: string | null;
          audit_firm: string | null;
          anomaly_detected: boolean;
          anomaly_description: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          protocol_name: string;
          chain: Database["public"]["Enums"]["chain_type"];
          tvl_usd?: number;
          tvl_change_24h?: number;
          risk_level?: Database["public"]["Enums"]["risk_level"];
          last_audit?: string | null;
          audit_firm?: string | null;
          anomaly_detected?: boolean;
          anomaly_description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          protocol_name?: string;
          chain?: Database["public"]["Enums"]["chain_type"];
          tvl_usd?: number;
          tvl_change_24h?: number;
          risk_level?: Database["public"]["Enums"]["risk_level"];
          last_audit?: string | null;
          audit_firm?: string | null;
          anomaly_detected?: boolean;
          anomaly_description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      stablecoin_pegs: {
        Row: {
          id: string;
          symbol: string;
          current_price: number;
          peg_deviation_pct: number;
          price_24h_high: number;
          price_24h_low: number;
          reserve_ratio: number | null;
          status: Database["public"]["Enums"]["stablecoin_status"];
          updated_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          current_price: number;
          peg_deviation_pct?: number;
          price_24h_high: number;
          price_24h_low: number;
          reserve_ratio?: number | null;
          status?: Database["public"]["Enums"]["stablecoin_status"];
          updated_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          current_price?: number;
          peg_deviation_pct?: number;
          price_24h_high?: number;
          price_24h_low?: number;
          reserve_ratio?: number | null;
          status?: Database["public"]["Enums"]["stablecoin_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_tier: "free" | "pro" | "whale";
      alert_type: "whale" | "risk" | "price_signal" | "token_unlock" | "liquidity";
      severity: "critical" | "high" | "medium" | "low";
      signal_type: "buy" | "sell" | "hold";
      timeframe: "4h" | "1d" | "1w";
      signal_status: "active" | "hit_target" | "stopped_out" | "expired";
      unlock_type: "team" | "investor" | "ecosystem" | "public";
      risk_level: "low" | "medium" | "high" | "critical";
      stablecoin_status: "normal" | "warning" | "depeg";
      chain_type: "ethereum" | "solana" | "bsc" | "polygon" | "arbitrum";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ── Convenience aliases ──
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
