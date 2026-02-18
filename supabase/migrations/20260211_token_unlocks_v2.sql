-- Token Unlocks v2: New schema with notification tracking
-- Replaces the old token_unlocks table

-- Drop old table if it exists (Phase 3 placeholder)
DROP TABLE IF EXISTS public.token_unlocks;

CREATE TABLE IF NOT EXISTS public.token_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  unlock_date TIMESTAMPTZ NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  usd_value_estimate NUMERIC NOT NULL DEFAULT 0,
  percent_of_supply NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'public',
  impact_score NUMERIC NOT NULL DEFAULT 0,
  is_notified_3d BOOLEAN NOT NULL DEFAULT false,
  is_notified_1d BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(token_symbol, unlock_date)
);

-- Index for cron queries (upcoming unlocks + notification status)
CREATE INDEX IF NOT EXISTS idx_token_unlocks_date
  ON public.token_unlocks (unlock_date ASC);

CREATE INDEX IF NOT EXISTS idx_token_unlocks_notify
  ON public.token_unlocks (unlock_date, is_notified_3d, is_notified_1d);

-- RLS: public read
ALTER TABLE public.token_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "token_unlocks_public_read" ON public.token_unlocks;
CREATE POLICY "token_unlocks_public_read"
  ON public.token_unlocks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "token_unlocks_service_write" ON public.token_unlocks;
CREATE POLICY "token_unlocks_service_write"
  ON public.token_unlocks FOR ALL
  USING (auth.role() = 'service_role');
