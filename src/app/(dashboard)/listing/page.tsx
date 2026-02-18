"use client";

import { useState, memo } from "react";
import {
  Zap,
  ArrowRight,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { ListingDelayGate, ListingCoinName } from "@/components/listing-delay-gate";
import { useListings, type NewListingItem, type ListingFilters } from "@/hooks/use-listings";

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */

const EXCHANGE_OPTIONS = [
  { value: "all" as const, label: "전체" },
  { value: "upbit" as const, label: "업비트" },
  { value: "bithumb" as const, label: "빗썸" },
];

function formatKRW(value: number): string {
  if (value >= 1_000_000) {
    return `${value.toLocaleString("ko-KR")}`;
  }
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function formatVolume(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}조`;
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`;
  if (value >= 10_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  return `${(value / 10_000).toFixed(0)}만`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function exchangeLabel(exchange: string): string {
  return exchange === "upbit" ? "업비트" : exchange === "bithumb" ? "빗썸" : exchange;
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function ListingPage() {
  const [filters, setFilters] = useState<ListingFilters>({ exchange: "all" });
  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useListings(filters);

  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  // Separate latest (within 24h) from history
  const now = Date.now();
  const latest = items.filter(
    (item) => now - new Date(item.detected_at).getTime() < 24 * 60 * 60 * 1000
  );
  const history = items.filter(
    (item) => now - new Date(item.detected_at).getTime() >= 24 * 60 * 60 * 1000
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 space-y-4 max-w-360 w-full mx-auto">
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              상장 알림
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              업비트·빗썸 신규 상장 즉시 감지
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
        <ListingFilterBar filters={filters} onChange={setFilters} total={total} />

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
          </div>
        ) : items.length === 0 ? (
          <ListingEmptyState />
        ) : (
          <div className="space-y-4">
            {/* Latest listings (within 24h) */}
            {latest.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  최신 상장 ({latest.length}건)
                </h2>
                <div className="space-y-2">
                  {latest.map((item) => (
                    <ListingDelayGate
                      key={item.id}
                      listedAt={item.detected_at}
                      coinName={item.coin_name || item.symbol}
                    >
                      <LatestListingCard item={item} />
                    </ListingDelayGate>
                  ))}
                </div>
              </section>
            )}

            {/* History table */}
            {history.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  상장 히스토리
                </h2>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <ListingHistoryTable items={history} />
                </div>
                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {history.map((item) => (
                    <ListingHistoryCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Pro gate placeholder */}
            <ListingGatePlaceholder />
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Filter Bar
   ═══════════════════════════════════════════════ */

function ListingFilterBar({
  filters,
  onChange,
  total,
}: {
  filters: ListingFilters;
  onChange: (f: ListingFilters) => void;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 p-0.5 bg-bg-secondary rounded-lg border border-border-default">
        {EXCHANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ ...filters, exchange: opt.value })}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              filters.exchange === opt.value
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <span className="text-[11px] text-text-disabled ml-auto tabular-nums">
        총 {total}건
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Latest Listing Card (highlighted)
   ═══════════════════════════════════════════════ */

const LatestListingCard = memo(function LatestListingCard({
  item,
}: {
  item: NewListingItem;
}) {
  const priceChange = item.price_change_since_listing;
  const isPositive = priceChange != null && priceChange > 0;
  const isNegative = priceChange != null && priceChange < 0;

  return (
    <div className="bg-bg-secondary border border-amber-500/20 rounded-lg p-4 hover:border-amber-500/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
            NEW
          </span>
          <span className="text-sm font-bold text-text-primary">
            <ListingCoinName name={item.coin_name ? `${item.coin_name} (${item.symbol})` : item.symbol} />
          </span>
        </div>
        <span className="text-[11px] text-text-secondary flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeAgo(item.detected_at)}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
        <ExchangeBadge exchange={item.exchange} />
        <span className="text-text-disabled">│</span>
        <span>{exchangeLabel(item.exchange)}</span>
      </div>

      {/* Price info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <PriceStat label="상장가" value={item.initial_price_krw} suffix="원" />
        <PriceStat label="현재가" value={item.current_price_krw} suffix="원" />
        <div>
          <p className="text-[10px] text-text-disabled mb-0.5">상장 후 변동</p>
          {priceChange != null ? (
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                isPositive && "text-emerald-400",
                isNegative && "text-red-400",
                !isPositive && !isNegative && "text-text-primary"
              )}
            >
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)}%
            </p>
          ) : (
            <p className="text-sm text-text-disabled">—</p>
          )}
        </div>
      </div>

      {/* Cross navigation */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border-default/50">
        <CrossLink href="/surge" label="급등 레이더에서 보기" />
        <CrossLink href="/kimchi" label="김프 확인하기" />
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Desktop History Table
   ═══════════════════════════════════════════════ */

function ListingHistoryTable({ items }: { items: NewListingItem[] }) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_100px_100px_100px_80px] gap-2 px-4 py-2.5 border-b border-border-default text-[11px] text-text-secondary uppercase tracking-wider">
        <span>코인</span>
        <span>거래소</span>
        <span className="text-right">상장가</span>
        <span className="text-right">현재가</span>
        <span className="text-right">변동률</span>
        <span className="text-right">감지일</span>
      </div>

      {/* Rows */}
      {items.map((item) => (
        <ListingHistoryRow key={item.id} item={item} />
      ))}
    </div>
  );
}

const ListingHistoryRow = memo(function ListingHistoryRow({
  item,
}: {
  item: NewListingItem;
}) {
  const priceChange = item.price_change_since_listing;
  const isPositive = priceChange != null && priceChange > 0;
  const isNegative = priceChange != null && priceChange < 0;

  return (
    <div className="grid grid-cols-[1fr_80px_100px_100px_100px_80px] gap-2 px-4 py-3 items-center border-b border-border-default/50 last:border-b-0 hover:bg-white/2 transition-colors">
      {/* Symbol */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-text-primary truncate">
          <ListingCoinName name={item.coin_name ? `${item.coin_name}` : item.symbol} />
        </span>
        <span className="text-[11px] text-text-secondary shrink-0">{item.symbol}</span>
      </div>

      {/* Exchange */}
      <ExchangeBadge exchange={item.exchange} />

      {/* Initial price */}
      <span className="text-xs text-text-secondary tabular-nums text-right">
        {item.initial_price_krw != null
          ? `${formatKRW(item.initial_price_krw)}원`
          : "—"}
      </span>

      {/* Current price */}
      <span className="text-xs text-text-primary tabular-nums text-right">
        {item.current_price_krw != null
          ? `${formatKRW(item.current_price_krw)}원`
          : "—"}
      </span>

      {/* Price change */}
      <span
        className={cn(
          "text-xs font-semibold tabular-nums text-right",
          isPositive && "text-emerald-400",
          isNegative && "text-red-400",
          !isPositive && !isNegative && "text-text-secondary"
        )}
      >
        {priceChange != null
          ? `${isPositive ? "+" : ""}${priceChange.toFixed(2)}%`
          : "—"}
      </span>

      {/* Date */}
      <span className="text-[11px] text-text-secondary tabular-nums text-right">
        {new Date(item.detected_at).toLocaleDateString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
        })}
      </span>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Mobile History Card
   ═══════════════════════════════════════════════ */

const ListingHistoryCard = memo(function ListingHistoryCard({
  item,
}: {
  item: NewListingItem;
}) {
  const priceChange = item.price_change_since_listing;
  const isPositive = priceChange != null && priceChange > 0;
  const isNegative = priceChange != null && priceChange < 0;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            <ListingCoinName name={item.coin_name || item.symbol} />
          </span>
          {item.coin_name && (
            <span className="text-[11px] text-text-secondary">{item.symbol}</span>
          )}
        </div>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            isPositive && "text-emerald-400",
            isNegative && "text-red-400",
            !isPositive && !isNegative && "text-text-secondary"
          )}
        >
          {priceChange != null
            ? `${isPositive ? "+" : ""}${priceChange.toFixed(1)}%`
            : "—"}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ExchangeBadge exchange={item.exchange} />
          <span className="text-text-secondary tabular-nums">
            {item.current_price_krw != null
              ? `${formatKRW(item.current_price_krw)}원`
              : "—"}
          </span>
        </div>
        <span className="text-text-disabled tabular-nums">
          {timeAgo(item.detected_at)}
        </span>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Shared UI
   ═══════════════════════════════════════════════ */

function ExchangeBadge({ exchange }: { exchange: string }) {
  return (
    <span
      className={cn(
        "text-[10px] font-medium px-1.5 py-0.5 rounded",
        exchange === "upbit"
          ? "bg-blue-500/15 text-blue-400"
          : "bg-orange-500/15 text-orange-400"
      )}
    >
      {exchangeLabel(exchange)}
    </span>
  );
}

function PriceStat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-[10px] text-text-disabled mb-0.5">{label}</p>
      <p className="text-sm text-text-primary tabular-nums">
        {value != null ? `${formatKRW(value)}${suffix}` : "—"}
      </p>
    </div>
  );
}

function CrossLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="text-[11px] text-accent-secondary hover:text-accent-secondary/80 flex items-center gap-0.5 transition-colors"
    >
      {label}
      <ArrowRight className="w-3 h-3" />
    </a>
  );
}

/* ═══════════════════════════════════════════════
   Gate Placeholder (for Prompt 7)
   ═══════════════════════════════════════════════ */

function ListingGatePlaceholder() {
  const isPro = useAuthStore((s) => s.isPro);
  if (isPro) return null;

  return (
    <div className="bg-bg-secondary border border-accent-primary/20 rounded-lg p-5 text-center">
      <p className="text-sm font-medium text-text-primary mb-1">
        Free 유저는 상장 알림이 30분 지연됩니다
      </p>
      <p className="text-xs text-text-secondary mb-3">
        Pro 유저는 신규 상장 즉시 확인 + 텔레그램 알림을 받습니다
      </p>
      <a
        href="/billing"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
      >
        <Zap className="w-4 h-4" />
        Pro로 즉시 확인
        <ArrowRight className="w-3 h-3" />
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Empty State
   ═══════════════════════════════════════════════ */

function ListingEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-3">
        <Zap className="w-6 h-6 text-zinc-600" />
      </div>
      <p className="text-sm text-text-secondary">아직 감지된 신규 상장이 없습니다</p>
      <p className="text-xs text-text-disabled mt-1">
        5분마다 업비트·빗썸 상장을 자동 확인합니다
      </p>
    </div>
  );
}
