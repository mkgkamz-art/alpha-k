# DATABASE.md — Supabase DB 스키마

## 테이블 8개

### users (auth 확장)
id(uuid PK), email, display_name, subscription_tier(free/pro/whale),
ls_customer_id, ls_subscription_id, ls_variant_id, telegram_chat_id,
discord_webhook_url, phone_number, quiet_hours_start/end(time),
max_alerts_per_hour(25), timezone(Asia/Seoul), created_at, updated_at

### watchlist_items
id, user_id(FK), token_symbol, token_name, token_address,
chain, is_muted(false), added_at
UNIQUE(user_id, token_symbol, chain)

### alert_rules
id, user_id(FK), name, type(whale/risk/price_signal/token_unlock/liquidity),
conditions(jsonb), delivery_channels(jsonb), is_active(true),
cooldown_minutes(60), last_triggered_at, created_at, updated_at

### alert_events
id, rule_id(FK nullable), user_id(FK), type, severity(critical/high/medium/low),
title, description, metadata(jsonb), is_read(false), is_bookmarked(false),
delivered_via(jsonb), created_at

### trading_signals
id, token_symbol, token_name, chain, signal_type(buy/sell/hold),
confidence(0-100), entry_low, entry_high, target_1, target_2,
stop_loss, basis_tags(text[]), timeframe(4h/1d/1w),
status(active/hit_target/stopped_out/expired), result_pnl, expires_at, created_at

### token_unlocks
id, token_symbol, token_name, unlock_date, unlock_amount,
unlock_value_usd, pct_of_circulating, unlock_type(team/investor/ecosystem/public),
vesting_info, impact_score(1-10), source_url, created_at, updated_at

### defi_protocol_health
id, protocol_name, chain, tvl_usd, tvl_change_24h,
risk_level(low/medium/high/critical), last_audit, audit_firm,
anomaly_detected(false), anomaly_description, updated_at

### stablecoin_pegs
id, symbol, current_price, peg_deviation_pct,
price_24h_high, price_24h_low, reserve_ratio, status(normal/warning/depeg),
updated_at

## RLS: users/watchlist/rules=본인CRUD, events=본인SELECT,
signals/unlocks/protocols/pegs=인증유저 SELECT

## 인덱스: events(user_id,created_at DESC), rules(user_id,type,is_active),
signals(status,timeframe,created_at DESC), unlocks(unlock_date), watchlist(user_id)

## Realtime: alert_events, stablecoin_pegs
