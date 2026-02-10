"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";

export const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<{ settings: User }>({
    queryKey: settingsKeys.all,
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
  });

  return {
    settings: query.data?.settings ?? null,
    ...query,
    updateSettings,
  };
}
