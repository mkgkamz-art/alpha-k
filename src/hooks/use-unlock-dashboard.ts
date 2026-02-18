"use client";

import { useQuery } from "@tanstack/react-query";
import type { AlertEvent } from "@/types";

/* ── Types ── */

export interface EnrichedUnlock {
  id: string;
  token_symbol: string;
  token_name: string;
  unlock_date: string;
  amount: number;
  usd_value_estimate: number;
  percent_of_supply: number;
  category: string;
  impact_score: number;
  is_notified_3d: boolean;
  is_notified_1d: boolean;
  created_at: string;
  daysUntil: number;
  hoursUntil: number;
  currentPrice: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
}

export interface UnlockOverview {
  weekCount: number;
  weekTotalValue: number;
  highestImpact: {
    symbol: string;
    percentOfSupply: number;
    impactScore: number;
  } | null;
  nextUnlock: {
    symbol: string;
    hoursUntil: number;
    daysUntil: number;
  } | null;
}

export interface TopImpactUnlock {
  id: string;
  symbol: string;
  name: string;
  daysUntil: number;
  impactScore: number;
  usdValue: number;
  percentOfSupply: number;
  category: string;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  totalUsd: number;
}

export interface PriceCorrelation {
  symbol: string;
  category: string;
  impactScore: number;
  percentOfSupply: number;
  priceChange24h: number;
}

export interface UnlockImpact {
  topImpact: TopImpactUnlock[];
  categoryBreakdown: CategoryBreakdown[];
  priceCorrelation: PriceCorrelation[];
  avgPriceChange: number;
}

export interface CalendarDay {
  date: string;
  count: number;
  totalUsd: number;
  events: { symbol: string; usd: number; category: string }[];
}

interface UnlockDashboardResponse {
  overview: UnlockOverview;
  unlocks: EnrichedUnlock[];
  impact: UnlockImpact;
  calendarData: CalendarDay[];
  alertFeed: AlertEvent[];
}

/* ── Query Keys ── */

export const unlockDashboardKeys = {
  all: ["unlock-dashboard"] as const,
  dashboard: (range: string, search: string) =>
    ["unlock-dashboard", range, search] as const,
};

/* ── Hook ── */

export function useUnlockDashboard(range = "30d", search = "") {
  return useQuery<UnlockDashboardResponse>({
    queryKey: unlockDashboardKeys.dashboard(range, search),
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("range", range);
      if (search) params.set("search", search);

      const res = await fetch(`/api/unlocks-dashboard?${params}`);
      if (!res.ok) throw new Error("Failed to fetch unlock dashboard");
      return res.json();
    },
  });
}
