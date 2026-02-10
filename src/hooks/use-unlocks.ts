"use client";

import { useQuery } from "@tanstack/react-query";
import type { TokenUnlock } from "@/types";

interface UnlocksResponse {
  unlocks: TokenUnlock[];
  stats: {
    count: number;
    totalValue: number;
    highestImpact: number;
  };
}

export const unlockKeys = {
  all: ["unlocks"] as const,
  list: (range: string) => ["unlocks", "list", range] as const,
};

export function useUnlocks(range = "30d") {
  const query = useQuery<UnlocksResponse>({
    queryKey: unlockKeys.list(range),
    queryFn: async () => {
      const res = await fetch(`/api/unlocks?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch unlocks");
      return res.json() as Promise<UnlocksResponse>;
    },
  });

  return {
    unlocks: query.data?.unlocks ?? [],
    stats: query.data?.stats ?? { count: 0, totalValue: 0, highestImpact: 0 },
    ...query,
  };
}
