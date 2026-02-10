"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@/components/ui";
import { PLANS } from "@/lib/lemonsqueezy/plans";
import type { Feature } from "@/lib/middleware/subscription-guard";

const FEATURE_LABELS: Record<Feature, string> = {
  unlimited_rules: "Unlimited Alert Rules",
  realtime_alerts: "Real-time Instant Alerts",
  signals_1d: "1D Trading Signals",
  signals_4h: "4H Trading Signals",
  signals_1w: "1W Trading Signals",
  telegram: "Telegram Integration",
  discord: "Discord Integration",
  sms: "SMS & Phone Alerts",
  api_access: "API Access",
  unlimited_api: "Unlimited API Calls",
};

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  feature?: Feature;
  requiredTier?: "pro" | "whale";
}

export function UpgradePrompt({
  open,
  onClose,
  feature,
  requiredTier = "pro",
}: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);
  const plan = PLANS.find((p) => p.tier === requiredTier);

  const handleUpgrade = async () => {
    if (!plan) return;

    const variantId = plan.monthly.variantId;
    if (!variantId) {
      window.location.href = "/pricing";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      if (!res.ok) throw new Error("Checkout failed");

      const { url } = (await res.json()) as { url: string };

      if (typeof window !== "undefined" && window.LemonSqueezy) {
        window.LemonSqueezy.Url.Open(url);
      } else {
        window.location.href = url;
      }
    } catch {
      window.location.href = "/pricing";
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader onClose={onClose}>Upgrade Required</ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="size-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <Zap className="size-6 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-text-primary font-medium">
                {feature
                  ? `${FEATURE_LABELS[feature]} requires the ${plan?.name} plan.`
                  : `This feature requires the ${plan?.name} plan.`}
              </p>
              <p className="text-xs text-text-secondary mt-2">
                Upgrade to unlock all {requiredTier === "whale" ? "institutional-grade" : "professional"} features
                starting at ${plan?.monthly.price}/mo.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} size="sm">
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} disabled={loading} size="sm">
            <Zap className="size-3.5 mr-1" />
            {loading ? "Loading..." : `Upgrade to ${plan?.name}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Extend Window for Lemon Squeezy ── */
declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}
