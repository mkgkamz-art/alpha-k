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
          chain: string;
          is_muted: boolean;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_symbol: string;
          token_name: string;
          token_address: string;
          chain?: string;
          is_muted?: boolean;
          added_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_symbol?: string;
          token_name?: string;
          token_address?: string;
          chain?: string;
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
      token_prices: {
        Row: {
          id: string;
          token_id: string;
          symbol: string;
          name: string;
          current_price: number;
          market_cap: number;
          total_volume: number;
          price_change_1h: number | null;
          price_change_24h: number | null;
          price_change_7d: number | null;
          last_updated: string;
        };
        Insert: {
          id?: string;
          token_id: string;
          symbol: string;
          name: string;
          current_price?: number;
          market_cap?: number;
          total_volume?: number;
          price_change_1h?: number | null;
          price_change_24h?: number | null;
          price_change_7d?: number | null;
          last_updated?: string;
        };
        Update: {
          id?: string;
          token_id?: string;
          symbol?: string;
          name?: string;
          current_price?: number;
          market_cap?: number;
          total_volume?: number;
          price_change_1h?: number | null;
          price_change_24h?: number | null;
          price_change_7d?: number | null;
          last_updated?: string;
        };
        Relationships: [];
      };
      price_history: {
        Row: {
          id: string;
          token_id: string;
          price: number;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          token_id: string;
          price: number;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          token_id?: string;
          price?: number;
          recorded_at?: string;
        };
        Relationships: [];
      };
      whale_events: {
        Row: {
          id: string;
          tx_hash: string;
          blockchain: string;
          from_address: string | null;
          from_label: string | null;
          to_address: string | null;
          to_label: string | null;
          symbol: string;
          amount: number;
          usd_value: number;
          event_type: string;
          detected_at: string;
        };
        Insert: {
          id?: string;
          tx_hash: string;
          blockchain: string;
          from_address?: string | null;
          from_label?: string | null;
          to_address?: string | null;
          to_label?: string | null;
          symbol: string;
          amount?: number;
          usd_value?: number;
          event_type?: string;
          detected_at?: string;
        };
        Update: {
          id?: string;
          tx_hash?: string;
          blockchain?: string;
          from_address?: string | null;
          from_label?: string | null;
          to_address?: string | null;
          to_label?: string | null;
          symbol?: string;
          amount?: number;
          usd_value?: number;
          event_type?: string;
          detected_at?: string;
        };
        Relationships: [];
      };
      defi_protocols: {
        Row: {
          id: string;
          protocol_name: string;
          slug: string;
          tvl: number;
          tvl_change_24h: number;
          tvl_change_7d: number;
          category: string | null;
          chains: string[];
          last_updated: string;
        };
        Insert: {
          id?: string;
          protocol_name: string;
          slug: string;
          tvl?: number;
          tvl_change_24h?: number;
          tvl_change_7d?: number;
          category?: string | null;
          chains?: string[];
          last_updated?: string;
        };
        Update: {
          id?: string;
          protocol_name?: string;
          slug?: string;
          tvl?: number;
          tvl_change_24h?: number;
          tvl_change_7d?: number;
          category?: string | null;
          chains?: string[];
          last_updated?: string;
        };
        Relationships: [];
      };
      stablecoin_status: {
        Row: {
          id: string;
          symbol: string;
          name: string;
          current_price: number;
          peg_deviation: number;
          is_depegged: boolean;
          last_updated: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          name: string;
          current_price?: number;
          peg_deviation?: number;
          is_depegged?: boolean;
          last_updated?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          name?: string;
          current_price?: number;
          peg_deviation?: number;
          is_depegged?: boolean;
          last_updated?: string;
        };
        Relationships: [];
      };
      signals: {
        Row: {
          id: string;
          token_symbol: string;
          token_name: string;
          signal_type: string;
          signal_name: string;
          confidence: number;
          timeframe: string;
          description: string;
          indicators: Json;
          price_at_signal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          token_symbol: string;
          token_name: string;
          signal_type: string;
          signal_name: string;
          confidence: number;
          timeframe?: string;
          description?: string;
          indicators?: Json;
          price_at_signal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          token_symbol?: string;
          token_name?: string;
          signal_type?: string;
          signal_name?: string;
          confidence?: number;
          timeframe?: string;
          description?: string;
          indicators?: Json;
          price_at_signal?: number;
        };
        Relationships: [];
      };
      dex_volumes: {
        Row: {
          id: string;
          protocol_name: string;
          daily_volume: number;
          volume_change_24h: number;
          total_tvl: number;
          chains: string[];
          last_updated: string;
        };
        Insert: {
          id?: string;
          protocol_name: string;
          daily_volume?: number;
          volume_change_24h?: number;
          total_tvl?: number;
          chains?: string[];
          last_updated?: string;
        };
        Update: {
          id?: string;
          protocol_name?: string;
          daily_volume?: number;
          volume_change_24h?: number;
          total_tvl?: number;
          chains?: string[];
          last_updated?: string;
        };
        Relationships: [];
      };
      liquidity_pools: {
        Row: {
          id: string;
          pool_name: string;
          protocol: string;
          chain: string;
          tvl: number;
          apy: number;
          apy_base: number;
          apy_reward: number;
          tvl_change_24h: number;
          is_stablecoin: boolean;
          risk_level: string;
          last_updated: string;
        };
        Insert: {
          id?: string;
          pool_name: string;
          protocol: string;
          chain?: string;
          tvl?: number;
          apy?: number;
          apy_base?: number;
          apy_reward?: number;
          tvl_change_24h?: number;
          is_stablecoin?: boolean;
          risk_level?: string;
          last_updated?: string;
        };
        Update: {
          id?: string;
          pool_name?: string;
          protocol?: string;
          chain?: string;
          tvl?: number;
          apy?: number;
          apy_base?: number;
          apy_reward?: number;
          tvl_change_24h?: number;
          is_stablecoin?: boolean;
          risk_level?: string;
          last_updated?: string;
        };
        Relationships: [];
      };
      token_unlocks: {
        Row: {
          id: string;
          token_symbol: string;
          token_name: string;
          unlock_date: string;
          amount: number;
          usd_value_estimate: number;
          percent_of_supply: number;
          category: string;
          impact_score: number;
          is_notified_3d: boolean;
          is_notified_1d: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          token_symbol: string;
          token_name: string;
          unlock_date: string;
          amount: number;
          usd_value_estimate: number;
          percent_of_supply: number;
          category?: string;
          impact_score: number;
          is_notified_3d?: boolean;
          is_notified_1d?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          token_symbol?: string;
          token_name?: string;
          unlock_date?: string;
          amount?: number;
          usd_value_estimate?: number;
          percent_of_supply?: number;
          category?: string;
          impact_score?: number;
          is_notified_3d?: boolean;
          is_notified_1d?: boolean;
        };
        Relationships: [];
      };
      korean_prices: {
        Row: {
          id: number;
          symbol: string;
          exchange: string;
          price_krw: number;
          price_usd: number | null;
          volume_24h: number | null;
          change_24h: number | null;
          kimchi_premium: number | null;
          usd_krw_rate: number | null;
          fetched_at: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          symbol: string;
          exchange: string;
          price_krw: number;
          price_usd?: number | null;
          volume_24h?: number | null;
          change_24h?: number | null;
          kimchi_premium?: number | null;
          usd_krw_rate?: number | null;
          fetched_at?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          symbol?: string;
          exchange?: string;
          price_krw?: number;
          price_usd?: number | null;
          volume_24h?: number | null;
          change_24h?: number | null;
          kimchi_premium?: number | null;
          usd_krw_rate?: number | null;
          fetched_at?: string;
        };
        Relationships: [];
      };
      kimchi_premium_history: {
        Row: {
          id: number;
          symbol: string;
          premium_percent: number;
          price_krw: number | null;
          price_usd: number | null;
          usd_krw_rate: number | null;
          recorded_at: string;
        };
        Insert: {
          id?: number;
          symbol: string;
          premium_percent: number;
          price_krw?: number | null;
          price_usd?: number | null;
          usd_krw_rate?: number | null;
          recorded_at?: string;
        };
        Update: {
          id?: number;
          symbol?: string;
          premium_percent?: number;
          price_krw?: number | null;
          price_usd?: number | null;
          usd_krw_rate?: number | null;
        };
        Relationships: [];
      };
      exchange_listed_coins: {
        Row: {
          id: number;
          exchange: string;
          symbol: string;
          market_code: string;
          listed_at: string;
          is_new: boolean;
        };
        Insert: {
          id?: number;
          exchange: string;
          symbol: string;
          market_code: string;
          listed_at?: string;
          is_new?: boolean;
        };
        Update: {
          id?: number;
          exchange?: string;
          symbol?: string;
          market_code?: string;
          listed_at?: string;
          is_new?: boolean;
        };
        Relationships: [];
      };
      new_listings: {
        Row: {
          id: number;
          exchange: string;
          symbol: string;
          market_code: string;
          coin_name: string | null;
          detected_at: string;
          initial_price_krw: number | null;
          current_price_krw: number | null;
          price_change_since_listing: number | null;
          notified: boolean;
        };
        Insert: {
          id?: number;
          exchange: string;
          symbol: string;
          market_code: string;
          coin_name?: string | null;
          detected_at?: string;
          initial_price_krw?: number | null;
          current_price_krw?: number | null;
          price_change_since_listing?: number | null;
          notified?: boolean;
        };
        Update: {
          id?: number;
          exchange?: string;
          symbol?: string;
          market_code?: string;
          coin_name?: string | null;
          detected_at?: string;
          initial_price_krw?: number | null;
          current_price_krw?: number | null;
          price_change_since_listing?: number | null;
          notified?: boolean;
        };
        Relationships: [];
      };
      context_alerts: {
        Row: {
          id: number;
          alert_type: string;
          symbol: string | null;
          severity: string;
          what_title: string;
          what_description: string | null;
          why_analysis: string | null;
          action_suggestion: string | null;
          source_data: Json | null;
          related_page: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          alert_type: string;
          symbol?: string | null;
          severity: string;
          what_title: string;
          what_description?: string | null;
          why_analysis?: string | null;
          action_suggestion?: string | null;
          source_data?: Json | null;
          related_page?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          alert_type?: string;
          symbol?: string | null;
          severity?: string;
          what_title?: string;
          what_description?: string | null;
          why_analysis?: string | null;
          action_suggestion?: string | null;
          source_data?: Json | null;
          related_page?: string | null;
          is_read?: boolean;
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
