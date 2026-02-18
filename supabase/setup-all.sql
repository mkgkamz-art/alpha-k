-- ═══════════════════════════════════════════════════════
-- BLOSAFE: 전체 테이블 생성 + 샘플 데이터 시딩
-- Supabase SQL Editor에서 한번 실행하세요
-- ═══════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════
-- 0. 기존 충돌 객체 정리
-- stablecoin_pegs 테이블이 stablecoin_status enum을 사용하므로
-- 새 stablecoin_status 테이블 생성 전 제거 필요
-- ═══════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.stablecoin_pegs CASCADE;
DROP TYPE IF EXISTS public.stablecoin_status CASCADE;

-- 미사용 old 테이블 정리 (우리 코드는 signals, defi_protocols 사용)
DROP TABLE IF EXISTS public.trading_signals CASCADE;
DROP TABLE IF EXISTS public.defi_protocol_health CASCADE;

-- token_unlocks 테이블 재생성 (old 스키마와 완전히 다름)
DROP TABLE IF EXISTS public.token_unlocks CASCADE;

-- old enum 타입 정리 (새 테이블은 text 컬럼 사용)
DROP TYPE IF EXISTS public.signal_type CASCADE;
DROP TYPE IF EXISTS public.signal_status CASCADE;
DROP TYPE IF EXISTS public.timeframe CASCADE;
DROP TYPE IF EXISTS public.risk_level CASCADE;
DROP TYPE IF EXISTS public.unlock_type CASCADE;
DROP TYPE IF EXISTS public.chain_type CASCADE;

-- ═══════════════════════════════════════════════════════
-- 1. token_prices
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.token_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id text NOT NULL UNIQUE,
  symbol text NOT NULL,
  name text NOT NULL,
  current_price numeric NOT NULL DEFAULT 0,
  market_cap numeric NOT NULL DEFAULT 0,
  total_volume numeric NOT NULL DEFAULT 0,
  price_change_1h numeric,
  price_change_24h numeric,
  price_change_7d numeric,
  last_updated timestamptz DEFAULT now()
);
ALTER TABLE public.token_prices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "token_prices_public_read" ON public.token_prices FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════
-- 2. price_history
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.price_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id text NOT NULL,
  price numeric NOT NULL,
  recorded_at timestamptz DEFAULT now()
);
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "price_history_public_read" ON public.price_history FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════
-- 3. whale_events
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.whale_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash text NOT NULL UNIQUE,
  blockchain text NOT NULL,
  from_address text,
  from_label text,
  to_address text,
  to_label text,
  symbol text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  usd_value numeric NOT NULL DEFAULT 0,
  event_type text NOT NULL DEFAULT 'transfer',
  detected_at timestamptz DEFAULT now()
);
ALTER TABLE public.whale_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "whale_events_public_read" ON public.whale_events FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════
-- 4. defi_protocols
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.defi_protocols (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tvl numeric NOT NULL DEFAULT 0,
  tvl_change_24h numeric DEFAULT 0,
  tvl_change_7d numeric DEFAULT 0,
  category text,
  chains text[] DEFAULT '{}',
  last_updated timestamptz DEFAULT now()
);
ALTER TABLE public.defi_protocols ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "defi_protocols_public_read" ON public.defi_protocols FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════
-- 5. stablecoin_status (enum 타입 제거 후 생성 가능)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.stablecoin_status (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol text NOT NULL UNIQUE,
  name text NOT NULL,
  current_price numeric NOT NULL DEFAULT 1.0,
  peg_deviation numeric DEFAULT 0,
  is_depegged boolean DEFAULT false,
  last_updated timestamptz DEFAULT now()
);
ALTER TABLE public.stablecoin_status ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "stablecoin_status_public_read" ON public.stablecoin_status FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════
-- 6. signals
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.signals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token_symbol text NOT NULL,
  token_name text NOT NULL,
  signal_type text NOT NULL,
  signal_name text NOT NULL,
  confidence smallint NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  timeframe text NOT NULL DEFAULT '1D',
  description text DEFAULT '',
  indicators jsonb DEFAULT '{}',
  price_at_signal numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "signals_public_read" ON public.signals FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════
