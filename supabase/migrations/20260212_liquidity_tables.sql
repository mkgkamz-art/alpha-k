-- Liquidity monitoring tables: dex_volumes + liquidity_pools

CREATE TABLE IF NOT EXISTS public.dex_volumes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_name text NOT NULL,
  daily_volume numeric NOT NULL DEFAULT 0,
  volume_change_24h numeric NOT NULL DEFAULT 0,
  total_tvl numeric NOT NULL DEFAULT 0,
  chains text[] NOT NULL DEFAULT '{}',
  last_updated timestamptz DEFAULT now(),
  CONSTRAINT dex_volumes_protocol_unique UNIQUE (protocol_name)
);

CREATE TABLE IF NOT EXISTS public.liquidity_pools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_name text NOT NULL,
  protocol text NOT NULL,
  chain text NOT NULL DEFAULT 'Ethereum',
  tvl numeric NOT NULL DEFAULT 0,
  apy numeric NOT NULL DEFAULT 0,
  apy_base numeric NOT NULL DEFAULT 0,
  apy_reward numeric NOT NULL DEFAULT 0,
  tvl_change_24h numeric NOT NULL DEFAULT 0,
  is_stablecoin boolean NOT NULL DEFAULT false,
  risk_level text NOT NULL DEFAULT 'low',
  last_updated timestamptz DEFAULT now(),
  CONSTRAINT liquidity_pools_unique UNIQUE (pool_name, protocol, chain)
);

-- RLS: public read
ALTER TABLE public.dex_volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read dex_volumes" ON public.dex_volumes FOR SELECT USING (true);
CREATE POLICY "Public read liquidity_pools" ON public.liquidity_pools FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dex_volumes_volume ON public.dex_volumes (daily_volume DESC);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_tvl ON public.liquidity_pools (tvl DESC);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_risk ON public.liquidity_pools (risk_level);

-- ═══ Seed Data ═══

INSERT INTO public.dex_volumes (protocol_name, daily_volume, volume_change_24h, total_tvl, chains)
VALUES
  ('Uniswap', 1812000000, 12.5, 5200000000, ARRAY['Ethereum','Arbitrum','Polygon','BSC','Base']),
  ('PancakeSwap', 642000000, -5.2, 1800000000, ARRAY['BSC','Ethereum','Arbitrum']),
  ('Curve Finance', 385000000, 8.1, 2100000000, ARRAY['Ethereum','Arbitrum','Polygon']),
  ('Raydium', 520000000, 45.3, 890000000, ARRAY['Solana']),
  ('Orca', 310000000, 22.1, 420000000, ARRAY['Solana']),
  ('SushiSwap', 125000000, -12.3, 340000000, ARRAY['Ethereum','Arbitrum','Polygon']),
  ('Trader Joe', 98000000, 18.7, 280000000, ARRAY['Avalanche','Arbitrum']),
  ('Aerodrome', 215000000, 35.2, 680000000, ARRAY['Base']),
  ('Velodrome', 87000000, -3.8, 310000000, ARRAY['Optimism']),
  ('Camelot', 62000000, 7.5, 190000000, ARRAY['Arbitrum'])
ON CONFLICT (protocol_name) DO NOTHING;

INSERT INTO public.liquidity_pools (pool_name, protocol, chain, tvl, apy, apy_base, apy_reward, tvl_change_24h, is_stablecoin, risk_level)
VALUES
  ('USDC-ETH', 'Uniswap', 'Ethereum', 485000000, 18.5, 12.3, 6.2, 2.1, false, 'low'),
  ('USDT-USDC', 'Curve Finance', 'Ethereum', 620000000, 4.2, 3.8, 0.4, 0.3, true, 'low'),
  ('WBTC-ETH', 'Uniswap', 'Ethereum', 320000000, 12.8, 10.2, 2.6, -1.5, false, 'low'),
  ('ETH-USDC', 'Uniswap', 'Arbitrum', 180000000, 22.4, 15.1, 7.3, 5.2, false, 'low'),
  ('SOL-USDC', 'Raydium', 'Solana', 145000000, 28.5, 18.2, 10.3, 8.4, false, 'medium'),
  ('DAI-USDC', 'Curve Finance', 'Ethereum', 410000000, 3.8, 3.5, 0.3, -0.2, true, 'low'),
  ('FRAX-USDC', 'Curve Finance', 'Ethereum', 95000000, 6.5, 4.1, 2.4, -22.5, true, 'high'),
  ('ETH-USDT', 'SushiSwap', 'Ethereum', 75000000, 15.2, 11.8, 3.4, -3.1, false, 'low'),
  ('ARB-ETH', 'Camelot', 'Arbitrum', 42000000, 35.8, 12.5, 23.3, 12.1, false, 'medium'),
  ('AERO-USDC', 'Aerodrome', 'Base', 88000000, 42.1, 8.2, 33.9, 15.3, false, 'medium'),
  ('OP-ETH', 'Velodrome', 'Optimism', 55000000, 28.3, 10.5, 17.8, -5.2, false, 'medium'),
  ('stETH-ETH', 'Curve Finance', 'Ethereum', 890000000, 3.2, 3.0, 0.2, 0.5, false, 'low'),
  ('USDD-USDT', 'Curve Finance', 'Ethereum', 35000000, 120.5, 5.2, 115.3, -18.4, true, 'high'),
  ('SOL-RAY', 'Raydium', 'Solana', 32000000, 55.2, 22.1, 33.1, 25.3, false, 'medium'),
  ('JOE-AVAX', 'Trader Joe', 'Avalanche', 18000000, 48.5, 15.3, 33.2, -8.1, false, 'medium'),
  ('WETH-USDC', 'PancakeSwap', 'BSC', 62000000, 16.8, 12.1, 4.7, 1.8, false, 'low'),
  ('CAKE-BNB', 'PancakeSwap', 'BSC', 95000000, 24.5, 8.5, 16.0, -2.3, false, 'low'),
  ('ORCA-SOL', 'Orca', 'Solana', 28000000, 32.1, 14.8, 17.3, 6.7, false, 'medium'),
  ('3pool', 'Curve Finance', 'Ethereum', 550000000, 3.5, 3.2, 0.3, 0.1, true, 'low'),
  ('LUSD-3CRV', 'Curve Finance', 'Ethereum', 42000000, 8.2, 5.1, 3.1, -1.2, true, 'low')
ON CONFLICT (pool_name, protocol, chain) DO NOTHING;
