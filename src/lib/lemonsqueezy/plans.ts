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
    description: "시장 탐색을 시작하는 캐주얼 트레이더에게 적합합니다.",
    monthly: { price: 0, variantId: "" },
    yearly: { price: 0, variantId: "" },
    features: [
      { label: "알림 규칙 3개", included: true },
      { label: "알림 5분 지연", included: true },
      { label: "이메일 알림", included: true },
      { label: "급등 레이더 상위 5개", included: true },
      { label: "텔레그램 & 디스코드", included: false },
      { label: "트레이딩 시그널", included: false },
      { label: "API 접근", included: false },
    ],
    ctaLabel: "무료로 시작",
  },
  {
    tier: "pro",
    name: "PRO",
    description: "적극적인 트레이더를 위한 프로페셔널 도구.",
    monthly: {
      price: 19900,
      variantId: process.env.NEXT_PUBLIC_LS_PRO_MONTHLY_VARIANT_ID ?? "",
    },
    yearly: {
      price: 190000,
      variantId: process.env.NEXT_PUBLIC_LS_PRO_YEARLY_VARIANT_ID ?? "",
    },
    features: [
      { label: "무제한 알림 규칙", included: true },
      { label: "실시간 즉시 알림", included: true },
      { label: "텔레그램 & 디스코드 연동", included: true },
      { label: "1D 트레이딩 시그널", included: true },
      { label: "API 1,000회/일", included: true },
      { label: "우선 지원 (24시간)", included: true },
      { label: "SMS & 전화 알림", included: false },
    ],
    highlighted: true,
    highlightLabel: "인기",
    ctaLabel: "Pro 시작하기",
  },
  {
    tier: "whale",
    name: "WHALE",
    description: "대량 운용을 위한 기관급 속도와 기능.",
    monthly: {
      price: 99000,
      variantId: process.env.NEXT_PUBLIC_LS_WHALE_MONTHLY_VARIANT_ID ?? "",
    },
    yearly: {
      price: 990000,
      variantId: process.env.NEXT_PUBLIC_LS_WHALE_YEARLY_VARIANT_ID ?? "",
    },
    features: [
      { label: "Pro의 모든 기능 포함", included: true },
      { label: "<10초 블록 지연 알림", included: true },
      { label: "SMS & 전화 알림", included: true },
      { label: "4H/1D/1W 시그널", included: true },
      { label: "무제한 API 접근", included: true },
      { label: "전담 매니저", included: true },
      { label: "커스텀 웹훅", included: true },
    ],
    ctaLabel: "Whale 시작하기",
  },
];

export function getPlanByVariantId(variantId: string): Plan | undefined {
  return PLANS.find(
    (p) =>
      p.monthly.variantId === variantId || p.yearly.variantId === variantId
  );
}
