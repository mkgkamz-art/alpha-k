/**
 * Subscription access control — Free vs Pro vs Whale feature matrix.
 *
 * Client-side: use useAuthStore() isPro / isWhale / tier
 * Server-side: use isProUser() / isWhaleUser()
 */

import type { SubscriptionTier } from "@/types";

/* ── Access Matrix ── */

export const ACCESS_MATRIX = {
  /** 라이브 피드 (dashboard) */
  dashboard: {
    free: { what: true, why: false, action: false },
    pro: { what: true, why: true, action: true },
    whale: { what: true, why: true, action: true },
  },
  /** 급등 레이더 */
  surge: {
    free: { maxItems: 5, refreshInterval: 60_000 },
    pro: { maxItems: Infinity, refreshInterval: 10_000 },
    whale: { maxItems: Infinity, refreshInterval: 10_000 },
  },
  /** 김치 프리미엄 */
  kimchi: {
    free: { full: true },
    pro: { full: true },
    whale: { full: true },
  },
  /** 상장 알림 */
  listing: {
    free: { delayMinutes: 30, blurCoinName: true },
    pro: { delayMinutes: 0, blurCoinName: false },
    whale: { delayMinutes: 0, blurCoinName: false },
  },
  /** 고래 추적 */
  whale_tracker: {
    free: { maxEvents: 20, delayMinutes: 5 },
    pro: { maxEvents: Infinity, delayMinutes: 0 },
    whale: { maxEvents: Infinity, delayMinutes: 0 },
  },
  /** 시그널 */
  signals: {
    free: { timeframes: ["1d"] as string[] },
    pro: { timeframes: ["1d"] as string[] },
    whale: { timeframes: ["4h", "1d", "1w"] as string[] },
  },
  /** DeFi 리스크 */
  risk: {
    free: { full: true },
    pro: { full: true },
    whale: { full: true },
  },
  /** 토큰 언락 */
  unlocks: {
    free: { full: true },
    pro: { full: true },
    whale: { full: true },
  },
  /** 유동성 */
  liquidity: {
    free: { full: true },
    pro: { full: true },
    whale: { full: true },
  },
  /** 워치리스트 */
  watchlist: {
    free: { maxCoins: 5 },
    pro: { maxCoins: Infinity },
    whale: { maxCoins: Infinity },
  },
} as const;

/* ── Helper functions ── */

/** Get feature access for a given tier (defaults to 'free') */
export function getAccess<K extends keyof typeof ACCESS_MATRIX>(
  feature: K,
  tier: SubscriptionTier | null,
) {
  const t = tier ?? "free";
  return ACCESS_MATRIX[feature][t] as (typeof ACCESS_MATRIX)[K]["free"];
}

/** Server-side: check if tier is Pro or Whale */
export function isProUser(tier: SubscriptionTier | null): boolean {
  return tier === "pro" || tier === "whale";
}

/** Server-side: check if tier is Whale */
export function isWhaleUser(tier: SubscriptionTier | null): boolean {
  return tier === "whale";
}

/** LISTING_DELAY_MS: 30 minutes in ms */
export const LISTING_DELAY_MS = 30 * 60 * 1000;
