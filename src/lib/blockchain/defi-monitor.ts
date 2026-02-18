/**
 * DeFi Monitor — Protocol TVL & Stablecoin Peg Monitoring
 *
 * DeFiLlama API (free, no key): Protocol TVL data
 * CoinGecko API: Stablecoin prices
 *
 * Stablecoin depeg: 0.5% = medium, 1% = high, 3%+ = critical
 * TVL drop: 10% = high, 30% = critical
 */

/* ── Types ── */

export interface DefiProtocol {
  protocol_name: string;
  slug: string;
  tvl: number;
  tvl_change_24h: number;
  tvl_change_7d: number;
  category: string;
  chains: string[];
  last_updated: string;
}

export interface StablecoinData {
  symbol: string;
  name: string;
  current_price: number;
  peg_deviation: number;
  is_depegged: boolean;
  last_updated: string;
}

export interface TvlAlert {
  protocolName: string;
  protocolSlug: string;
  chain: string;
  currentTvl: number;
  previousTvl: number;
  changePct: number;
  severity: "critical" | "high" | "medium";
}

export interface StablecoinAlert {
  symbol: string;
  currentPrice: number;
  deviationPct: number;
  severity: "critical" | "high" | "medium";
}

export type DefiAlertHandler = (
  alert: TvlAlert | StablecoinAlert
) => void;

/* ── Constants ── */

const DEFILLAMA_BASE = "https://api.llama.fi";
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

/** Top DeFi protocols to monitor (DeFi Llama slugs) */
const MONITORED_PROTOCOLS = [
  "aave",
  "lido",
  "makerdao",
  "uniswap",
  "curve-dex",
  "compound-finance",
  "convex-finance",
  "eigenlayer",
  "ether-fi",
  "pendle",
  "rocket-pool",
  "morpho",
  "spark",
  "instadapp",
  "balancer",
  "yearn-finance",
  "sushiswap",
  "pancakeswap",
  "frax",
  "benqi",
] as const;

/** Stablecoins to monitor — CoinGecko IDs */
const STABLECOINS = [
  { id: "tether", symbol: "USDT", name: "Tether" },
  { id: "usd-coin", symbol: "USDC", name: "USD Coin" },
  { id: "dai", symbol: "DAI", name: "Dai" },
  { id: "frax", symbol: "FRAX", name: "Frax" },
  { id: "true-usd", symbol: "TUSD", name: "TrueUSD" },
  { id: "first-digital-usd", symbol: "FDUSD", name: "First Digital USD" },
  { id: "ethena-usde", symbol: "USDe", name: "Ethena USDe" },
  { id: "paypal-usd", symbol: "PYUSD", name: "PayPal USD" },
] as const;

/* ── Helpers ── */

function getCoinGeckoHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) headers["x-cg-demo-api-key"] = apiKey;
  return headers;
}

