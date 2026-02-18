-- Signals table: Generated trading signals (simpler than trading_signals)
-- This is a separate table from trading_signals (legacy)

CREATE TABLE IF NOT EXISTS public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  signal_type TEXT NOT NULL DEFAULT 'alert',
  signal_name TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 50,
  timeframe TEXT NOT NULL DEFAULT '1D',
  description TEXT NOT NULL DEFAULT '',
  indicators JSONB NOT NULL DEFAULT '{}',
  price_at_signal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for queries by timeframe + recency
CREATE INDEX IF NOT EXISTS idx_signals_timeframe_created
  ON public.signals (timeframe, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signals_type
  ON public.signals (signal_type, created_at DESC);

-- RLS: public read
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signals_public_read" ON public.signals;
CREATE POLICY "signals_public_read"
  ON public.signals FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "signals_service_write" ON public.signals;
CREATE POLICY "signals_service_write"
  ON public.signals FOR ALL
  USING (auth.role() = 'service_role');
