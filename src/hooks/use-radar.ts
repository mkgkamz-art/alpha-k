"use client";

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { RadarSignal, RadarFilters, RadarSettings, RadarSignalType } from "@/types";

/* ── Radar signal feed (infinite scroll) ── */

interface RadarPage {
  signals: RadarSignal[];
  lockedCount: number;
  hasMore: boolean;
  nextCursor: string | null;
  tier: string;
}

export function useRadarSignals(filters: RadarFilters = {}) {
  const params = new URLSearchParams();
  if (filters.types && filters.types.length > 0) {
    params.set("types", filters.types.join(","));
  }
  if (filters.minScore) {
    params.set("minScore", String(filters.minScore));
  }
  params.set("limit", String(filters.limit ?? 20));

  return useInfiniteQuery<RadarPage>({
    queryKey: ["radar", filters],
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams(params);
      if (pageParam) {
        p.set("cursor", pageParam as string);
      }
      const res = await fetch(`/api/radar?${p.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch radar signals");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/* ── Radar settings ── */

const DEFAULT_SETTINGS: Omit<RadarSettings, "id" | "user_id" | "created_at" | "updated_at"> = {
  signal_types: ["surge", "kimchi", "listing", "signal", "context"] as RadarSignalType[],
  min_score_alert: 70,
  notify_telegram: true,
  notify_in_app: true,
};

export function useRadarSettings() {
  return useQuery({
    queryKey: ["radar-settings"],
    queryFn: async () => {
      const res = await fetch("/api/radar/settings");
      if (!res.ok) throw new Error("Failed to fetch radar settings");
      const data = await res.json();
      return data.settings as RadarSettings;
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateRadarSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: Partial<Pick<RadarSettings, "signal_types" | "min_score_alert" | "notify_telegram" | "notify_in_app">>,
    ) => {
      const res = await fetch("/api/radar/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update radar settings");
      return res.json();
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["radar-settings"] });
      const previous = queryClient.getQueryData<RadarSettings>(["radar-settings"]);
      if (previous) {
        queryClient.setQueryData<RadarSettings>(["radar-settings"], {
          ...previous,
          ...updates,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["radar-settings"], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["radar-settings"] });
    },
  });
}
