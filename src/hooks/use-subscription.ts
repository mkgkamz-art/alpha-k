"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SubscriptionInfo {
  tier: string;
  status: string;
  cancelled?: boolean;
  plan: string | null;
  renewsAt: string | null;
  endsAt: string | null;
  amount: number | null;
  interval: "monthly" | "yearly" | null;
  customerPortalUrl: string | null;
  updatePaymentUrl: string | null;
}

export const subscriptionKeys = {
  all: ["subscription"] as const,
};

export function useSubscription(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery<{ subscription: SubscriptionInfo }>({
    queryKey: subscriptionKeys.all,
    enabled,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/subscription");
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return res.json();
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) throw new Error("Failed to cancel subscription");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }),
  });

  return {
    subscription: query.data?.subscription ?? null,
    ...query,
    cancelSubscription,
  };
}
