"use client";

import { useQuery } from "@tanstack/react-query";
import type { AlertEvent, Severity } from "@/types";

/* ── Types ── */

export interface DefiProtocol {
  id: string;
  protocol_name: string;
  slug: string;
  tvl: number;
  tvl_change_24h: number;
  tvl_change_7d: number;
  category: string | null;
  chains: string[];
  last_updated: string;
}

export interface StablecoinInfo {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  peg_deviation: number;
  is_depegged: boolean;
  last_updated: string;
}

export interface RiskOverview {
  totalTvl: number;
  avgTvlChange24h: number;
  depeggedCount: number;
  depeggedCoins: string[];
  alertBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

export interface RiskFilters {
  search: string;
  category: string;
  chain: string;
  sort: string;
  order: string;
}

interface RiskResponse {
  overview: RiskOverview;
  protocols: DefiProtocol[];
  stablecoins: StablecoinInfo[];
  riskEvents: AlertEvent[];
  filterOptions: { categories: string[]; chains: string[] };
}

/* ── Query Keys ── */

export const riskKeys = {
  all: ["risk"] as const,
  dashboard: (filters: RiskFilters) => ["risk", "dashboard", filters] as const,
  fearGreed: () => ["risk", "fear-greed"] as const,
};

/* ── Main Risk Data Hook ── */

export function useRiskDashboard(filters: RiskFilters) {
  return useQuery<RiskResponse>({
    queryKey: riskKeys.dashboard(filters),
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category !== "all") params.set("category", filters.category);
      if (filters.chain !== "all") params.set("chain", filters.chain);
      params.set("sort", filters.sort);
      params.set("order", filters.order);

      const res = await fetch(`/api/risk?${params}`);
      if (!res.ok) throw new Error("Failed to fetch risk data");
      return res.json();
    },
  });
}

/* ── Fear & Greed Index Hook ── */

export interface FearGreedData {
  value: number;
  label: string;
  timestamp: string;
}

export function useFearGreed() {
  return useQuery<FearGreedData>({
    queryKey: riskKeys.fearGreed(),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      try {
        const res = await fetch("https://api.alternative.me/fng/?limit=1");
        if (!res.ok) throw new Error("FNG API error");
        const json = await res.json();
        const d = json.data?.[0];
        return {
          value: Number(d?.value ?? 50),
          label: d?.value_classification ?? "Neutral",
          timestamp: d?.timestamp
            ? new Date(Number(d.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
        };
      } catch {
        return { value: 50, label: "Neutral", timestamp: new Date().toISOString() };
      }
    },
  });
}
