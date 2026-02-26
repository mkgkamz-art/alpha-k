/**
 * Alpha K Promo System — DISABLED
 *
 * 프로모션 종료. 모든 함수는 pass-through (always false).
 * Lemon Squeezy 네이티브 Trial 시스템으로 전환.
 * import 호환성을 위해 export 유지.
 */

import type { SubscriptionTier } from "@/types";

/* ── Master Config ── */

export const PROMO_ENABLED = false;

export const PROMO_START = new Date("2026-02-19T00:00:00+09:00");
export const PROMO_END = new Date("2026-05-19T23:59:59+09:00");
export const PROMO_TIER: SubscriptionTier = "pro";
export const PROMO_END_DATE_STRING = "2026.05.19";

/* ── Helper Functions (all return non-promo values) ── */

/** @deprecated 프로모션 종료. Always returns false. */
export function isPromoActive(): boolean {
  return false;
}

/** @deprecated 프로모션 종료. Returns tier unchanged. */
export function getEffectiveTier(
  originalTier: SubscriptionTier | null,
): SubscriptionTier {
  return originalTier ?? "free";
}

/** @deprecated 프로모션 종료. Always returns 0. */
export function getPromoDaysLeft(): number {
  return 0;
}