-- 7. token_unlocks (재생성)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.token_unlocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token_symbol text NOT NULL,
  token_name text NOT NULL,
  unlock_date timestamptz NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  usd_value_estimate numeric NOT NULL DEFAULT 0,
  percent_of_supply numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'ecosystem',
  impact_score smallint NOT NULL DEFAULT 5,
  is_notified_3d boolean DEFAULT false,
  is_notified_1d boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT token_unlocks_symbol_date_unique UNIQUE (token_symbol, unlock_date)
);
ALTER TABLE public.token_unlocks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "token_unlocks_public_read" ON public.token_unlocks FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════
-- 샘플 데이터 시딩
-- ═══════════════════════════════════════════════════════

-- token_prices (Top 20 coins)
INSERT INTO public.token_prices (token_id, symbol, name, current_price, market_cap, total_volume, price_change_1h, price_change_24h, price_change_7d)
VALUES
  ('bitcoin', 'btc', 'Bitcoin', 97542.00, 1932000000000, 28500000000, 0.3, 2.1, 5.4),
  ('ethereum', 'eth', 'Ethereum', 3285.50, 395000000000, 15200000000, -0.1, 1.8, 3.2),
  ('tether', 'usdt', 'Tether', 1.0001, 142000000000, 52000000000, 0.0, 0.01, 0.0),
  ('binancecoin', 'bnb', 'BNB', 685.20, 99800000000, 1850000000, 0.5, 3.2, 7.1),
  ('solana', 'sol', 'Solana', 198.40, 96500000000, 4200000000, 1.2, 4.5, 12.3),
  ('ripple', 'xrp', 'XRP', 2.85, 164000000000, 8900000000, -0.3, -1.2, 8.5),
  ('usd-coin', 'usdc', 'USD Coin', 0.9999, 56000000000, 8100000000, 0.0, -0.01, 0.0),
  ('cardano', 'ada', 'Cardano', 0.782, 27800000000, 890000000, 0.8, 2.5, -1.3),
  ('dogecoin', 'doge', 'Dogecoin', 0.342, 50200000000, 2100000000, -0.5, -2.1, 15.6),
  ('avalanche-2', 'avax', 'Avalanche', 38.50, 15800000000, 620000000, 0.2, 1.9, -3.2),
  ('chainlink', 'link', 'Chainlink', 19.85, 12700000000, 780000000, 0.6, 3.1, 9.4),
  ('polkadot', 'dot', 'Polkadot', 7.42, 10800000000, 340000000, -0.2, -0.5, -2.8),
  ('sui', 'sui', 'Sui', 3.65, 11200000000, 890000000, 1.5, 6.2, 18.5),
  ('near', 'near', 'NEAR Protocol', 5.28, 6300000000, 420000000, 0.4, 2.8, 7.2),
  ('uniswap', 'uni', 'Uniswap', 12.45, 9400000000, 310000000, -0.1, 1.2, -1.5),
  ('litecoin', 'ltc', 'Litecoin', 128.30, 9700000000, 580000000, 0.3, 0.8, 2.1),
  ('aptos', 'apt', 'Aptos', 9.12, 4800000000, 280000000, -0.7, -3.2, -8.5),
  ('arbitrum', 'arb', 'Arbitrum', 1.15, 4200000000, 420000000, 0.9, 5.1, 11.2),
  ('optimism', 'op', 'Optimism', 2.08, 2900000000, 310000000, 0.3, 2.4, 6.8),
  ('render-token', 'rndr', 'Render', 7.85, 4100000000, 280000000, 1.1, 4.2, 14.3)
ON CONFLICT (token_id) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  market_cap = EXCLUDED.market_cap,
  total_volume = EXCLUDED.total_volume,
  price_change_1h = EXCLUDED.price_change_1h,
  price_change_24h = EXCLUDED.price_change_24h,
  price_change_7d = EXCLUDED.price_change_7d,
  last_updated = now();

