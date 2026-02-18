-- Korean Exchange Data Engine — Supabase Tables
-- Run this in the Supabase SQL Editor

-- 1. 한국 거래소 실시간 시세
CREATE TABLE IF NOT EXISTS korean_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  exchange VARCHAR(10) NOT NULL,
  price_krw DECIMAL(20,2) NOT NULL,
  price_usd DECIMAL(20,8),
  volume_24h DECIMAL(20,2),
  change_24h DECIMAL(10,4),
  kimchi_premium DECIMAL(10,4),
  usd_krw_rate DECIMAL(10,2),
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_korean_prices_symbol_exchange
  ON korean_prices(symbol, exchange);
CREATE INDEX IF NOT EXISTS idx_korean_prices_fetched_at
  ON korean_prices(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_korean_prices_kimchi
  ON korean_prices(kimchi_premium DESC);

-- 2. 최신 시세 뷰
CREATE OR REPLACE VIEW latest_korean_prices AS
SELECT DISTINCT ON (symbol, exchange) *
FROM korean_prices
ORDER BY symbol, exchange, fetched_at DESC;

-- 3. 김치프리미엄 히스토리
CREATE TABLE IF NOT EXISTS kimchi_premium_history (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  premium_percent DECIMAL(10,4) NOT NULL,
  price_krw DECIMAL(20,2),
  price_usd DECIMAL(20,8),
  usd_krw_rate DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kimchi_history_symbol
  ON kimchi_premium_history(symbol, recorded_at DESC);

-- 4. 상장 코인 목록
CREATE TABLE IF NOT EXISTS exchange_listed_coins (
  id BIGSERIAL PRIMARY KEY,
  exchange VARCHAR(10) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  market_code VARCHAR(30) NOT NULL,
  listed_at TIMESTAMPTZ DEFAULT NOW(),
  is_new BOOLEAN DEFAULT FALSE,
  UNIQUE(exchange, market_code)
);
