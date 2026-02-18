"use client";

import { useQuery } from "@tanstack/react-query";

/* ── Types ── */

export interface KimchiPriceRow {
  symbol: string;
  exchange: string;
  price_krw: number;
  price_usd: number | null;
  volume_24h: number | null;
  change_24h: number | null;
  kimchi_premium: number;
  usd_krw_rate: number | null;
  fetched_at: string;
}

export interface KimchiResponse {
  data: KimchiPriceRow[];
  count: number;
  avgPremium: number;
  usdKrwRate: number | null;
}

export interface KimchiHistoryPoint {
  symbol: string;
  premium_percent: number;
  price_krw: number | null;
  price_usd: number | null;
  usd_krw_rate: number | null;
  recorded_at: string;
}

export interface KimchiHistoryResponse {
  data: KimchiHistoryPoint[];
  symbol: string;
  period: string;
}

/* ── Hooks ── */

export function useKimchiPremium(sort = "premium_desc", interval = 15_000) {
  return useQuery<KimchiResponse>({
    queryKey: ["kimchi-premium", sort],
    queryFn: async () => {
      const res = await fetch(`/api/kimchi-premium?sort=${sort}`);
      if (!res.ok) throw new Error("Failed to fetch kimchi premium");
      return res.json();
    },
    refetchInterval: interval,
    staleTime: 10_000,
  });
}

export function useKimchiHistory(symbol: string, period: string) {
  return useQuery<KimchiHistoryResponse>({
    queryKey: ["kimchi-history", symbol, period],
    queryFn: async () => {
      const params = new URLSearchParams({ symbol, period });
      const res = await fetch(`/api/kimchi-premium/history?${params}`);
      if (!res.ok) throw new Error("Failed to fetch kimchi history");
      return res.json();
    },
    staleTime: 60_000,
  });
}
