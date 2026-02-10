"use client";

import { useQuery } from "@tanstack/react-query";
import type { TradingSignal, Chain, Timeframe, SignalType } from "@/types";

interface SignalsResponse {
  signals: TradingSignal[];
  message?: string;
}

interface UseSignalsOptions {
  chain?: Chain | "all";
  timeframe?: Timeframe | "all";
  type?: SignalType | "all";
}

export const signalKeys = {
  all: ["signals"] as const,
  list: (filters: UseSignalsOptions) => ["signals", "list", filters] as const,
};

export function useSignals(options: UseSignalsOptions = {}) {
  const { chain = "all", timeframe = "all", type = "all" } = options;

  const query = useQuery<SignalsResponse>({
    queryKey: signalKeys.list({ chain, timeframe, type }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (chain !== "all") params.set("chain", chain);
      if (timeframe !== "all") params.set("timeframe", timeframe);
      if (type !== "all") params.set("type", type);

      const res = await fetch(`/api/signals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch signals");
      return res.json() as Promise<SignalsResponse>;
    },
  });

  return {
    signals: query.data?.signals ?? [],
    message: query.data?.message,
    ...query,
  };
}
