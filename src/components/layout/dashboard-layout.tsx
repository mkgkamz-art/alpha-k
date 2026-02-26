"use client";

import { useState, type ReactNode } from "react";
import Script from "next/script";
import Link from "next/link";
import { X } from "lucide-react";
import { TabNav } from "./tab-nav";
import { TopBar } from "./top-bar";
import { MarketBar } from "./market-bar";
import { useAuthInit } from "@/hooks/use-auth-init";
import { useAuthStore } from "@/stores/auth-store";
import { useSubscription } from "@/hooks/use-subscription";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Sync Supabase session → Zustand (works for both auth & unauth)
  useAuthInit();

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* Lemon Squeezy overlay checkout script */}
      <Script
        src="https://app.lemonsqueezy.com/js/lemon.js"
        strategy="lazyOnload"
      />

      {/* ── Trial expiry warning banner ── */}
      <TrialExpiryBanner />

      {/* ── MarketBar: sticky top ── */}
      <MarketBar />

      {/* ── Body: tab nav + content ── */}
      <div className="flex flex-1 min-h-0">
        <TabNav />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />

          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ── Trial Expiry Warning Banner ── */

const BANNER_DISMISS_KEY = "alpha-k-trial-banner-dismissed";

function TrialExpiryBanner() {
  const user = useAuthStore((s) => s.user);
  const isOnTrial = useAuthStore((s) => s.isOnTrial);
  const { subscription } = useSubscription(!!user && isOnTrial);

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(BANNER_DISMISS_KEY) === "1";
  });

  // Only show during trial, when D-7 or less
  const daysLeft = subscription?.daysLeftInTrial ?? 0;
  if (!isOnTrial || daysLeft > 7 || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(BANNER_DISMISS_KEY, "1"); } catch {}
  };

  return (
    <div className="bg-signal-warning/10 border-b border-signal-warning/20 px-4 py-2">
      <div className="flex items-center justify-between gap-3 max-w-350 mx-auto">
        <p className="text-xs text-signal-warning font-medium">
          무료 체험 종료 D-{daysLeft}
          <span className="text-text-secondary ml-2">
            체험 종료 후 자동 결제됩니다. 해지하려면 Billing에서 취소하세요.
          </span>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/billing"
            className="text-[11px] font-bold text-signal-warning hover:text-signal-warning/80 transition-colors"
          >
            구독 관리
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-0.5 rounded hover:bg-signal-warning/10 transition-colors"
            aria-label="배너 닫기"
          >
            <X className="w-3.5 h-3.5 text-text-disabled" />
          </button>
        </div>
      </div>
    </div>
  );
}
