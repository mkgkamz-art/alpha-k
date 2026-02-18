"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface MarketData {
  btcKrw: number | null;
  btcChange24h: number | null;
  kimchiPremium: number | null;
  surgeCount: number | null;
  fearGreedIndex: number | null;
  fearGreedLabel: string | null;
}

const EMPTY: MarketData = {
  btcKrw: null,
  btcChange24h: null,
  kimchiPremium: null,
  surgeCount: null,
  fearGreedIndex: null,
  fearGreedLabel: null,
};

/* ── Helpers ── */
function getFearGreedStyle(value: number) {
  if (value <= 25) return { color: "text-red-400", label: "극단적 공포" };
  if (value <= 45) return { color: "text-orange-400", label: "공포" };
  if (value <= 55) return { color: "text-zinc-300", label: "중립" };
  if (value <= 75) return { color: "text-emerald-400", label: "탐욕" };
  return { color: "text-emerald-300", label: "극단적 탐욕" };
}

function getKimchiStyle(value: number) {
  if (value >= 5) return "text-red-400 animate-pulse";
  if (value > 0) return "text-amber-300";
  return "text-blue-400";
}

/* ── Component ── */
export function MarketBar() {
  const [data, setData] = useState<MarketData>(EMPTY);

  const fetchData = useCallback(async () => {
    // Primary: /api/market-bar (uses korean_prices table)
    try {
      const res = await fetch("/api/market-bar", {
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.btc?.priceKrw) {
          setData({
            btcKrw: json.btc.priceKrw,
            btcChange24h: json.btc.change24h,
            kimchiPremium: json.btc.kimchiPremium,
            surgeCount: json.surgeCount,
            fearGreedIndex: json.fearGreed?.value ?? null,
            fearGreedLabel: json.fearGreed?.label ?? null,
          });
          return;
        }
      }
    } catch {
      // fall through to fallback
    }

    // Fallback: CoinGecko direct (BTC KRW) + alternative.me (fear & greed)
    try {
      const [btcRes, fgRes] = await Promise.allSettled([
        fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=krw&include_24hr_change=true",
          { signal: AbortSignal.timeout(5_000) }
        ).then((r) => r.json()),
        fetch("https://api.alternative.me/fng/?limit=1", {
          signal: AbortSignal.timeout(5_000),
        }).then((r) => r.json()),
      ]);

      setData((prev) => {
        const next = { ...prev };

        if (btcRes.status === "fulfilled") {
          next.btcKrw = btcRes.value?.bitcoin?.krw ?? null;
          const change = btcRes.value?.bitcoin?.krw_24h_change;
          next.btcChange24h =
            change != null ? Math.round(change * 100) / 100 : null;
        }

        if (fgRes.status === "fulfilled") {
          const entry = fgRes.value?.data?.[0];
          if (entry) {
            next.fearGreedIndex = Number(entry.value) || null;
            next.fearGreedLabel = entry.value_classification ?? null;
          }
        }

        return next;
      });
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const btcFormatted = data.btcKrw
    ? `₿ ${data.btcKrw.toLocaleString("ko-KR")}원`
    : "₿ —";

  const btcChangeStr =
    data.btcChange24h != null
      ? `${data.btcChange24h >= 0 ? "+" : ""}${data.btcChange24h.toFixed(1)}%`
      : "";

  const kimchiStr =
    data.kimchiPremium != null
      ? `${data.kimchiPremium >= 0 ? "+" : ""}${data.kimchiPremium.toFixed(1)}%`
      : "—";

  const surgeStr = data.surgeCount != null ? `${data.surgeCount}건` : "—";

  const fgValue = data.fearGreedIndex;
  const fgStyle = fgValue != null ? getFearGreedStyle(fgValue) : null;

  return (
    <div className="sticky top-0 z-30 h-10 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 shrink-0">
      <div className="flex items-center h-full px-3 md:px-5 gap-4 md:gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        {/* BTC Price */}
        <Link
          href="/kimchi"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
        >
          <span className="font-mono">{btcFormatted}</span>
          {btcChangeStr && (
            <span
              className={cn(
                "font-mono",
                data.btcChange24h != null && data.btcChange24h >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              )}
            >
              ({btcChangeStr})
            </span>
          )}
        </Link>

        <span className="text-zinc-700 shrink-0">│</span>

        {/* Kimchi Premium */}
        <Link
          href="/kimchi"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
        >
          <span>김프</span>
          <span
            className={cn(
              "font-mono",
              data.kimchiPremium != null
                ? getKimchiStyle(data.kimchiPremium)
                : "text-zinc-500"
            )}
          >
            {kimchiStr}
          </span>
        </Link>

        <span className="text-zinc-700 shrink-0">│</span>

        {/* Surge Count */}
        <Link
          href="/surge"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
        >
          <span>🔥 급등</span>
          <span className="font-mono text-amber-300">{surgeStr}</span>
        </Link>

        <span className="text-zinc-700 shrink-0">│</span>

        {/* Fear & Greed */}
        <span className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
          {fgValue != null && fgStyle ? (
            <>
              <span>{fgValue <= 45 ? "😨" : fgValue >= 55 ? "🤑" : "😐"}</span>
              <span className={cn("font-mono", fgStyle.color)}>{fgValue}</span>
              <span className={fgStyle.color}>{fgStyle.label}</span>
            </>
          ) : (
            <>
              <span>😨</span>
              <span className="text-zinc-500">—</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
