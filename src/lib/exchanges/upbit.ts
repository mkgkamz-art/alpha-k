/**
 * Upbit REST API client (Public, no auth required)
 * Docs: https://docs.upbit.com/reference
 *
 * Rate limit: 10 req/sec (public endpoints)
 */

const UPBIT_API = "https://api.upbit.com/v1";
const REQUEST_TIMEOUT_MS = 10_000;

/* ── Types ── */
export interface UpbitMarket {
  market: string;        // "KRW-BTC"
  korean_name: string;   // "비트코인"
  english_name: string;  // "Bitcoin"
}

export interface UpbitTicker {
  market: string;
  trade_price: number;          // 현재가
  signed_change_rate: number;   // 변동률 (소수점, 0.05 = 5%)
  acc_trade_price_24h: number;  // 24시간 누적 거래대금 (KRW)
  timestamp: number;
}

/* ── Helpers ── */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/* ── API Functions ── */

/** Fetch all KRW markets from Upbit */
export async function getUpbitMarkets(): Promise<UpbitMarket[]> {
  const res = await fetch(`${UPBIT_API}/market/all?is_details=true`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Upbit market/all HTTP ${res.status}`);

  const data: UpbitMarket[] = await res.json();
  return data.filter((m) => m.market.startsWith("KRW-"));
}

/** Fetch tickers for given markets (max 100 per request, auto-chunked) */
export async function getUpbitTickers(
  markets: string[]
): Promise<UpbitTicker[]> {
  const chunks = chunkArray(markets, 100);
  const results: UpbitTicker[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const res = await fetch(
      `${UPBIT_API}/ticker?markets=${chunk.join(",")}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!res.ok) throw new Error(`Upbit ticker HTTP ${res.status}`);

    const data: UpbitTicker[] = await res.json();
    results.push(...data);

    // Rate limit guard
    if (i < chunks.length - 1) await sleep(150);
  }

  return results;
}

/* ── Orderbook Types ── */

export interface UpbitOrderbookUnit {
  ask_price: number;
  bid_price: number;
  ask_size: number;
  bid_size: number;
}

export interface UpbitOrderbook {
  market: string;
  orderbook_units: UpbitOrderbookUnit[];
  total_ask_size: number;
  total_bid_size: number;
}

/**
 * Fetch orderbook for given markets (max 10 per request).
 * 호가 정보: 상/하 15호가.
 */
export async function getUpbitOrderbook(
  markets: string[],
): Promise<UpbitOrderbook[]> {
  const chunks = chunkArray(markets, 10);
  const results: UpbitOrderbook[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const res = await fetch(
      `${UPBIT_API}/orderbook?markets=${chunk.join(",")}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!res.ok) throw new Error(`Upbit orderbook HTTP ${res.status}`);

    const data: UpbitOrderbook[] = await res.json();
    results.push(...data);

    if (i < chunks.length - 1) await sleep(150);
  }

  return results;
}
