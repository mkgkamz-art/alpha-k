"use client";

import { useQuery } from "@tanstack/react-query";
import type { AlertEvent } from "@/types";

/* ── Types matching new tables ── */

export interface DefiProtocolRow {
  id: string;
  protocol_name: string;
  slug: string;
  tvl: number;
  tvl_change_24h: number;
  tvl_change_7d: number;
  category: string;
  chains: string[];
  last_updated: string;
}

export interface StablecoinStatusRow {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  peg_deviation: number;
  is_depegged: boolean;
  last_updated: string;
}

/* ── Query Keys ── */

export const defiKeys = {
  all: ["defi"] as const,
  stablecoins: () => ["defi", "stablecoins"] as const,
  protocols: () => ["defi", "protocols"] as const,
  riskEvents: () => ["defi", "risk-events"] as const,
};

/* ── Hooks ── */

export function useStablecoins() {
  const query = useQuery<{ stablecoins: StablecoinStatusRow[]; warningCount: number }>({
    queryKey: defiKeys.stablecoins(),
    staleTime: 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/defi/stablecoins");
      if (!res.ok) throw new Error("Failed to fetch stablecoins");
      return res.json();
    },
  });

  return {
    stablecoins: query.data?.stablecoins ?? [],
    warningCount: query.data?.warningCount ?? 0,
    ...query,
  };
}

export function useProtocols() {
  const query = useQuery<{ protocols: DefiProtocolRow[] }>({
    queryKey: defiKeys.protocols(),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/defi/protocols");
      if (!res.ok) throw new Error("Failed to fetch protocols");
      return res.json();
    },
  });

  return {
    protocols: query.data?.protocols ?? [],
    ...query,
  };
}

export function useRiskEvents() {
  const query = useQuery<{ events: AlertEvent[] }>({
    queryKey: defiKeys.riskEvents(),
    staleTime: 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/defi/risk-events");
      if (!res.ok) throw new Error("Failed to fetch risk events");
      return res.json();
    },
  });

  return {
    events: query.data?.events ?? [],
    ...query,
  };
}
