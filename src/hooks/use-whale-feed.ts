"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { WhaleEventRow } from "./use-alerts";

/* ── Types ── */

export interface WhaleFilters {
  blockchain: string;
  minAmount: number;
  eventType: string;
  period: string;
}

export interface WhaleSummary {
  totalCount: number;
  totalVolume: number;
  largest: { symbol: string; amount: number; usdValue: number } | null;
}

export interface WhaleFlow {
  inflow: number;
  outflow: number;
  netFlow: number;
}

export interface WhaleTopMover {
  entity: string;
  count: number;
  volume: number;
}

export interface WhaleAsset {
  symbol: string;
  volume: number;
  percentage: number;
}

export interface WhaleTrendPoint {
  date: string;
  count: number;
  volume: number;
}

export interface WhaleStats {
  summary: WhaleSummary;
  flow: WhaleFlow;
  topMovers: WhaleTopMover[];
  assetBreakdown: WhaleAsset[];
  trend: WhaleTrendPoint[];
}

interface WhaleFeedPage {
  events: WhaleEventRow[];
  hasMore: boolean;
  nextCursor: string | null;
}

interface WhaleStatsResponse extends WhaleFeedPage {
  stats: WhaleStats;
}

/* ── Query Keys ── */

export const whaleKeys = {
  all: ["whale"] as const,
  feed: (filters: WhaleFilters) => ["whale", "feed", filters] as const,
  stats: (filters: WhaleFilters) => ["whale", "stats", filters] as const,
};

/* ── Build URL params ── */

function buildParams(filters: WhaleFilters, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (filters.blockchain !== "all") params.set("blockchain", filters.blockchain);
  if (filters.minAmount > 0) params.set("minAmount", String(filters.minAmount));
  if (filters.eventType !== "all") params.set("eventType", filters.eventType);
  params.set("period", filters.period);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
  }
  return params;
}

/* ── Feed hook (infinite scroll) ── */

export function useWhaleFeed(filters: WhaleFilters) {
  return useInfiniteQuery<WhaleFeedPage>({
    queryKey: whaleKeys.feed(filters),
    staleTime: 30_000,
    refetchInterval: 30_000,
    queryFn: async ({ pageParam }) => {
      const params = buildParams(filters);
      if (pageParam) params.set("cursor", pageParam as string);

      const res = await fetch(`/api/whale?${params}`);
      if (!res.ok) return { events: [], hasMore: false, nextCursor: null };
      return res.json() as Promise<WhaleFeedPage>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

/* ── Stats hook (aggregated data, less frequent) ── */

export function useWhaleStats(filters: WhaleFilters) {
  return useQuery<WhaleStats>({
    queryKey: whaleKeys.stats(filters),
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const params = buildParams(filters, { stats: "true", limit: "1" });
      const res = await fetch(`/api/whale?${params}`);
      if (!res.ok) throw new Error("Failed to fetch whale stats");
      const data = (await res.json()) as WhaleStatsResponse;
      return data.stats;
    },
  });
}
