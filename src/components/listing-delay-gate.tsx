"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { LISTING_DELAY_MS } from "@/lib/subscription";

interface ListingDelayGateProps {
  /** ISO timestamp of the listing */
  listedAt: string;
  /** Coin name (shown blurred for free users) */
  coinName: string;
  /** Children rendered when accessible */
  children: React.ReactNode;
  className?: string;
}

/**
 * Gates listing info behind a 30-minute delay for Free users.
 * Shows countdown timer + regret marketing copy.
 * Pro users see everything immediately.
 */
export function ListingDelayGate({
  listedAt,
  coinName,
  children,
  className,
}: ListingDelayGateProps) {
  const isPro = useAuthStore((s) => s.isPro);
  const [now, setNow] = useState(() => Date.now());

  const listedTime = useMemo(() => new Date(listedAt).getTime(), [listedAt]);
  const unlockTime = listedTime + LISTING_DELAY_MS;
  const remaining = unlockTime - now;
  const isLocked = !isPro && remaining > 0;

  // Tick every second while locked
  useEffect(() => {
    if (!isLocked) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLocked]);

  // Accessible — render children
  if (!isLocked) {
    return <>{children}</>;
  }

  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  // Regret marketing messages based on time remaining
  const regretMessage = getRegretMessage(minutes);

  return (
    <div className={cn("relative", className)}>
      {/* Blurred content preview */}
      <div className="blur-md select-none pointer-events-none" aria-hidden>
        {children}
      </div>

      {/* Delay overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/70 backdrop-blur-[2px] rounded-lg">
        <div className="flex flex-col items-center gap-4 px-6 py-4 max-w-[320px] text-center">
          {/* Countdown */}
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-signal-warning animate-pulse" />
            <span className="text-2xl font-bold font-num text-text-primary tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">
            <span className="blur-sm inline-block px-1 bg-bg-tertiary rounded text-text-primary font-medium">
              {coinName}
            </span>{" "}
            상장 알림이{" "}
            <span className="text-signal-warning font-medium">30분 지연</span>{" "}
            중입니다
          </p>

          {/* Regret marketing */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-signal-warning/5 border border-signal-warning/20">
            <AlertTriangle className="w-4 h-4 text-signal-warning shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed text-left">
              {regretMessage}
            </p>
          </div>

          {/* Past performance hint */}
          <div className="flex items-center gap-1.5 text-xs text-signal-success">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pro 유저는 평균 23분 빠르게 진입</span>
          </div>

          {/* Upgrade CTA */}
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Pro로 즉시 확인
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Blur-only coin name for free users in listing lists.
 */
export function ListingCoinName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const isPro = useAuthStore((s) => s.isPro);

  if (isPro) {
    return <span className={className}>{name}</span>;
  }

  return (
    <span className={cn("blur-sm select-none", className)} aria-label="Pro 전용">
      {name}
    </span>
  );
}

/* ── Regret marketing messages ── */

function getRegretMessage(minutesLeft: number): string {
  if (minutesLeft >= 25) {
    return "신규 상장 직후 평균 47%의 가격 변동이 발생합니다. 지금 이 순간에도 Pro 유저들은 매매 중입니다.";
  }
  if (minutesLeft >= 15) {
    return "상장 초기 거래량의 60%가 처음 15분에 집중됩니다. 골든타임을 놓치고 계십니다.";
  }
  if (minutesLeft >= 5) {
    return "곧 공개됩니다. 하지만 최적의 진입 시점은 이미 지났을 수 있습니다.";
  }
  return "거의 다 됐습니다! 하지만 다음 상장도 Pro라면 즉시 확인 가능합니다.";
}