async function fetchJson<T>(url: string, headers?: Record<string, string>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: headers ?? { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 429 && attempt < retries) {
      const wait = (attempt + 1) * 2000; // 2s, 4s backoff
      console.warn(`[defi-monitor] Rate limited (429), retrying in ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json() as Promise<T>;
  }
  throw new Error(`Max retries exceeded: ${url}`);
}

/* ─────────────────────────────────────────────
 *  Protocol TVL Monitor (DeFiLlama)
 * ───────────────────────────────────────────── */

interface DeFiLlamaRaw {
  name: string;
  slug: string;
  category: string;
  chains: string[];
  tvl: number;
  change_1d: number | null;
  change_7d: number | null;
}

/** Fetch current TVL for all monitored protocols from DeFi Llama */
export async function fetchProtocolTvls(): Promise<DefiProtocol[]> {
  const data = await fetchJson<DeFiLlamaRaw[]>(`${DEFILLAMA_BASE}/protocols`);

  const slugSet = new Set<string>(MONITORED_PROTOCOLS);
  const now = new Date().toISOString();

  return data
    .filter((p) => slugSet.has(p.slug))
    .map((p) => ({
      protocol_name: p.name,
      slug: p.slug,
      tvl: p.tvl ?? 0,
      tvl_change_24h: p.change_1d ?? 0,
      tvl_change_7d: p.change_7d ?? 0,
      category: p.category || "Other",
      chains: p.chains ?? [],
      last_updated: now,
    }));
}

/** Check TVL drops and return alerts for significant drops (>10%) */
export function checkTvlAlerts(protocols: DefiProtocol[]): TvlAlert[] {
  const alerts: TvlAlert[] = [];

  for (const p of protocols) {
    const changePct = p.tvl_change_24h;
    if (changePct > -10) continue; // Only alert on 10%+ drops

    const severity: TvlAlert["severity"] =
      changePct <= -30 ? "critical" : changePct <= -10 ? "high" : "medium";

    const previousTvl = p.tvl / (1 + changePct / 100);

    alerts.push({
      protocolName: p.protocol_name,
      protocolSlug: p.slug,
      chain: p.chains[0] ?? "Multi",
      currentTvl: p.tvl,
      previousTvl,
      changePct,
      severity,
    });
  }

  return alerts;
}

/* ─────────────────────────────────────────────
 *  Stablecoin Peg Monitor (CoinGecko)
 * ───────────────────────────────────────────── */

/** Fetch current stablecoin prices and peg deviation */
export async function fetchStablecoinPrices(): Promise<StablecoinData[]> {
  const ids = STABLECOINS.map((s) => s.id).join(",");
  const data = await fetchJson<Record<string, { usd: number }>>(
    `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd`,
    getCoinGeckoHeaders()
  );

  const now = new Date().toISOString();

  return STABLECOINS.map((s) => {
    const price = data[s.id]?.usd ?? 1;
    const deviation = ((price - 1) / 1) * 100;
    const isDepegged = Math.abs(deviation) > 0.5;

    return {
      symbol: s.symbol,
      name: s.name,
      current_price: price,
      peg_deviation: deviation,
      is_depegged: isDepegged,
      last_updated: now,
    };
  });
}

/** Check stablecoin deviations and return alerts */
export function checkStablecoinAlerts(
  prices: StablecoinData[]
): StablecoinAlert[] {
  const alerts: StablecoinAlert[] = [];

  for (const p of prices) {
    const absDeviation = Math.abs(p.peg_deviation);
    if (absDeviation < 0.5) continue;

    const severity: StablecoinAlert["severity"] =
      absDeviation >= 3 ? "critical" : absDeviation >= 1 ? "high" : "medium";

    alerts.push({
      symbol: p.symbol,
      currentPrice: p.current_price,
      deviationPct: p.peg_deviation,
      severity,
    });
  }

  return alerts;
}

/* ── Combined Monitor (for long-running processes) ── */

export class DefiMonitor {
  private handler: DefiAlertHandler;
  private tvlInterval: ReturnType<typeof setInterval> | null = null;
  private stableInterval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(handler: DefiAlertHandler) {
    this.handler = handler;
  }

  start() {
    if (this.running) return;
    this.running = true;

    this.checkTvl();
    this.checkStablecoins();

    this.tvlInterval = setInterval(() => this.checkTvl(), 5 * 60 * 1_000);
    this.stableInterval = setInterval(() => this.checkStablecoins(), 60_000);
  }

  stop() {
    this.running = false;
    if (this.tvlInterval) clearInterval(this.tvlInterval);
    if (this.stableInterval) clearInterval(this.stableInterval);
  }

  private async checkTvl() {
    try {
      const protocols = await fetchProtocolTvls();
      const alerts = checkTvlAlerts(protocols);
      alerts.forEach((a) => this.handler(a));
    } catch (err) {
      console.error("[DefiMonitor] TVL check failed:", err);
    }
  }

  private async checkStablecoins() {
    try {
      const prices = await fetchStablecoinPrices();
      const alerts = checkStablecoinAlerts(prices);
      alerts.forEach((a) => this.handler(a));
    } catch (err) {
      console.error("[DefiMonitor] Stablecoin check failed:", err);
    }
  }
}
