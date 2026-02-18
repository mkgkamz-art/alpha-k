"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn, formatPercentage } from "@/lib/utils";
import { useKimchiPremium } from "@/hooks/use-kimchi";

function getInterpretation(avg: number): { text: string; color: string } {
  if (avg >= 5) return { text: "과열 — 매수 주의", color: "text-signal-danger" };
  if (avg >= 3)
    return { text: "높음 — 관망 추천", color: "text-signal-warning" };
  if (avg >= 1) return { text: "보통", color: "text-text-secondary" };
  if (avg >= -1) return { text: "균형 — 안정적", color: "text-signal-success" };
  return { text: "역프 — 해외 대비 저렴", color: "text-signal-info" };
}

/**
 * Side widget showing average kimchi premium + top 3 coins.
 * Used on Whale, Signals, Unlocks, Liquidity pages.
 */
export function KimchiSideWidget() {
  const { data, isLoading } = useKimchiPremium("premium_desc", 30_000);

  const avg = data?.avgPremium ?? 0;
  const top3 = data?.data?.slice(0, 3) ?? [];
  const interpretation = getInterpretation(avg);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          김치프리미엄
        </h3>
        <Link
          href="/kimchi"
          className="text-[10px] text-accent-secondary hover:text-accent-secondary/80 flex items-center gap-0.5"
        >
          더보기 <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
        </div>
      ) : (
        <>
          {/* Average premium */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-xl font-bold font-num text-text-primary">
              {avg >= 0 ? "+" : ""}
              {avg.toFixed(2)}%
            </span>
            <span className={cn("text-[10px] font-medium", interpretation.color)}>
              {interpretation.text}
            </span>
          </div>

          {/* Top 3 coins */}
          <div className="flex flex-col gap-1.5">
            {top3.map((item) => (
              <div
                key={`${item.symbol}-${item.exchange}`}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-text-primary font-medium">
                    {item.symbol}
                  </span>
                  <span className="text-[9px] text-text-disabled">
                    {item.exchange}
                  </span>
                </div>
                <span
                  className={cn(
                    "font-num font-bold",
                    item.kimchi_premium >= 5
                      ? "text-signal-danger"
                      : item.kimchi_premium >= 3
                        ? "text-signal-warning"
                        : item.kimchi_premium >= 0
                          ? "text-text-primary"
                          : "text-signal-info"
                  )}
                >
                  {item.kimchi_premium >= 0 ? "+" : ""}
                  {item.kimchi_premium.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
