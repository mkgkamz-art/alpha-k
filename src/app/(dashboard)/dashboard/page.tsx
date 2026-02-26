"use client";

import { useRef, useEffect, memo, useMemo } from "react";
import Link from "next/link";
import {
  Radio,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  RefreshCw,
  Lock,
  Eye,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useContextAlerts, type ContextAlertRow } from "@/hooks/use-context-alerts";
import { useDailySummary } from "@/hooks/use-daily-summary";
import { useSurge } from "@/hooks/use-surge";
import { useKimchiPremium } from "@/hooks/use-kimchi";
import { useWhaleFeed, useWhaleStats, type WhaleFilters } from "@/hooks/use-whale-feed";
import { useSignalDashboard, type EnrichedSignal } from "@/hooks/use-signal-dashboard";
import { useRiskDashboard } from "@/hooks/use-risk";
import { useUnlockDashboard } from "@/hooks/use-unlock-dashboard";
import { useAuthStore } from "@/stores/auth-store";
import type { WhaleEventRow } from "@/hooks/use-alerts";

/* ═══════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════ */

const SEVERITY_STYLES = {
  critical: {
    border: "border-l-2 border-l-red-500",
    bg: "bg-red-500/5",
    badge: "bg-red-500/20 text-red-400",
    label: "CRITICAL",
  },
  warning: {
    border: "border-l-2 border-l-orange-500",
    bg: "bg-orange-500/5",
    badge: "bg-orange-500/20 text-orange-400",
    label: "WARNING",
  },
  info: {
    border: "border-l-2 border-l-blue-500",
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/20 text-blue-400",
    label: "INFO",
  },
} as const;

const TYPE_ICONS: Record<string, string> = {
  surge: "🔥",
  dump: "💧",
  kimchi: "🇰🇷",
  listing: "⚡",
  whale: "🐋",
  signal: "📊",
  unlock: "🔓",
  liquidity: "💧",
};

function timeAgoKR(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function formatKRW(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000_000)
    return `${sign}₩${(abs / 1_000_000_000_000).toFixed(1)}조`;
  if (abs >= 100_000_000)
    return `${sign}₩${Math.round(abs / 100_000_000).toLocaleString()}억`;
  if (abs >= 10_000)
    return `${sign}₩${Math.round(abs / 10_000).toLocaleString()}만`;
  return `${sign}₩${Math.round(abs).toLocaleString("ko-KR")}`;
}

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

const DEFAULT_WHALE_FILTERS: WhaleFilters = {
  blockchain: "all",
  minAmount: 0,
  eventType: "all",
  period: "24h",
};

/* ── Unified Feed Item ── */

