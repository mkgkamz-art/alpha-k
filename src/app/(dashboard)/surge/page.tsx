"use client";

import { useState, memo } from "react";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
  Lock,
  RefreshCw,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useSurge, type SurgeFilters } from "@/hooks/use-surge";
import { ACCESS_MATRIX } from "@/lib/subscription";
import type { SurgeItem, SurgeLevel } from "@/lib/surge-detector";

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */

const EXCHANGE_OPTIONS = [
  { value: "upbit" as const, label: "업비트" },
  { value: "bithumb" as const, label: "빗썸" },
];

const TYPE_OPTIONS = [
  { value: "all" as const, label: "전체" },
  { value: "pump" as const, label: "급등" },
  { value: "dump" as const, label: "급락" },
];

const LEVEL_CONFIG: Record<SurgeLevel, { label: string; badge: string; row: string }> = {
  extreme: {
    label: "극단적",
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    row: "bg-red-500/5 border-l-2 border-l-red-500",
  },
  very_hot: {
    label: "매우뜨거움",
    badge: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    row: "bg-orange-500/5 border-l-2 border-l-orange-400",
  },
  hot: {
    label: "뜨거움",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    row: "bg-amber-500/5 border-l-2 border-l-amber-400",
  },
};

function formatVolume(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}조`;
  }
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(0)}억`;
  }
  if (value >= 10_000_000) {
    return `${(value / 100_000_000).toFixed(1)}억`;
  }
  return `${(value / 10_000).toFixed(0)}만`;
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function SurgePage() {
  const [filters, setFilters] = useState<SurgeFilters>({
    exchange: "upbit",
    type: "all",
  });

  const isPro = useAuthStore((s) => s.isPro);
  const surgeAccess = isPro ? ACCESS_MATRIX.surge.pro : ACCESS_MATRIX.surge.free;
  const refreshInterval = surgeAccess.refreshInterval;

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useSurge(filters, refreshInterval);

  const allItems = data?.data ?? [];
  const freeLimit = ACCESS_MATRIX.surge.free.maxItems;
  const items = isPro ? allItems : allItems.slice(0, freeLimit);
  const lockedItems = isPro ? [] : allItems.slice(freeLimit);
  const pumpCount = data?.pumpCount ?? 0;
  const dumpCount = data?.dumpCount ?? 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 space-y-4 max-w-360 w-full mx-auto">
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              급등 레이더
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              업비트/빗썸 2시간 기준 급등·급락 코인
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-1.5 rounded-md hover:bg-bg-secondary transition-colors"
              aria-label="새로고침"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
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

        {/* ── Filter Bar ── */}
        <FilterBar filters={filters} onChange={setFilters} refreshInterval={refreshInterval} />

        {/* ── Table ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState type={filters.type} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <SurgeTable items={items} />
            </div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {items.map((item, idx) => (
                <SurgeCardMobile key={`${item.symbol}-${item.exchange}`} item={item} rank={idx + 1} />
              ))}
            </div>

            {/* Locked items — Pro upgrade CTA */}
            {lockedItems.length > 0 && (
              <SurgeUpgradeGate lockedCount={lockedItems.length} />
            )}
          </>
        )}

        {/* ── Stats Bar ── */}
        <SurgeStats pumpCount={pumpCount} dumpCount={dumpCount} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Filter Bar
   ═══════════════════════════════════════════════ */

function FilterBar({
  filters,
  onChange,
  refreshInterval,
}: {
  filters: SurgeFilters;
  onChange: (f: SurgeFilters) => void;
  refreshInterval: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type filter pills */}
      <div className="flex items-center gap-1 p-0.5 bg-bg-secondary rounded-lg border border-border-default">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ ...filters, type: opt.value })}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              filters.type === opt.value
                ? opt.value === "pump"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : opt.value === "dump"
                    ? "bg-red-500/15 text-red-400"
                    : "bg-bg-tertiary text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {opt.value === "pump" && "🔥 "}
            {opt.value === "dump" && "💧 "}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Exchange selector */}
      <select
        value={filters.exchange}
        onChange={(e) =>
          onChange({ ...filters, exchange: e.target.value as SurgeFilters["exchange"] })
        }
        className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-border-active cursor-pointer ml-auto"
      >
        {EXCHANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Auto-refresh indicator */}
      <span className="text-[10px] text-text-disabled">⟳ {refreshInterval / 1000}초 갱신</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Desktop Surge Table
   ═══════════════════════════════════════════════ */

