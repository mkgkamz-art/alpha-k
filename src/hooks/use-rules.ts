"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AlertRule } from "@/types";

interface RulesResponse {
  rules: AlertRule[];
}

export const ruleKeys = {
  all: ["rules"] as const,
  list: () => ["rules", "list"] as const,
};

export function useRules() {
  const queryClient = useQueryClient();

  const query = useQuery<RulesResponse>({
    queryKey: ruleKeys.list(),
    queryFn: async () => {
      const res = await fetch("/api/rules");
      if (!res.ok) throw new Error("Failed to fetch rules");
      return res.json() as Promise<RulesResponse>;
    },
  });

  const createRule = useMutation({
    mutationFn: async (body: {
      name: string;
      type: string;
      conditions: Record<string, unknown>;
      delivery_channels: Record<string, boolean>;
      cooldown_minutes?: number;
    }) => {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create rule");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ruleKeys.all }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete rule");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ruleKeys.all }),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active }),
      });
      if (!res.ok) throw new Error("Failed to toggle rule");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ruleKeys.all }),
  });

  return {
    rules: query.data?.rules ?? [],
    ...query,
    createRule,
    deleteRule,
    toggleRule,
  };
}
