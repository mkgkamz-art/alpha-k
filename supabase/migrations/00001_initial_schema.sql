-- ============================================================
-- BLOSAFE — Initial Schema Migration
-- 8 tables · RLS · Indexes · Realtime
-- ============================================================

-- ── Custom ENUM types ──────────────────────────────────────
create type subscription_tier as enum ('free', 'pro', 'whale');
create type alert_type       as enum ('whale', 'risk', 'price_signal', 'token_unlock', 'liquidity');
create type severity         as enum ('critical', 'high', 'medium', 'low');
create type signal_type      as enum ('buy', 'sell', 'hold');
create type timeframe        as enum ('4h', '1d', '1w');
create type signal_status    as enum ('active', 'hit_target', 'stopped_out', 'expired');
create type unlock_type      as enum ('team', 'investor', 'ecosystem', 'public');
create type risk_level       as enum ('low', 'medium', 'high', 'critical');
create type stablecoin_status as enum ('normal', 'warning', 'depeg');
create type chain_type       as enum ('ethereum', 'solana', 'bsc', 'polygon', 'arbitrum');


-- ============================================================
-- 1. users (extends Supabase auth.users)
-- ============================================================
create table public.users (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  display_name         text,
  subscription_tier    subscription_tier not null default 'free',

  -- Lemon Squeezy
  ls_customer_id       text,
  ls_subscription_id   text,
  ls_variant_id        text,

  -- Notification channels
  telegram_chat_id     text,
  discord_webhook_url  text,
  phone_number         text,

  -- Preferences
  quiet_hours_start    time,
  quiet_hours_end      time,
  max_alerts_per_hour  int not null default 25,
  timezone             text not null default 'Asia/Seoul',

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.users is 'User profiles extending Supabase auth';


-- ============================================================
-- 2. watchlist_items
-- ============================================================
create table public.watchlist_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  token_symbol   text not null,
  token_name     text not null,
  token_address  text not null,
  chain          chain_type not null,
  is_muted       boolean not null default false,
  added_at       timestamptz not null default now(),

  unique (user_id, token_symbol, chain)
);

comment on table public.watchlist_items is 'Per-user token watchlist';


