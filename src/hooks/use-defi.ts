"use client";

import { useQuery } from "@tanstack/react-query";
import type { StablecoinPeg, DefiProtocolHealth, AlertEvent } from "@/types";

export const defiKeys = {
  all: ["defi"] as const,
  stablecoins: () => ["defi", "stablecoins"] as const,
  protocols: () => ["defi", "protocols"] as const,
  riskEvents: () => ["defi", "risk-events"] as const,
};

export function useStablecoins() {
  const query = useQuery<{ stablecoins: StablecoinPeg[]; warningCount: number }>({
    queryKey: defiKeys.stablecoins(),
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
  const query = useQuery<{ protocols: DefiProtocolHealth[] }>({
    queryKey: defiKeys.protocols(),
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
