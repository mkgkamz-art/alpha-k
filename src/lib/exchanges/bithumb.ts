/**
 * Bithumb REST API client (Public)
 * Docs: https://apidocs.bithumb.com/
 */

const BITHUMB_API = "https://api.bithumb.com/public";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;

/* ── Types ── */
export interface BithumbTicker {
  symbol: string;
  closing_price: number;
  fluctate_rate_24H: number;   // 24h 변동률 (%)
  acc_trade_value_24H: number; // 24h 거래량 (KRW)
}

/* ── Helpers ── */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── API Functions ── */

/** Fetch all KRW tickers from Bithumb */
export async function getBithumbTickers(): Promise<BithumbTicker[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BITHUMB_API}/ticker/ALL_KRW`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!res.ok) throw new Error(`Bithumb HTTP ${res.status}`);

      const data = await res.json();

      if (data.status !== "0000") {
        throw new Error(`Bithumb API status: ${data.status} ${data.message ?? ""}`);
      }

      const tickers: BithumbTicker[] = [];
      for (const [symbol, info] of Object.entries(data.data)) {
        if (symbol === "date" || typeof info !== "object" || info === null)
          continue;

        const record = info as Record<string, string>;
        tickers.push({
          symbol,
          closing_price: Number(record.closing_price) || 0,
          fluctate_rate_24H: Number(record.fluctate_rate_24H) || 0,
          acc_trade_value_24H: Number(record.acc_trade_value_24H) || 0,
        });
      }

      return tickers;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) await sleep(attempt * 2_000);
    }
  }

  throw lastError ?? new Error("Bithumb fetch failed");
}
