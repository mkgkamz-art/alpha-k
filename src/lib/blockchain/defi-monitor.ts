/**
 * DeFi Monitor — Protocol TVL & Stablecoin Peg Monitoring
 *
 * DeFiLlama API: Protocol TVL (5min polling)
 * CoinGecko API: Stablecoin prices (15s polling)
 *
 * Reference: docs/BLOCKCHAIN.md
 * Stablecoin: 0.5% deviation = warning, 2% deviation = critical
 * TVL: 10% drop = warning, 30% drop = critical
 */

/* ── Types ── */
export type DefiSeverity = "warning" | "critical";

export interface TvlAlert {
  protocolName: string;
  protocolSlug: string;
  chain: string;
  currentTvl: number;
  previousTvl: number;
  changePct: number;
  severity: DefiSeverity;
  timestamp: number;
}

export interface StablecoinAlert {
  symbol: string;
  currentPrice: number;
  deviationPct: number;
  severity: DefiSeverity;
  timestamp: number;
}

export type DefiAlertHandler = (
  alert: TvlAlert | StablecoinAlert
) => void;

/* ── Constants ── */
const DEFILLAMA_BASE = "https://api.llama.fi";
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const TVL_WARNING_PCT = 10;
const TVL_CRITICAL_PCT = 30;
const STABLE_WARNING_PCT = 0.5;
const STABLE_CRITICAL_PCT = 2;

/** Top DeFi protocols to monitor */
const MONITORED_PROTOCOLS = [
  "aave",
  "lido",
  "makerdao",
  "uniswap",
  "curve-dex",
  "compound-finance",
  "rocket-pool",
  "instadapp",
  "balancer",
  "yearn-finance",
  "sushiswap",
  "pancakeswap",
  "convex-finance",
  "frax",
  "morpho",
  "eigenlayer",
  "ether-fi",
  "pendle",
  "spark",
  "benqi",
] as const;

/** Stablecoins to monitor — CoinGecko IDs */
const STABLECOINS = [
  { id: "tether", symbol: "USDT", peg: 1 },
  { id: "usd-coin", symbol: "USDC", peg: 1 },
  { id: "dai", symbol: "DAI", peg: 1 },
  { id: "frax", symbol: "FRAX", peg: 1 },
  { id: "true-usd", symbol: "TUSD", peg: 1 },
  { id: "first-digital-usd", symbol: "FDUSD", peg: 1 },
  { id: "ethena-usde", symbol: "USDe", peg: 1 },
  { id: "paypal-usd", symbol: "PYUSD", peg: 1 },
] as const;

/* ── Helpers ── */
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

/* ─────────────────────────────────────────────
 *  Protocol TVL Monitor (DeFiLlama)
 * ───────────────────────────────────────────── */

interface DeFiLlamaProtocol {
  name: string;
  slug: string;
  chain: string;
  tvl: number;
  change_1d?: number;
}

/** Fetch current TVL for all monitored protocols */
export async function fetchProtocolTvls(): Promise<DeFiLlamaProtocol[]> {
  const data = await fetchJson<
    Array<{
      name: string;
      slug: string;
      chain: string;
      tvl: number;
      change_1d: number;
    }>
  >(`${DEFILLAMA_BASE}/protocols`);

  const slugSet = new Set<string>(MONITORED_PROTOCOLS);
  return data
    .filter((p) => slugSet.has(p.slug))
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      chain: p.chain ?? "Multi",
      tvl: p.tvl,
      change_1d: p.change_1d,
    }));
}

/** Check TVL drops and return alerts */
export function checkTvlAlerts(
  protocols: DeFiLlamaProtocol[]
): TvlAlert[] {
  const alerts: TvlAlert[] = [];

  for (const p of protocols) {
    const changePct = p.change_1d ?? 0;
    if (changePct > -TVL_WARNING_PCT) continue;

    const severity: DefiSeverity =
      changePct <= -TVL_CRITICAL_PCT ? "critical" : "warning";

    const previousTvl = p.tvl / (1 + changePct / 100);

    alerts.push({
      protocolName: p.name,
      protocolSlug: p.slug,
      chain: p.chain,
      currentTvl: p.tvl,
      previousTvl,
      changePct,
      severity,
      timestamp: Date.now(),
    });
  }

  return alerts;
}

/* ─────────────────────────────────────────────
 *  Stablecoin Peg Monitor (CoinGecko)
 * ───────────────────────────────────────────── */

interface CoinGeckoPrice {
  [id: string]: { usd: number };
}

/** Fetch current stablecoin prices */
export async function fetchStablecoinPrices(): Promise<
  Array<{ symbol: string; price: number; deviationPct: number }>
> {
  const ids = STABLECOINS.map((s) => s.id).join(",");
  const data = await fetchJson<CoinGeckoPrice>(
    `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd`
  );

  return STABLECOINS.map((s) => {
    const price = data[s.id]?.usd ?? s.peg;
    const deviationPct = ((price - s.peg) / s.peg) * 100;
    return { symbol: s.symbol, price, deviationPct };
  });
}

/** Check stablecoin deviations and return alerts */
export function checkStablecoinAlerts(
  prices: Array<{ symbol: string; price: number; deviationPct: number }>
): StablecoinAlert[] {
  const alerts: StablecoinAlert[] = [];

  for (const p of prices) {
    const absDeviation = Math.abs(p.deviationPct);
    if (absDeviation < STABLE_WARNING_PCT) continue;

    const severity: DefiSeverity =
      absDeviation >= STABLE_CRITICAL_PCT ? "critical" : "warning";

    alerts.push({
      symbol: p.symbol,
      currentPrice: p.price,
      deviationPct: p.deviationPct,
      severity,
      timestamp: Date.now(),
    });
  }

  return alerts;
}

/* ─────────────────────────────────────────────
 *  Combined DeFi Monitor
 * ───────────────────────────────────────────── */

export class DefiMonitor {
  private handler: DefiAlertHandler;
  private tvlInterval: ReturnType<typeof setInterval> | null = null;
  private stableInterval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(handler: DefiAlertHandler) {
    this.handler = handler;
  }

  /** Start polling: TVL every 5 min, stablecoins every 15 sec */
  start() {
    if (this.running) return;
    this.running = true;

    // Initial fetch
    this.checkTvl();
    this.checkStablecoins();

    // TVL: every 5 minutes
    this.tvlInterval = setInterval(() => this.checkTvl(), 5 * 60 * 1_000);

    // Stablecoins: every 15 seconds
    this.stableInterval = setInterval(() => this.checkStablecoins(), 15_000);
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
