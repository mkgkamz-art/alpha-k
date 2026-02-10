/**
 * Pricing plan definitions.
 *
 * Variant IDs come from Lemon Squeezy products.
 * Set them in env vars after creating products in the LS dashboard:
 *   NEXT_PUBLIC_LS_PRO_MONTHLY_VARIANT_ID
 *   NEXT_PUBLIC_LS_PRO_YEARLY_VARIANT_ID
 *   NEXT_PUBLIC_LS_WHALE_MONTHLY_VARIANT_ID
 *   NEXT_PUBLIC_LS_WHALE_YEARLY_VARIANT_ID
 */

import type { SubscriptionTier } from "@/types";

export interface Plan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthly: { price: number; variantId: string };
  yearly: { price: number; variantId: string };
  features: { label: string; included: boolean }[];
  highlighted?: boolean;
  highlightLabel?: string;
  ctaLabel: string;
}

export const PLANS: Plan[] = [
  {
    tier: "free",
    name: "FREE",
    description: "Perfect for casual enthusiasts exploring the market.",
    monthly: { price: 0, variantId: "" },
    yearly: { price: 0, variantId: "" },
    features: [
      { label: "3 alert rules", included: true },
      { label: "5-minute delay on alerts", included: true },
      { label: "Standard email alerts", included: true },
      { label: "Public community access", included: true },
      { label: "Telegram & Discord", included: false },
      { label: "Trading signals", included: false },
      { label: "API access", included: false },
    ],
    ctaLabel: "Get Started Free",
  },
  {
    tier: "pro",
    name: "PRO",
    description: "Professional grade tools for active traders and analysts.",
    monthly: {
      price: 19,
      variantId: process.env.NEXT_PUBLIC_LS_PRO_MONTHLY_VARIANT_ID ?? "",
    },
    yearly: {
      price: 190,
      variantId: process.env.NEXT_PUBLIC_LS_PRO_YEARLY_VARIANT_ID ?? "",
    },
    features: [
      { label: "Unlimited alert rules", included: true },
      { label: "Real-time instant alerts", included: true },
      { label: "Telegram & Discord integration", included: true },
      { label: "1D trading signals", included: true },
      { label: "1,000 API calls/month", included: true },
      { label: "Priority support (24h)", included: true },
      { label: "SMS & Phone alerts", included: false },
    ],
    highlighted: true,
    highlightLabel: "POPULAR",
    ctaLabel: "Start Pro Trial",
  },
  {
    tier: "whale",
    name: "WHALE",
    description: "Institutional speed and scale for high-volume operations.",
    monthly: {
      price: 99,
      variantId: process.env.NEXT_PUBLIC_LS_WHALE_MONTHLY_VARIANT_ID ?? "",
    },
    yearly: {
      price: 990,
      variantId: process.env.NEXT_PUBLIC_LS_WHALE_YEARLY_VARIANT_ID ?? "",
    },
    features: [
      { label: "Everything in Pro", included: true },
      { label: "<10s block latency alerts", included: true },
      { label: "SMS & Phone call alerts", included: true },
      { label: "4H/1D/1W trading signals", included: true },
      { label: "Unlimited API calls", included: true },
      { label: "Dedicated Account Manager", included: true },
      { label: "Custom webhook integrations", included: true },
    ],
    ctaLabel: "Go Whale",
  },
];

export function getPlanByVariantId(variantId: string): Plan | undefined {
  return PLANS.find(
    (p) =>
      p.monthly.variantId === variantId || p.yearly.variantId === variantId
  );
}
