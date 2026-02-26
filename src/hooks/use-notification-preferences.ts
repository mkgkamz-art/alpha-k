"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  NotificationPreferences,
  NotificationAlertType,
  NotificationAlertConfig,
} from "@/types";

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  listing: { telegram: true, in_app: true, frequency: "instant" },
  surge: { telegram: true, in_app: true, threshold: 10, frequency: "instant" },
  kimchi_premium: { telegram: true, in_app: true, threshold: 5, frequency: "instant" },
  whale: {
    telegram: true,
    in_app: true,
    threshold: 100_000,
    frequency: "instant",
  },
  defi_risk: { telegram: true, in_app: true, frequency: "instant" },
  trading_signal: { telegram: true, in_app: true, frequency: "instant" },
  liquidity: { telegram: true, in_app: true, frequency: "instant" },
};

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/notification-preferences");
      if (!res.ok) throw new Error("Failed to fetch preferences");
      const data = await res.json();
      return data.preferences as NotificationPreferences;
    },
    staleTime: 5 * 60 * 1_000,
  });

  const updatePreference = useMutation({
    mutationFn: async ({
      alertType,
      updates,
    }: {
      alertType: NotificationAlertType;
      updates: Partial<NotificationAlertConfig>;
    }) => {
      const res = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertType, updates }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onMutate: async ({ alertType, updates }) => {
      await queryClient.cancelQueries({
        queryKey: ["notification-preferences"],
      });
      const previous =
        queryClient.getQueryData<NotificationPreferences>([
          "notification-preferences",
        ]);
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(
          ["notification-preferences"],
          {
            ...previous,
            [alertType]: { ...previous[alertType], ...updates },
          },
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["notification-preferences"],
          context.previous,
        );
      }
    },
  });

  return {
    preferences: query.data ?? DEFAULT_PREFERENCES,
    isLoading: query.isLoading,
    updatePreference,
  };
}