type FeedItem =
  | { kind: "alert"; data: ContextAlertRow; ts: number }
  | { kind: "whale"; data: WhaleEventRow; ts: number }
  | { kind: "signal"; data: EnrichedSignal; ts: number };

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function DashboardPage() {
  const {
    data: alertsPages,
    isLoading: alertsLoading,
    refetch,
    isFetching,
    dataUpdatedAt,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useContextAlerts({ limit: 20 });
  const { data: summary, isLoading: summaryLoading } = useDailySummary();
  const { data: surgeData } = useSurge({ exchange: "upbit", type: "all" }, 15_000);
  const { data: kimchiData } = useKimchiPremium("premium_desc", 30_000);
  const { data: whaleStats } = useWhaleStats(DEFAULT_WHALE_FILTERS);
  const whaleFeed = useWhaleFeed(DEFAULT_WHALE_FILTERS);
  const { data: signalData } = useSignalDashboard({
    timeframe: "all",
    type: "all",
    search: "",
  });
  const { data: riskData } = useRiskDashboard({
    search: "",
    category: "all",
    chain: "all",
    sort: "tvl",
    order: "desc",
  });
  const { data: unlockData } = useUnlockDashboard();

  // Flatten context alerts
  const allAlerts = useMemo(() => {
    if (!alertsPages?.pages) return [];
    return alertsPages.pages.flatMap((page) => page.data);
  }, [alertsPages]);

  const surgeItems = surgeData?.data?.slice(0, 10) ?? [];

  // Deduplicate context alerts by title
  const dedupedAlerts = useMemo(() => {
    const seen = new Set<string>();
    return allAlerts.filter((a) => {
      if (seen.has(a.what_title)) return false;
      seen.add(a.what_title);
      return true;
    });
  }, [allAlerts]);

  // Whale events from feed (first page, latest 10)
  const whaleEvents = useMemo(() => {
    if (!whaleFeed.data?.pages) return [];
    return whaleFeed.data.pages.flatMap((p) => p.events).slice(0, 10);
  }, [whaleFeed.data]);

  // Signals (latest 10)
  const recentSignals = useMemo(
    () => signalData?.signals?.slice(0, 10) ?? [],
    [signalData],
  );

  // Unified feed: merge all items sorted by timestamp desc
  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];

    for (const a of dedupedAlerts) {
      items.push({ kind: "alert", data: a, ts: new Date(a.created_at).getTime() });
    }
    for (const w of whaleEvents) {
      items.push({ kind: "whale", data: w, ts: new Date(w.detected_at).getTime() });
    }
    for (const s of recentSignals) {
      items.push({ kind: "signal", data: s, ts: new Date(s.created_at).getTime() });
    }

    return items.sort((a, b) => b.ts - a.ts);
  }, [dedupedAlerts, whaleEvents, recentSignals]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /* ── Build data attachment per alert type ── */
  function getAttachment(alert: ContextAlertRow): React.ReactNode {
    const symbol = alert.symbol?.toUpperCase() ?? "";
    const items: { label: string; value: string; color?: string }[] = [];

    switch (alert.alert_type) {
      case "surge":
      case "dump": {
        const si = surgeData?.data?.find((s) => s.symbol === symbol);
        const ki =
          kimchiData?.data?.filter((k) => k.symbol === symbol) ?? [];
        if (si) {
          items.push(
            {
              label: "거래소",
              value: (si.exchange ?? "—").toUpperCase(),
            },
            {
              label: "2h 변동",
              value: `${si.change_pct >= 0 ? "+" : ""}${si.change_pct.toFixed(1)}%`,
              color:
                si.change_pct >= 0
                  ? "text-signal-success"
                  : "text-signal-danger",
            },
          );
          if (si.price_krw)
            items.push({ label: "KRW 가격", value: formatKRW(si.price_krw) });
          if (si.volume_24h)
            items.push({ label: "거래량", value: formatKRW(si.volume_24h) });
        }
        for (const k of ki.slice(0, 2)) {
          items.push(
            { label: `${k.exchange} 가격`, value: formatKRW(k.price_krw) },
            {
              label: `${k.exchange} 김프`,
              value: `${k.kimchi_premium >= 0 ? "+" : ""}${k.kimchi_premium.toFixed(1)}%`,
              color:
                k.kimchi_premium >= 3
                  ? "text-signal-danger"
                  : k.kimchi_premium >= 1
                    ? "text-signal-warning"
                    : "text-signal-success",
            },
          );
        }
        break;
      }

      case "kimchi": {
        const ki =
          kimchiData?.data?.filter((k) => k.symbol === symbol) ?? [];
        if (kimchiData?.usdKrwRate) {
          items.push({
            label: "환율",
            value: `₩${Math.round(kimchiData.usdKrwRate).toLocaleString("ko-KR")}`,
          });
        }
        for (const k of ki.slice(0, 3)) {
          items.push(
            { label: `${k.exchange} 가격`, value: formatKRW(k.price_krw) },
            {
              label: `${k.exchange} 김프`,
              value: `${k.kimchi_premium >= 0 ? "+" : ""}${k.kimchi_premium.toFixed(1)}%`,
              color:
                k.kimchi_premium >= 3
                  ? "text-signal-danger"
                  : k.kimchi_premium >= 1
                    ? "text-signal-warning"
                    : "text-signal-success",
            },
          );
        }
        break;
      }

      case "signal": {
        const sigs =
          signalData?.signals
            ?.filter((s) => s.token_symbol === symbol)
            ?.slice(0, 3) ?? [];
        for (const s of sigs) {
          const typeLabel =
            s.signal_type === "buy"
              ? "BUY"
              : s.signal_type === "sell"
                ? "SELL"
                : "ALERT";
          const typeColor =
            s.signal_type === "buy"
              ? "text-signal-success"
              : s.signal_type === "sell"
                ? "text-signal-danger"
                : "text-signal-warning";
          items.push(
            { label: s.signal_name, value: typeLabel, color: typeColor },
            {
              label: "신뢰도",
              value: `${s.confidence}%`,
              color:
                s.confidence >= 80
                  ? "text-signal-success"
                  : s.confidence >= 60
                    ? "text-signal-warning"
                    : "text-signal-danger",
            },
          );
        }
        break;
      }

      case "whale": {
        if (whaleStats) {
          items.push(
            { label: "24h 건수", value: `${whaleStats.summary.totalCount}건` },
            {
              label: "유입",
              value: `$${formatNumber(whaleStats.flow.inflow, 1)}`,
              color: "text-signal-success",
            },
            {
              label: "유출",
              value: `$${formatNumber(whaleStats.flow.outflow, 1)}`,
              color: "text-signal-danger",
            },
            {
              label: "순이동",
              value: `${whaleStats.flow.netFlow >= 0 ? "+" : ""}$${formatNumber(Math.abs(whaleStats.flow.netFlow), 1)}`,
              color:
                whaleStats.flow.netFlow >= 0
                  ? "text-signal-success"
                  : "text-signal-danger",
            },
          );
        }
        break;
      }

      case "unlock": {
        const u = unlockData?.unlocks?.find(
          (u) => u.token_symbol === symbol,
        );
        if (u) {
          items.push(
            {
              label: "해제일",
              value:
                u.daysUntil === 0
                  ? "오늘"
                  : u.daysUntil === 1
                    ? "내일"
                    : `D-${u.daysUntil}`,
            },
            {
              label: "가치",
              value: `$${formatNumber(u.usd_value_estimate, 1)}`,
            },
            { label: "공급량", value: `${u.percent_of_supply.toFixed(1)}%` },
            {
              label: "영향도",
              value: `${u.impact_score}/10`,
              color:
                u.impact_score >= 8
                  ? "text-signal-danger"
                  : u.impact_score >= 5
                    ? "text-signal-warning"
                    : "text-signal-success",
            },
          );
        }
        break;
      }

      default: {
        const protocol = riskData?.protocols?.find(
          (p) =>
            p.protocol_name?.toUpperCase() === symbol ||
            p.protocol_name?.toUpperCase().includes(symbol),
        );
        if (protocol) {
          items.push(
            { label: "TVL", value: `$${formatNumber(protocol.tvl, 1)}` },
            {
              label: "24h 변동",
              value: `${protocol.tvl_change_24h >= 0 ? "+" : ""}${protocol.tvl_change_24h.toFixed(1)}%`,
              color:
                protocol.tvl_change_24h >= 0
                  ? "text-signal-success"
                  : "text-signal-danger",
            },
          );
          if (protocol.category)
            items.push({ label: "카테고리", value: protocol.category });
        }
        break;
      }
    }

    if (items.length === 0) return null;
    return <DataAttachment items={items} />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 space-y-4 max-w-360 w-full mx-auto">
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              라이브 피드
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              실시간 시장 인텔리전스
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-1.5 rounded-md hover:bg-bg-secondary transition-colors"
              aria-label="새로고침"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isFetching && "animate-spin")}
              />
            </button>
            {dataUpdatedAt > 0 && (
              <span className="tabular-nums">
                {new Date(dataUpdatedAt).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        {/* ── Surge Mini Ticker ── */}
        {surgeItems.length > 0 && <SurgeMiniTicker items={surgeItems} />}

        {/* ── Daily Summary ── */}
        <DailySummaryCard summary={summary ?? null} loading={summaryLoading} />

        {/* ── Unified Live Feed ── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Live Feed
            </h2>
            <Link
              href="/alerts"
              className="text-[10px] text-accent-secondary hover:text-accent-secondary/80 flex items-center gap-0.5"
            >
              전체보기
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {alertsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
            </div>
          ) : feedItems.length === 0 ? (
            <div className="text-center py-12 text-sm text-text-disabled">
              아직 피드가 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {feedItems.map((item) => {
                switch (item.kind) {
                  case "alert":
                    return (
                      <ContextAlertCard
                        key={`a-${item.data.id}`}
                        alert={item.data}
                        attachment={getAttachment(item.data)}
                      />
                    );
                  case "whale":
                    return (
                      <WhaleEventCard
                        key={`w-${item.data.id}`}
                        event={item.data}
                      />
                    );
                  case "signal":
                    return (
                      <SignalFeedCard
                        key={`s-${item.data.id}`}
                        signal={item.data}
                      />
                    );
                }
              })}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />

              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
                  <span className="ml-2 text-xs text-text-secondary">
                    더 불러오는 중...
                  </span>
                </div>
              )}

              {!hasNextPage && feedItems.length >= 20 && (
                <p className="text-center text-xs text-text-disabled py-4">
                  모든 피드를 불러왔습니다
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Surge Mini Ticker
   ═══════════════════════════════════════════════ */

interface MiniTickerItem {
  symbol: string;
  change_pct: number;
  type: "pump" | "dump";
}

function SurgeMiniTicker({ items }: { items: MiniTickerItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4"
      >
        <span className="shrink-0 text-[10px] text-text-disabled uppercase tracking-wider mr-1">
          실시간
        </span>
        {items.map((item) => {
          const isPump = item.type === "pump";
          return (
            <Link
              key={item.symbol}
              href="/surge"
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                "bg-bg-secondary border border-border-default hover:border-border-active"
              )}
            >
              <span className="text-[10px]">{isPump ? "🔥" : "💧"}</span>
              <span className="text-text-primary font-semibold">
                {item.symbol}
              </span>
              <span
                className={cn(
                  "tabular-nums font-bold",
                  isPump ? "text-emerald-400" : "text-red-400"
                )}
              >
                {isPump ? "+" : ""}
                {item.change_pct.toFixed(1)}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Daily Summary Card
   ═══════════════════════════════════════════════ */

function DailySummaryCard({
  summary,
  loading,
}: {
  summary: {
    surgeCount: number;
    dumpCount: number;
    avgKimchi: number;
    listingCount: number;
    whaleCount: number;
    fearGreed: { value: number | null; label: string } | null;
  } | null;
  loading: boolean;
}) {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });

  if (loading) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse">
        <div className="h-4 w-40 bg-bg-tertiary rounded mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-bg-tertiary rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <p className="text-[11px] text-text-disabled mb-2">{today} 시장 요약</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <SummaryItem
          icon={<TrendingUp className="w-3 h-3 text-emerald-400" />}
          label="급등"
          value={`${summary?.surgeCount ?? 0}건`}
          href="/surge"
          color="text-emerald-400"
        />
        <SummaryItem
          icon={<TrendingDown className="w-3 h-3 text-red-400" />}
          label="급락"
          value={`${summary?.dumpCount ?? 0}건`}
          href="/surge"
          color="text-red-400"
        />
        <SummaryItem
          icon={<span className="text-[10px]">🇰🇷</span>}
          label="김프"
          value={`${(summary?.avgKimchi ?? 0).toFixed(1)}%`}
          href="/kimchi"
          color={
            (summary?.avgKimchi ?? 0) >= 3
              ? "text-amber-300"
              : "text-text-primary"
          }
        />
        <SummaryItem
          icon={<Zap className="w-3 h-3 text-amber-400" />}
          label="상장"
          value={`${summary?.listingCount ?? 0}건`}
          href="/listing"
          color="text-amber-400"
        />
        <SummaryItem
          icon={<span className="text-[10px]">🐋</span>}
          label="고래"
          value={`${summary?.whaleCount ?? 0}건`}
          href="/whale"
          color="text-blue-400"
        />
        <SummaryItem
          label="공포탐욕"
          value={
            summary?.fearGreed?.value != null
              ? `${summary.fearGreed.value}`
              : "—"
          }
          subValue={summary?.fearGreed?.label ?? ""}
          color={getFearGreedColor(summary?.fearGreed?.value ?? null)}
        />
      </div>
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
  subValue,
  href,
  color = "text-text-primary",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  href?: string;
  color?: string;
}) {
  const content = (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
        <span className="text-[10px] text-text-disabled">{label}</span>
      </div>
      <p className={cn("text-sm font-bold tabular-nums", color)}>{value}</p>
      {subValue && (
        <p className="text-[9px] text-text-disabled">{subValue}</p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="hover:bg-bg-tertiary rounded-md p-1 transition-colors"
      >
        {content}
      </Link>
    );
  }
  return <div className="p-1">{content}</div>;
}

function getFearGreedColor(value: number | null): string {
  if (value == null) return "text-text-secondary";
  if (value <= 25) return "text-red-400";
  if (value <= 45) return "text-orange-400";
  if (value <= 55) return "text-text-primary";
  if (value <= 75) return "text-emerald-400";
  return "text-emerald-300";
}

/* ═══════════════════════════════════════════════
   Data Attachment (inline data panel for alerts)
   ═══════════════════════════════════════════════ */

function DataAttachment({
  items,
}: {
  items: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="mt-3 pt-3 border-t border-border-default/50">
      <p className="text-[10px] text-text-disabled uppercase tracking-wider mb-2">
        연관 데이터
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-baseline justify-between gap-2"
          >
            <span className="text-[10px] text-text-disabled shrink-0">
              {item.label}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium tabular-nums",
                item.color ?? "text-text-primary",
              )}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Context Alert Card
   ═══════════════════════════════════════════════ */

const ContextAlertCard = memo(function ContextAlertCard({
  alert,
  attachment,
}: {
  alert: ContextAlertRow;
  attachment?: React.ReactNode;
}) {
  const isPro = useAuthStore((s) => s.isPro);
  const severity = alert.severity as keyof typeof SEVERITY_STYLES;
  const style = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info;
  const icon = TYPE_ICONS[alert.alert_type] ?? "📌";

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border-default rounded-lg overflow-hidden",
        style.border,
        style.bg
      )}
    >
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                style.badge
              )}
            >
              {style.label}
            </span>
            {alert.symbol && (
              <span className="text-[11px] text-text-secondary font-medium">
                {alert.symbol}
              </span>
            )}
          </div>
          <span className="text-[10px] text-text-disabled tabular-nums">
            {timeAgoKR(alert.created_at)}
          </span>
        </div>

        {/* WHAT — always visible */}
        <div className="mb-2">
          <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <span>{icon}</span>
            {alert.what_title}
          </p>
          {alert.what_description && (
            <p className="text-xs text-text-secondary mt-1">
              {alert.what_description}
            </p>
          )}
        </div>

        {/* WHY — Pro only or blur */}
        {alert.why_analysis && (
          <div className="mb-2">
            <p className="text-[10px] text-text-disabled uppercase tracking-wider mb-0.5">
              WHY
            </p>
            {isPro ? (
              <p className="text-xs text-text-secondary">
                {alert.why_analysis}
              </p>
            ) : (
              <ProBlurSection text={alert.why_analysis} />
            )}
          </div>
        )}

        {/* ACTION — Pro only or blur */}
        {alert.action_suggestion && (
          <div className="mb-2">
            <p className="text-[10px] text-text-disabled uppercase tracking-wider mb-0.5">
              ACTION
            </p>
            {isPro ? (
              <p className="text-xs text-text-secondary">
                {alert.action_suggestion}
              </p>
            ) : (
              <ProBlurSection text={alert.action_suggestion} />
            )}
          </div>
        )}

        {/* Data attachment */}
        {attachment}

        {/* Cross link */}
        {alert.related_page && (
          <Link
            href={alert.related_page}
            className="inline-flex items-center gap-1 text-[11px] text-accent-secondary hover:text-accent-secondary/80 transition-colors mt-1"
          >
            자세히 보기
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Whale Event Card (compact feed card)
   ═══════════════════════════════════════════════ */

const BLOCKCHAIN_BADGE: Record<string, { label: string; color: string }> = {
  bitcoin: { label: "BTC", color: "bg-amber-500/20 text-amber-400" },
  ethereum: { label: "ETH", color: "bg-indigo-500/20 text-indigo-400" },
  ripple: { label: "XRP", color: "bg-sky-500/20 text-sky-400" },
  tron: { label: "TRX", color: "bg-red-500/20 text-red-400" },
};

const WhaleEventCard = memo(function WhaleEventCard({
  event,
}: {
  event: WhaleEventRow;
}) {
  const chain = BLOCKCHAIN_BADGE[event.blockchain.toLowerCase()] ?? {
    label: event.blockchain.slice(0, 3).toUpperCase(),
    color: "bg-zinc-500/20 text-zinc-400",
  };

  const isToExchange = /exchange|upbit|bithumb|binance|coinbase|bybit|okx|bitget|kucoin/i.test(
    event.to_label,
  );
  const isFromExchange = /exchange|upbit|bithumb|binance|coinbase|bybit|okx|bitget|kucoin/i.test(
    event.from_label,
  );

  let severity: "warning" | "info" = "info";
  if (event.usd_value >= 1_000_000) severity = "warning";

  return (
    <Link
      href="/whale"
      className={cn(
        "block bg-bg-secondary border border-border-default rounded-lg overflow-hidden hover:border-border-active transition-colors",
        "border-l-2 border-l-blue-500/60",
      )}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                chain.color,
              )}
            >
              {chain.label}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
              WHALE
            </span>
          </div>
          <span className="text-[10px] text-text-disabled tabular-nums">
            {timeAgoKR(event.detected_at)}
          </span>
        </div>

        <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <span>🐋</span>
          {event.amount.toLocaleString()} {event.symbol} transferred
        </p>

        <div className="flex items-center gap-1.5 mt-1.5 text-xs">
          <span className={cn(
            "font-medium",
            isFromExchange ? "text-amber-400" : "text-text-secondary",
          )}>
            [{event.from_label || "Unknown"}]
          </span>
          <span className="text-text-disabled">→</span>
          <span className={cn(
            "font-medium",
            isToExchange ? "text-red-400" : "text-text-secondary",
          )}>
            [{event.to_label || "Unknown"}]
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-[11px] text-text-disabled">
          <span className="font-semibold text-text-secondary tabular-nums">
            {formatUSD(event.usd_value)}
          </span>
          <span>{event.blockchain}</span>
        </div>
      </div>
    </Link>
  );
});

/* ═══════════════════════════════════════════════
   Signal Feed Card (compact feed card)
   ═══════════════════════════════════════════════ */

const SIGNAL_TYPE_CONFIG = {
  buy: { label: "BUY", color: "bg-emerald-500/20 text-emerald-400", border: "border-l-emerald-500" },
  sell: { label: "SELL", color: "bg-red-500/20 text-red-400", border: "border-l-red-500" },
  alert: { label: "ALERT", color: "bg-amber-500/20 text-amber-300", border: "border-l-amber-500" },
} as const;

const SignalFeedCard = memo(function SignalFeedCard({
  signal,
}: {
  signal: EnrichedSignal;
}) {
  const config = SIGNAL_TYPE_CONFIG[signal.signal_type] ?? SIGNAL_TYPE_CONFIG.alert;
  const pnl = signal.priceChange;

  return (
    <Link
      href="/signals"
      className={cn(
        "block bg-bg-secondary border border-border-default rounded-lg overflow-hidden hover:border-border-active transition-colors",
        "border-l-2",
        config.border,
      )}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                config.color,
              )}
            >
              {config.label}
            </span>
            <span className="text-[11px] text-text-secondary font-medium">
              {signal.token_symbol}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Confidence bar */}
            <div className="flex items-center gap-1">
              <div className="w-12 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    signal.confidence >= 80
                      ? "bg-signal-success"
                      : signal.confidence >= 60
                        ? "bg-signal-warning"
                        : "bg-signal-danger",
                  )}
                  style={{ width: `${signal.confidence}%` }}
                />
              </div>
              <span className="text-[10px] text-text-disabled tabular-nums">
                {signal.confidence}%
              </span>
            </div>
            <span className="text-[10px] text-text-disabled tabular-nums">
              {timeAgoKR(signal.created_at)}
            </span>
          </div>
        </div>

        <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <span>📊</span>
          {signal.token_name} — {signal.signal_name}
        </p>

        {signal.description && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-1">
            {signal.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-2 text-[11px]">
          <span className="text-text-disabled">
            시그널가 <span className="text-text-secondary tabular-nums">${signal.price_at_signal.toFixed(signal.price_at_signal >= 1 ? 2 : 4)}</span>
          </span>
          {signal.currentPrice != null && (
            <span className="text-text-disabled">
              현재가 <span className="text-text-secondary tabular-nums">${signal.currentPrice.toFixed(signal.currentPrice >= 1 ? 2 : 4)}</span>
            </span>
          )}
          {pnl != null && (
            <span
              className={cn(
                "font-semibold tabular-nums",
                pnl >= 0 ? "text-signal-success" : "text-signal-danger",
              )}
            >
              {pnl >= 0 ? "+" : ""}
              {pnl.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

/* Pro blur overlay for WHY / ACTION sections */
function ProBlurSection({ text }: { text: string }) {
  return (
    <div className="relative">
      <p className="text-xs text-text-secondary blur-sm select-none pointer-events-none">
        {text}
      </p>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link
          href="/billing"
          className="flex items-center gap-1.5 bg-amber-500/90 text-black px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-amber-400 transition-colors"
        >
          <Lock className="w-3 h-3" />
          Pro에서 분석 보기
        </Link>
      </div>
    </div>
  );
}