-- whale_events (Recent whale movements)
INSERT INTO public.whale_events (tx_hash, blockchain, from_address, from_label, to_address, to_label, symbol, amount, usd_value, event_type, detected_at)
VALUES
  ('0xabc001', 'ethereum', '0x1234...abcd', 'Binance', '0x5678...efgh', 'Unknown Wallet', 'BTC', 450, 43893900, 'exchange_withdrawal', now() - interval '12 minutes'),
  ('0xabc002', 'ethereum', '0x9876...wxyz', 'Unknown Whale', '0x1111...2222', 'Coinbase', 'ETH', 12500, 41068750, 'exchange_deposit', now() - interval '28 minutes'),
  ('0xabc003', 'ethereum', '0x3333...4444', 'Jump Trading', '0x5555...6666', 'Wintermute', 'USDT', 50000000, 50000000, 'transfer', now() - interval '45 minutes'),
  ('0xabc004', 'solana', 'So1234...abcd', 'FTX Recovery', 'So5678...efgh', 'Kraken', 'SOL', 185000, 36704000, 'exchange_deposit', now() - interval '1 hour'),
  ('0xabc005', 'ethereum', '0x7777...8888', 'Alameda', '0x9999...0000', 'OKX', 'ETH', 8200, 26940900, 'exchange_deposit', now() - interval '2 hours'),
  ('0xabc006', 'ethereum', '0xaaaa...bbbb', 'Vitalik.eth', '0xcccc...dddd', 'Gitcoin Grants', 'ETH', 500, 1642750, 'transfer', now() - interval '3 hours'),
  ('0xabc007', 'bitcoin', 'bc1q...whale1', 'Satoshi Era Wallet', 'bc1q...exch1', 'Binance', 'BTC', 1200, 117050400, 'exchange_deposit', now() - interval '4 hours'),
  ('0xabc008', 'ethereum', '0xdddd...eeee', 'Paradigm', '0xffff...1111', 'Aave V3', 'USDC', 25000000, 25000000, 'defi_deposit', now() - interval '5 hours')
ON CONFLICT (tx_hash) DO NOTHING;

-- defi_protocols (Top DeFi protocols)
INSERT INTO public.defi_protocols (protocol_name, slug, tvl, tvl_change_24h, tvl_change_7d, category, chains)
VALUES
  ('Lido', 'lido', 35200000000, 1.2, 3.5, 'Liquid Staking', ARRAY['ethereum', 'solana', 'polygon']),
  ('Aave', 'aave', 18500000000, -0.8, 2.1, 'Lending', ARRAY['ethereum', 'arbitrum', 'polygon', 'avalanche']),
  ('MakerDAO', 'makerdao', 8900000000, 0.5, 1.8, 'CDP', ARRAY['ethereum']),
  ('Uniswap', 'uniswap', 6200000000, 2.3, 5.4, 'DEX', ARRAY['ethereum', 'arbitrum', 'polygon', 'bsc']),
  ('Eigenlayer', 'eigenlayer', 12800000000, -1.5, -4.2, 'Restaking', ARRAY['ethereum']),
  ('Rocket Pool', 'rocket-pool', 4500000000, 0.3, 1.2, 'Liquid Staking', ARRAY['ethereum']),
  ('Compound', 'compound', 3200000000, -0.2, 0.8, 'Lending', ARRAY['ethereum', 'arbitrum']),
  ('Curve', 'curve', 2800000000, 1.1, -2.5, 'DEX', ARRAY['ethereum', 'arbitrum', 'polygon']),
  ('Pendle', 'pendle', 4100000000, 3.2, 8.5, 'Yield', ARRAY['ethereum', 'arbitrum']),
  ('Jupiter', 'jupiter', 2100000000, -12.5, -18.3, 'DEX', ARRAY['solana'])
ON CONFLICT (slug) DO UPDATE SET
  tvl = EXCLUDED.tvl,
  tvl_change_24h = EXCLUDED.tvl_change_24h,
  tvl_change_7d = EXCLUDED.tvl_change_7d,
  last_updated = now();

-- stablecoin_status
INSERT INTO public.stablecoin_status (symbol, name, current_price, peg_deviation, is_depegged)
VALUES
  ('USDT', 'Tether', 1.0001, 0.01, false),
  ('USDC', 'USD Coin', 0.9999, -0.01, false),
  ('DAI', 'Dai', 0.9998, -0.02, false),
  ('BUSD', 'Binance USD', 0.9995, -0.05, false),
  ('FRAX', 'Frax', 0.9992, -0.08, false),
  ('TUSD', 'TrueUSD', 0.9978, -0.22, false),
  ('USDD', 'USDD', 0.9845, -1.55, true),
  ('PYUSD', 'PayPal USD', 1.0002, 0.02, false)
