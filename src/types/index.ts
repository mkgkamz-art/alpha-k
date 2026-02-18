/* ── Subscription ── */
export type SubscriptionTier = "free" | "pro" | "whale";

/* ── Alert Types ── */
export type AlertType =
  | "whale"
  | "risk"
  | "price_signal"
  | "token_unlock"
  | "liquidity";

export type Severity = "critical" | "high" | "medium" | "low";

export type SignalType = "buy" | "sell" | "hold";

export type Timeframe = "4h" | "1d" | "1w";

export type SignalStatus =
  | "active"
  | "hit_target"
  | "stopped_out"
  | "expired";

export type UnlockType = "team" | "investor" | "ecosystem" | "public";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type StablecoinStatus = "normal" | "warning" | "depeg";

export type Chain = "ethereum" | "solana" | "bsc" | "polygon" | "arbitrum";

/* ── Database Models ── */
export interface User {
  id: string;
  email: string;
  display_name: string | null;
  subscription_tier: SubscriptionTier;
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
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  token_symbol: string;
  token_name: string;
  token_address: string;
  chain: Chain;
  is_muted: boolean;
  added_at: string;
}

export interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  type: AlertType;
  conditions: Record<string, unknown>;
  delivery_channels: Record<string, boolean>;
  is_active: boolean;
  cooldown_minutes: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertEvent {
  id: string;
  rule_id: string | null;
  user_id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  is_bookmarked: boolean;
  delivered_via: Record<string, boolean>;
  created_at: string;
}

export interface TradingSignal {
  id: string;
  token_symbol: string;
  token_name: string;
  chain: Chain;
  signal_type: SignalType;
  confidence: number;
  entry_low: number;
  entry_high: number;
  target_1: number;
  target_2: number;
  stop_loss: number;
  basis_tags: string[];
  timeframe: Timeframe;
  status: SignalStatus;
  result_pnl: number | null;
  expires_at: string;
  created_at: string;
}

export interface TokenUnlock {
  id: string;
  token_symbol: string;
  token_name: string;
  unlock_date: string;
  amount: number;
  usd_value_estimate: number;
  percent_of_supply: number;
  category: UnlockType;
  impact_score: number;
  is_notified_3d: boolean;
  is_notified_1d: boolean;
  created_at: string;
}

export interface DefiProtocolHealth {
  id: string;
  protocol_name: string;
  chain: Chain;
  tvl_usd: number;
  tvl_change_24h: number;
  risk_level: RiskLevel;
  last_audit: string | null;
  audit_firm: string | null;
  anomaly_detected: boolean;
  anomaly_description: string | null;
  updated_at: string;
}

export interface StablecoinPeg {
  id: string;
  symbol: string;
  current_price: number;
  peg_deviation_pct: number;
  price_24h_high: number;
  price_24h_low: number;
  reserve_ratio: number | null;
  status: StablecoinStatus;
  updated_at: string;
}

export type SignalCategory = "buy" | "sell" | "alert";

export interface Signal {
  id: string;
  token_symbol: string;
  token_name: string;
  signal_type: SignalCategory;
  signal_name: string;
  confidence: number;
  timeframe: string;
  description: string;
  indicators: Record<string, unknown>;
  price_at_signal: number;
  created_at: string;
}
