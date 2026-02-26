"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
  useMemo,
} from "react";
import {
  Fish,
  Flame,
  Heart,
  Loader2,
  Lock,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
} from "@/components/ui/tabs";
import {
  useWhaleRanking,
  useWhaleTrades,
  useWhaleHotCoins,
  useFollowWhale,
  useUnfollowWhale,
  type WhaleRankingFilters,
  type WhaleTradeFilters,
} from "@/hooks/use-whale-tracker";
import type { WhaleRankingItem, SerializedTrade, SerializedHotCoin } from "@/lib/whale-api";

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */

const SORT_OPTIONS = [
  { value: "return_30d", label: "30일 수익률" },
  { value: "return_7d", label: "7일 수익률" },
  { value: "return_90d", label: "90일 수익률" },
  { value: "win_rate", label: "승률" },
  { value: "followers", label: "팔로워" },
] as const;

const TIER_PILLS = [
  { value: "", label: "전체" },
  { value: "s", label: "S" },
  { value: "a", label: "A" },
  { value: "b", label: "B" },
  { value: "c", label: "C" },
];

const MIN_AMOUNT_OPTIONS = [
  { value: "0", label: "전체" },
  { value: "10000", label: "$10K+" },
  { value: "100000", label: "$100K+" },
  { value: "500000", label: "$500K+" },
  { value: "1000000", label: "$1M+" },
];

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  A: { bg: "bg-zinc-400/15", text: "text-zinc-300", border: "border-zinc-400/30" },
  B: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  C: { bg: "bg-zinc-600/15", text: "text-zinc-500", border: "border-zinc-600/30" },
};

const SIGNAL_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  strong_buy: { label: "강한 매수", bg: "bg-signal-success/15", text: "text-signal-success" },
  buy: { label: "매수", bg: "bg-signal-success/10", text: "text-signal-success/80" },
  neutral: { label: "혼조", bg: "bg-bg-tertiary", text: "text-text-secondary" },
  sell: { label: "매도", bg: "bg-signal-danger/10", text: "text-signal-danger/80" },
  strong_sell: { label: "강한 매도", bg: "bg-signal-danger/15", text: "text-signal-danger" },
};

