/**
 * Token Unlock Fetcher — CoinGecko-enriched unlock data
 *
 * Schedule data: src/lib/data/upcoming-unlocks.json (manually curated)
 * Market data:   CoinGecko /coins/markets API (live prices + supply)
 *
 * Dynamic calculations:
 *   - usd_value = amount * current_price
 *   - percent_of_supply = amount / circulating_supply * 100
 *   - impact_score = f(supplyPct, usdValue, dailyVolume)
 */

import type { UnlockType } from "@/types";
import upcomingUnlocks from "@/lib/data/upcoming-unlocks.json";

/* ── Constants ── */
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

/* ── Types ── */
export interface TokenUnlockEvent {
  tokenSymbol: string;
  tokenName: string;
  unlockDate: string; // ISO 8601
  unlockAmount: number;
  unlockValueUsd: number;
  pctOfSupply: number;
  category: UnlockType;
  impactScore: number; // 1-10
}

export interface TokenUnlockSummary {
  upcoming: TokenUnlockEvent[];
  totalValueUsd: number;
  highImpactCount: number;
  fetchedAt: number;
}

/* ── Raw JSON shape ── */
interface RawUnlock {
  token: string;
  name: string;
  coingecko_id: string;
  unlock_date: string;
  amount: number;
  category: string;
}

/* ── CoinGecko market data shape ── */
interface CoinMarketData {
  id: string;
  current_price: number | null;
  total_volume: number | null;
  circulating_supply: number | null;
}

/* ── Valid categories ── */
const VALID_CATEGORIES = new Set<string>(["team", "investor", "ecosystem", "public"]);

function toUnlockType(category: string): UnlockType {
  const lower = category.toLowerCase();
  if (VALID_CATEGORIES.has(lower)) return lower as UnlockType;
  if (lower.includes("team") || lower.includes("core")) return "team";
  if (lower.includes("investor") || lower.includes("seed") || lower.includes("private"))
    return "investor";
  if (lower.includes("ecosystem") || lower.includes("community"))
    return "ecosystem";
  return "public";
}

