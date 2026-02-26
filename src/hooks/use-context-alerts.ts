"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { Tables } from "@/types/database.types";

export type ContextAlertRow = Tables<"context_alerts">;

export interface ContextAlertFilters {
  type?: string;
  severity?: string;
  limit?: number;
}

export interface ContextAlertPage {
  data: ContextAlertRow[];
  count: number;
  nextCursor: string | null;
}

export const contextAlertKeys = {
  all: ["context-alerts"] as const,
  list: (f: ContextAlertFilters) =>
    ["context-alerts", f.type ?? "all", f.severity ?? "all", f.limit ?? 20] as const,
  latest: ["context-alerts", "latest-critical"] as const,
};

export function useContextAlerts(filters: ContextAlertFilters = {}, interval = 30_000) {
  const limit = filters.limit ?? 20;

  return useInfiniteQuery<ContextAlertPage, Error, { pages: ContextAlertPage[]; pageParams: (string | null)[] }, readonly (string | number)[], string | null>({
    queryKey: contextAlertKeys.list(filters),
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (filters.type) params.set("type", filters.type);
      if (filters.severity) params.set("severity", filters.severity);
      params.set("limit", String(limit));
      if (pageParam) params.set("cursor", pageParam);

      const res = await fetch(`/api/context-alerts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch context alerts");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: interval,
    staleTime: 15_000,
  });
}

/** Latest critical alert — used by toast system */
export function useLatestCriticalAlert() {
  return useQuery<{ data: ContextAlertRow[]; count: number }>({
    queryKey: contextAlertKeys.latest,
    queryFn: async () => {
      const res = await fetch("/api/context-alerts?severity=critical&limit=1");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
