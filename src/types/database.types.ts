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
          subscription_status: string;
          trial_ends_at: string | null;
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
          notification_preferences: Json | null;
          telegram_username: string | null;
          telegram_connected_at: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"];
          subscription_status?: string;
          trial_ends_at?: string | null;
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
          notification_preferences?: Json | null;
          telegram_username?: string | null;
          telegram_connected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"];
          subscription_status?: string;
          trial_ends_at?: string | null;
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
          notification_preferences?: Json | null;
          telegram_username?: string | null;
          telegram_connected_at?: string | null;
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
      whales: {
        Row: {
          id: string;
          address: string;
          label: string;
          chain: Database["public"]["Enums"]["whale_chain"];
          tier: Database["public"]["Enums"]["whale_tier"];
          profile: Record<string, unknown>;
          return_7d_pct: number;
          return_30d_pct: number;
          return_90d_pct: number;
          win_rate_30d: number;
          total_trades_30d: number;
          follower_count: number;
          is_active: boolean;
          first_tracked_at: string;
          last_trade_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          address: string;
          label: string;
          chain: Database["public"]["Enums"]["whale_chain"];
          tier?: Database["public"]["Enums"]["whale_tier"];
          profile?: Record<string, unknown>;
          return_7d_pct?: number;
          return_30d_pct?: number;
          return_90d_pct?: number;
          win_rate_30d?: number;
          total_trades_30d?: number;
          follower_count?: number;
          is_active?: boolean;
          first_tracked_at?: string;
          last_trade_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          address?: string;
          label?: string;
          chain?: Database["public"]["Enums"]["whale_chain"];
          tier?: Database["public"]["Enums"]["whale_tier"];
          profile?: Record<string, unknown>;
          return_7d_pct?: number;
          return_30d_pct?: number;
          return_90d_pct?: number;
          win_rate_30d?: number;
          total_trades_30d?: number;
          follower_count?: number;
          is_active?: boolean;
          first_tracked_at?: string;
          last_trade_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      whale_portfolios: {
        Row: {
          id: string;
          whale_id: string;
          coin_symbol: string;
          coin_name: string;
          amount: number;
          value_usd: number;
          weight_pct: number;
          avg_entry_price: number;
          current_price: number;
          unrealized_pnl_pct: number;
          first_bought_at: string | null;
          last_updated_at: string;
        };
        Insert: {
          id?: string;
          whale_id: string;
          coin_symbol: string;
          coin_name: string;
          amount?: number;
          value_usd?: number;
          weight_pct?: number;
          avg_entry_price?: number;
          current_price?: number;
          unrealized_pnl_pct?: number;
          first_bought_at?: string | null;
          last_updated_at?: string;
        };
        Update: {
          id?: string;
          whale_id?: string;
          coin_symbol?: string;
          coin_name?: string;
          amount?: number;
          value_usd?: number;
          weight_pct?: number;
          avg_entry_price?: number;
          current_price?: number;
          unrealized_pnl_pct?: number;
          first_bought_at?: string | null;
          last_updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whale_portfolios_whale_id_fkey";
            columns: ["whale_id"];
            isOneToOne: false;
            referencedRelation: "whales";
            referencedColumns: ["id"];
          },
        ];
      };
      whale_trades: {
        Row: {
          id: string;
          whale_id: string;
          coin_symbol: string;
          coin_name: string;
          trade_type: Database["public"]["Enums"]["whale_trade_type"];
          amount: number;
          value_usd: number;
          price: number;
          tx_hash: string;
          exchange_or_dex: string | null;
          realized_pnl_pct: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          whale_id: string;
          coin_symbol: string;
          coin_name: string;
          trade_type: Database["public"]["Enums"]["whale_trade_type"];
          amount: number;
          value_usd: number;
          price: number;
          tx_hash: string;
          exchange_or_dex?: string | null;
          realized_pnl_pct?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          whale_id?: string;
          coin_symbol?: string;
          coin_name?: string;
          trade_type?: Database["public"]["Enums"]["whale_trade_type"];
          amount?: number;
          value_usd?: number;
          price?: number;
          tx_hash?: string;
          exchange_or_dex?: string | null;
          realized_pnl_pct?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whale_trades_whale_id_fkey";
            columns: ["whale_id"];
            isOneToOne: false;
            referencedRelation: "whales";
            referencedColumns: ["id"];
          },
        ];
      };
      whale_follows: {
        Row: {
          id: string;
          user_id: string;
          whale_id: string;
          alert_telegram: boolean;
          alert_push: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          whale_id: string;
          alert_telegram?: boolean;
          alert_push?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          whale_id?: string;
          alert_telegram?: boolean;
          alert_push?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whale_follows_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whale_follows_whale_id_fkey";
            columns: ["whale_id"];
            isOneToOne: false;
            referencedRelation: "whales";
            referencedColumns: ["id"];
          },
        ];
      };
      whale_hot_coins: {
        Row: {
          id: string;
          coin_symbol: string;
          coin_name: string;
          buy_whale_count_24h: number;
          sell_whale_count_24h: number;
          net_buy_volume_usd_24h: number;
          avg_whale_tier: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coin_symbol: string;
          coin_name: string;
          buy_whale_count_24h?: number;
          sell_whale_count_24h?: number;
          net_buy_volume_usd_24h?: number;
          avg_whale_tier?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coin_symbol?: string;
          coin_name?: string;
          buy_whale_count_24h?: number;
          sell_whale_count_24h?: number;
          net_buy_volume_usd_24h?: number;
          avg_whale_tier?: number;
          updated_at?: string;
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
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          api_key: string;
          api_secret_hash: string;
          status: string;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          api_key: string;
          api_secret_hash: string;
          status?: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          api_key?: string;
          api_secret_hash?: string;
          status?: string;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      api_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          api_key_id: string;
          endpoint: string;
          request_date: string;
          request_count: number;
          last_request_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          api_key_id: string;
          endpoint: string;
          request_date?: string;
          request_count?: number;
          last_request_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          api_key_id?: string;
          endpoint?: string;
          request_date?: string;
          request_count?: number;
          last_request_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey";
            columns: ["api_key_id"];
            isOneToOne: false;
            referencedRelation: "api_keys";
            referencedColumns: ["id"];
          },
        ];
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
      telegram_verifications: {
        Row: {
          id: string;
          chat_id: string;
          verification_code: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          verification_code: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          verification_code?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          alert_type: Database["public"]["Enums"]["notification_alert_type"];
          telegram_enabled: boolean;
          app_enabled: boolean;
          custom_config: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          alert_type: Database["public"]["Enums"]["notification_alert_type"];
          telegram_enabled?: boolean;
          app_enabled?: boolean;
          custom_config?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          alert_type?: Database["public"]["Enums"]["notification_alert_type"];
          telegram_enabled?: boolean;
          app_enabled?: boolean;
          custom_config?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      radar_signals: {
        Row: {
          id: string;
          signal_type: Database["public"]["Enums"]["radar_signal_type"];
          token_symbol: string;
          token_name: string | null;
          score: number;
          strength: Database["public"]["Enums"]["radar_strength"];
          title: string;
          description: string | null;
          data_snapshot: Json;
          historical_pattern: Json;
          source: string | null;
          expires_at: string;
          created_at: string;
          status: string;
          price_at_signal: number | null;
        };
        Insert: {
          id?: string;
          signal_type: Database["public"]["Enums"]["radar_signal_type"];
          token_symbol: string;
          token_name?: string | null;
          score: number;
          strength?: Database["public"]["Enums"]["radar_strength"];
          title: string;
          description?: string | null;
          data_snapshot?: Json;
          historical_pattern?: Json;
          source?: string | null;
          expires_at?: string;
          created_at?: string;
          status?: string;
          price_at_signal?: number | null;
        };
        Update: {
          id?: string;
          signal_type?: Database["public"]["Enums"]["radar_signal_type"];
          token_symbol?: string;
          token_name?: string | null;
          score?: number;
          strength?: Database["public"]["Enums"]["radar_strength"];
          title?: string;
          description?: string | null;
          data_snapshot?: Json;
          historical_pattern?: Json;
          source?: string | null;
          expires_at?: string;
          status?: string;
          price_at_signal?: number | null;
        };
        Relationships: [];
      };
      radar_signal_results: {
        Row: {
          id: string;
          signal_id: string;
          price_at_signal: number | null;
          price_5m: number | null;
          price_1h: number | null;
          price_24h: number | null;
          price_change_5m: number | null;
          price_change_1h: number | null;
          price_change_24h: number | null;
          is_hit: boolean;
          evaluated_at: string;
        };
        Insert: {
          id?: string;
          signal_id: string;
          price_at_signal?: number | null;
          price_5m?: number | null;
          price_1h?: number | null;
          price_24h?: number | null;
          price_change_5m?: number | null;
          price_change_1h?: number | null;
          price_change_24h?: number | null;
          is_hit?: boolean;
          evaluated_at?: string;
        };
        Update: {
          id?: string;
          signal_id?: string;
          price_at_signal?: number | null;
          price_5m?: number | null;
          price_1h?: number | null;
          price_24h?: number | null;
          price_change_5m?: number | null;
          price_change_1h?: number | null;
          price_change_24h?: number | null;
          is_hit?: boolean;
          evaluated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "radar_signal_results_signal_id_fkey";
            columns: ["signal_id"];
            isOneToOne: false;
            referencedRelation: "radar_signals";
            referencedColumns: ["id"];
          },
        ];
      };
      user_radar_settings: {
        Row: {
          id: string;
          user_id: string;
          signal_types: string[];
          min_score_alert: number;
          notify_telegram: boolean;
          notify_in_app: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          signal_types?: string[];
          min_score_alert?: number;
          notify_telegram?: boolean;
          notify_in_app?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          signal_types?: string[];
          min_score_alert?: number;
          notify_telegram?: boolean;
          notify_in_app?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_radar_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_radar_views: {
        Row: {
          id: string;
          user_id: string;
          signal_id: string;
          viewed_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          signal_id: string;
          viewed_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          signal_id?: string;
          viewed_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_radar_views_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_radar_views_signal_id_fkey";
            columns: ["signal_id"];
            isOneToOne: false;
            referencedRelation: "radar_signals";
            referencedColumns: ["id"];
          },
        ];
      };
      alpha_signals: {
        Row: {
          id: string;
          coin_symbol: string;
          coin_name: string | null;
          direction: "buy" | "sell";
          strength: "strong_buy" | "buy" | "weak_buy" | "weak_sell" | "sell" | "strong_sell";
          alpha_score: number;
          convergence_grade: "perfect" | "strong";
          convergence_sources: Json;
          score_breakdown: Json;
          historical_accuracy: Json | null;
          price_at_signal: number | null;
          created_at: string;
          expired_at: string;
          status: "active" | "expired" | "hit" | "missed";
        };
        Insert: {
          id?: string;
          coin_symbol: string;
          coin_name?: string | null;
          direction: "buy" | "sell";
          strength: "strong_buy" | "buy" | "weak_buy" | "weak_sell" | "sell" | "strong_sell";
          alpha_score: number;
          convergence_grade: "perfect" | "strong";
          convergence_sources?: Json;
          score_breakdown?: Json;
          historical_accuracy?: Json | null;
          price_at_signal?: number | null;
          created_at?: string;
          expired_at?: string;
          status?: "active" | "expired" | "hit" | "missed";
        };
        Update: {
          id?: string;
          coin_symbol?: string;
          coin_name?: string | null;
          direction?: "buy" | "sell";
          strength?: "strong_buy" | "buy" | "weak_buy" | "weak_sell" | "sell" | "strong_sell";
          alpha_score?: number;
          convergence_grade?: "perfect" | "strong";
          convergence_sources?: Json;
          score_breakdown?: Json;
          historical_accuracy?: Json | null;
          price_at_signal?: number | null;
          expired_at?: string;
          status?: "active" | "expired" | "hit" | "missed";
        };
        Relationships: [];
      };
      alpha_signal_results: {
        Row: {
          id: string;
          signal_id: string;
          price_at_signal: number | null;
          price_after_1h: number | null;
          price_after_4h: number | null;
          price_after_24h: number | null;
          return_1h_pct: number | null;
          return_4h_pct: number | null;
          return_24h_pct: number | null;
          max_return_pct: number | null;
          is_hit: boolean | null;
          evaluated_at: string | null;
        };
        Insert: {
          id?: string;
          signal_id: string;
          price_at_signal?: number | null;
          price_after_1h?: number | null;
          price_after_4h?: number | null;
          price_after_24h?: number | null;
          return_1h_pct?: number | null;
          return_4h_pct?: number | null;
          return_24h_pct?: number | null;
          max_return_pct?: number | null;
          is_hit?: boolean | null;
          evaluated_at?: string | null;
        };
        Update: {
          id?: string;
          signal_id?: string;
          price_at_signal?: number | null;
          price_after_1h?: number | null;
          price_after_4h?: number | null;
          price_after_24h?: number | null;
          return_1h_pct?: number | null;
          return_4h_pct?: number | null;
          return_24h_pct?: number | null;
          max_return_pct?: number | null;
          is_hit?: boolean | null;
          evaluated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "alpha_signal_results_signal_id_fkey";
            columns: ["signal_id"];
            isOneToOne: true;
            referencedRelation: "alpha_signals";
            referencedColumns: ["id"];
          },
        ];
      };
      alpha_signal_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          min_alpha_score: number;
          min_convergence: "strong" | "perfect";
          direction_filter: "all" | "buy_only" | "sell_only";
          alert_telegram: boolean;
          alert_push: boolean;
          alert_sound: boolean;
          coins_watchlist: Json | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          min_alpha_score?: number;
          min_convergence?: "strong" | "perfect";
          direction_filter?: "all" | "buy_only" | "sell_only";
          alert_telegram?: boolean;
          alert_push?: boolean;
          alert_sound?: boolean;
          coins_watchlist?: Json | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          min_alpha_score?: number;
          min_convergence?: "strong" | "perfect";
          direction_filter?: "all" | "buy_only" | "sell_only";
          alert_telegram?: boolean;
          alert_push?: boolean;
          alert_sound?: boolean;
          coins_watchlist?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alpha_signal_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_api_usage: {
        Args: {
          p_user_id: string;
          p_api_key_id: string;
          p_endpoint: string;
          p_request_date: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      subscription_tier: "free" | "pro" | "whale";
      alert_type: "whale" | "risk" | "price_signal" | "token_unlock" | "liquidity";
      severity: "critical" | "high" | "medium" | "low";
      notification_alert_type: "listing" | "surge" | "kimchi_premium" | "whale" | "defi_risk" | "trading_signal" | "liquidity";
      radar_signal_type: "surge" | "kimchi" | "listing" | "signal" | "context" | "volume" | "orderbook" | "buzz" | "onchain";
      radar_strength: "weak" | "moderate" | "strong" | "extreme";
      whale_chain: "ethereum" | "bsc" | "solana" | "arbitrum" | "base" | "multi";
      whale_tier: "s" | "a" | "b" | "c";
      whale_trade_type: "buy" | "sell";
      alpha_direction: "buy" | "sell";
      alpha_strength: "strong_buy" | "buy" | "weak_buy" | "weak_sell" | "sell" | "strong_sell";
      alpha_grade: "perfect" | "strong";
      alpha_status: "active" | "expired" | "hit" | "missed";
      alpha_direction_filter: "all" | "buy_only" | "sell_only";
      alpha_min_convergence: "strong" | "perfect";
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
