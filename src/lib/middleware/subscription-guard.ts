/**
 * Subscription tier access control.
 *
 * Tier feature matrix (from CLAUDE.md):
 * | Feature         | Free    | Pro $19    | Whale $99   |
 * | Alert Rules     | 3       | ∞          | ∞           |
 * | Delay           | 5min    | Real-time  | <10s        |
 * | Signal TF       | —       | 1D         | 4H/1D/1W    |
 * | Telegram        | ✗       | ✓          | ✓           |
 * | Discord         | ✗       | ✓          | ✓           |
 * | SMS             | ✗       | ✗          | ✓           |
 * | API             | ✗       | 1K/day     | ∞           |
 */

import type { SubscriptionTier } from "@/types";

export type Feature =
  | "unlimited_rules"
  | "realtime_alerts"
  | "signals_1d"
  | "signals_4h"
  | "signals_1w"
  | "telegram"
  | "discord"
  | "sms"
  | "api_access"
  | "unlimited_api";

const TIER_FEATURES: Record<SubscriptionTier, Set<Feature>> = {
  free: new Set(),
  pro: new Set([
    "unlimited_rules",
    "realtime_alerts",
    "signals_1d",
    "telegram",
    "discord",
    "api_access",
  ]),
  whale: new Set([
    "unlimited_rules",
    "realtime_alerts",
    "signals_1d",
    "signals_4h",
    "signals_1w",
    "telegram",
    "discord",
    "sms",
    "api_access",
    "unlimited_api",
  ]),
};

const TIER_LIMITS: Record<SubscriptionTier, { maxRules: number; apiCallsPerDay: number }> = {
  free: { maxRules: 3, apiCallsPerDay: 0 },
  pro: { maxRules: Infinity, apiCallsPerDay: 1000 },
  whale: { maxRules: Infinity, apiCallsPerDay: Infinity },
};

/** Check if a tier has access to a feature */
export function hasFeature(tier: SubscriptionTier, feature: Feature): boolean {
  return TIER_FEATURES[tier].has(feature);
}

/** Get the limits for a tier */
export function getTierLimits(tier: SubscriptionTier) {
  return TIER_LIMITS[tier];
}

/** Get the minimum tier required for a feature */
export function requiredTier(feature: Feature): SubscriptionTier {
  if (TIER_FEATURES.free.has(feature)) return "free";
  if (TIER_FEATURES.pro.has(feature)) return "pro";
  return "whale";
}

/** Check if user can create more alert rules */
export function canCreateRule(tier: SubscriptionTier, currentCount: number): boolean {
  return currentCount < TIER_LIMITS[tier].maxRules;
}
