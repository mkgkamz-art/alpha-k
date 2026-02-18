-- DeFi protocols table (TVL monitoring from DeFi Llama)
CREATE TABLE IF NOT EXISTS public.defi_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  tvl NUMERIC NOT NULL DEFAULT 0,
  tvl_change_24h NUMERIC NOT NULL DEFAULT 0,
  tvl_change_7d NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Other',
  chains TEXT[] NOT NULL DEFAULT '{}',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slug)
);

-- Stablecoin status table (peg monitoring from CoinGecko)
CREATE TABLE IF NOT EXISTS public.stablecoin_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  current_price NUMERIC NOT NULL DEFAULT 1,
  peg_deviation NUMERIC NOT NULL DEFAULT 0,
  is_depegged BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(symbol)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_defi_protocols_tvl ON public.defi_protocols (tvl DESC);
CREATE INDEX IF NOT EXISTS idx_stablecoin_status_symbol ON public.stablecoin_status (symbol);

-- RLS
ALTER TABLE public.defi_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stablecoin_status ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can see DeFi data)
CREATE POLICY "Public read defi_protocols"
  ON public.defi_protocols FOR SELECT
  USING (true);

CREATE POLICY "Public read stablecoin_status"
  ON public.stablecoin_status FOR SELECT
  USING (true);
