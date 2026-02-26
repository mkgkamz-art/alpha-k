/**
 * Subscription access control — Free vs Pro vs Whale feature matrix.
 *
 * Client-side: use useAuthStore() isPro / isWhale / tier
 * Server-side: use isProUser() / isWhaleUser()
 *
 * Open Beta: NEXT_PUBLIC_OPEN_BETA_UNTIL 환경변수로 종료일 제어.
 * 오픈 베타 기간 중 모든 유저가 whale 티어 접근 가능.
 */

import type { SubscriptionTier } from "@/types";

/* ── Open Beta ── */

const OPEN_BETA_UNTIL = process.env.NEXT_PUBLIC_OPEN_BETA_UNTIL;

/** 오픈 베타 기간인지 확인 */
export function isOpenBeta(): boolean {
  if (!OPEN_BETA_UNTIL) return false;
  return new Date() < new Date(OPEN_BETA_UNTIL);
}

/** 오픈 베타면 whale, 아니면 원래 티어 반환 */
export function effectiveTier(tier: SubscriptionTier | null): SubscriptionTier {
  if (isOpenBeta()) return "whale";
  return tier ?? "free";
}

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
  /** 레이더 피드 */
  radar: {
    free: { maxSignals: 5, refreshInterval: 60_000 },
    pro: { maxSignals: Infinity, refreshInterval: 30_000 },
    whale: { maxSignals: Infinity, refreshInterval: 15_000 },
  },
} as const;

/* ── Helper functions ── */

/** Get feature access for a given tier (defaults to 'free', open beta → whale) */
export function getAccess<K extends keyof typeof ACCESS_MATRIX>(
  feature: K,
  tier: SubscriptionTier | null,
) {
  const t = effectiveTier(tier);
  return ACCESS_MATRIX[feature][t] as (typeof ACCESS_MATRIX)[K]["free"];
}

/** Server-side: check if tier is Pro or Whale (open beta → true) */
export function isProUser(tier: SubscriptionTier | null): boolean {
  const t = effectiveTier(tier);
  return t === "pro" || t === "whale";
}

/** Server-side: check if tier is Whale (open beta → true) */
export function isWhaleUser(tier: SubscriptionTier | null): boolean {
  return effectiveTier(tier) === "whale";
}

/** LISTING_DELAY_MS: 30 minutes in ms */
export const LISTING_DELAY_MS = 30 * 60 * 1000;
