"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Zap } from "lucide-react";
import { cn, formatPercentage } from "@/lib/utils";
import { useListings } from "@/hooks/use-listings";
import { timeAgo } from "@/lib/utils";

/**
 * Side widget showing the latest listing + count.
 * Used on Risk, Liquidity pages.
 */
export function ListingSideWidget() {
  const { data, isLoading } = useListings(
    { exchange: "all" },
    60_000
  );

  const latest = data?.data?.[0] ?? null;
  const total = data?.total ?? 0;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          최신 상장
        </h3>
        <Link
          href="/listing"
          className="text-[10px] text-accent-secondary hover:text-accent-secondary/80 flex items-center gap-0.5"
        >
          더보기 <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
        </div>
      ) : !latest ? (
        <p className="text-xs text-text-disabled text-center py-4">
          최근 상장 정보 없음
        </p>
      ) : (
        <div className="space-y-2">
          {/* Latest listing card */}
          <div className="bg-bg-tertiary/50 rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-accent-primary" />
              <span className="text-sm font-bold text-text-primary">
                {latest.symbol}
              </span>
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                  latest.exchange === "upbit"
                    ? "bg-signal-info/10 text-signal-info"
                    : "bg-signal-warning/10 text-signal-warning"
                )}
              >
                {latest.exchange}
              </span>
            </div>
            {latest.coin_name && (
              <p className="text-[10px] text-text-secondary mb-1">
                {latest.coin_name}
              </p>
            )}
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-text-disabled">
                {timeAgo(latest.detected_at)}
              </span>
              {latest.price_change_since_listing !== null && (
                <span
                  className={cn(
                    "font-num font-bold",
                    latest.price_change_since_listing >= 0
                      ? "text-signal-success"
                      : "text-signal-danger"
                  )}
                >
                  상장 후 {formatPercentage(latest.price_change_since_listing)}
                </span>
              )}
            </div>
          </div>

          {total > 1 && (
            <p className="text-[10px] text-text-disabled text-center">
              최근 7일간 {total}건 상장
            </p>
          )}
        </div>
      )}
    </div>
  );
}
