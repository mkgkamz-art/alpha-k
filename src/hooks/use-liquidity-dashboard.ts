"use client";

import { useQuery } from "@tanstack/react-query";
import type { AlertEvent } from "@/types";

/* ── Types ── */

export interface LiquidityOverview {
  totalVolume24h: number;
  totalDexTvl: number;
  poolCount: number;
  alertCount24h: number;
  alertBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface DexRanking {
  id: string;
  protocol_name: string;
  daily_volume: number;
  volume_change_24h: number;
  total_tvl: number;
  chains: string[];
  last_updated: string;
}

export interface LiquidityPool {
  id: string;
  pool_name: string;
  protocol: string;
  chain: string;
  tvl: number;
  apy: number;
  apy_base: number;
  apy_reward: number;
  tvl_change_24h: number;
  is_stablecoin: boolean;
  risk_level: string;
  last_updated: string;
}

export interface ChainDistribution {
  chain: string;
  volume: number;
  tvl: number;
  poolCount: number;
}

export interface StablecoinHealth {
  totalTvl: number;
  avgApy: number;
  poolCount: number;
  flaggedCount: number;
  flaggedPools: {
    poolName: string;
    protocol: string;
    chain: string;
    tvl: number;
    apy: number;
    tvlChange: number;
    riskLevel: string;
  }[];
}

export interface LiquidityFilters {
  search: string;
  chain: string;
}

interface LiquidityDashboardResponse {
  overview: LiquidityOverview;
  dexRankings: DexRanking[];
  topPools: LiquidityPool[];
  chainDistribution: ChainDistribution[];
  stablecoinHealth: StablecoinHealth;
  alertFeed: AlertEvent[];
  btcPrice: { price: number; change24h: number | null } | null;
  filterOptions: { chains: string[] };
}

/* ── Query Keys ── */

export const liquidityKeys = {
  all: ["liquidity"] as const,
  dashboard: (filters: LiquidityFilters) =>
    ["liquidity", "dashboard", filters] as const,
};

/* ── Hook ── */

export function useLiquidityDashboard(filters: LiquidityFilters) {
  return useQuery<LiquidityDashboardResponse>({
    queryKey: liquidityKeys.dashboard(filters),
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.chain !== "all") params.set("chain", filters.chain);

      const res = await fetch(`/api/liquidity-dashboard?${params}`);
      if (!res.ok) throw new Error("Failed to fetch liquidity dashboard");
      return res.json();
    },
  });
}
