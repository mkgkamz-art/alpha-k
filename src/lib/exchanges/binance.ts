/**
 * Binance REST API client (Public, no auth required)
 * Docs: https://binance-docs.github.io/apidocs/spot/en/
 *
 * Rate limit: 1200 req/min (public endpoints)
 */

const BINANCE_API = "https://api.binance.com/api/v3";
const REQUEST_TIMEOUT_MS = 10_000;

/* ── Types ── */

export interface BinanceTicker {
  symbol: string;           // "BTCUSDT"
  lastPrice: number;        // 현재가
  priceChangePercent: number; // 24h 변동률 (%)
  volume: number;           // 24h base asset volume
  quoteVolume: number;      // 24h quote asset volume (USDT)
}

export interface BinanceOrderbookEntry {
  price: number;
  quantity: number;
}

export interface BinanceOrderbook {
  symbol: string;
  bids: BinanceOrderbookEntry[];
  asks: BinanceOrderbookEntry[];
}

/* ── API Functions ── */

/**
 * Fetch 24h tickers for all USDT pairs.
 * Returns only USDT pairs for kimchi premium calculation.
 */
export async function getBinanceTickers(): Promise<BinanceTicker[]> {
  const res = await fetch(`${BINANCE_API}/ticker/24hr`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Binance ticker HTTP ${res.status}`);

  const data: Array<{
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    volume: string;
    quoteVolume: string;
  }> = await res.json();

  return data
    .filter((t) => t.symbol.endsWith("USDT"))
    .map((t) => ({
      symbol: t.symbol.replace("USDT", ""),
      lastPrice: Number(t.lastPrice),
      priceChangePercent: Number(t.priceChangePercent),
      volume: Number(t.volume),
      quoteVolume: Number(t.quoteVolume),
    }));
}

/**
 * Fetch specific USDT ticker.
 */
export async function getBinanceTicker(
  symbol: string,
): Promise<BinanceTicker | null> {
  const pair = `${symbol.toUpperCase()}USDT`;

  try {
    const res = await fetch(
      `${BINANCE_API}/ticker/24hr?symbol=${pair}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );

    if (!res.ok) return null;

    const t: {
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
      volume: string;
      quoteVolume: string;
    } = await res.json();

    return {
      symbol: t.symbol.replace("USDT", ""),
      lastPrice: Number(t.lastPrice),
      priceChangePercent: Number(t.priceChangePercent),
      volume: Number(t.volume),
      quoteVolume: Number(t.quoteVolume),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch orderbook (상/하 20호가).
 */
export async function getBinanceOrderbook(
  symbol: string,
  limit = 20,
): Promise<BinanceOrderbook | null> {
  const pair = `${symbol.toUpperCase()}USDT`;

  try {
    const res = await fetch(
      `${BINANCE_API}/depth?symbol=${pair}&limit=${limit}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    );

    if (!res.ok) return null;

    const data: {
      bids: [string, string][];
      asks: [string, string][];
    } = await res.json();

    return {
      symbol,
      bids: data.bids.map(([p, q]) => ({
        price: Number(p),
        quantity: Number(q),
      })),
      asks: data.asks.map(([p, q]) => ({
        price: Number(p),
        quantity: Number(q),
      })),
    };
  } catch {
    return null;
  }
}
