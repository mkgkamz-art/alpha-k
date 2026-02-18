"use client";

import { useQuery } from "@tanstack/react-query";
import type { DailySummaryResponse } from "@/app/api/daily-summary/route";

export type { DailySummaryResponse };

export const dailySummaryKeys = {
  all: ["daily-summary"] as const,
};

export function useDailySummary(interval = 60_000) {
  return useQuery<DailySummaryResponse>({
    queryKey: dailySummaryKeys.all,
    queryFn: async () => {
      const res = await fetch("/api/daily-summary");
      if (!res.ok) throw new Error("Failed to fetch daily summary");
      return res.json();
    },
    refetchInterval: interval,
    staleTime: 30_000,
  });
}