-- ============================================================
-- 3. alert_rules
-- ============================================================
create table public.alert_rules (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  name               text not null,
  type               alert_type not null,
  conditions         jsonb not null default '{}',
  delivery_channels  jsonb not null default '{"push": true}',
  is_active          boolean not null default true,
  cooldown_minutes   int not null default 60,
  last_triggered_at  timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.alert_rules is 'User-defined alert rules with conditions & delivery config';


-- ============================================================
-- 4. alert_events
-- ============================================================
create table public.alert_events (
  id             uuid primary key default gen_random_uuid(),
  rule_id        uuid references public.alert_rules(id) on delete set null,
  user_id        uuid not null references public.users(id) on delete cascade,
  type           alert_type not null,
  severity       severity not null,
  title          text not null,
  description    text not null default '',
  metadata       jsonb not null default '{}',
  is_read        boolean not null default false,
  is_bookmarked  boolean not null default false,
  delivered_via  jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

comment on table public.alert_events is 'Fired alert events (notifications)';


-- ============================================================
-- 5. trading_signals
-- ============================================================
create table public.trading_signals (
  id            uuid primary key default gen_random_uuid(),
  token_symbol  text not null,
  token_name    text not null,
  chain         chain_type not null,
  signal_type   signal_type not null,
  confidence    smallint not null check (confidence between 0 and 100),
  entry_low     numeric(20,8) not null,
  entry_high    numeric(20,8) not null,
  target_1      numeric(20,8) not null,
  target_2      numeric(20,8),
  stop_loss     numeric(20,8) not null,
  basis_tags    text[] not null default '{}',
  timeframe     timeframe not null,
  status        signal_status not null default 'active',
  result_pnl    numeric(10,2),
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

comment on table public.trading_signals is 'Trading signal recommendations';


-- ============================================================
-- 6. token_unlocks
-- ============================================================
create table public.token_unlocks (
  id                   uuid primary key default gen_random_uuid(),
  token_symbol         text not null,
  token_name           text not null,
  unlock_date          timestamptz not null,
  unlock_amount        numeric(30,8) not null,
  unlock_value_usd     numeric(20,2) not null,
  pct_of_circulating   numeric(7,4) not null,
  unlock_type          unlock_type not null,
  vesting_info         text,
  impact_score         smallint not null check (impact_score between 1 and 10),
  source_url           text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.token_unlocks is 'Upcoming and past token unlock events';


-- ============================================================
-- 7. defi_protocol_health
-- ============================================================
create table public.defi_protocol_health (
  id                   uuid primary key default gen_random_uuid(),
  protocol_name        text not null,
  chain                chain_type not null,
  tvl_usd              numeric(20,2) not null default 0,
  tvl_change_24h       numeric(10,4) not null default 0,
  risk_level           risk_level not null default 'low',
  last_audit           date,
  audit_firm           text,
  anomaly_detected     boolean not null default false,
  anomaly_description  text,
  updated_at           timestamptz not null default now()
);

comment on table public.defi_protocol_health is 'DeFi protocol health and risk metrics';


-- ============================================================
-- 8. stablecoin_pegs
-- ============================================================
create table public.stablecoin_pegs (
  id                 uuid primary key default gen_random_uuid(),
  symbol             text not null unique,
  current_price      numeric(12,8) not null,
  peg_deviation_pct  numeric(8,4) not null default 0,
  price_24h_high     numeric(12,8) not null,
  price_24h_low      numeric(12,8) not null,
  reserve_ratio      numeric(8,4),
  status             stablecoin_status not null default 'normal',
  updated_at         timestamptz not null default now()
);

comment on table public.stablecoin_pegs is 'Stablecoin peg monitoring';


-- ============================================================
-- updated_at trigger function
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tables with updated_at
create trigger set_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.alert_rules
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.token_unlocks
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.defi_protocol_health
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.stablecoin_pegs
  for each row execute function public.handle_updated_at();


-- ============================================================
-- Auto-create user profile on auth.users insert
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- INDEXES
-- ============================================================

-- alert_events: user feed sorted by time
create index idx_alert_events_user_created
  on public.alert_events (user_id, created_at desc);

-- alert_events: unread filter
create index idx_alert_events_user_unread
  on public.alert_events (user_id, is_read)
  where is_read = false;

-- alert_rules: user's active rules by type
create index idx_alert_rules_user_type_active
  on public.alert_rules (user_id, type, is_active);

-- trading_signals: active signals feed
create index idx_trading_signals_status_tf_created
  on public.trading_signals (status, timeframe, created_at desc);

-- token_unlocks: upcoming unlocks
create index idx_token_unlocks_date
  on public.token_unlocks (unlock_date);

-- watchlist: user lookup
create index idx_watchlist_user
  on public.watchlist_items (user_id);

-- defi_protocol_health: risk scan
create index idx_defi_health_risk
  on public.defi_protocol_health (risk_level, chain);

-- stablecoin_pegs: depeg alerts
create index idx_stablecoin_pegs_status
  on public.stablecoin_pegs (status)
  where status != 'normal';


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.users               enable row level security;
alter table public.watchlist_items      enable row level security;
alter table public.alert_rules         enable row level security;
alter table public.alert_events        enable row level security;
alter table public.trading_signals     enable row level security;
alter table public.token_unlocks       enable row level security;
alter table public.defi_protocol_health enable row level security;
alter table public.stablecoin_pegs     enable row level security;

-- ── users: own profile CRUD ──
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- ── watchlist_items: own CRUD ──
create policy "watchlist_select_own" on public.watchlist_items
  for select using (auth.uid() = user_id);
create policy "watchlist_insert_own" on public.watchlist_items
  for insert with check (auth.uid() = user_id);
create policy "watchlist_update_own" on public.watchlist_items
  for update using (auth.uid() = user_id);
create policy "watchlist_delete_own" on public.watchlist_items
  for delete using (auth.uid() = user_id);

-- ── alert_rules: own CRUD ──
create policy "rules_select_own" on public.alert_rules
  for select using (auth.uid() = user_id);
create policy "rules_insert_own" on public.alert_rules
  for insert with check (auth.uid() = user_id);
create policy "rules_update_own" on public.alert_rules
  for update using (auth.uid() = user_id);
create policy "rules_delete_own" on public.alert_rules
  for delete using (auth.uid() = user_id);

-- ── alert_events: own SELECT + update (mark read/bookmark) ──
create policy "events_select_own" on public.alert_events
  for select using (auth.uid() = user_id);
create policy "events_update_own" on public.alert_events
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── trading_signals: authenticated SELECT ──
create policy "signals_select_authed" on public.trading_signals
  for select using (auth.role() = 'authenticated');

-- ── token_unlocks: authenticated SELECT ──
create policy "unlocks_select_authed" on public.token_unlocks
  for select using (auth.role() = 'authenticated');

-- ── defi_protocol_health: authenticated SELECT ──
create policy "defi_select_authed" on public.defi_protocol_health
  for select using (auth.role() = 'authenticated');

-- ── stablecoin_pegs: authenticated SELECT ──
create policy "pegs_select_authed" on public.stablecoin_pegs
  for select using (auth.role() = 'authenticated');


-- ============================================================
-- REALTIME
-- ============================================================

-- Enable Realtime on alert_events and stablecoin_pegs
alter publication supabase_realtime add table public.alert_events;
alter publication supabase_realtime add table public.stablecoin_pegs;