ON CONFLICT (symbol) DO UPDATE SET
  current_price = EXCLUDED.current_price,
  peg_deviation = EXCLUDED.peg_deviation,
  is_depegged = EXCLUDED.is_depegged,
  last_updated = now();

-- signals (Trading signals)
INSERT INTO public.signals (token_symbol, token_name, signal_type, signal_name, confidence, timeframe, description, indicators, price_at_signal, created_at)
VALUES
  ('BTC', 'Bitcoin', 'buy', 'Strong Uptrend', 85, '1D', 'Sustained momentum: 24h +2.1%, 7d +5.4%. Significant price movement (+2.1%) indicates elevated trading volume.', '{"Strong Uptrend": {"direction": "bullish", "detail": "Sustained momentum: 24h +2.1%, 7d +5.4%"}, "Volume Spike": {"direction": "neutral", "detail": "Significant price movement (+2.1%)"}}', 97542, now() - interval '2 hours'),
  ('SOL', 'Solana', 'buy', 'Oversold Signal', 90, '1D', '7d change: +12.3%, 24h change: +4.5%. Momentum Shift (Bullish): 24h flipped to +4.5%.', '{"Oversold Signal": {"direction": "bullish", "detail": "7d change: +12.3%, 24h +4.5%"}, "Momentum Shift (Bullish)": {"direction": "bullish", "detail": "24h flipped to +4.5%"}, "Volume Spike": {"direction": "neutral", "detail": "High volume detected"}}', 198.40, now() - interval '2 hours'),
  ('SUI', 'Sui', 'buy', 'Strong Uptrend', 82, '1D', 'Sustained momentum: 24h +6.2%, 7d +18.5%. Volume spike detected.', '{"Strong Uptrend": {"direction": "bullish", "detail": "24h +6.2%, 7d +18.5%"}, "Volume Spike": {"direction": "neutral", "detail": "+6.2% price movement"}}', 3.65, now() - interval '2 hours'),
  ('APT', 'Aptos', 'sell', 'Strong Downtrend', 78, '1D', 'Sustained decline: 24h -3.2%, 7d -8.5%. Bearish momentum detected.', '{"Strong Downtrend": {"direction": "bearish", "detail": "24h -3.2%, 7d -8.5%"}, "Volume Spike": {"direction": "neutral", "detail": "High selling volume"}}', 9.12, now() - interval '2 hours'),
  ('DOGE', 'Dogecoin', 'alert', 'High Volatility Alert', 55, '1D', '1h change: -0.5%. Significant price movement detected.', '{"High Volatility Alert": {"direction": "bearish", "detail": "1h change: -0.5%"}}', 0.342, now() - interval '3 hours'),
  ('ARB', 'Arbitrum', 'buy', 'Momentum Shift (Bullish)', 72, '1D', '24h flipped from -1.5% to +5.1%. Strong recovery signal.', '{"Momentum Shift (Bullish)": {"direction": "bullish", "detail": "24h flipped to +5.1%"}, "Volume Spike": {"direction": "neutral", "detail": "+5.1% movement"}}', 1.15, now() - interval '3 hours'),
  ('RNDR', 'Render', 'buy', 'Strong Uptrend', 80, '1D', 'Sustained momentum: 24h +4.2%, 7d +14.3%.', '{"Strong Uptrend": {"direction": "bullish", "detail": "24h +4.2%, 7d +14.3%"}}', 7.85, now() - interval '4 hours'),
  ('ETH', 'Ethereum', 'alert', 'Volume Spike', 58, '4H', 'Significant price movement (+1.8%) indicates elevated trading volume.', '{"Volume Spike": {"direction": "neutral", "detail": "+1.8% movement in 4h window"}}', 3285.50, now() - interval '1 hour'),
  ('LINK', 'Chainlink', 'buy', 'Momentum Shift (Bullish)', 75, '4H', '4h momentum shifted bullish. Volume spike confirmed.', '{"Momentum Shift (Bullish)": {"direction": "bullish", "detail": "4h bullish flip"}, "Volume Spike": {"direction": "neutral", "detail": "Elevated volume"}}', 19.85, now() - interval '1 hour')
ON CONFLICT DO NOTHING;

