"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WatchlistItem } from "@/types";

interface WatchlistResponse {
  items: WatchlistItem[];
}

export const watchlistKeys = {
  all: ["watchlist"] as const,
  list: () => ["watchlist", "list"] as const,
};

export function useWatchlist() {
  const queryClient = useQueryClient();

  const query = useQuery<WatchlistResponse>({
    queryKey: watchlistKeys.list(),
    queryFn: async () => {
      const res = await fetch("/api/watchlist");
      if (!res.ok) throw new Error("Failed to fetch watchlist");
      return res.json() as Promise<WatchlistResponse>;
    },
  });

  const addToken = useMutation({
    mutationFn: async (body: {
      token_symbol: string;
      token_name: string;
      token_address: string;
      chain: string;
    }) => {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to add token");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: watchlistKeys.all }),
  });

  const removeToken = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove token");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: watchlistKeys.all }),
  });

  const toggleMute = useMutation({
    mutationFn: async ({ id, is_muted }: { id: string; is_muted: boolean }) => {
      const res = await fetch(`/api/watchlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_muted }),
      });
      if (!res.ok) throw new Error("Failed to toggle mute");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: watchlistKeys.all }),
  });

  return {
    items: query.data?.items ?? [],
    ...query,
    addToken,
    removeToken,
    toggleMute,
  };
}
