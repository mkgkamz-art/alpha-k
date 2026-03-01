"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Target,
  Flame,
  Fish,
  MessageCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlphaSignal, ConvergenceResponse } from "@/app/api/signal/convergence/route";

/* ─────────────────────────────────────────────
   Data Fetching
───────────────────────────────────────────── */

function useAlphaSignals() {
  return useQuery<ConvergenceResponse>({
    queryKey: ["signal", "convergence"],
    queryFn: async () => {
      const res = await fetch("/api/signal/convergence");
      if (!res.ok) throw new Error("Failed to fetch convergence signals");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */

export default function SignalPage() {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } =
    useAlphaSignals();

  const signals = data?.signals ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 max-w-3xl w-full mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-text-primary">알파 시그널</h2>
            {meta && (
              <span className="text-[11px] text-text-disabled font-mono">
                #{meta.total}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            aria-label="새로고침"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", isFetching && "animate-spin")}
            />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>

        {/* Concept banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-bg-secondary border border-border-default">
          <Info className="w-3.5 h-3.5 text-text-disabled mt-0.5 shrink-0" />
          <p className="text-[11px] text-text-secondary leading-relaxed">
            <span className="text-text-primary font-medium">Alpha Signal</span>
            은 레이더(기술 지표) · 고래(스마트머니) · 찌라시(군중 지성) 3가지 소스 중{" "}
            <span className="text-text-primary font-medium">2개 이상이 동일 방향</span>
            을 가리킬 때 발행됩니다. 점수 40점 미만 또는 단일 소스 신호는 노이즈로 제외됩니다.
          </p>
        </div>

        {/* Summary pills */}
        {meta && meta.total > 0 && (
          <div className="flex items-center gap-2">
            {meta.perfect_count > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] font-bold text-amber-400">
                  ★★★
                </span>
                <span className="text-[11px] text-amber-300/80">
                  PERFECT {meta.perfect_count}
                </span>
              </div>
            )}
            {meta.strong_count > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-700/30 border border-zinc-600/30">
                <span className="text-[11px] font-bold text-zinc-300">
                  ★★
                </span>
                <span className="text-[11px] text-zinc-400">
                  STRONG {meta.strong_count}
                </span>
              </div>
            )}
            {dataUpdatedAt > 0 && (
              <span className="ml-auto text-[10px] text-text-disabled">
                {timeAgoKR(dataUpdatedAt)} 업데이트
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : signals.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Signal Card
───────────────────────────────────────────── */

function SignalCard({ signal }: { signal: AlphaSignal }) {
  const isPerfect = signal.grade === "perfect";
  const isBuy = signal.direction === "buy";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3 transition-all",
        isPerfect
          ? "border-amber-500/40 bg-amber-500/[0.04] shadow-lg shadow-amber-900/10"
          : "border-zinc-700/60 bg-bg-secondary",
      )}
    >
      {/* Top row: grade + coin + direction */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Grade badge */}
          <GradeBadge grade={signal.grade} pulse={isPerfect} />
          {/* Coin */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[17px] font-bold text-text-primary font-mono">
                {signal.coin_symbol}
              </span>
              {signal.coin_name && (
                <span className="text-xs text-text-disabled truncate">
                  {signal.coin_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Direction badge */}
        <DirectionBadge
          label={signal.strength_label}
          isBuy={isBuy}
          score={signal.alpha_score}
        />
      </div>

      {/* Alpha Score bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-text-disabled uppercase tracking-wider">
            Alpha Score
          </span>
          <span
            className={cn(
              "font-mono font-bold text-[13px]",
              signal.alpha_score >= 80
                ? "text-signal-success"
                : signal.alpha_score >= 60
                  ? "text-signal-warning"
                  : "text-text-secondary",
            )}
          >
            {signal.alpha_score}
          </span>
        </div>
        <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              signal.alpha_score >= 80
                ? "bg-signal-success"
                : signal.alpha_score >= 60
                  ? "bg-signal-warning"
                  : "bg-text-disabled",
            )}
            style={{ width: `${signal.alpha_score}%` }}
          />
        </div>
      </div>

      {/* Source grid */}
      <div className="grid grid-cols-3 gap-2">
        <SourceCell
          icon={<Flame className="w-3.5 h-3.5" />}
          label="레이더"
          source={signal.radar}
        />
        <SourceCell
          icon={<Fish className="w-3.5 h-3.5" />}
          label="고래"
          source={signal.whale}
        />
        <SourceCell
          icon={<MessageCircle className="w-3.5 h-3.5" />}
          label="찌라시"
          source={signal.chirashi}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function GradeBadge({
  grade,
  pulse,
}: {
  grade: "perfect" | "strong";
  pulse?: boolean;
}) {
  if (grade === "perfect") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border shrink-0",
          "bg-amber-400/10 text-amber-300 border-amber-400/25",
          pulse && "animate-pulse",
        )}
      >
        ★★★
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border shrink-0 bg-zinc-700/40 text-zinc-300 border-zinc-600/40">
      ★★
    </span>
  );
}

function DirectionBadge({
  label,
  isBuy,
  score,
}: {
  label: string;
  isBuy: boolean;
  score: number;
}) {
  const isStrong = score >= 80;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold shrink-0",
        isBuy
          ? isStrong
            ? "bg-signal-success/15 text-signal-success"
            : "bg-signal-success/10 text-signal-success/80"
          : isStrong
            ? "bg-signal-danger/15 text-signal-danger"
            : "bg-signal-danger/10 text-signal-danger/80",
      )}
    >
      {isBuy ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {label}
    </div>
  );
}

function SourceCell({
  icon,
  label,
  source,
}: {
  icon: React.ReactNode;
  label: string;
  source: { active: boolean; score: number; detail: string; direction: string };
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-2.5 rounded-lg border text-center",
        source.active
          ? "border-border-active/30 bg-bg-tertiary"
          : "border-border-default bg-bg-primary/50 opacity-50",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-1 text-[10px] font-medium",
          source.active ? "text-text-primary" : "text-text-disabled",
        )}
      >
        <span className={source.active ? "text-amber-400" : "text-text-disabled"}>
          {icon}
        </span>
        {label}
      </div>
      {source.active ? (
        <>
          <span className="text-[11px] font-mono font-bold text-signal-success">
            {source.score}점
          </span>
          <span className="text-[9px] text-text-disabled leading-tight line-clamp-2">
            {source.detail}
          </span>
        </>
      ) : (
        <span className="text-[10px] text-text-disabled">신호 없음</span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   State Components
───────────────────────────────────────────── */

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-48 rounded-xl border border-border-default bg-bg-secondary animate-pulse"
        />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <Target className="w-10 h-10 text-text-disabled" />
      <p className="text-sm text-text-secondary">데이터를 불러올 수 없습니다</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bg-secondary border border-border-default text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        다시 시도
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-bg-secondary border border-border-default flex items-center justify-center">
          <Target className="w-7 h-7 text-text-disabled" />
        </div>
        {/* Source icons below */}
        <div className="flex items-center justify-center gap-2 mt-3 text-text-disabled">
          <Flame className="w-4 h-4" />
          <span className="text-text-disabled text-lg">+</span>
          <Fish className="w-4 h-4" />
          <span className="text-text-disabled text-lg">+</span>
          <MessageCircle className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <h3 className="text-sm font-semibold text-text-primary">
          현재 수렴 시그널이 없습니다
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          3개 소스 중 2개 이상이 같은 방향을 가리킬 때 Alpha Signal이 발행됩니다.
          레이더, 고래, 찌라시 데이터가 수렴되면 이 화면에 표시됩니다.
        </p>
      </div>

      {/* Methodology */}
      <div className="w-full max-w-sm mt-2 rounded-xl border border-border-default bg-bg-secondary p-4 text-left space-y-3">
        <p className="text-[10px] text-text-disabled uppercase tracking-wider font-medium">
          수렴 조건
        </p>
        {[
          {
            icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
            label: "레이더",
            desc: "score 60+ 활성 기술 지표",
          },
          {
            icon: <Fish className="w-3.5 h-3.5 text-blue-400" />,
            label: "고래",
            desc: "6시간 이내 스마트머니 거래",
          },
          {
            icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />,
            label: "찌라시",
            desc: "12시간 이내 신뢰도 60+ 버즈",
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-xs">
            {item.icon}
            <span className="font-medium text-text-primary w-12 shrink-0">
              {item.label}
            </span>
            <span className="text-text-secondary">{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function timeAgoKR(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
