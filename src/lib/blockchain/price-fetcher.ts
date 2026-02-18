/**
 * CoinGecko price fetcher with rate-limiting, retry, and data normalization.
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

/** Delay between requests to respect CoinGecko free tier rate limits */
const REQUEST_DELAY_MS = 3_000;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 15_000;

/* ── Types ── */

export interface TokenPrice {
  token_id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_1h: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  last_updated: string;
}

export interface FearGreedData {
  value: number;
  classification: string;
}

export interface GasData {
  fast: number;
  average: number;
  low: number;
}

/* ── Helpers ── */

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) headers["x-cg-demo-api-key"] = apiKey;
  return headers;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: getHeaders(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (res.status === 429) {
        // Rate limited — wait longer and retry
        const wait = Math.min(attempt * 5_000, 30_000);
        console.warn(`[price-fetcher] Rate limited, waiting ${wait}ms (attempt ${attempt})`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        throw new Error(`CoinGecko HTTP ${res.status}`);
      }

      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      const backoff = Math.pow(2, attempt) * 1_000;
      console.warn(`[price-fetcher] Retry ${attempt}/${retries} in ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw new Error("fetchWithRetry: exhausted retries");
}

/* ── Main Fetchers ── */

/**
 * Fetches top N market tokens with price change percentages.
 * Uses /coins/markets endpoint for comprehensive data.
 */
export async function fetchMarketPrices(perPage = 100): Promise<TokenPrice[]> {
  const url =
    `${COINGECKO_BASE}/coins/markets` +
    `?vs_currency=usd` +
    `&order=market_cap_desc` +
    `&per_page=${perPage}` +
    `&page=1` +
    `&sparkline=false` +
    `&price_change_percentage=1h,24h,7d`;

  const res = await fetchWithRetry(url);
  const data = (await res.json()) as Array<{
    id: string;
    symbol: string;
    name: string;
    current_price: number | null;
    market_cap: number | null;
    total_volume: number | null;
    price_change_percentage_1h_in_currency: number | null;
    price_change_percentage_24h_in_currency: number | null;
    price_change_percentage_7d_in_currency: number | null;
    last_updated: string;
  }>;

  return data
    .filter((coin) => coin.current_price !== null)
    .map((coin) => ({
      token_id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      current_price: coin.current_price!,
      market_cap: coin.market_cap ?? 0,
      total_volume: coin.total_volume ?? 0,
      price_change_1h: coin.price_change_percentage_1h_in_currency,
      price_change_24h: coin.price_change_percentage_24h_in_currency,
      price_change_7d: coin.price_change_percentage_7d_in_currency,
      last_updated: coin.last_updated,
    }));
}

/**
 * Fetches simple prices for specific token IDs.
 * Lighter than /coins/markets, good for targeted lookups.
 */
export async function fetchSimplePrices(
  ids: string[]
): Promise<Record<string, { usd: number; usd_24h_change: number | null }>> {
  if (ids.length === 0) return {};

  const url =
    `${COINGECKO_BASE}/simple/price` +
    `?ids=${ids.join(",")}` +
    `&vs_currencies=usd` +
    `&include_24hr_change=true`;

  const res = await fetchWithRetry(url);
  return res.json();
}

/**
 * Fetches Crypto Fear & Greed Index.
 */
export async function fetchFearGreed(): Promise<FearGreedData> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`FNG HTTP ${res.status}`);
    const data = await res.json();
    const entry = data.data?.[0];
    return {
      value: Number(entry?.value ?? 50),
      classification: entry?.value_classification ?? "Neutral",
    };
  } catch {
    return { value: 50, classification: "Neutral" };
  }
}

/**
 * Fetches Ethereum gas prices (Gwei).
 * Falls back to a simple default if API is unavailable.
 */
export async function fetchGasPrice(): Promise<GasData> {
  // Try Etherscan first
  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  if (etherscanKey) {
    try {
      const res = await fetch(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscanKey}`,
        { signal: AbortSignal.timeout(5_000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "1" && data.result) {
          return {
            fast: Number(data.result.FastGasPrice),
            average: Number(data.result.ProposeGasPrice),
            low: Number(data.result.SafeGasPrice),
          };
        }
      }
    } catch {
      // Fall through to alternative
    }
  }

  // Fallback: Blocknative-style public endpoint
  try {
    const res = await fetch(
      "https://api.blocknative.com/gasprices/blockprices?confidenceLevels=90",
      { signal: AbortSignal.timeout(5_000) }
    );
    if (res.ok) {
      const data = await res.json();
      const block = data.blockPrices?.[0];
      const est = block?.estimatedPrices?.[0];
      if (est) {
        return {
          fast: Math.round(est.maxFeePerGas ?? 30),
          average: Math.round(est.maxFeePerGas ? est.maxFeePerGas * 0.8 : 20),
          low: Math.round(est.maxFeePerGas ? est.maxFeePerGas * 0.6 : 10),
        };
      }
    }
  } catch {
    // Fall through
  }

  return { fast: 30, average: 20, low: 10 };
}