function timeAgoKR(dateOrMinutes: string | number): string {
  const mins =
    typeof dateOrMinutes === "number"
      ? dateOrMinutes
      : Math.floor((Date.now() - new Date(dateOrMinutes).getTime()) / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function TierBadge({ tier }: { tier: string }) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES.C;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold border",
        style.bg,
        style.text,
        style.border,
      )}
    >
      {tier}
    </span>
  );
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function WhalePage() {
  const [showHotCoins, setShowHotCoins] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 max-w-4xl w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-text-primary">고래 트래커</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowHotCoins(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-signal-danger/10 text-signal-danger hover:bg-signal-danger/20 transition-colors"
          >
            <Flame className="w-3.5 h-3.5" />
            핫코인
          </button>
        </div>

        {/* Sub-tabs */}
        <Tabs defaultValue="ranking">
          <TabList>
            <TabTrigger value="ranking">랭킹</TabTrigger>
            <TabTrigger value="feed">매매 피드</TabTrigger>
            <TabTrigger value="following">내 팔로잉</TabTrigger>
          </TabList>
          <TabContent value="ranking">
            <RankingSection />
          </TabContent>
          <TabContent value="feed">
            <TradeFeedSection />
          </TabContent>
          <TabContent value="following">
            <FollowingSection />
          </TabContent>
        </Tabs>
      </div>

      {/* Hot Coin Bottom Sheet */}
      <HotCoinSheet open={showHotCoins} onClose={() => setShowHotCoins(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Ranking Section
   ═══════════════════════════════════════════════ */

function RankingSection() {
  const [sort, setSort] = useState<WhaleRankingFilters["sort"]>("return_30d");
  const [tierFilter, setTierFilter] = useState("");
  const isPro = useAuthStore((s) => s.isPro);

  const filters: WhaleRankingFilters = {
    sort,
    tier: tierFilter || undefined,
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useWhaleRanking(filters);

  const allWhales = useMemo(
    () => data?.pages.flatMap((p) => p.whales) ?? [],
    [data],
  );
  const followedIds = useMemo(
    () => new Set(data?.pages.flatMap((p) => p.followed_ids) ?? []),
    [data],
  );

  // Free tier: show first 3, then lock
  const freeLimit = data?.pages[0]?.meta.free_limit ?? 3;
  const accessibleWhales = isPro ? allWhales : allWhales.slice(0, freeLimit);
  const lockedCount = isPro ? 0 : Math.max(0, allWhales.length - freeLimit);

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

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value as WhaleRankingFilters["sort"])
          }
          className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-border-active cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          {TIER_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setTierFilter(pill.value)}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                tierFilter === pill.value
                  ? "bg-amber-500/20 text-amber-300"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary",
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Whale cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-text-secondary animate-spin" />
          <span className="ml-2 text-sm text-text-secondary">
            고래 랭킹 로딩 중...
          </span>
        </div>
      ) : accessibleWhales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Fish className="w-10 h-10 text-text-disabled mb-3" />
          <p className="text-sm text-text-secondary">
            등록된 고래가 없습니다
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {accessibleWhales.map((whale, idx) => (
            <WhaleCard
              key={whale.id}
              whale={whale}
              rank={idx + 1}
              isFollowed={followedIds.has(whale.id)}
            />
          ))}

          {/* Locked overlay */}
          {lockedCount > 0 && (
            <div className="relative">
              <div
                className="space-y-2 blur-sm select-none pointer-events-none"
                aria-hidden
              >
                {Array.from({ length: Math.min(3, lockedCount) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border border-border-default bg-bg-secondary h-24"
                    />
                  ),
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60 backdrop-blur-[2px] rounded-lg">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary/10">
                    <Lock className="w-5 h-5 text-accent-primary" />
                  </div>
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">
                      +{lockedCount}명의 고래
                    </span>
                    를 더 추적할 수 있습니다
                  </p>
                  <Link
                    href="/billing"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Pro 업그레이드
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Whale Card
   ═══════════════════════════════════════════════ */

const WhaleCard = memo(function WhaleCard({
  whale,
  rank,
  isFollowed,
}: {
  whale: WhaleRankingItem;
  rank: number;
  isFollowed: boolean;
}) {
  const router = useRouter();
  const followMut = useFollowWhale();
  const unfollowMut = useUnfollowWhale();
  const user = useAuthStore((s) => s.user);

  const handleClick = useCallback(() => {
    if (whale.is_accessible) {
      router.push(`/whale/${whale.id}`);
    }
  }, [whale.id, whale.is_accessible, router]);

  const handleFollow = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) return;
      if (isFollowed) {
        unfollowMut.mutate(whale.id);
      } else {
        followMut.mutate(whale.id);
      }
    },
    [user, isFollowed, whale.id, followMut, unfollowMut],
  );

  const returnKey =
    "return_30d_pct" as keyof Pick<
      WhaleRankingItem,
      "return_7d_pct" | "return_30d_pct" | "return_90d_pct"
    >;
  const mainReturn = whale[returnKey];

  // Rank medal
  const rankDisplay =
    rank === 1 ? "🏆" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;

  if (!whale.is_accessible) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border-default bg-bg-secondary opacity-60">
        <span className="text-sm font-bold text-text-disabled w-8 text-center shrink-0">
          {rank}.
        </span>
        <Lock className="w-4 h-4 text-text-disabled shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-disabled">
            Whale_???? · ??? 티어
          </p>
          <p className="text-xs text-text-disabled mt-0.5">
            +???% · 승률 ??%
          </p>
        </div>
        <Link
          href="/billing"
          className="text-[11px] text-accent-primary hover:underline shrink-0"
        >
          Pro 업그레이드 →
        </Link>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="flex flex-col gap-2 p-4 rounded-lg border border-border-default bg-bg-secondary hover:border-border-active/50 transition-colors cursor-pointer"
    >
      {/* Top row: rank + label + tier + follow */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-text-primary w-8 text-center shrink-0">
          {rankDisplay}
        </span>
        <TierBadge tier={whale.tier} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-text-primary truncate">
              {whale.label}
            </span>
            <span className="text-[11px] text-text-disabled font-mono">
              {whale.address_short}
            </span>
          </div>
        </div>
        {/* Follow button */}
        <button
          type="button"
          onClick={handleFollow}
          disabled={followMut.isPending || unfollowMut.isPending}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0",
            isFollowed
              ? "bg-signal-danger/10 text-signal-danger"
              : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
          )}
          aria-label={isFollowed ? "팔로우 해제" : "팔로우"}
        >
          <Heart
            className={cn(
              "w-3 h-3",
              isFollowed && "fill-current",
            )}
          />
          {whale.follower_count > 0 && (
            <span className="font-mono">{whale.follower_count}</span>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 ml-10 text-xs">
        <span
          className={cn(
            "font-bold font-mono text-sm",
            mainReturn >= 0 ? "text-signal-success" : "text-signal-danger",
          )}
        >
          {formatPercentage(mainReturn)}
        </span>
        <span className="text-text-secondary">
          승률{" "}
          <span className="font-mono text-text-primary">
            {(whale.win_rate_30d * 100).toFixed(0)}%
          </span>
        </span>
        <span className="text-text-secondary">
          <span className="font-mono text-text-primary">
            {whale.total_trades_30d}
          </span>
          회 거래
        </span>
      </div>

      {/* Holdings */}
      {whale.top_holdings.length > 0 && (
        <div className="flex items-center gap-2 ml-10 text-[11px] text-text-secondary">
          <span className="text-text-disabled">보유</span>
          {whale.top_holdings.map((h, i) => (
            <span key={h.coin_symbol}>
              <span className="font-mono text-text-primary">
                {h.coin_symbol}
              </span>{" "}
              {h.weight_pct.toFixed(0)}%
              {i < whale.top_holdings.length - 1 && (
                <span className="text-text-disabled mx-0.5">·</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Last trade */}
      {whale.last_trade_summary && (
        <div className="flex items-center gap-1.5 ml-10 text-[11px]">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              whale.last_trade_summary.type === "buy"
                ? "bg-signal-success"
                : "bg-signal-danger",
            )}
          />
          <span className="text-text-secondary">
            {timeAgoKR(whale.last_trade_summary.minutes_ago)}
          </span>
          <span className="font-mono text-text-primary">
            ${whale.last_trade_summary.coin_symbol}
          </span>
          <span className="text-text-secondary">
            {whale.last_trade_summary.type === "buy" ? "매수" : "매도"}
          </span>
          <span className="font-mono text-text-primary">
            {formatCurrency(whale.last_trade_summary.value_usd)}
          </span>
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Trade Feed Section
   ═══════════════════════════════════════════════ */

function TradeFeedSection() {
  const [tradeType, setTradeType] = useState<"" | "buy" | "sell">("");
  const [minAmount, setMinAmount] = useState(0);
  const [tierFilter, setTierFilter] = useState("");
  const isPro = useAuthStore((s) => s.isPro);

  const filters: WhaleTradeFilters = {
    trade_type: tradeType || undefined,
    min_value_usd: minAmount || undefined,
    whale_tier: tierFilter || undefined,
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useWhaleTrades(filters);

  const allTrades = useMemo(
    () => data?.pages.flatMap((p) => p.trades) ?? [],
    [data],
  );
  const lockedCount = data?.pages[0]?.lockedCount ?? 0;

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

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Trade type pills */}
        {[
          { value: "", label: "전체" },
          { value: "buy", label: "매수" },
          { value: "sell", label: "매도" },
        ].map((pill) => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setTradeType(pill.value as "" | "buy" | "sell")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              tradeType === pill.value
                ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
            )}
          >
            {pill.label}
          </button>
        ))}

        <select
          value={String(minAmount)}
          onChange={(e) => setMinAmount(Number(e.target.value))}
          className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-border-active cursor-pointer"
        >
          {MIN_AMOUNT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          {TIER_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setTierFilter(pill.value)}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-medium transition-colors",
                tierFilter === pill.value
                  ? "bg-amber-500/20 text-amber-300"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary",
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trade timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-text-secondary animate-spin" />
          <span className="ml-2 text-sm text-text-secondary">
            매매 피드 로딩 중...
          </span>
        </div>
      ) : allTrades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Fish className="w-10 h-10 text-text-disabled mb-3" />
          <p className="text-sm text-text-secondary">매매 기록이 없습니다</p>
        </div>
      ) : (
        <div className="relative pl-4">
          {/* Vertical timeline line */}
          <div className="absolute left-1.75 top-2 bottom-2 w-px bg-border-default" />

          <div className="space-y-0">
            {allTrades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
          </div>

          {/* Locked overlay */}
          {lockedCount > 0 && !isPro && (
            <div className="relative mt-2">
              <div
                className="space-y-2 blur-sm select-none pointer-events-none"
                aria-hidden
              >
                {Array.from({ length: Math.min(3, lockedCount) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border border-border-default bg-bg-secondary h-20"
                    />
                  ),
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60 backdrop-blur-[2px] rounded-lg">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary/10">
                    <Lock className="w-5 h-5 text-accent-primary" />
                  </div>
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">
                      +{lockedCount}건
                    </span>{" "}
                    거래를 더 확인할 수 있습니다
                  </p>
                  <Link
                    href="/billing"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Pro 업그레이드
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Trade Card
   ═══════════════════════════════════════════════ */

const TradeCard = memo(function TradeCard({
  trade,
}: {
  trade: SerializedTrade;
}) {
  const isBuy = trade.trade_type === "buy";
  const router = useRouter();

  return (
    <div
      className="relative pl-5 pb-4 cursor-pointer group"
      onClick={() => router.push(`/whale/${trade.whale_id}`)}
    >
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-0 top-2 w-2.25 h-2.25 rounded-full border-2 z-10",
          isBuy
            ? "bg-signal-success border-signal-success/30"
            : "bg-signal-danger border-signal-danger/30",
        )}
      />

      <div className="p-3 rounded-lg border border-border-default bg-bg-secondary group-hover:border-border-active/50 transition-colors">
        {/* Header: whale + time */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            {trade.whale_tier && <TierBadge tier={trade.whale_tier} />}
            <span className="text-[13px] font-semibold text-text-primary truncate">
              {trade.whale_label ?? trade.whale_id.slice(0, 10)}
            </span>
          </div>
          <span className="text-[11px] text-text-disabled shrink-0">
            {timeAgoKR(trade.created_at)}
          </span>
        </div>

        {/* Trade info */}
        <div className="flex items-center gap-2 text-[13px]">
          <span
            className={cn(
              "font-medium",
              isBuy ? "text-signal-success" : "text-signal-danger",
            )}
          >
            {isBuy ? "매수" : "매도"}
          </span>
          <span className="font-mono font-bold text-text-primary">
            ${trade.coin_symbol}
          </span>
          <span className="font-mono text-text-primary">
            {formatCurrency(trade.value_usd)}
          </span>
          <span className="text-text-disabled">@</span>
          <span className="font-mono text-text-secondary">
            ${trade.price.toLocaleString()}
          </span>
        </div>

        {/* PnL badge + DEX */}
        <div className="flex items-center gap-2 mt-1">
          {trade.realized_pnl_pct != null && trade.realized_pnl_pct !== 0 && (
            <span
              className={cn(
                "text-[11px] font-mono font-bold px-1.5 py-0.5 rounded",
                trade.realized_pnl_pct > 0
                  ? "bg-signal-success/10 text-signal-success"
                  : "bg-signal-danger/10 text-signal-danger",
              )}
            >
              {formatPercentage(trade.realized_pnl_pct)}
            </span>
          )}
          {trade.exchange_or_dex && (
            <span className="text-[10px] text-text-disabled px-1.5 py-0.5 bg-bg-tertiary rounded">
              {trade.exchange_or_dex}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Following Section
   ═══════════════════════════════════════════════ */

function FollowingSection() {
  const isPro = useAuthStore((s) => s.isPro);
  const isWhale = useAuthStore((s) => s.isWhale);
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useWhaleRanking({ followedOnly: true });

  const whales = useMemo(
    () => data?.pages.flatMap((p) => p.whales) ?? [],
    [data],
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="w-10 h-10 text-text-disabled mb-3" />
        <p className="text-sm text-text-secondary">
          로그인 후 고래를 팔로우하세요
        </p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock className="w-10 h-10 text-text-disabled mb-3" />
        <p className="text-sm text-text-secondary">
          고래 팔로우는 Pro 전용 기능입니다
        </p>
        <Link
          href="/billing"
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Pro 업그레이드
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Follow count indicator */}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>팔로잉 {whales.length}명</span>
        <span>
          {isWhale
            ? "무제한"
            : `${whales.length}/10`}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-text-secondary animate-spin" />
        </div>
      ) : whales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Fish className="w-10 h-10 text-text-disabled mb-3" />
          <p className="text-sm text-text-secondary">
            팔로우한 고래가 없습니다
          </p>
          <p className="text-xs text-text-disabled mt-1">
            랭킹 탭에서 고래를 팔로우해보세요
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {whales.map((whale, idx) => (
            <WhaleCard
              key={whale.id}
              whale={whale}
              rank={idx + 1}
              isFollowed
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Hot Coin Bottom Sheet
   ═══════════════════════════════════════════════ */

function HotCoinSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useWhaleHotCoins();
  const isPro = useAuthStore((s) => s.isPro);
  const coins = data?.hot_coins ?? [];
  const lockedCount = data?.lockedCount ?? 0;

  // Max net volume for bar scaling
  const maxVolume = coins.length > 0
    ? Math.max(...coins.map((c) => Math.abs(c.net_buy_volume_usd_24h)))
    : 1;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 bg-bg-secondary border-t border-border-default rounded-t-2xl shadow-xl transition-transform duration-300 max-h-[70vh] overflow-y-auto",
          open ? "translate-y-0" : "translate-y-full pointer-events-none",
        )}
      >
        {/* Handle + header */}
        <div className="sticky top-0 bg-bg-secondary z-10 pt-3 pb-2 px-4 border-b border-border-default">
          <div className="w-10 h-1 bg-bg-tertiary rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-signal-danger" />
              <h3 className="text-sm font-bold text-text-primary">
                고래들이 지금 사는 코인 (24h)
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-text-primary"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
            </div>
          ) : coins.length === 0 ? (
            <p className="text-sm text-text-disabled text-center py-10">
              데이터 없음
            </p>
          ) : (
            <>
              {coins.map((coin, idx) => (
                <HotCoinRow
                  key={coin.coin_symbol}
                  coin={coin}
                  rank={idx + 1}
                  maxVolume={maxVolume}
                />
              ))}

              {/* Locked */}
              {lockedCount > 0 && !isPro && (
                <div className="relative">
                  <div
                    className="space-y-3 blur-sm select-none pointer-events-none"
                    aria-hidden
                  >
                    {Array.from({ length: Math.min(2, lockedCount) }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="h-16 rounded-lg border border-border-default bg-bg-tertiary"
                        />
                      ),
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60 backdrop-blur-[2px] rounded-lg">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Lock className="w-4 h-4 text-accent-primary" />
                      <p className="text-xs text-text-secondary">
                        +{lockedCount}개 코인 Pro 전용
                      </p>
                      <Link
                        href="/billing"
                        className="text-xs text-accent-primary font-semibold hover:underline"
                      >
                        업그레이드 →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function HotCoinRow({
  coin,
  rank,
  maxVolume,
}: {
  coin: SerializedHotCoin;
  rank: number;
  maxVolume: number;
}) {
  const signalStyle = SIGNAL_STYLES[coin.signal] ?? SIGNAL_STYLES.neutral;
  const barPct = maxVolume > 0
    ? (Math.abs(coin.net_buy_volume_usd_24h) / maxVolume) * 100
    : 0;
  const isPositive = coin.net_buy_volume_usd_24h >= 0;

  return (
    <div className="p-3 rounded-lg border border-border-default bg-bg-secondary">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-text-disabled w-5">
            {rank}.
          </span>
          <span className="font-mono font-bold text-text-primary text-sm">
            ${coin.coin_symbol}
          </span>
          <span className="text-[11px] text-text-disabled truncate">
            {coin.coin_name}
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded",
            signalStyle.bg,
            signalStyle.text,
          )}
        >
          {signalStyle.label}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-text-secondary mb-1.5">
        <span>
          <span className="text-signal-success">매수</span>{" "}
          <span className="font-mono text-text-primary">
            {coin.buy_whale_count_24h}
          </span>
          명
        </span>
        <span>
          <span className="text-signal-danger">매도</span>{" "}
          <span className="font-mono text-text-primary">
            {coin.sell_whale_count_24h}
          </span>
          명
        </span>
        <span>
          순매수{" "}
          <span
            className={cn(
              "font-mono font-bold",
              isPositive ? "text-signal-success" : "text-signal-danger",
            )}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(coin.net_buy_volume_usd_24h)}
          </span>
        </span>
      </div>

      {/* Bar */}
      <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isPositive ? "bg-signal-success" : "bg-signal-danger",
          )}
          style={{ width: `${barPct}%` }}
        />
      </div>

      {/* Top buyers */}
      {coin.top_buyers.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-text-disabled">
          <span>매수:</span>
          {coin.top_buyers.map((b, i) => (
            <span key={i}>
              {b}
              {i < coin.top_buyers.length - 1 && ", "}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
