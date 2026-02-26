"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  MessageCircle,
  Loader2,
  Lock,
  RefreshCw,
  Zap,
  TrendingUp,
  Hash,
  Heart,
  Repeat2,
  MessageSquare,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useChirashiFeed, useChirashiTweets } from "@/hooks/use-chirashi";
import type { RadarSignal, RadarStrength } from "@/types";

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */

const WATCH_COINS = [
  "BTC", "ETH", "XRP", "SOL", "DOGE", "ADA", "AVAX",
  "DOT", "LINK", "ARB", "OP", "SUI", "APT", "NEAR", "UNI",
];

const STRENGTH_CONFIG: Record<RadarStrength, { label: string; color: string }> = {
  extreme: { label: "극단", color: "text-red-400" },
  strong: { label: "강함", color: "text-orange-400" },
  moderate: { label: "보통", color: "text-amber-300" },
  weak: { label: "약함", color: "text-zinc-400" },
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

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function ChirashiPage() {
  const [selectedCoin, setSelectedCoin] = useState<string | undefined>();
  const [tweetCoin, setTweetCoin] = useState<string | null>(null);
  const isPro = useAuthStore((s) => s.isPro);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useChirashiFeed({ coin: selectedCoin });

  const allSignals = data?.pages.flatMap((p) => p.signals) ?? [];
  const lockedCount = data?.pages[0]?.lockedCount ?? 0;

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

  const handleTweetView = useCallback(
    (coin: string) => {
      if (!isPro) return;
      setTweetCoin(coin);
    },
    [isPro],
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-pink-400" />
          <h2 className="text-lg font-bold text-text-primary">찌라시</h2>
          {allSignals.length > 0 && (
            <span className="text-xs text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full">
              {allSignals.length}건
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors disabled:opacity-50"
          aria-label="새로고침"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
          새로고침
        </button>
      </div>

      {/* ── Coin filter bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCoin(undefined)}
          className={cn(
            "shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            !selectedCoin
              ? "bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30"
              : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
          )}
        >
          전체
        </button>
        {WATCH_COINS.map((coin) => (
          <button
            key={coin}
            onClick={() => setSelectedCoin(selectedCoin === coin ? undefined : coin)}
            className={cn(
              "shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium font-mono transition-colors",
              selectedCoin === coin
                ? "bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30"
                : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
            )}
          >
            {coin}
          </button>
        ))}
      </div>

      {/* ── Buzz cards ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-text-secondary animate-spin" />
          <span className="ml-2 text-sm text-text-secondary">커뮤니티 스캔 중...</span>
        </div>
      ) : allSignals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageCircle className="w-10 h-10 text-text-disabled mb-3" />
          <p className="text-sm text-text-secondary">감지된 버즈가 없습니다</p>
          <p className="text-xs text-text-disabled mt-1">
            트위터에서 15개 코인을 감시하고 있습니다...
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allSignals.map((signal) => (
            <BuzzCard
              key={signal.id}
              signal={signal}
              isPro={isPro}
              onTweetView={handleTweetView}
            />
          ))}

          {/* Locked overlay for free users */}
          {lockedCount > 0 && !isPro && (
            <div className="relative">
              <div className="space-y-3 blur-sm select-none pointer-events-none" aria-hidden>
                {Array.from({ length: Math.min(3, lockedCount) }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border-default bg-bg-secondary h-36"
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60 backdrop-blur-[2px] rounded-lg">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary/10">
                    <Lock className="w-5 h-5 text-accent-primary" />
                  </div>
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">+{lockedCount}개 버즈</span>가 더 있습니다
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

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* ── Tweet preview sheet ── */}
      {tweetCoin && (
        <TweetPreviewSheet
          coin={tweetCoin}
          onClose={() => setTweetCoin(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Buzz Card
   ═══════════════════════════════════════════════ */

const BuzzCard = memo(function BuzzCard({
  signal,
  isPro,
  onTweetView,
}: {
  signal: RadarSignal;
  isPro: boolean;
  onTweetView: (coin: string) => void;
}) {
  const strengthCfg = STRENGTH_CONFIG[signal.strength];
  const snap = (signal.data_snapshot ?? {}) as Record<string, number>;

  const spikeRatio = snap.spike_ratio ?? 0;
  const positiveRatio = snap.positive_ratio ?? 0;
  const negativeRatio = snap.negative_ratio ?? 0;
  const neutralRatio = 1 - positiveRatio - negativeRatio;
  const mentionCount = snap.mention_count_1h ?? 0;
  const channelCount = snap.channel_count ?? 0;

  const positivePct = Math.round(positiveRatio * 100);
  const negativePct = Math.round(negativeRatio * 100);
  const neutralPct = Math.round(Math.max(0, neutralRatio) * 100);

  return (
    <div className="p-4 rounded-lg border border-border-default bg-bg-secondary hover:bg-bg-tertiary/50 transition-colors">
      {/* Top row: icon + token + score */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-pink-500/15">
            <MessageCircle className="w-4.5 h-4.5 text-pink-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-text-primary font-mono">
                {signal.token_symbol}
              </span>
              <span className="text-[10px] font-bold uppercase text-pink-400 bg-pink-500/15 px-1.5 py-0.5 rounded">
                buzz
              </span>
            </div>
            <p className="text-[13px] text-text-primary leading-snug mt-0.5">
              {signal.title}
            </p>
          </div>
        </div>

        {/* Score gauge */}
        <div className="flex flex-col items-center gap-1 shrink-0 w-14">
          <div className="relative w-11 h-11">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke="currentColor" strokeWidth="3"
                className="text-bg-tertiary"
              />
              <circle
                cx="22" cy="22" r="18" fill="none"
                stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${(signal.score / 100) * 113} 113`}
                strokeLinecap="round"
                className={
                  signal.score >= 80 ? "text-red-400"
                    : signal.score >= 60 ? "text-orange-400"
                      : signal.score >= 40 ? "text-amber-300"
                        : "text-zinc-400"
                }
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-text-primary font-mono">
              {signal.score}
            </span>
          </div>
          <span className={cn("text-[10px] font-medium", strengthCfg.color)}>
            {strengthCfg.label}
          </span>
        </div>
      </div>

      {/* Sentiment bar */}
      <div className="mb-3">
        <div className="flex h-2 rounded-full overflow-hidden bg-bg-tertiary">
          {positivePct > 0 && (
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${positivePct}%` }}
            />
          )}
          {neutralPct > 0 && (
            <div
              className="bg-zinc-600 transition-all"
              style={{ width: `${neutralPct}%` }}
            />
          )}
          {negativePct > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${negativePct}%` }}
            />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            긍정 {positivePct}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
            중립 {neutralPct}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            부정 {negativePct}%
          </span>
        </div>
      </div>

      {/* Mini stats + tweet button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px] text-text-secondary">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            언급 {spikeRatio.toFixed(1)}x
          </span>
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {mentionCount.toLocaleString()}건/1h
          </span>
          <span className="flex items-center gap-1">
            채널 {channelCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-disabled">
            {timeAgoKR(signal.created_at)}
          </span>
          {isPro ? (
            <button
              onClick={() => onTweetView(signal.token_symbol)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              트윗 보기
            </button>
          ) : (
            <Link
              href="/billing"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-text-disabled bg-bg-tertiary"
            >
              <Lock className="w-3 h-3" />
              Pro
            </Link>
          )}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Tweet Preview Sheet
   ═══════════════════════════════════════════════ */

function TweetPreviewSheet({
  coin,
  onClose,
}: {
  coin: string;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useChirashiTweets(coin, true);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div className="relative w-full max-w-2xl bg-bg-secondary border-t border-border-default rounded-t-2xl max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-bg-secondary border-b border-border-default">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-bold text-text-primary font-mono">{coin}</span>
            <span className="text-xs text-text-secondary">최신 트윗</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
              <span className="ml-2 text-sm text-text-secondary">트윗 로딩 중...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-text-secondary">트윗을 불러올 수 없습니다</p>
              <p className="text-xs text-text-disabled mt-1">잠시 후 다시 시도해주세요</p>
            </div>
          ) : data?.tweets && data.tweets.length > 0 ? (
            <>
              {/* Sentiment summary */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-bg-tertiary/50 text-xs text-text-secondary">
                <span>
                  🟢 긍정 {data.sentiment.positive_pct}%
                </span>
                <span>
                  ⚪ 중립 {data.sentiment.neutral_pct}%
                </span>
                <span>
                  🔴 부정 {data.sentiment.negative_pct}%
                </span>
              </div>

              {/* Tweets */}
              {data.tweets.map((tweet) => (
                <div
                  key={tweet.id}
                  className="p-3 rounded-lg border border-border-default bg-bg-primary"
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">
                      {tweet.sentiment === "positive"
                        ? "🟢"
                        : tweet.sentiment === "negative"
                          ? "🔴"
                          : "⚪"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap wrap-break-word">
                        {tweet.text}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-text-disabled">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {tweet.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Repeat2 className="w-3 h-3" />
                          {tweet.retweets}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {tweet.replies}
                        </span>
                        <span className="ml-auto">
                          {timeAgoKR(tweet.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-text-secondary">최근 트윗이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
