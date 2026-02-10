/**
 * Token Unlock Fetcher — Scheduled vesting unlock data
 *
 * Primary: Token Unlocks API (tokenunlocks.app)
 * Fallback: CoinGecko enrichment for market data
 *
 * Reference: docs/BLOCKCHAIN.md — REST 1일 polling
 */

import type { UnlockType } from "@/types";

/* ── Types ── */
export interface TokenUnlockEvent {
  tokenSymbol: string;
  tokenName: string;
  unlockDate: string; // ISO 8601
  unlockAmount: number;
  unlockValueUsd: number;
  pctOfCirculating: number;
  unlockType: UnlockType;
  vestingInfo: string | null;
  impactScore: number; // 1-10
  sourceUrl: string | null;
}

export interface TokenUnlockSummary {
  upcoming: TokenUnlockEvent[];
  totalValueUsd: number;
  highImpactCount: number;
  fetchedAt: number;
}

/* ── Constants ── */
const TOKEN_UNLOCKS_BASE = "https://token.unlocks.app/api/v2";
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

/** Tokens to monitor for unlocks */
const MONITORED_TOKENS = [
  "ARB", "OP", "APT", "SUI", "SEI", "TIA", "JTO",
  "PYTH", "WLD", "STRK", "ZK", "MANTA", "DYM",
  "AXL", "ALT", "PIXEL", "PORTAL", "W", "ENA",
  "EIGEN", "ZRO", "AEVO", "ETHFI", "ONDO",
  "PENDLE", "JUP", "RENDER", "FET", "AGIX",
] as const;

/* ── Helpers ── */
async function fetchJson<T>(url: string, apiKey?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

/**
 * Calculate impact score (1-10) based on unlock size and timing
 * Higher % of circulating supply + closer date = higher impact
 */
function calculateImpactScore(
  pctOfCirculating: number,
  daysUntilUnlock: number
): number {
  // Supply impact (0-5): >5% = max
  const supplyScore = Math.min(pctOfCirculating / 5, 1) * 5;

  // Timing impact (0-5): closer = higher
  let timingScore = 0;
  if (daysUntilUnlock <= 1) timingScore = 5;
  else if (daysUntilUnlock <= 3) timingScore = 4;
  else if (daysUntilUnlock <= 7) timingScore = 3;
  else if (daysUntilUnlock <= 14) timingScore = 2;
  else if (daysUntilUnlock <= 30) timingScore = 1;

  return Math.round(Math.min(supplyScore + timingScore, 10));
}

/**
 * Map raw unlock category to our UnlockType
 */
function mapUnlockType(category: string): UnlockType {
  const lower = category.toLowerCase();
  if (lower.includes("team") || lower.includes("core")) return "team";
  if (lower.includes("investor") || lower.includes("seed") || lower.includes("private"))
    return "investor";
  if (lower.includes("ecosystem") || lower.includes("community") || lower.includes("airdrop"))
    return "ecosystem";
  return "public";
}

/* ─────────────────────────────────────────────
 *  Token Unlocks API
 * ───────────────────────────────────────────── */

interface RawUnlockEvent {
  token_name?: string;
  token_symbol?: string;
  unlock_date?: string;
  amount?: number;
  value_usd?: number;
  pct_of_circulating?: number;
  category?: string;
  vesting_info?: string;
  source_url?: string;
}

/**
 * Fetch upcoming token unlock events from Token Unlocks API
 * Falls back to mock data if no API key is set
 */
export async function fetchTokenUnlocks(
  daysAhead = 30
): Promise<TokenUnlockEvent[]> {
  const apiKey = process.env.TOKEN_UNLOCKS_API_KEY;

  if (!apiKey) {
    console.warn("[TokenUnlockFetcher] TOKEN_UNLOCKS_API_KEY not set, returning empty");
    return [];
  }

  const now = new Date();
  const events: TokenUnlockEvent[] = [];

  // Fetch per-token unlock schedules
  for (const symbol of MONITORED_TOKENS) {
    try {
      const data = await fetchJson<{ unlocks?: RawUnlockEvent[] }>(
        `${TOKEN_UNLOCKS_BASE}/tokens/${symbol.toLowerCase()}/unlocks?days=${daysAhead}`,
        apiKey
      );

      if (!data.unlocks?.length) continue;

      for (const u of data.unlocks) {
        if (!u.unlock_date || !u.amount) continue;

        const unlockDate = new Date(u.unlock_date);
        const daysUntil = Math.max(
          0,
          Math.floor((unlockDate.getTime() - now.getTime()) / 86_400_000)
        );
        const pctCirc = u.pct_of_circulating ?? 0;

        events.push({
          tokenSymbol: u.token_symbol ?? symbol,
          tokenName: u.token_name ?? symbol,
          unlockDate: u.unlock_date,
          unlockAmount: u.amount,
          unlockValueUsd: u.value_usd ?? 0,
          pctOfCirculating: pctCirc,
          unlockType: mapUnlockType(u.category ?? "public"),
          vestingInfo: u.vesting_info ?? null,
          impactScore: calculateImpactScore(pctCirc, daysUntil),
          sourceUrl: u.source_url ?? null,
        });
      }
    } catch {
      // Skip individual token failures
    }
  }

  // Sort by date ascending
  events.sort(
    (a, b) =>
      new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime()
  );

  return events;
}

/**
 * Get a summary of upcoming unlocks
 */
export async function getUnlockSummary(
  daysAhead = 30
): Promise<TokenUnlockSummary> {
  const events = await fetchTokenUnlocks(daysAhead);

  return {
    upcoming: events,
    totalValueUsd: events.reduce((sum, e) => sum + e.unlockValueUsd, 0),
    highImpactCount: events.filter((e) => e.impactScore >= 7).length,
    fetchedAt: Date.now(),
  };
}

/**
 * Filter unlocks by minimum impact score threshold
 */
export function filterHighImpactUnlocks(
  events: TokenUnlockEvent[],
  minScore = 7
): TokenUnlockEvent[] {
  return events.filter((e) => e.impactScore >= minScore);
}

/** List of monitored token symbols */
export { MONITORED_TOKENS };
