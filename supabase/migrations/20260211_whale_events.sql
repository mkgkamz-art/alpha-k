-- Whale events table (large on-chain transfers)
CREATE TABLE IF NOT EXISTS public.whale_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_label TEXT NOT NULL DEFAULT 'Unknown Wallet',
  to_address TEXT NOT NULL,
  to_label TEXT NOT NULL DEFAULT 'Unknown Wallet',
  symbol TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  usd_value NUMERIC NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL DEFAULT 'transfer',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whale_events_detected_at ON public.whale_events (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_whale_events_usd_value ON public.whale_events (usd_value DESC);
CREATE INDEX IF NOT EXISTS idx_whale_events_symbol ON public.whale_events (symbol);

-- RLS
ALTER TABLE public.whale_events ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can see whale movements)
CREATE POLICY "Public read whale_events"
  ON public.whale_events FOR SELECT
  USING (true);

-- Service role can insert (cron jobs use admin client which bypasses RLS)
-- No additional policies needed — admin client bypasses RLS.
