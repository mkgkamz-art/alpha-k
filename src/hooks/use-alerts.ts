"use client";

import { useEffect, useCallback, useMemo, useRef } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AlertEvent, AlertType, Severity } from "@/types";

/* ── Types ── */

interface AlertsPage {
  items: AlertEvent[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface UseAlertsOptions {
  type?: AlertType | "all";
  severity?: Severity | "all";
}

/* ── Query Key Factory ── */

export const alertKeys = {
  all: ["alerts"] as const,
  list: (filters: UseAlertsOptions) => ["alerts", "list", filters] as const,
  trending: () => ["alerts", "trending"] as const,
  whaleMovements: () => ["alerts", "whale-movements"] as const,
};

/* ── Main Hook ── */

export function useAlerts(options: UseAlertsOptions = {}) {
  const { type = "all", severity = "all" } = options;
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  const query = useInfiniteQuery<AlertsPage>({
    queryKey: alertKeys.list({ type, severity }),
    staleTime: 10 * 1000,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (type !== "all") params.set("type", type);
      if (severity !== "all") params.set("severity", severity);
      if (pageParam) params.set("cursor", pageParam as string);

      const res = await fetch(`/api/alerts?${params}`);
      if (!res.ok) {
        return { items: [], nextCursor: null, hasMore: false } as AlertsPage;
      }
      return res.json() as Promise<AlertsPage>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Flatten pages into a single array
  const alerts = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages]
  );

  // Supabase Realtime subscription for new alert_events
  useEffect(() => {
    const supabase = createClient();

    channelRef.current = supabase
      .channel("alert-events-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alert_events",
        },
        (payload) => {
          const newAlert = payload.new as AlertEvent;

          // Check if it matches current filters
          if (type !== "all" && newAlert.type !== type) return;
          if (severity !== "all" && newAlert.severity !== severity) return;

          // Prepend to the first page
          queryClient.setQueryData<{
            pages: AlertsPage[];
            pageParams: (string | null)[];
          }>(alertKeys.list({ type, severity }), (old) => {
            if (!old) return old;

            const firstPage = old.pages[0];
            return {
              ...old,
              pages: [
                {
                  ...firstPage,
                  items: [newAlert, ...firstPage.items],
                },
                ...old.pages.slice(1),
              ],
            };
          });
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [type, severity, queryClient]);

  // Mark as read
  const markAsRead = useCallback(
    async (alertId: string) => {
      const supabase = createClient();
      await supabase
        .from("alert_events")
        .update({ is_read: true })
        .eq("id", alertId);

      queryClient.setQueryData<{
        pages: AlertsPage[];
        pageParams: (string | null)[];
      }>(alertKeys.list({ type, severity }), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === alertId ? { ...item, is_read: true } : item
            ),
          })),
        };
      });
    },
    [queryClient, type, severity]
  );

  // Toggle bookmark
  const toggleBookmark = useCallback(
    async (alertId: string) => {
      // Read current bookmark state from the query cache
      const cached = queryClient.getQueryData<{
        pages: AlertsPage[];
        pageParams: (string | null)[];
      }>(alertKeys.list({ type, severity }));

      const currentAlert = cached?.pages
        .flatMap((p) => p.items)
        .find((a) => a.id === alertId);
      if (!currentAlert) return;

      const newBookmarked = !currentAlert.is_bookmarked;

      const supabase = createClient();
      await supabase
        .from("alert_events")
        .update({ is_bookmarked: newBookmarked })
        .eq("id", alertId);

      queryClient.setQueryData<{
        pages: AlertsPage[];
        pageParams: (string | null)[];
      }>(alertKeys.list({ type, severity }), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === alertId
                ? { ...item, is_bookmarked: newBookmarked }
                : item
            ),
          })),
        };
      });
    },
    [queryClient, type, severity]
  );

  return {
    alerts,
    ...query,
    markAsRead,
    toggleBookmark,
  };
}

/* ── Trending ── */

export interface TrendingToken {
  rank: number;
  symbol: string;
  alertCount: number;
}

export function useTrending() {
  const query = useQuery<{ trending: TrendingToken[] }>({
    queryKey: alertKeys.trending(),
    queryFn: async () => {
      const res = await fetch("/api/alerts/trending");
      if (!res.ok) throw new Error("Failed to fetch trending");
      return res.json();
    },
    refetchInterval: 60_000,
  });

  return {
    trending: query.data?.trending ?? [],
    ...query,
  };
}

/* ── Whale Events ── */

export interface WhaleEventRow {
  id: string;
  tx_hash: string;
  blockchain: string;
  from_address: string;
  from_label: string;
  to_address: string;
  to_label: string;
  symbol: string;
  amount: number;
  usd_value: number;
  event_type: string;
  detected_at: string;
}

export function useWhaleEvents() {
  const query = useQuery<{ events: WhaleEventRow[] }>({
    queryKey: alertKeys.whaleMovements(),
    queryFn: async () => {
      const res = await fetch("/api/alerts/whale-movements");
      if (!res.ok) throw new Error("Failed to fetch whale events");
      return res.json();
    },
    staleTime: 30 * 1000,
    refetchInterval: 120_000, // 2 min — matches cron interval
  });

  return {
    events: query.data?.events ?? [],
    ...query,
  };
}
