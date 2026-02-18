/**
 * CoinGecko global USD prices + Exchange Rate
 *
 * Used for kimchi premium calculation:
 *   kimchi = (krw_price - usd_price * rate) / (usd_price * rate) * 100
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const REQUEST_TIMEOUT_MS = 15_000;

/* ── Symbol → CoinGecko ID mapping (major coins traded on Korean exchanges) ── */
export const SYMBOL_TO_COINGECKO: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  XRP: "ripple",
  SOL: "solana",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  MATIC: "matic-network",
  ATOM: "cosmos",
  UNI: "uniswap",
  AAVE: "aave",
  ARB: "arbitrum",
  OP: "optimism",
  SUI: "sui",
  APT: "aptos",
  SEI: "sei-network",
  TIA: "celestia",
  STX: "blockstack",
  NEAR: "near",
  EOS: "eos",
  TRX: "tron",
  SHIB: "shiba-inu",
  SAND: "the-sandbox",
  MANA: "decentraland",
  IMX: "immutable-x",
  FTM: "fantom",
  ALGO: "algorand",
  HBAR: "hedera-hashgraph",
};

/* ── CoinGecko headers ── */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) headers["x-cg-demo-api-key"] = apiKey;
  return headers;
}

/* ── Exchange Rate (USD/KRW) ── */
const RATE_CACHE_MS = 60 * 60 * 1000; // 1 hour
let cachedRate: { rate: number; ts: number } | null = null;

/**
 * Get USD/KRW exchange rate.
 * Strategy: ExchangeRate-API → CoinGecko fallback → hardcoded 1450
 */
export async function getExchangeRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.ts < RATE_CACHE_MS) {
    return cachedRate.rate;
  }

  // 1. ExchangeRate-API (if key available)
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/KRW`,
        { signal: AbortSignal.timeout(5_000) }
      );
      if (res.ok) {
        const data = await res.json();
        const rate = Number(data.conversion_rate);
        if (rate > 0) {
          cachedRate = { rate, ts: Date.now() };
          return rate;
        }
      }
    } catch {
      // fall through
    }
  }

  // 2. CoinGecko BTC KRW/USD ratio as proxy
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=bitcoin&vs_currencies=krw,usd`,
      { headers: getHeaders(), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    );
    if (res.ok) {
      const data = await res.json();
      const krw = data?.bitcoin?.krw;
      const usd = data?.bitcoin?.usd;
      if (krw && usd && usd > 0) {
        const rate = Math.round(krw / usd);
        cachedRate = { rate, ts: Date.now() };
        return rate;
      }
    }
  } catch {
    // fall through
  }

  // 3. Hardcoded fallback
  return cachedRate?.rate ?? 1450;
}

/* ── Global USD Prices ── */

/**
 * Fetch global USD prices for given CoinGecko IDs.
 * Returns map: coingecko_id → usd price
 */
export async function getGlobalPricesUsd(
  ids: string[]
): Promise<Record<string, number>> {
  if (ids.length === 0) return {};

  const prices: Record<string, number> = {};

  // CoinGecko /simple/price supports up to ~250 IDs
  const batchSize = 100;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    try {
      const res = await fetch(
        `${COINGECKO_BASE}/simple/price?ids=${batch.join(",")}&vs_currencies=usd`,
        { headers: getHeaders(), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
      );

      if (!res.ok) {
        console.warn(`[coingecko-prices] HTTP ${res.status} for batch ${i}`);
        continue;
      }

      const data = await res.json();
      for (const [id, val] of Object.entries(data)) {
        const usd = (val as Record<string, number>)?.usd;
        if (usd != null) prices[id] = usd;
      }
    } catch (err) {
      console.warn(`[coingecko-prices] Fetch error:`, err);
    }
  }

  return prices;
}
