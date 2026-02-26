/* ── Subscription ── */
export type SubscriptionTier = "free" | "pro" | "whale";
export type SubscriptionStatus = "free" | "trialing" | "active" | "cancelled" | "expired";

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
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  ls_customer_id: string | null;
  ls_subscription_id: string | null;
  ls_variant_id: string | null;
  telegram_chat_id: string | null;
  telegram_username: string | null;
  telegram_connected_at: string | null;
  discord_webhook_url: string | null;
  phone_number: string | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  max_alerts_per_hour: number;
  notification_preferences: NotificationPreferences | null;
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

/* ── Notification Preferences ── */
export type NotificationAlertType =
  | "listing"
  | "surge"
  | "kimchi_premium"
  | "whale"
  | "defi_risk"
  | "trading_signal"
  | "liquidity";

export type NotificationFrequency = "instant" | "hourly" | "daily";

export interface NotificationAlertConfig {
  telegram: boolean;
  in_app: boolean;
  threshold?: number;
  frequency: NotificationFrequency;
}

export type NotificationPreferences = Record<
  NotificationAlertType,
  NotificationAlertConfig
>;

export interface NotificationSetting {
  id: string;
  user_id: string;
  alert_type: NotificationAlertType;
  telegram_enabled: boolean;
  app_enabled: boolean;
  custom_config: {
    threshold?: number;
    frequency?: NotificationFrequency;
    [key: string]: unknown;
  };
  updated_at: string;
}

/* ── API Keys ── */
export type ApiKeyStatus = "active" | "revoked";

export interface ApiKey {
  id: string;
  user_id: string;
  api_key: string;
  api_secret_hash: string;
  status: ApiKeyStatus;
  created_at: string;
  revoked_at: string | null;
}

export interface ApiUsageLog {
  id: string;
  user_id: string;
  api_key_id: string;
  endpoint: string;
  request_date: string;
  request_count: number;
  last_request_at: string;
}

/* ── Radar ── */
export type RadarSignalType = "surge" | "kimchi" | "listing" | "signal" | "context" | "volume" | "orderbook" | "buzz" | "onchain";
export type RadarStrength = "weak" | "moderate" | "strong" | "extreme";
export type RadarSignalStatus = "active" | "confirmed" | "failed";

export interface RadarSignal {
  id: string;
  signal_type: RadarSignalType;
  token_symbol: string;
  token_name: string | null;
  score: number;
  strength: RadarStrength;
  title: string;
  description: string | null;
  data_snapshot: Record<string, unknown>;
  historical_pattern: Record<string, unknown>;
  source: string | null;
  expires_at: string;
  created_at: string;
  status: RadarSignalStatus;
  price_at_signal: number | null;
}

export interface RadarSettings {
  id: string;
  user_id: string;
  signal_types: RadarSignalType[];
  min_score_alert: number;
  notify_telegram: boolean;
  notify_in_app: boolean;
  created_at: string;
  updated_at: string;
}

export interface RadarFilters {
  types?: RadarSignalType[];
  minScore?: number;
  limit?: number;
  cursor?: string;
}

/* ── Radar v1 API Response Types ── */
export interface RadarSignalV1Response {
  id: string;
  signal_type: RadarSignalType;
  coin_symbol: string;
  coin_name: string | null;
  exchange: string | null;
  score: number;
  strength: RadarStrength;
  title: string;
  description: string | null;
  data_snapshot: Record<string, unknown> | null;
  historical_pattern: Record<string, unknown> | null;
  created_at: string;
  seconds_ago: number;
  is_pro_only: boolean;
  is_accessible: boolean;
}

export interface RadarSignalDetailV1Response extends RadarSignalV1Response {
  current_price: number | null;
  price_change_24h: number | null;
  volume_24h: number | null;
  related_signals: RadarSignalV1Response[];
}

export interface RadarStatsV1Response {
  hit_rate_7d: number;
  hit_rate_30d: number;
  total_signals_today: number;
  top_signal_today: RadarSignalV1Response | null;
  avg_return_on_hit: number;
}

export interface UserRadarView {
  id: string;
  user_id: string;
  signal_id: string;
  viewed_date: string;
  created_at: string;
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
