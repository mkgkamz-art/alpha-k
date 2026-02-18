"use client";

import { useRef, memo } from "react";
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
import { cn } from "@/lib/utils";
import { useContextAlerts, type ContextAlertRow } from "@/hooks/use-context-alerts";
import { useDailySummary } from "@/hooks/use-daily-summary";
import { useSurge } from "@/hooks/use-surge";
import { useAuthStore } from "@/stores/auth-store";

/* ═══════════════════════════════════════════════
   Constants
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

const FEATURE_CARDS = [
  { icon: "🐋", label: "고래 추적", href: "/whale", desc: "대규모 이동 감지" },
  { icon: "📊", label: "시그널", href: "/signals", desc: "매매 신호 분석" },
  { icon: "🛡️", label: "DeFi 리스크", href: "/risk", desc: "프로토콜 건전성" },
  { icon: "🔓", label: "토큰 언락", href: "/unlocks", desc: "언락 일정 추적" },
  { icon: "💧", label: "유동성", href: "/liquidity", desc: "LP 풀 모니터링" },
  { icon: "⭐", label: "워치리스트", href: "/watchlist", desc: "관심 코인 관리" },
];

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

export default function DashboardPage() {
  const { data: alertsData, isLoading: alertsLoading, refetch, isFetching, dataUpdatedAt } =
    useContextAlerts({ limit: 30 });
  const { data: summary, isLoading: summaryLoading } = useDailySummary();
  const { data: surgeData } = useSurge({ exchange: "upbit", type: "all" }, 15_000);

  const alerts = alertsData?.data ?? [];
  const surgeItems = surgeData?.data?.slice(0, 10) ?? [];

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

        {/* ── Surge Mini Ticker ── */}
        {surgeItems.length > 0 && <SurgeMiniTicker items={surgeItems} />}

        {/* ── Daily Summary ── */}
        <DailySummaryCard summary={summary ?? null} loading={summaryLoading} />

        {/* ── Context Alert Feed ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Context Alerts
          </h2>
          {alertsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-bg-secondary border border-border-default rounded-lg p-6 text-center">
              <p className="text-sm text-text-secondary">아직 알림이 없습니다</p>
              <p className="text-xs text-text-disabled mt-1">
                급등·급락, 김프 급변, 신규 상장 시 자동 생성됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <ContextAlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </section>

        {/* ── Feature Hub ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            기능 허브
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FEATURE_CARDS.map((card) => (
              <FeatureCard key={card.href} {...card} />
            ))}
          </div>
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
  change_24h: number;
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
              <span className="text-text-primary font-semibold">{item.symbol}</span>
              <span
                className={cn(
                  "tabular-nums font-bold",
                  isPump ? "text-emerald-400" : "text-red-400"
                )}
              >
                {isPump ? "+" : ""}
                {item.change_24h.toFixed(1)}%
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
          color={(summary?.avgKimchi ?? 0) >= 3 ? "text-amber-300" : "text-text-primary"}
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
          value={summary?.fearGreed?.value != null ? `${summary.fearGreed.value}` : "—"}
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
      <Link href={href} className="hover:bg-bg-tertiary rounded-md p-1 transition-colors">
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
   Context Alert Card
   ═══════════════════════════════════════════════ */

const ContextAlertCard = memo(function ContextAlertCard({
  alert,
}: {
  alert: ContextAlertRow;
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
            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", style.badge)}>
              {style.label}
            </span>
            {alert.symbol && (
              <span className="text-[11px] text-text-secondary font-medium">{alert.symbol}</span>
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
            <p className="text-xs text-text-secondary mt-1">{alert.what_description}</p>
          )}
        </div>

        {/* WHY — Pro only or blur */}
        {alert.why_analysis && (
          <div className="mb-2">
            <p className="text-[10px] text-text-disabled uppercase tracking-wider mb-0.5">WHY</p>
            {isPro ? (
              <p className="text-xs text-text-secondary">{alert.why_analysis}</p>
            ) : (
              <ProBlurSection text={alert.why_analysis} />
            )}
          </div>
        )}

        {/* ACTION — Pro only or blur */}
        {alert.action_suggestion && (
          <div className="mb-2">
            <p className="text-[10px] text-text-disabled uppercase tracking-wider mb-0.5">ACTION</p>
            {isPro ? (
              <p className="text-xs text-text-secondary">{alert.action_suggestion}</p>
            ) : (
              <ProBlurSection text={alert.action_suggestion} />
            )}
          </div>
        )}

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

/* ═══════════════════════════════════════════════
   Feature Hub Card
   ═══════════════════════════════════════════════ */

function FeatureCard({
  icon,
  label,
  href,
  desc,
}: {
  icon: string;
  label: string;
  href: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="bg-bg-secondary border border-border-default rounded-lg p-3 hover:border-border-active transition-colors group"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold text-text-primary group-hover:text-accent-primary transition-colors">
          {label}
        </span>
      </div>
      <p className="text-[10px] text-text-disabled">{desc}</p>
    </Link>
  );
}