-- alert_events for the existing user
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM public.users LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.alert_events (user_id, type, severity, title, description, metadata, created_at)
    VALUES
      (uid, 'whale', 'high', 'BTC 450 moved from Binance', '450 BTC ($43.9M) withdrawn from Binance to unknown wallet', '{"symbol":"BTC","amount":450,"usd_value":43893900}', now() - interval '12 minutes'),
      (uid, 'whale', 'critical', '1,200 BTC moved to Binance', 'Satoshi-era wallet deposited 1,200 BTC ($117M) to Binance', '{"symbol":"BTC","amount":1200,"usd_value":117050400}', now() - interval '4 hours'),
      (uid, 'risk', 'high', 'Jupiter TVL dropped 12.5% in 24h', 'Jupiter TVL fell from $2.4B to $2.1B (-12.5%)', '{"protocol":"Jupiter","change_pct":-12.5}', now() - interval '1 hour'),
      (uid, 'risk', 'medium', 'USDD peg deviation warning: -1.55%', 'USDD trading at $0.9845, deviating 1.55% from $1.00 peg', '{"symbol":"USDD","price":0.9845,"deviation":-1.55}', now() - interval '2 hours'),
      (uid, 'price_signal', 'high', 'SOL — Oversold Signal', '7d change: +12.3%, 24h change: +4.5%. Confidence: 90%', '{"signal_type":"buy","confidence":90,"timeframe":"1D"}', now() - interval '2 hours'),
      (uid, 'price_signal', 'medium', 'APT — Strong Downtrend', 'Sustained decline: 24h -3.2%, 7d -8.5%. Confidence: 78%', '{"signal_type":"sell","confidence":78,"timeframe":"1D"}', now() - interval '2 hours'),
      (uid, 'token_unlock', 'medium', 'ARB unlock in 5 days', '1,100,000,000 ARB tokens ($1.27B) — 10.7% of supply', '{"token_symbol":"ARB","days_until":5}', now() - interval '6 hours'),
      (uid, 'token_unlock', 'high', 'OP unlock TOMORROW', '31,340,000 OP tokens ($65.2M) unlocking tomorrow', '{"token_symbol":"OP","days_until":1}', now() - interval '3 hours');
  END IF;
END $$;

-- Seed token_unlocks
INSERT INTO public.token_unlocks (token_symbol, token_name, unlock_date, amount, usd_value_estimate, percent_of_supply, category, impact_score, is_notified_3d, is_notified_1d)
VALUES
  ('ARB', 'Arbitrum', now() + interval '5 days', 1100000000, 1265000000, 10.7, 'investor', 9, false, false),
  ('OP', 'Optimism', now() + interval '1 day', 31340000, 65200000, 2.9, 'team', 7, false, false),
  ('APT', 'Aptos', now() + interval '12 days', 11310000, 103150000, 2.5, 'ecosystem', 6, false, false),
  ('SUI', 'Sui', now() + interval '18 days', 64190000, 234300000, 2.1, 'investor', 7, false, false),
  ('SEI', 'Sei', now() + interval '8 days', 55000000, 23100000, 1.8, 'ecosystem', 5, false, false),
  ('TIA', 'Celestia', now() + interval '25 days', 88700000, 620900000, 8.4, 'investor', 9, false, false),
  ('STRK', 'Starknet', now() + interval '3 days', 64000000, 44800000, 3.5, 'team', 6, false, false),
  ('JTO', 'Jito', now() + interval '15 days', 22000000, 66000000, 3.1, 'investor', 5, false, false),
  ('PYTH', 'Pyth Network', now() + interval '22 days', 127000000, 50800000, 2.8, 'ecosystem', 4, false, false),
  ('DYDX', 'dYdX', now() + interval '9 days', 33333333, 40000000, 5.0, 'team', 7, false, false)
ON CONFLICT (token_symbol, unlock_date) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- 완료 확인
-- ═══════════════════════════════════════════════════════
SELECT 'Setup complete!' AS status,
  (SELECT count(*) FROM public.token_prices) AS token_prices,
  (SELECT count(*) FROM public.whale_events) AS whale_events,
  (SELECT count(*) FROM public.defi_protocols) AS defi_protocols,
  (SELECT count(*) FROM public.stablecoin_status) AS stablecoins,
  (SELECT count(*) FROM public.signals) AS signals,
  (SELECT count(*) FROM public.alert_events) AS alert_events,
  (SELECT count(*) FROM public.token_unlocks) AS token_unlocks;
