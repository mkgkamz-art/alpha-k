"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useTelegramLink() {
  const queryClient = useQueryClient();

  const generateCode = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate code");
      return res.json() as Promise<{
        code: string;
        expiresIn: number;
        botUsername: string;
      }>;
    },
  });

  const verifyCode = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/telegram/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification failed");
      }
      return res.json() as Promise<{ ok: boolean; chatId: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/link", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });

  const sendTest = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/test", { method: "POST" });
      if (!res.ok) throw new Error("Failed to send test");
      return res.json();
    },
  });

  return { generateCode, verifyCode, disconnect, sendTest };
}
