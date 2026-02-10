"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { alertKeys } from "./use-alerts";
import type { AlertEvent } from "@/types";

interface AlertDetailResponse {
  alert: AlertEvent;
  related: AlertEvent[];
}

export const alertDetailKeys = {
  detail: (id: string) => ["alerts", "detail", id] as const,
};

export function useAlertDetail(id: string) {
  const queryClient = useQueryClient();

  return useQuery<AlertDetailResponse>({
    queryKey: alertDetailKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/alerts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch alert detail");
      const data = (await res.json()) as AlertDetailResponse;

      // Mark as read in list cache too
      queryClient.setQueriesData<{
        pages: { items: AlertEvent[]; nextCursor: string | null; hasMore: boolean }[];
        pageParams: (string | null)[];
      }>({ queryKey: alertKeys.all }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === id ? { ...item, is_read: true } : item
            ),
          })),
        };
      });

      return data;
    },
    enabled: !!id,
  });
}
