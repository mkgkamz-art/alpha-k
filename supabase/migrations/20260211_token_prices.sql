-- Token prices table (latest snapshot per token)
CREATE TABLE IF NOT EXISTS public.token_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  current_price NUMERIC NOT NULL DEFAULT 0,
  market_cap NUMERIC NOT NULL DEFAULT 0,
  total_volume NUMERIC NOT NULL DEFAULT 0,
  price_change_1h NUMERIC,
  price_change_24h NUMERIC,
  price_change_7d NUMERIC,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(token_id)
);

-- Price history table (time series for charts)
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL,
  price NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_prices_symbol ON public.token_prices (symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_token_time ON public.price_history (token_id, recorded_at DESC);

-- RLS
ALTER TABLE public.token_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can read prices)
CREATE POLICY "Public read token_prices"
  ON public.token_prices FOR SELECT
  USING (true);

CREATE POLICY "Public read price_history"
  ON public.price_history FOR SELECT
  USING (true);

-- Service role can insert/update (cron jobs use admin client which bypasses RLS)
-- No additional policies needed — admin client bypasses RLS.
