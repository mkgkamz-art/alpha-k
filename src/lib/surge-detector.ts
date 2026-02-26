/**
 * Surge detection algorithm for Korean exchange price data.
 *
 * Uses korean_prices to find coins with significant 2-hour
 * price change (±5% threshold).
 */

/* ── Surge level classification ── */

export type SurgeLevel = "hot" | "very_hot" | "extreme";
export type SurgeType = "pump" | "dump";

export interface SurgeItem {
  symbol: string;
  exchange: string;
  price_krw: number;
  price_usd: number | null;
  volume_24h: number | null;
  /** 2-hour price change percentage */
  change_pct: number;
  kimchi_premium: number | null;
  fetched_at: string;
  level: SurgeLevel;
  type: SurgeType;
}

export function classifySurge(changePercent: number): SurgeLevel | null {
  const abs = Math.abs(changePercent);
  if (abs >= 20) return "extreme";
  if (abs >= 10) return "very_hot";
  if (abs >= 5) return "hot";
  return null;
}

export function getSurgeType(change: number): SurgeType {
  return change >= 0 ? "pump" : "dump";
}

/* ── Constants ── */

export const SURGE_THRESHOLD = 5; // minimum ±5% to be considered a surge
export const SURGE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
