"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { RadarSignal } from "@/types";

/* ── Types ── */

interface ChirashiPage {
  signals: RadarSignal[];
  lockedCount: number;
  hasMore: boolean;
  nextCursor: string | null;
  tier: string;
}

interface ChirashiTweet {
  id: string;
  text: string;
  created_at: string;
  likes: number;
  retweets: number;
  replies: number;
  sentiment: "positive" | "negative" | "neutral";
}

interface ChirashiTweetsResponse {
  coin: string;
  tweets: ChirashiTweet[];
  sentiment: {
    positive_pct: number;
    negative_pct: number;
    neutral_pct: number;
  };
  source?: "twitter" | "analysis";
}

/* ── Buzz feed (infinite scroll) ── */

export function useChirashiFeed(filters: { coin?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.coin) params.set("coin", filters.coin);
  params.set("limit", "20");

  return useInfiniteQuery<ChirashiPage>({
    queryKey: ["chirashi", filters],
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams(params);
      if (pageParam) {
        p.set("cursor", pageParam as string);
      }
      const res = await fetch(`/api/chirashi?${p.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch buzz feed");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/* ── Tweet samples (Pro/Whale only) ── */

export function useChirashiTweets(coin: string, enabled: boolean) {
  return useQuery<ChirashiTweetsResponse>({
    queryKey: ["chirashi-tweets", coin],
    queryFn: async () => {
      const res = await fetch(`/api/chirashi/tweets?coin=${coin}`);
      if (res.status === 403) throw new Error("UPGRADE_REQUIRED");
      if (!res.ok) throw new Error("Failed to fetch tweets");
      return res.json();
    },
    enabled: enabled && !!coin,
    staleTime: 2 * 60_000,
    refetchInterval: false,
  });
}
