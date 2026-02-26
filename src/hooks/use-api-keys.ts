"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ApiKeyInfo {
  apiKey: {
    id: string;
    maskedKey: string;
    status: string;
    createdAt: string;
  } | null;
  usage: {
    today: number;
    limit: number | null;
    tier: string;
  };
}

export const apiKeyKeys = {
  all: ["api-keys"] as const,
};

export function useApiKeys(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery<ApiKeyInfo>({
    queryKey: apiKeyKeys.all,
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch("/api/api-keys");
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return res.json();
    },
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/api-keys", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create API key");
      return res.json() as Promise<{
        apiKey: string;
        apiSecret: string;
        message: string;
      }>;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all }),
  });

  const deleteKey = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch("/api/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      if (!res.ok) throw new Error("Failed to delete API key");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all }),
  });

  return {
    ...query,
    createKey,
    deleteKey,
  };
}
