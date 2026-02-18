"use client";

import { memo, useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2,
  Lock,
  Search,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  Zap,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn, formatCurrency, formatPercentage, timeAgo } from "@/lib/utils";
import {
  useSignalDashboard,
  type EnrichedSignal,
  type HeatmapItem,
  type TopConfidenceSignal,
  type SignalDashboardFilters,
} from "@/hooks/use-signal-dashboard";
import { useAuthStore } from "@/stores/auth-store";
import { LoginPromptModal } from "@/components/login-prompt-modal";
import { SurgeSideWidget, KimchiSideWidget } from "@/components/widgets";
import { FilterPills, Tag, Input } from "@/components/ui";
import type { SignalCategory } from "@/types";

/* ── Constants ── */

const TIMEFRAME_OPTIONS = [
  { value: "all", label: "All" },
  { value: "1D", label: "1D" },
  { value: "4H", label: "4H" },
  { value: "1W", label: "1W" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
  { value: "alert", label: "Alert" },
];

const SIGNAL_COLORS: Record<
  SignalCategory,
  { border: string; badge: string; text: string; bg: string }
> = {
  buy: {
    border: "border-l-signal-success",
    badge: "bg-signal-success/10 text-signal-success",
    text: "text-signal-success",
    bg: "bg-signal-success",
  },
  sell: {
    border: "border-l-signal-danger",
    badge: "bg-signal-danger/10 text-signal-danger",
    text: "text-signal-danger",
    bg: "bg-signal-danger",
  },
  alert: {
    border: "border-l-signal-warning",
    badge: "bg-signal-warning/10 text-signal-warning",
    text: "text-signal-warning",
    bg: "bg-signal-warning",
  },
};

const LOCKED_TIMEFRAMES = new Set(["4H", "1W"]);

const CHART_COLORS = {
  buy: "#0ECB81",
  sell: "#F6465D",
  alert: "#F0B90B",
};

/* ── Page ── */

export default function SignalsPage() {
  const user = useAuthStore((s) => s.user);
  const isPro = useAuthStore((s) => s.isPro);
  const tier = useAuthStore((s) => s.tier);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [filters, setFilters] = useState<SignalDashboardFilters>({
    timeframe: "all",
    type: "all",
    search: "",
  });

  const effectiveTimeframe =
    !isPro &&
    filters.timeframe !== "all" &&
    LOCKED_TIMEFRAMES.has(filters.timeframe)
      ? "1D"
      : filters.timeframe;

  const effectiveFilters = useMemo(
    () => ({ ...filters, timeframe: effectiveTimeframe }),
    [filters, effectiveTimeframe]
  );

  const { data, isLoading } = useSignalDashboard(effectiveFilters);

  const handleTimeframeChange = (v: string) => {
    if (LOCKED_TIMEFRAMES.has(v) && !isPro) {
      if (user) {
        // Authenticated free user — redirect to billing
        window.location.href = "/billing";
      } else {
        setShowLoginModal(true);
      }
      return;
    }
    setFilters((f) => ({ ...f, timeframe: v }));
  };

  const summary = data?.summary ?? {
    total: 0,
    buy: 0,
    sell: 0,
    alert: 0,
    avgConfidence: 0,
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-360 w-full mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold">Trading Signals</h1>
          <p className="text-sm text-text-secondary">
            Data-driven signals based on price momentum and volatility analysis.
          </p>
        </div>

        {/* ── Section 1: Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Active Signals"
            value={summary.total}
            icon={Activity}
            color="text-accent-primary"
          />
          <SummaryCard
            label="Buy Signals"
            value={summary.buy}
            icon={TrendingUp}
            color="text-signal-success"
          />
          <SummaryCard
            label="Sell Signals"
            value={summary.sell}
            icon={TrendingDown}
            color="text-signal-danger"
          />
          <SummaryCard
            label="Avg Confidence"
            value={`${summary.avgConfidence}%`}
            icon={Target}
            color="text-signal-info"
          />
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <FilterPills
            options={TIMEFRAME_OPTIONS.map((opt) => ({
              ...opt,
              label:
                LOCKED_TIMEFRAMES.has(opt.value) && !isPro
                  ? `${opt.label} (Pro)`
                  : opt.label,
            }))}
            value={effectiveTimeframe}
            onChange={handleTimeframeChange}
          />
          <div className="h-px sm:h-auto sm:w-px bg-border-default" />
          <FilterPills
            options={TYPE_OPTIONS}
            value={filters.type}
            onChange={(v) =>
              setFilters((f) => ({
                ...f,
                type: v as SignalCategory | "all",
              }))
            }
          />
          <div className="ml-auto w-full sm:w-52">
            <Input
              placeholder="Search token..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Pro lock notice */}
        {!isPro && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Lock className="w-3.5 h-3.5 text-accent-primary shrink-0" />
            <span>
              4H, 1W 타임프레임은{" "}
              <span className="text-accent-primary font-medium">Pro</span>{" "}
              구독이 필요합니다.
              {!user && " 로그인 후 시작하세요."}
            </span>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 text-text-secondary animate-spin" />
          </div>
        ) : data?.message ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <p className="text-sm">{data.message}</p>
          </div>
        ) : (
          <>
            {/* ── Section 2 & 3: Feed + Sidebar ── */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Feed (65%) */}
              <div className="flex-1 lg:w-[65%] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-text-primary">
                    Signal Feed
                  </h2>
                  <span className="text-xs text-text-secondary">
                    {data?.signals.length ?? 0} signals
                  </span>
                </div>

                {(data?.signals.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-text-secondary bg-bg-secondary rounded-lg border border-border-default">
                    <Activity className="size-8 mb-2 text-text-disabled" />
                    <p className="text-sm">No signals match your filters.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {data?.signals.map((signal) => (
                      <SignalCard key={signal.id} signal={signal} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar (35%) */}
              <div className="lg:w-[35%] flex flex-col gap-4">
                {/* Heatmap */}
                <HeatmapWidget items={data?.heatmap ?? []} />

                {/* Top Confidence */}
                <TopConfidenceWidget
                  items={data?.topConfidence ?? []}
                />

                {/* Signal History Chart */}
                <HistoryChart history={data?.history ?? []} />

                {/* Cross-navigation widgets (desktop) */}
                <div className="hidden lg:flex flex-col gap-4">
                  <SurgeSideWidget />
                  <KimchiSideWidget />
                </div>
              </div>
            </div>

            {/* ── Section 4: Performance (Pro/Whale only) ── */}
            <PerformanceSection
              performance={data?.performance ?? null}
              isPro={isPro}
              onUpgrade={() => setShowLoginModal(true)}
            />
          </>
        )}

        {/* ── Mobile: 관련 기능 ── */}
        <div className="lg:hidden space-y-3">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            관련 기능
          </h3>
          <SurgeSideWidget />
          <KimchiSideWidget />
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-text-disabled text-center mt-4">
          Trading signals are for informational purposes only. Not financial
          advice. Past performance does not guarantee future results.
        </p>
      </div>

      <LoginPromptModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Sign in and upgrade to Pro to access 4H/1W timeframes and performance tracking"
      />
    </div>
  );
}

/* ── Summary Card ── */

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: typeof Activity;
  color: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", color)} />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <span className="text-xl font-bold font-num text-text-primary">
        {value}
      </span>
    </div>
  );
}

/* ── Signal Card (expandable) ── */

const SignalCard = memo(function SignalCard({
  signal,
}: {
  signal: EnrichedSignal;
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = SIGNAL_COLORS[signal.signal_type] ?? SIGNAL_COLORS.alert;
  const SignalIcon =
    signal.signal_type === "buy"
      ? TrendingUp
      : signal.signal_type === "sell"
        ? TrendingDown
        : Activity;

  const indicators = signal.indicators ?? {};
  const indicatorNames = Object.keys(indicators);

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border-default rounded-lg border-l-[3px] transition-all",
        colors.border
      )}
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 text-left"
        aria-expanded={expanded}
      >
        <SignalIcon className={cn("size-5 shrink-0", colors.text)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">
              {signal.token_symbol}
            </span>
            <span className="text-xs text-text-secondary truncate">
              {signal.token_name}
            </span>
          </div>
          <p className="text-xs text-text-secondary truncate mt-0.5">
            {signal.signal_name}
          </p>
        </div>

        {/* Confidence pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  signal.confidence >= 80
                    ? "bg-signal-success"
                    : signal.confidence >= 60
                      ? "bg-signal-warning"
                      : "bg-signal-danger"
                )}
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
            <span className="text-xs font-num text-text-secondary w-8 text-right">
              {signal.confidence}%
            </span>
          </div>

          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
              colors.badge
            )}
          >
            {signal.signal_type}
          </span>

          {expanded ? (
            <ChevronUp className="size-4 text-text-secondary" />
          ) : (
            <ChevronDown className="size-4 text-text-secondary" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border-default">
          <div className="pt-3 flex flex-col gap-3">
            {/* Description */}
            <p className="text-xs text-text-secondary">{signal.description}</p>

            {/* Price info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] uppercase text-text-disabled">
                  Price at Signal
                </span>
                <p className="text-sm font-num font-bold text-text-primary">
                  {formatCurrency(signal.price_at_signal)}
                </p>
              </div>
              {signal.currentPrice !== null && (
                <div>
                  <span className="text-[10px] uppercase text-text-disabled">
                    Current Price
                  </span>
                  <p className="text-sm font-num font-bold text-text-primary">
                    {formatCurrency(signal.currentPrice)}
                  </p>
                </div>
              )}
              {signal.priceChange !== null && (
                <div>
                  <span className="text-[10px] uppercase text-text-disabled">
                    Since Signal
                  </span>
                  <p
                    className={cn(
                      "text-sm font-num font-bold",
                      signal.priceChange >= 0
                        ? "text-signal-success"
                        : "text-signal-danger"
                    )}
                  >
                    {formatPercentage(signal.priceChange)}
                  </p>
                </div>
              )}
            </div>

            {/* Indicators + Tags */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag color="neutral">{signal.timeframe}</Tag>
              {indicatorNames.slice(0, 4).map((name) => (
                <Tag
                  key={name}
                  color={
                    indicators[name]?.direction === "bullish"
                      ? "success"
                      : indicators[name]?.direction === "bearish"
                        ? "danger"
                        : "info"
                  }
                >
                  {name}
                </Tag>
              ))}
            </div>

            {/* Indicator details */}
            {indicatorNames.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {indicatorNames.map((name) => (
                  <div key={name} className="flex items-start gap-2 text-xs">
                    <span className="text-text-secondary font-medium shrink-0">
                      {name}:
                    </span>
                    <span className="text-text-disabled">
                      {indicators[name]?.detail ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Time */}
            <span className="text-[10px] text-text-disabled">
              {timeAgo(signal.created_at)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

/* ── Heatmap Widget ── */

function HeatmapWidget({ items }: { items: HeatmapItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="size-4 text-accent-primary" />
        <h3 className="text-sm font-bold text-text-primary">
          Market Signal Map
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.slice(0, 9).map((item) => {
          const sentimentColor =
            item.sentiment > 0
              ? "border-signal-success/40 bg-signal-success/5"
              : item.sentiment < 0
                ? "border-signal-danger/40 bg-signal-danger/5"
                : "border-border-default bg-bg-tertiary";

          return (
            <div
              key={item.symbol}
              className={cn(
                "rounded-md border p-2.5 flex flex-col items-center gap-1 transition-colors",
                sentimentColor
              )}
            >
              <span className="text-xs font-bold text-text-primary">
                {item.symbol}
              </span>
              <span
                className={cn(
                  "text-[10px] font-num",
                  item.change24h >= 0
                    ? "text-signal-success"
                    : "text-signal-danger"
                )}
              >
                {formatPercentage(item.change24h)}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-signal-success font-num">
                  {item.buy}B
                </span>
                <span className="text-[9px] text-text-disabled">/</span>
                <span className="text-[9px] text-signal-danger font-num">
                  {item.sell}S
                </span>
              </div>
              {/* Confidence bar */}
              <div className="w-full h-1 bg-bg-primary rounded-full mt-1 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    item.avgConfidence >= 75
                      ? "bg-signal-success"
                      : item.avgConfidence >= 55
                        ? "bg-signal-warning"
                        : "bg-signal-danger"
                  )}
                  style={{ width: `${item.avgConfidence}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[9px] text-text-disabled">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-signal-success/30 border border-signal-success/50" />
          Bullish
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-signal-danger/30 border border-signal-danger/50" />
          Bearish
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-bg-tertiary border border-border-default" />
          Neutral
        </div>
      </div>
    </div>
  );
}

/* ── Top Confidence Widget ── */

function TopConfidenceWidget({ items }: { items: TopConfidenceSignal[] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="size-4 text-accent-primary" />
        <h3 className="text-sm font-bold text-text-primary">
          Top Confidence
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const colors =
            SIGNAL_COLORS[item.signalType] ?? SIGNAL_COLORS.alert;
          const pnlPct =
            item.priceAtSignal > 0
              ? ((item.currentPrice - item.priceAtSignal) /
                  item.priceAtSignal) *
                100
              : 0;

          return (
            <div
              key={item.id}
              className="flex items-center gap-2 py-1.5 border-b border-border-default last:border-0"
            >
              <span className="text-xs font-num text-text-disabled w-4">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-primary">
                    {item.symbol}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase px-1 py-0.5 rounded",
                      colors.badge
                    )}
                  >
                    {item.signalType}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary truncate">
                  {item.signalName}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-num font-bold text-accent-primary">
                  {item.confidence}%
                </span>
                <p
                  className={cn(
                    "text-[10px] font-num",
                    pnlPct >= 0 ? "text-signal-success" : "text-signal-danger"
                  )}
                >
                  {formatPercentage(pnlPct)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Signal History Chart ── */

function HistoryChart({
  history,
}: {
  history: { date: string; buy: number; sell: number; alert: number }[];
}) {
  if (history.length === 0) return null;

  const chartData = history.map((h) => ({
    ...h,
    date: h.date.slice(5), // MM-DD
  }));

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="size-4 text-accent-primary" />
        <h3 className="text-sm font-bold text-text-primary">Signal History</h3>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={1}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2B3139"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#848E9C", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#848E9C", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={24}
              allowDecimals={false}
            />
            <RechartsTooltip
              contentStyle={{
                background: "#1E2329",
                border: "1px solid #2B3139",
                borderRadius: 6,
                fontSize: 11,
              }}
              labelStyle={{ color: "#EAECEF" }}
            />
            <Bar dataKey="buy" stackId="a" fill={CHART_COLORS.buy} radius={[0, 0, 0, 0]} />
            <Bar dataKey="sell" stackId="a" fill={CHART_COLORS.sell} radius={[0, 0, 0, 0]} />
            <Bar dataKey="alert" stackId="a" fill={CHART_COLORS.alert} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2 text-[9px] text-text-disabled">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.buy }} />
          Buy
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.sell }} />
          Sell
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.alert }} />
          Alert
        </div>
      </div>
    </div>
  );
}

/* ── Performance Section (Pro/Whale gated) ── */

function PerformanceSection({
  performance,
  isPro,
  onUpgrade,
}: {
  performance: {
    totalSignals: number;
    winRate: number;
    avgPnl: number;
    bestSignal: { token_symbol: string; signal_name: string; pnl: number } | null;
    worstSignal: { token_symbol: string; signal_name: string; pnl: number } | null;
    recentPerformance: {
      symbol: string;
      signalType: SignalCategory;
      signalName: string;
      confidence: number;
      priceAtSignal: number;
      currentPrice: number;
      pnl: number;
    }[];
  } | null;
  isPro: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div className="relative">
      {/* Blur overlay for free users */}
      {!isPro && (
        <div className="absolute inset-0 z-10 backdrop-blur-sm bg-bg-primary/60 rounded-lg flex flex-col items-center justify-center gap-3">
          <Lock className="size-8 text-accent-primary" />
          <p className="text-sm font-medium text-text-primary">
            Signal Performance Tracking
          </p>
          <p className="text-xs text-text-secondary text-center max-w-xs">
            Upgrade to Pro to see win rate, PnL tracking, and detailed signal
            performance analytics.
          </p>
          <button
            onClick={onUpgrade}
            className="mt-1 px-4 py-2 bg-accent-primary text-bg-primary text-xs font-bold rounded-md hover:bg-accent-primary/90 transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="size-4 text-accent-primary" />
          <h3 className="text-sm font-bold text-text-primary">
            Signal Performance
          </h3>
        </div>

        {/* Performance overview cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <PerfCard
            label="Total Tracked"
            value={String(performance?.totalSignals ?? 0)}
          />
          <PerfCard
            label="Win Rate"
            value={`${performance?.winRate ?? 0}%`}
            color={
              (performance?.winRate ?? 0) >= 50
                ? "text-signal-success"
                : "text-signal-danger"
            }
          />
          <PerfCard
            label="Avg PnL"
            value={formatPercentage(performance?.avgPnl ?? 0)}
            color={
              (performance?.avgPnl ?? 0) >= 0
                ? "text-signal-success"
                : "text-signal-danger"
            }
          />
          <PerfCard
            label="Best Signal"
            value={
              performance?.bestSignal
                ? `${performance.bestSignal.token_symbol} ${formatPercentage(performance.bestSignal.pnl)}`
                : "—"
            }
            color="text-signal-success"
          />
        </div>

        {/* Recent performance table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-2 px-2 text-text-secondary font-medium">
                  Token
                </th>
                <th className="text-left py-2 px-2 text-text-secondary font-medium">
                  Signal
                </th>
                <th className="text-right py-2 px-2 text-text-secondary font-medium">
                  Conf
                </th>
                <th className="text-right py-2 px-2 text-text-secondary font-medium">
                  Entry
                </th>
                <th className="text-right py-2 px-2 text-text-secondary font-medium">
                  Current
                </th>
                <th className="text-right py-2 px-2 text-text-secondary font-medium">
                  PnL
                </th>
              </tr>
            </thead>
            <tbody>
              {(performance?.recentPerformance ?? []).map((p, i) => {
                const colors =
                  SIGNAL_COLORS[p.signalType] ?? SIGNAL_COLORS.alert;
                return (
                  <tr
                    key={i}
                    className="border-b border-border-default last:border-0 hover:bg-bg-tertiary/50"
                  >
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-text-primary">
                          {p.symbol}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase px-1 py-0.5 rounded",
                            colors.badge
                          )}
                        >
                          {p.signalType}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-text-secondary truncate max-w-32">
                      {p.signalName}
                    </td>
                    <td className="py-2 px-2 text-right font-num text-text-primary">
                      {p.confidence}%
                    </td>
                    <td className="py-2 px-2 text-right font-num text-text-primary">
                      {formatCurrency(p.priceAtSignal)}
                    </td>
                    <td className="py-2 px-2 text-right font-num text-text-primary">
                      {formatCurrency(p.currentPrice)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span
                        className={cn(
                          "font-num font-bold inline-flex items-center gap-0.5",
                          p.pnl >= 0
                            ? "text-signal-success"
                            : "text-signal-danger"
                        )}
                      >
                        {p.pnl >= 0 ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {formatPercentage(p.pnl)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(performance?.recentPerformance ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-text-disabled"
                  >
                    No performance data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Perf Card ── */

function PerfCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-bg-tertiary/50 rounded-md p-3">
      <span className="text-[10px] uppercase text-text-disabled">{label}</span>
      <p
        className={cn("text-base font-num font-bold mt-0.5", color ?? "text-text-primary")}
      >
        {value}
      </p>
    </div>
  );
}