/* ── CoinGecko helpers ── */

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
        const wait = Math.min(attempt * 5_000, 30_000);
        console.warn(`[unlock-fetcher] Rate limited, waiting ${wait}ms (attempt ${attempt})`);
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
      console.warn(`[unlock-fetcher] Retry ${attempt}/${retries} in ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw new Error("fetchWithRetry: exhausted retries");
}

/**
 * Fetch market data for a list of CoinGecko token IDs.
 * Returns a map of id → { current_price, total_volume, circulating_supply }.
 */
async function fetchMarketData(
  ids: string[]
): Promise<Map<string, CoinMarketData>> {
  const map = new Map<string, CoinMarketData>();
  if (ids.length === 0) return map;

  try {
    const url =
      `${COINGECKO_BASE}/coins/markets` +
      `?vs_currency=usd` +
      `&ids=${ids.join(",")}` +
      `&order=market_cap_desc` +
      `&per_page=${ids.length}` +
      `&page=1` +
      `&sparkline=false`;

    const res = await fetchWithRetry(url);
    const data = (await res.json()) as Array<{
      id: string;
      current_price: number | null;
      total_volume: number | null;
      circulating_supply: number | null;
    }>;

    for (const coin of data) {
      map.set(coin.id, {
        id: coin.id,
        current_price: coin.current_price,
        total_volume: coin.total_volume,
        circulating_supply: coin.circulating_supply,
      });
    }
  } catch (err) {
    console.error("[unlock-fetcher] Failed to fetch market data:", err);
  }

  return map;
}

/* ── Impact Score Calculation ── */

/**
 * Calculate impact score (0-10) based on:
 *   1. Supply impact (0-4): percentage of circulating supply
 *   2. Value impact (0-3): USD value of the unlock
 *   3. Volume ratio (0-3): unlock value relative to daily trading volume
 */
function calculateImpactScore(
  pctSupply: number,
  usdValue: number,
  dailyVolume: number
): number {
  // Supply impact: 2.5% supply = 1 point, max 4
  const supplyScore = Math.min(pctSupply / 2.5, 4);

  // Value impact: $33M = 1 point, max 3
  const valueScore = Math.min(usdValue / 33_000_000, 3);

  // Volume ratio: higher ratio = bigger market impact
  const volumeRatio = dailyVolume > 0 ? usdValue / dailyVolume : 1;
  const volumeScore = Math.min(volumeRatio * 1.5, 3);

  const raw = supplyScore + valueScore + volumeScore;
  return Math.round(raw);
}

/* ── Main Fetcher ── */

/**
 * Fetch upcoming token unlocks, enriched with live CoinGecko market data.
 * Falls back to estimated values if API call fails.
 */
export async function fetchUpcomingUnlocks(daysAhead = 90): Promise<TokenUnlockEvent[]> {
  const now = Date.now();
  const maxDate = now + daysAhead * 86_400_000;

  // Filter to relevant date window
  const relevant = (upcomingUnlocks as RawUnlock[]).filter((raw) => {
    const unlockTime = new Date(raw.unlock_date).getTime();
    return unlockTime >= now - 86_400_000 && unlockTime <= maxDate;
  });

  if (relevant.length === 0) return [];

  // Collect unique CoinGecko IDs for batch API call
  const cgIds = [...new Set(relevant.map((r) => r.coingecko_id))];

  // Fetch live market data
  const marketData = await fetchMarketData(cgIds);

  // Build enriched events
  const events: TokenUnlockEvent[] = relevant.map((raw) => {
    const market = marketData.get(raw.coingecko_id);

    const price = market?.current_price ?? 0;
    const circulatingSupply = market?.circulating_supply ?? 0;
    const dailyVolume = market?.total_volume ?? 0;

    const usdValue = raw.amount * price;
    const pctSupply = circulatingSupply > 0
      ? (raw.amount / circulatingSupply) * 100
      : 0;
    const impactScore = price > 0
      ? calculateImpactScore(pctSupply, usdValue, dailyVolume)
      : 0;

    return {
      tokenSymbol: raw.token,
      tokenName: raw.name,
      unlockDate: raw.unlock_date,
      unlockAmount: raw.amount,
      unlockValueUsd: Math.round(usdValue),
      pctOfSupply: Math.round(pctSupply * 100) / 100,
      category: toUnlockType(raw.category),
      impactScore: Math.min(impactScore, 10),
    };
  });

  // Sort by unlock date ascending
  events.sort(
    (a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime()
  );

  return events;
}

/**
 * Synchronous fallback — loads from JSON without API enrichment.
 * Used when CoinGecko is unavailable or during build time.
 */
export function loadUpcomingUnlocks(daysAhead = 90): TokenUnlockEvent[] {
  const now = Date.now();
  const maxDate = now + daysAhead * 86_400_000;

  const events: TokenUnlockEvent[] = [];

  for (const raw of upcomingUnlocks as RawUnlock[]) {
    const unlockTime = new Date(raw.unlock_date).getTime();
    if (unlockTime < now - 86_400_000 || unlockTime > maxDate) continue;

    events.push({
      tokenSymbol: raw.token,
      tokenName: raw.name,
      unlockDate: raw.unlock_date,
      unlockAmount: raw.amount,
      unlockValueUsd: 0,
      pctOfSupply: 0,
      category: toUnlockType(raw.category),
      impactScore: 0,
    });
  }

  events.sort(
    (a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime()
  );

  return events;
}

/**
 * Get a summary of upcoming unlocks (async, with live data).
 */
export async function getUnlockSummary(daysAhead = 30): Promise<TokenUnlockSummary> {
  const events = await fetchUpcomingUnlocks(daysAhead);

  return {
    upcoming: events,
    totalValueUsd: events.reduce((sum, e) => sum + e.unlockValueUsd, 0),
    highImpactCount: events.filter((e) => e.impactScore >= 7).length,
    fetchedAt: Date.now(),
  };
}

/**
 * Filter unlocks by minimum impact score threshold.
 */
export function filterHighImpactUnlocks(
  events: TokenUnlockEvent[],
  minScore = 7
): TokenUnlockEvent[] {
  return events.filter((e) => e.impactScore >= minScore);
}

/**
 * Calculate urgency level based on days until unlock.
 */
export function getUrgencyLevel(unlockDate: string): "imminent" | "soon" | "upcoming" | "distant" {
  const daysUntil = Math.ceil(
    (new Date(unlockDate).getTime() - Date.now()) / 86_400_000
  );
  if (daysUntil <= 1) return "imminent";
  if (daysUntil <= 3) return "soon";
  if (daysUntil <= 7) return "upcoming";
  return "distant";
}

/** List of monitored token symbols */
export const MONITORED_TOKENS = [
  "ARB", "OP", "APT", "SUI", "SEI", "TIA", "STRK", "JTO",
  "PYTH", "WLD", "DYDX", "JUP", "IMX", "ONDO", "W", "ZRO",
  "EIGEN", "AXL", "MANTA", "BLAST",
] as const;
