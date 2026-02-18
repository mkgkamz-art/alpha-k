"use client";

import { useQuery } from "@tanstack/react-query";
import type { Tables } from "@/types/database.types";

export type ContextAlertRow = Tables<"context_alerts">;

export interface ContextAlertFilters {
  type?: string;
  severity?: string;
  limit?: number;
}

export const contextAlertKeys = {
  all: ["context-alerts"] as const,
  list: (f: ContextAlertFilters) =>
    ["context-alerts", f.type ?? "all", f.severity ?? "all", f.limit ?? 30] as const,
  latest: ["context-alerts", "latest-critical"] as const,
};

export function useContextAlerts(filters: ContextAlertFilters = {}, interval = 30_000) {
  return useQuery<{ data: ContextAlertRow[]; count: number }>({
    queryKey: contextAlertKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.type) params.set("type", filters.type);
      if (filters.severity) params.set("severity", filters.severity);
      if (filters.limit) params.set("limit", String(filters.limit));

      const res = await fetch(`/api/context-alerts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch context alerts");
      return res.json();
    },
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
