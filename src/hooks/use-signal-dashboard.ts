"use client";

import { useQuery } from "@tanstack/react-query";
import type { SignalCategory } from "@/types";

/* ── Types ── */

export interface SignalSummary {
  total: number;
  buy: number;
  sell: number;
  alert: number;
  avgConfidence: number;
}

export interface EnrichedSignal {
  id: string;
  token_symbol: string;
  token_name: string;
  signal_type: SignalCategory;
  signal_name: string;
  confidence: number;
  timeframe: string;
  description: string;
  indicators: Record<string, { direction?: string; detail?: string }>;
  price_at_signal: number;
  created_at: string;
  currentPrice: number | null;
  priceChange: number | null;
}

export interface HeatmapItem {
  symbol: string;
  name: string;
  buy: number;
  sell: number;
  alert: number;
  total: number;
  avgConfidence: number;
  currentPrice: number;
  change24h: number;
  sentiment: number;
}

export interface TopConfidenceSignal {
  id: string;
  symbol: string;
  name: string;
  signalType: SignalCategory;
  signalName: string;
  confidence: number;
  priceAtSignal: number;
  currentPrice: number;
}

export interface SignalPerformance {
  totalSignals: number;
  winRate: number;
  avgPnl: number;
  bestSignal: {
    token_symbol: string;
    signal_name: string;
    pnl: number;
  } | null;
  worstSignal: {
    token_symbol: string;
    signal_name: string;
    pnl: number;
  } | null;
  recentPerformance: {
    symbol: string;
    signalType: SignalCategory;
    signalName: string;
    confidence: number;
    priceAtSignal: number;
    currentPrice: number;
    pnl: number;
  }[];
}

export interface SignalHistory {
  date: string;
  buy: number;
  sell: number;
  alert: number;
}

export interface SignalDashboardFilters {
  timeframe: string;
  type: SignalCategory | "all";
  search: string;
}

interface SignalDashboardResponse {
  signals: EnrichedSignal[];
  summary: SignalSummary;
  heatmap: HeatmapItem[];
  topConfidence: TopConfidenceSignal[];
  performance: SignalPerformance | null;
  history: SignalHistory[];
  message?: string;
}

/* ── Query Keys ── */

export const signalDashboardKeys = {
  all: ["signal-dashboard"] as const,
  dashboard: (filters: SignalDashboardFilters) =>
    ["signal-dashboard", filters] as const,
};

/* ── Hook ── */

export function useSignalDashboard(filters: SignalDashboardFilters) {
  return useQuery<SignalDashboardResponse>({
    queryKey: signalDashboardKeys.dashboard(filters),
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.timeframe !== "all")
        params.set("timeframe", filters.timeframe);
      if (filters.type !== "all") params.set("type", filters.type);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/signals-dashboard?${params}`);
      if (!res.ok) throw new Error("Failed to fetch signals dashboard");
      return res.json();
    },
  });
}
