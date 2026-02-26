"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  WhaleRankingItem,
  WhaleDetailResponse,
  SerializedTrade,
  SerializedHotCoin,
} from "@/lib/whale-api";

/* ── Types ── */

export interface WhaleRankingFilters {
  sort?: "return_30d" | "return_7d" | "return_90d" | "win_rate" | "followers";
  tier?: string;
  limit?: number;
  followedOnly?: boolean;
}

export interface WhaleTradeFilters {
  coin_symbol?: string;
  trade_type?: "buy" | "sell";
  min_value_usd?: number;
  whale_tier?: string;
  limit?: number;
}

interface RankingPage {
  whales: WhaleRankingItem[];
  followed_ids: string[];
  next_cursor: string | null;
  meta: { tier: string; count: number; has_more: boolean; free_limit: number };
}

interface TradesPage {
  trades: SerializedTrade[];
  lockedCount: number;
  next_cursor: string | null;
  meta: { tier: string; count: number; has_more: boolean };
}

interface HotCoinsResponse {
  hot_coins: SerializedHotCoin[];
  lockedCount: number;
  meta: { tier: string; count: number; total: number };
}

interface WhaleDetailPageResponse {
  data: WhaleDetailResponse;
  meta: { tier: string };
}

/* ── Query Keys ── */

export const whaleTrackerKeys = {
  ranking: (filters: WhaleRankingFilters) =>
    ["whale-tracker", "ranking", filters] as const,
  trades: (filters: WhaleTradeFilters) =>
    ["whale-tracker", "trades", filters] as const,
  hotCoins: () => ["whale-tracker", "hot-coins"] as const,
  detail: (id: string) => ["whale-tracker", "detail", id] as const,
};

/* ── Ranking ── */

export function useWhaleRanking(filters: WhaleRankingFilters = {}) {
  const params = new URLSearchParams();
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.followedOnly) params.set("followedOnly", "true");
  params.set("limit", String(filters.limit ?? 20));

  return useInfiniteQuery<RankingPage>({
    queryKey: whaleTrackerKeys.ranking(filters),
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams(params);
      if (pageParam) p.set("cursor", pageParam as string);
      const res = await fetch(`/api/whale/ranking?${p.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch whale ranking");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more ? lastPage.next_cursor : undefined,
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}

/* ── Trades Feed ── */

export function useWhaleTrades(filters: WhaleTradeFilters = {}) {
  const params = new URLSearchParams();
  if (filters.coin_symbol) params.set("coin_symbol", filters.coin_symbol);
  if (filters.trade_type) params.set("trade_type", filters.trade_type);
  if (filters.min_value_usd)
    params.set("min_value_usd", String(filters.min_value_usd));
  if (filters.whale_tier) params.set("whale_tier", filters.whale_tier);
  params.set("limit", String(filters.limit ?? 20));

  return useInfiniteQuery<TradesPage>({
    queryKey: whaleTrackerKeys.trades(filters),
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams(params);
      if (pageParam) p.set("cursor", pageParam as string);
      const res = await fetch(`/api/whale/trades?${p.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch whale trades");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more ? lastPage.next_cursor : undefined,
    refetchInterval: 15_000,
    staleTime: 15_000,
  });
}

/* ── Hot Coins ── */

export function useWhaleHotCoins() {
  return useQuery<HotCoinsResponse>({
    queryKey: whaleTrackerKeys.hotCoins(),
    queryFn: async () => {
      const res = await fetch("/api/whale/hot-coins");
      if (!res.ok) throw new Error("Failed to fetch hot coins");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 60_000,
  });
}

/* ── Whale Detail ── */

export function useWhaleDetail(id: string) {
  return useQuery<WhaleDetailPageResponse>({
    queryKey: whaleTrackerKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/whale/${id}`);
      if (res.status === 403) {
        const body = await res.json();
        throw Object.assign(new Error(body.error ?? "Forbidden"), {
          status: 403,
        });
      }
      if (!res.ok) throw new Error("Failed to fetch whale detail");
      return res.json();
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

/* ── Follow / Unfollow Mutations ── */

export function useFollowWhale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (whaleId: string) => {
      const res = await fetch(`/api/whale/${whaleId}/follow`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        throw Object.assign(new Error(body.error ?? "Failed to follow"), {
          status: res.status,
          data: body,
        });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["whale-tracker", "ranking"],
      });
      queryClient.invalidateQueries({
        queryKey: ["whale-tracker", "detail"],
      });
    },
  });
}

export function useUnfollowWhale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (whaleId: string) => {
      const res = await fetch(`/api/whale/${whaleId}/follow`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        throw Object.assign(new Error(body.error ?? "Failed to unfollow"), {
          status: res.status,
        });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["whale-tracker", "ranking"],
      });
      queryClient.invalidateQueries({
        queryKey: ["whale-tracker", "detail"],
      });
    },
  });
}
