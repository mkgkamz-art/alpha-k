"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, Loader2 } from "lucide-react";
import { cn, formatPercentage } from "@/lib/utils";
import { useSurge, type SurgeResponse } from "@/hooks/use-surge";

/**
 * Side widget showing top 3 surge coins.
 * Used on Whale, Signals, Risk, Unlocks pages.
 */
export function SurgeSideWidget() {
  const { data, isLoading } = useSurge(
    { exchange: "upbit", type: "all" },
    30_000
  );

  const items = data?.data?.slice(0, 3) ?? [];

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          급등 레이더
        </h3>
        <Link
          href="/surge"
          className="text-[10px] text-accent-secondary hover:text-accent-secondary/80 flex items-center gap-0.5"
        >
          더보기 <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-text-disabled text-center py-4">
          급등/급락 감지 없음
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => {
            const isPump = item.type === "pump";
            return (
              <div
                key={`${item.symbol}-${item.exchange}`}
                className="flex items-center gap-2"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    isPump
                      ? "bg-signal-success/10"
                      : "bg-signal-danger/10"
                  )}
                >
                  {isPump ? (
                    <TrendingUp className="w-3 h-3 text-signal-success" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-signal-danger" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-text-primary">
                    {item.symbol}
                  </span>
                  <span className="text-[10px] text-text-disabled ml-1">
                    {item.exchange}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-xs font-num font-bold",
                    isPump ? "text-signal-success" : "text-signal-danger"
                  )}
                >
                  {item.change_24h >= 0 ? "+" : ""}
                  {formatPercentage(item.change_24h)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {(data?.pumpCount ?? 0) + (data?.dumpCount ?? 0) > 3 && (
        <p className="text-[10px] text-text-disabled mt-2 text-center">
          외 {(data?.pumpCount ?? 0) + (data?.dumpCount ?? 0) - 3}건 감지 중
        </p>
      )}
    </div>
  );
}
