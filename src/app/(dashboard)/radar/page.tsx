"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Flame,
  Flag,
  Zap,
  BarChart3,
  AlertTriangle,
  Loader2,
  Lock,
  RefreshCw,
  Radio,
  Volume2,
  Layers,
  MessageCircle,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useRadarSignals } from "@/hooks/use-radar";
import type { RadarSignal, RadarSignalType, RadarStrength } from "@/types";

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */

const TYPE_CHIPS: { type: RadarSignalType; label: string; icon: typeof Flame }[] = [
  { type: "surge", label: "급등", icon: Flame },
  { type: "kimchi", label: "김프", icon: Flag },
  { type: "listing", label: "상장", icon: Zap },
  { type: "signal", label: "시그널", icon: BarChart3 },
  { type: "context", label: "컨텍스트", icon: AlertTriangle },
  { type: "volume", label: "거래량", icon: Volume2 },
  { type: "orderbook", label: "호가벽", icon: Layers },
  { type: "buzz", label: "버즈", icon: MessageCircle },
  { type: "onchain", label: "온체인", icon: Link2 },
];

const SCORE_OPTIONS = [
  { value: 0, label: "전체" },
  { value: 30, label: "30+" },
  { value: 50, label: "50+" },
  { value: 70, label: "70+" },
  { value: 90, label: "90+" },
];

const TYPE_STYLES: Record<RadarSignalType, { bg: string; text: string; icon: typeof Flame }> = {
  surge: { bg: "bg-red-500/15", text: "text-red-400", icon: Flame },
  kimchi: { bg: "bg-blue-500/15", text: "text-blue-400", icon: Flag },
  listing: { bg: "bg-amber-500/15", text: "text-amber-400", icon: Zap },
  signal: { bg: "bg-emerald-500/15", text: "text-emerald-400", icon: BarChart3 },
  context: { bg: "bg-purple-500/15", text: "text-purple-400", icon: AlertTriangle },
  volume: { bg: "bg-cyan-500/15", text: "text-cyan-400", icon: Volume2 },
  orderbook: { bg: "bg-indigo-500/15", text: "text-indigo-400", icon: Layers },
  buzz: { bg: "bg-pink-500/15", text: "text-pink-400", icon: MessageCircle },
  onchain: { bg: "bg-teal-500/15", text: "text-teal-400", icon: Link2 },
};

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

export default function RadarPage() {
  const [selectedTypes, setSelectedTypes] = useState<RadarSignalType[]>([]);
  const [minScore, setMinScore] = useState(0);

  const isPro = useAuthStore((s) => s.isPro);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useRadarSignals({
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    minScore: minScore > 0 ? minScore : undefined,
  });

  const allSignals = data?.pages.flatMap((p) => p.signals) ?? [];
  const lockedCount = data?.pages[0]?.lockedCount ?? 0;

  // Toggle type filter
  const toggleType = useCallback((type: RadarSignalType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

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

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-text-primary">레이더</h2>
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

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type chips */}
        {TYPE_CHIPS.map(({ type, label, icon: Icon }) => {
          const isActive = selectedTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                isActive
                  ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                  : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}

        {/* Score filter */}
        <div className="ml-auto flex items-center gap-1">
          <span className="text-[11px] text-text-disabled mr-1">점수</span>
          {SCORE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setMinScore(value)}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-medium transition-colors",
                minScore === value
                  ? "bg-amber-500/20 text-amber-300"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Signal cards ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-text-secondary animate-spin" />
          <span className="ml-2 text-sm text-text-secondary">레이더 스캔 중...</span>
        </div>
      ) : allSignals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Radio className="w-10 h-10 text-text-disabled mb-3" />
          <p className="text-sm text-text-secondary">감지된 시그널이 없습니다</p>
          <p className="text-xs text-text-disabled mt-1">
            레이더가 시장을 스캔하고 있습니다...
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allSignals.map((signal) => (
            <RadarSignalCard key={signal.id} signal={signal} />
          ))}

          {/* Locked overlay for free users */}
          {lockedCount > 0 && !isPro && (
            <div className="relative">
              {/* Fake blurred cards */}
              <div className="space-y-2 blur-sm select-none pointer-events-none" aria-hidden>
                {Array.from({ length: Math.min(3, lockedCount) }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border-default bg-bg-secondary h-24"
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60 backdrop-blur-[2px] rounded-lg">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary/10">
                    <Lock className="w-5 h-5 text-accent-primary" />
                  </div>
                  <p className="text-sm text-text-secondary">
                    <span className="font-medium text-text-primary">
                      +{lockedCount}개 시그널
                    </span>
                    이 더 있습니다
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
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Signal Card
   ═══════════════════════════════════════════════ */

const RadarSignalCard = memo(function RadarSignalCard({
  signal,
}: {
  signal: RadarSignal;
}) {
  const style = TYPE_STYLES[signal.signal_type];
  const strengthCfg = STRENGTH_CONFIG[signal.strength];
  const Icon = style.icon;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border-default bg-bg-secondary hover:bg-bg-tertiary/50 transition-colors">
      {/* Type icon */}
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
          style.bg,
        )}
      >
        <Icon className={cn("w-4.5 h-4.5", style.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-bold text-text-primary font-mono">
            {signal.token_symbol}
          </span>
          {signal.token_name && (
            <span className="text-[11px] text-text-disabled truncate">
              {signal.token_name}
            </span>
          )}
          <span className={cn("text-[10px] font-bold uppercase", style.text, style.bg, "px-1.5 py-0.5 rounded")}>
            {signal.signal_type}
          </span>
        </div>
        <p className="text-[13px] text-text-primary leading-snug line-clamp-2">
          {signal.title}
        </p>
        {signal.description && (
          <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">
            {signal.description}
          </p>
        )}
        <span className="text-[10px] text-text-disabled mt-1 block">
          {timeAgoKR(signal.created_at)}
          {signal.source && ` · ${signal.source}`}
        </span>
      </div>

      {/* Score gauge */}
      <div className="flex flex-col items-center gap-1 shrink-0 w-14">
        <div className="relative w-11 h-11">
          <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-bg-tertiary"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${(signal.score / 100) * 113} 113`}
              strokeLinecap="round"
              className={
                signal.score >= 80
                  ? "text-red-400"
                  : signal.score >= 60
                    ? "text-orange-400"
                    : signal.score >= 40
                      ? "text-amber-300"
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
  );
});