function SurgeTable({ items }: { items: SurgeItem[] }) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_120px_100px_100px_80px] gap-2 px-4 py-2.5 border-b border-border-default text-[11px] text-text-secondary uppercase tracking-wider">
        <span>#</span>
        <span>코인</span>
        <span className="text-right">현재가</span>
        <span className="text-right">2h 변동</span>
        <span className="text-right">거래대금</span>
        <span className="text-right">김프</span>
      </div>

      {/* Rows */}
      {items.map((item, idx) => (
        <SurgeRow
          key={`${item.symbol}-${item.exchange}`}
          item={item}
          rank={idx + 1}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Surge Row (Desktop)
   ═══════════════════════════════════════════════ */

const SurgeRow = memo(function SurgeRow({
  item,
  rank,
}: {
  item: SurgeItem;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = LEVEL_CONFIG[item.level];
  const isPump = item.type === "pump";

  return (
    <div className={cn("border-b border-border-default/50 last:border-b-0", config.row)}>
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full grid grid-cols-[40px_1fr_120px_100px_100px_80px] gap-2 px-4 py-3 items-center text-left hover:bg-white/2 transition-colors"
        aria-expanded={expanded}
      >
        {/* Rank */}
        <span className="text-xs text-text-secondary tabular-nums">{rank}</span>

        {/* Symbol + Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <SurgeBadge level={item.level} />
          <span className="text-sm font-semibold text-text-primary">{item.symbol}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-text-secondary ml-auto shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary ml-auto shrink-0" />
          )}
        </div>

        {/* Price KRW */}
        <span className="text-sm text-text-primary tabular-nums text-right">
          {item.price_krw.toLocaleString("ko-KR")}원
        </span>

        {/* Change 24h */}
        <span
          className={cn(
            "text-sm font-semibold tabular-nums text-right",
            isPump ? "text-emerald-400" : "text-red-400"
          )}
        >
          {isPump ? "+" : ""}
          {item.change_pct.toFixed(1)}%
        </span>

        {/* Volume */}
        <span className="text-xs text-text-secondary tabular-nums text-right">
          {item.volume_24h != null ? formatVolume(item.volume_24h) : "—"}
        </span>

        {/* Kimchi Premium */}
        <span
          className={cn(
            "text-xs tabular-nums text-right",
            item.kimchi_premium != null && item.kimchi_premium > 0
              ? "text-amber-300"
              : item.kimchi_premium != null && item.kimchi_premium < 0
                ? "text-blue-400"
                : "text-text-secondary"
          )}
        >
          {item.kimchi_premium != null
            ? `${item.kimchi_premium >= 0 ? "+" : ""}${item.kimchi_premium.toFixed(1)}%`
            : "—"}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && <SurgeExpandedRow item={item} />}
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Surge Badge
   ═══════════════════════════════════════════════ */

function SurgeBadge({ level }: { level: SurgeLevel }) {
  const config = LEVEL_CONFIG[level];
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0",
        config.badge,
        level === "extreme" && "animate-pulse"
      )}
    >
      {level === "extreme" ? "🔴" : level === "very_hot" ? "🟠" : "🟡"}
    </span>
  );
}

/* ═══════════════════════════════════════════════
   Expanded Row — Cross-navigation Widgets
   ═══════════════════════════════════════════════ */

function SurgeExpandedRow({ item }: { item: SurgeItem }) {
  return (
    <div className="px-4 pb-4 pt-2 border-t border-border-default/30">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Kimchi Widget */}
        <CrossWidget
          title="김치프리미엄"
          href="/kimchi"
          icon="🇰🇷"
        >
          {item.kimchi_premium != null ? (
            <div className="space-y-1">
              <p
                className={cn(
                  "text-lg font-bold tabular-nums",
                  item.kimchi_premium > 0 ? "text-amber-300" : "text-blue-400"
                )}
              >
                {item.kimchi_premium >= 0 ? "+" : ""}
                {item.kimchi_premium.toFixed(2)}%
              </p>
              <p className="text-[11px] text-text-secondary">
                KRW {item.price_krw.toLocaleString("ko-KR")}원
              </p>
              {item.price_usd != null && (
                <p className="text-[11px] text-text-secondary">
                  USD ${item.price_usd.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-text-disabled">데이터 없음</p>
          )}
        </CrossWidget>

        {/* Whale Widget */}
        <CrossWidget
          title="고래 이동"
          href="/whale"
          icon="🐋"
        >
          <p className="text-xs text-text-secondary">
            {item.symbol} 관련 대규모 이동 내역
          </p>
          <p className="text-[11px] text-text-disabled mt-1">
            고래 추적 페이지에서 확인
          </p>
        </CrossWidget>

        {/* Signal Widget */}
        <CrossWidget
          title="기술 시그널"
          href="/signals"
          icon="📊"
        >
          <p className="text-xs text-text-secondary">
            {item.symbol} 매매 시그널 분석
          </p>
          <p className="text-[11px] text-text-disabled mt-1">
            시그널 페이지에서 확인
          </p>
        </CrossWidget>
      </div>
    </div>
  );
}

function CrossWidget({
  title,
  href,
  icon,
  children,
}: {
  title: string;
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-tertiary rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-text-secondary font-medium flex items-center gap-1">
          <span>{icon}</span>
          {title}
        </span>
        <a
          href={href}
          className="text-[10px] text-accent-secondary hover:text-accent-secondary/80 flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          자세히 <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Mobile Card
   ═══════════════════════════════════════════════ */

const SurgeCardMobile = memo(function SurgeCardMobile({
  item,
  rank,
}: {
  item: SurgeItem;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = LEVEL_CONFIG[item.level];
  const isPump = item.type === "pump";

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border-default rounded-lg overflow-hidden",
        config.row
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full p-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary tabular-nums w-5">{rank}</span>
            <SurgeBadge level={item.level} />
            <span className="text-sm font-semibold text-text-primary">{item.symbol}</span>
          </div>
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              isPump ? "text-emerald-400" : "text-red-400"
            )}
          >
            {isPump ? "+" : ""}
            {item.change_pct.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-text-primary tabular-nums">
            {item.price_krw.toLocaleString("ko-KR")}원
          </span>
          <div className="flex items-center gap-3">
            {item.volume_24h != null && (
              <span className="text-text-secondary tabular-nums">
                {formatVolume(item.volume_24h)}
              </span>
            )}
            {item.kimchi_premium != null && (
              <span
                className={cn(
                  "tabular-nums",
                  item.kimchi_premium > 0 ? "text-amber-300" : "text-blue-400"
                )}
              >
                김프 {item.kimchi_premium >= 0 ? "+" : ""}
                {item.kimchi_premium.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center mt-1">
          {expanded ? (
            <ChevronUp className="w-3 h-3 text-text-secondary" />
          ) : (
            <ChevronDown className="w-3 h-3 text-text-secondary" />
          )}
        </div>
      </button>

      {expanded && <SurgeExpandedRow item={item} />}
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Stats Bar
   ═══════════════════════════════════════════════ */

function SurgeStats({
  pumpCount,
  dumpCount,
}: {
  pumpCount: number;
  dumpCount: number;
}) {
  return (
    <div className="flex items-center justify-center gap-6 py-3 border-t border-border-default text-xs text-text-secondary">
      <span className="flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        급등 <span className="font-semibold text-emerald-400 tabular-nums">{pumpCount}건</span>
      </span>
      <span className="text-zinc-700">│</span>
      <span className="flex items-center gap-1.5">
        <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        급락 <span className="font-semibold text-red-400 tabular-nums">{dumpCount}건</span>
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Free User Upgrade Gate
   ═══════════════════════════════════════════════ */

function SurgeUpgradeGate({ lockedCount }: { lockedCount: number }) {
  return (
    <div className="relative">
      {/* Blurred preview rows */}
      <div className="blur-sm select-none pointer-events-none opacity-50" aria-hidden>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3">
          {Array.from({ length: Math.min(lockedCount, 3) }).map((_, i) => (
            <div key={i} className="h-10 bg-bg-tertiary rounded-md" />
          ))}
        </div>
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary/10">
            <Lock className="w-5 h-5 text-accent-primary" />
          </div>
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{lockedCount}개</span> 추가 급등·급락 코인이 있습니다
          </p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Pro로 전체 보기
          </Link>
          <p className="text-[11px] text-text-disabled">
            Pro 유저는 10초 갱신 + 전체 코인 확인 가능
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Empty State
   ═══════════════════════════════════════════════ */

function EmptyState({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-3">
        <Flame className="w-6 h-6 text-zinc-600" />
      </div>
      <p className="text-sm text-text-secondary">
        {type === "pump"
          ? "현재 급등 코인이 없습니다"
          : type === "dump"
            ? "현재 급락 코인이 없습니다"
            : "현재 급등·급락 코인이 없습니다"}
      </p>
      <p className="text-xs text-text-disabled mt-1">
        ±5% 이상 변동 시 자동 감지됩니다
      </p>
    </div>
  );
}
