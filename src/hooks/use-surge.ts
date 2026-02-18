"use client";

import { useQuery } from "@tanstack/react-query";
import type { SurgeItem } from "@/lib/surge-detector";

/* ── Types ── */

export interface SurgeResponse {
  data: SurgeItem[];
  pumpCount: number;
  dumpCount: number;
  total: number;
  exchange: string;
  type: string;
}

export interface SurgeFilters {
  exchange: "upbit" | "bithumb";
  type: "all" | "pump" | "dump";
}

/* ── Hook ── */

export function useSurge(filters: SurgeFilters, interval = 10_000) {
  return useQuery<SurgeResponse>({
    queryKey: ["surge", filters.exchange, filters.type],
    queryFn: async () => {
      const params = new URLSearchParams({
        exchange: filters.exchange,
        type: filters.type,
        limit: "50",
      });
      const res = await fetch(`/api/surge?${params}`);
      if (!res.ok) throw new Error("Failed to fetch surge data");
      return res.json();
    },
    refetchInterval: interval,
    staleTime: 5_000,
  });
}

/* ── Surge count hook (for MarketBar) ── */

export function useSurgeCount() {
  return useQuery<{ count: number }>({
    queryKey: ["surge-count"],
    queryFn: async () => {
      const res = await fetch("/api/surge-count");
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
