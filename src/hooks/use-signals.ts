"use client";

import { useQuery } from "@tanstack/react-query";
import type { Signal, SignalCategory } from "@/types";

interface SignalsResponse {
  signals: Signal[];
  message?: string;
}

interface UseSignalsOptions {
  timeframe?: string;
  type?: SignalCategory | "all";
}

export const signalKeys = {
  all: ["signals"] as const,
  list: (filters: UseSignalsOptions) => ["signals", "list", filters] as const,
};

export function useSignals(options: UseSignalsOptions = {}) {
  const { timeframe = "all", type = "all" } = options;

  const query = useQuery<SignalsResponse>({
    queryKey: signalKeys.list({ timeframe, type }),
    staleTime: 30 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams();
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
