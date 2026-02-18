"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  memo,
} from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Lock,
  Loader2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyAddress } from "@/components/ui/copy-address";
import { useAuthStore } from "@/stores/auth-store";
import { ACCESS_MATRIX } from "@/lib/subscription";
import { LoginPromptModal } from "@/components/login-prompt-modal";
import { SurgeSideWidget, KimchiSideWidget } from "@/components/widgets";
import {
  useWhaleFeed,
  useWhaleStats,
  type WhaleFilters,
  type WhaleStats,
  type WhaleAsset,
  type WhaleTopMover,
  type WhaleTrendPoint,
} from "@/hooks/use-whale-feed";
import type { WhaleEventRow } from "@/hooks/use-alerts";

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */

const CHAIN_COLORS: Record<string, string> = {
  bitcoin: "#F7931A",
  ethereum: "#627EEA",
  solana: "#9945FF",
  tron: "#FF0013",
  bnb: "#F0B90B",
  polygon: "#8247E5",
  avalanche: "#E84142",
  arbitrum: "#28A0F0",
};

const CHAIN_OPTIONS = [
  { value: "all", label: "All Chains" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "ethereum", label: "Ethereum" },
  { value: "solana", label: "Solana" },
  { value: "tron", label: "Tron" },
];

const AMOUNT_OPTIONS = [
  { value: "0", label: "All" },
  { value: "100000", label: "$100K+" },
  { value: "500000", label: "$500K+" },
  { value: "1000000", label: "$1M+" },
  { value: "10000000", label: "$10M+" },
  { value: "100000000", label: "$100M+" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "exchange_deposit", label: "Exchange Deposit" },
  { value: "exchange_withdrawal", label: "Exchange Withdrawal" },
  { value: "transfer", label: "Transfer" },
];

const PERIOD_OPTIONS = [
  { value: "1h", label: "1H" },
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "CRITICAL", color: "bg-signal-danger/15 text-signal-danger border-signal-danger/30" },
  high: { label: "HIGH", color: "bg-signal-warning/15 text-signal-warning border-signal-warning/30" },
  medium: { label: "MEDIUM", color: "bg-accent-primary/15 text-accent-primary border-accent-primary/30" },
};

function getSeverity(usdValue: number): string {
  if (usdValue >= 100_000_000) return "critical";
  if (usdValue >= 25_000_000) return "high";
  return "medium";
}

function getExplorerUrl(blockchain: string, txHash: string): string {
  const explorers: Record<string, string> = {
    bitcoin: `https://mempool.space/tx/${txHash}`,
    ethereum: `https://etherscan.io/tx/${txHash}`,
    solana: `https://solscan.io/tx/${txHash}`,
    tron: `https://tronscan.org/#/transaction/${txHash}`,
    bnb: `https://bscscan.com/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`,
    avalanche: `https://snowtrace.io/tx/${txHash}`,
  };
  return explorers[blockchain.toLowerCase()] ?? `https://etherscan.io/tx/${txHash}`;
}

function getAddressExplorerUrl(blockchain: string, address: string): string {
  const explorers: Record<string, string> = {
    bitcoin: `https://mempool.space/address/${address}`,
    ethereum: `https://etherscan.io/address/${address}`,
    solana: `https://solscan.io/account/${address}`,
    tron: `https://tronscan.org/#/address/${address}`,
  };
  return explorers[blockchain.toLowerCase()] ?? `https://etherscan.io/address/${address}`;
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function WhalePage() {
  const [filters, setFilters] = useState<WhaleFilters>({
    blockchain: "all",
    minAmount: 0,
    eventType: "all",
    period: "24h",
  });
  const [loginModal, setLoginModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isPro = useAuthStore((s) => s.isPro);

  const feedQuery = useWhaleFeed(filters);
  const { data: stats, isLoading: statsLoading } = useWhaleStats(filters);

  const allEvents = useMemo(
    () => feedQuery.data?.pages.flatMap((p) => p.events) ?? [],
    [feedQuery.data?.pages]
  );

  const freeLimit = ACCESS_MATRIX.whale_tracker.free.maxEvents;
  const events = isPro ? allEvents : allEvents.slice(0, freeLimit);
  const hasLockedEvents = !isPro && allEvents.length > freeLimit;

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
          feedQuery.fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [feedQuery.hasNextPage, feedQuery.isFetchingNextPage, feedQuery.fetchNextPage]);

  const updateFilter = useCallback(
    <K extends keyof WhaleFilters>(key: K, value: WhaleFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 space-y-5 max-w-360 w-full mx-auto">
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Whale Tracker
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Real-time large transaction monitoring across major blockchains
          </p>
        </div>

        {/* ── Filter Bar ── */}
        <FilterBar
          filters={filters}
          onUpdate={updateFilter}
        />

        {/* ── Main Content: Feed + Sidebar ── */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Feed (70%) */}
          <div className="flex-1 lg:w-[70%] space-y-3">
            {feedQuery.isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 text-text-secondary text-sm">
                No whale events found for the selected filters.
              </div>
            ) : (
              events.map((event) => (
                <WhaleEventCard
                  key={event.id}
                  event={event}
                  onTrackWallet={() => {
                    if (!user) setLoginModal(true);
                  }}
                  isAuthed={!!user}
                />
              ))
            )}

            {/* Free user upgrade gate */}
            {hasLockedEvents && (
              <div className="relative">
                <div className="blur-sm select-none pointer-events-none opacity-50" aria-hidden>
                  <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 bg-bg-tertiary rounded-md" />
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-center px-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary/10">
                      <Lock className="w-5 h-5 text-accent-primary" />
                    </div>
                    <p className="text-sm text-text-secondary">
                      Free 유저는 최근 <span className="font-medium text-text-primary">{freeLimit}건</span>까지 확인 가능합니다
                    </p>
                    <p className="text-xs text-text-disabled">
                      Free: 5분 지연 · Pro: 실시간 전체 이벤트
                    </p>
                    <Link
                      href="/billing"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      Pro로 전체 보기
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Infinite scroll sentinel (Pro only) */}
            {isPro && <div ref={sentinelRef} className="h-1" />}
            {!isPro && <div ref={sentinelRef} className="h-0" />}
            {feedQuery.isFetchingNextPage && isPro && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
              </div>
            )}
          </div>

          {/* Sidebar (30%) */}
          <div className="lg:w-[30%] space-y-4">
            <SummaryWidget stats={stats} loading={statsLoading} />
            <FlowWidget stats={stats} loading={statsLoading} />
            <TopMoversWidget movers={stats?.topMovers ?? []} loading={statsLoading} />
            <AssetBreakdownWidget assets={stats?.assetBreakdown ?? []} loading={statsLoading} />
            {/* Cross-navigation widgets (desktop) */}
            <div className="hidden lg:flex flex-col gap-4">
              <SurgeSideWidget />
              <KimchiSideWidget />
            </div>
          </div>
        </div>

        {/* ── Trend Chart (full width) ── */}
        <TrendChart
          data={stats?.trend ?? []}
          loading={statsLoading}
          period={filters.period}
        />

        {/* ── Mobile: 관련 기능 ── */}
        <div className="lg:hidden space-y-3">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            관련 기능
          </h3>
          <SurgeSideWidget />
          <KimchiSideWidget />
        </div>
      </div>

      <LoginPromptModal
        open={loginModal}
        onClose={() => setLoginModal(false)}
        message="Sign in to track this wallet"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Filter Bar
   ═══════════════════════════════════════════════ */

function FilterBar({
  filters,
  onUpdate,
}: {
  filters: WhaleFilters;
  onUpdate: <K extends keyof WhaleFilters>(key: K, value: WhaleFilters[K]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        value={filters.blockchain}
        options={CHAIN_OPTIONS}
        onChange={(v) => onUpdate("blockchain", v)}
      />
      <FilterSelect
        value={String(filters.minAmount)}
        options={AMOUNT_OPTIONS}
        onChange={(v) => onUpdate("minAmount", Number(v))}
      />
      <FilterSelect
        value={filters.eventType}
        options={TYPE_OPTIONS}
        onChange={(v) => onUpdate("eventType", v)}
      />
      <div className="flex items-center gap-1 p-0.5 bg-bg-secondary rounded-lg border border-border-default ml-auto">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onUpdate("period", opt.value)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              filters.period === opt.value
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-border-active cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ═══════════════════════════════════════════════
   Whale Event Card
   ═══════════════════════════════════════════════ */

const WhaleEventCard = memo(function WhaleEventCard({
  event,
  onTrackWallet,
  isAuthed,
}: {
  event: WhaleEventRow;
  onTrackWallet: () => void;
  isAuthed: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const severity = getSeverity(event.usd_value);
  const sevConfig = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.medium;
  const chainColor = CHAIN_COLORS[event.blockchain.toLowerCase()] ?? "#848E9C";
  const explorerUrl = getExplorerUrl(event.blockchain, event.tx_hash);

  const fromDisplay = event.from_label || null;
  const toDisplay = event.to_label || null;

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border-default rounded-lg transition-colors",
        "hover:border-border-active/50 cursor-pointer"
      )}
    >
      {/* Main row */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        {/* Chain icon */}
        <div
          className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
          style={{ backgroundColor: `${chainColor}20`, color: chainColor }}
        >
          {event.blockchain.slice(0, 3).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[15px] font-semibold text-text-primary truncate">
            {formatNumber(event.amount, event.amount >= 1 ? 0 : 2)}{" "}
            {event.symbol} transferred
          </p>

          <p className="text-sm text-text-secondary truncate">
            <span className={fromDisplay ? "text-accent-secondary" : ""}>
              {fromDisplay ? `[${fromDisplay}]` : (event.from_address ? `${event.from_address.slice(0, 8)}...${event.from_address.slice(-4)}` : "Unknown")}
            </span>
            <span className="mx-1.5 text-text-disabled">→</span>
            <span className={toDisplay ? "text-accent-secondary" : ""}>
              {toDisplay ? `[${toDisplay}]` : (event.to_address ? `${event.to_address.slice(0, 8)}...${event.to_address.slice(-4)}` : "Unknown")}
            </span>
          </p>

          <p className="text-xs text-text-secondary">
            <span className="font-num">{formatCurrency(event.usd_value, 1)}</span>
            <span className="mx-1.5">·</span>
            <span>{timeAgo(event.detected_at)}</span>
            <span className="mx-1.5">·</span>
            <span className="capitalize">{event.blockchain}</span>
          </p>
        </div>

        {/* Severity + expand icon */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded border",
              sevConfig.color
            )}
          >
            {sevConfig.label}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border-default/50 space-y-3">
          {/* Metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-text-secondary text-xs">Transaction Hash</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-num text-xs text-text-primary truncate max-w-50">
                  {event.tx_hash}
                </span>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-secondary hover:text-accent-secondary/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <div>
              <span className="text-text-secondary text-xs">Event Type</span>
              <p className="font-medium text-xs text-text-primary capitalize mt-0.5">
                {event.event_type.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* From/To full addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {event.from_address && (
              <div className="bg-bg-tertiary rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">From</span>
                  {event.from_label && (
                    <Badge variant="info" className="text-[10px]">{event.from_label}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CopyAddress address={event.from_address} chars={6} />
                  <a
                    href={getAddressExplorerUrl(event.blockchain, event.from_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-secondary hover:text-accent-secondary/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
            {event.to_address && (
              <div className="bg-bg-tertiary rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">To</span>
                  {event.to_label && (
                    <Badge variant="info" className="text-[10px]">{event.to_label}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <CopyAddress address={event.to_address} chars={6} />
                  <a
                    href={getAddressExplorerUrl(event.blockchain, event.to_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-secondary hover:text-accent-secondary/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Track wallet button */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (!isAuthed) onTrackWallet();
            }}
            className="text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            Track this wallet
          </Button>
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Sidebar Widgets
   ═══════════════════════════════════════════════ */

function WidgetShell({
  title,
  loading,
  children,
}: {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
        {title}
      </h3>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* Widget A: 24h Summary */
function SummaryWidget({
  stats,
  loading,
}: {
  stats?: WhaleStats;
  loading: boolean;
}) {
  const s = stats?.summary;
  return (
    <WidgetShell title="Summary" loading={loading}>
      <div className="space-y-3">
        <div>
          <p className="text-2xl font-bold font-num text-text-primary">
            {s?.totalCount ?? 0}
          </p>
          <p className="text-xs text-text-secondary">whale transfers</p>
        </div>
        <div>
          <p className="text-2xl font-bold font-num text-text-primary">
            {formatCurrency(s?.totalVolume ?? 0, 1)}
          </p>
          <p className="text-xs text-text-secondary">total volume moved</p>
        </div>
        {s?.largest && (
          <div className="bg-bg-tertiary rounded-lg p-3">
            <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">
              Largest Single TX
            </p>
            <p className="text-sm font-bold font-num text-text-primary">
              {formatNumber(s.largest.amount, 0)} {s.largest.symbol}
            </p>
            <p className="text-xs text-text-secondary font-num">
              {formatCurrency(s.largest.usdValue, 1)}
            </p>
          </div>
        )}
      </div>
    </WidgetShell>
  );
}

/* Widget B: Flow Direction */
function FlowWidget({
  stats,
  loading,
}: {
  stats?: WhaleStats;
  loading: boolean;
}) {
  const flow = stats?.flow;
  const total = (flow?.inflow ?? 0) + (flow?.outflow ?? 0);
  const inflowPct = total > 0 ? ((flow?.inflow ?? 0) / total) * 100 : 50;
  const outflowPct = total > 0 ? ((flow?.outflow ?? 0) / total) * 100 : 50;
  const netIsOutflow = (flow?.netFlow ?? 0) > 0;

  return (
    <WidgetShell title="Exchange Flow" loading={loading}>
      <div className="space-y-3">
        {/* Inflow */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-signal-danger">
              <ArrowDownRight className="w-3 h-3" />
              Inflow
            </span>
            <span className="font-num text-text-primary">
              {formatCurrency(flow?.inflow ?? 0, 1)}
            </span>
          </div>
          <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-signal-danger rounded-full transition-all"
              style={{ width: `${inflowPct}%` }}
            />
          </div>
        </div>

        {/* Outflow */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-signal-success">
              <ArrowUpRight className="w-3 h-3" />
              Outflow
            </span>
            <span className="font-num text-text-primary">
              {formatCurrency(flow?.outflow ?? 0, 1)}
            </span>
          </div>
          <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-signal-success rounded-full transition-all"
              style={{ width: `${outflowPct}%` }}
            />
          </div>
        </div>

        {/* Net flow */}
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Net Flow</p>
          <p
            className={cn(
              "text-sm font-bold font-num",
              netIsOutflow ? "text-signal-success" : "text-signal-danger"
            )}
          >
            {netIsOutflow ? "+" : "-"}
            {formatCurrency(Math.abs(flow?.netFlow ?? 0), 1)}{" "}
            {netIsOutflow ? "outflow" : "inflow"}
          </p>
          <p className="text-[11px] text-text-secondary mt-1">
            {netIsOutflow
              ? "Accumulation signal — exchange outflow dominant"
              : "Sell pressure — exchange inflow dominant"}
          </p>
        </div>
      </div>
    </WidgetShell>
  );
}

/* Widget C: Top Movers */
function TopMoversWidget({
  movers,
  loading,
}: {
  movers: WhaleTopMover[];
  loading: boolean;
}) {
  const maxVol = movers[0]?.volume ?? 1;

  return (
    <WidgetShell title="Top Movers by Entity" loading={loading}>
      {movers.length === 0 ? (
        <p className="text-xs text-text-disabled">No data</p>
      ) : (
        <div className="space-y-2.5">
          {movers.map((m) => (
            <div key={m.entity}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-primary font-medium truncate mr-2">
                  {m.entity}
                </span>
                <span className="text-text-secondary font-num shrink-0">
                  {m.count} tx · {formatCurrency(m.volume, 1)}
                </span>
              </div>
              <div className="h-1 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-secondary rounded-full"
                  style={{ width: `${(m.volume / maxVol) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

/* Widget D: Asset Breakdown */
function AssetBreakdownWidget({
  assets,
  loading,
}: {
  assets: WhaleAsset[];
  loading: boolean;
}) {
  const COLORS = ["#F0B90B", "#1E88E5", "#0ECB81", "#F6465D", "#9945FF", "#627EEA"];

  return (
    <WidgetShell title="Asset Breakdown" loading={loading}>
      {assets.length === 0 ? (
        <p className="text-xs text-text-disabled">No data</p>
      ) : (
        <div className="space-y-2">
          {/* Stacked bar */}
          <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden flex">
            {assets.map((a, i) => (
              <div
                key={a.symbol}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${a.percentage}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 mt-2">
            {assets.slice(0, 6).map((a, i) => (
              <div key={a.symbol} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-text-primary font-medium">{a.symbol}</span>
                </div>
                <span className="text-text-secondary font-num">
                  {a.percentage.toFixed(1)}% ({formatCurrency(a.volume, 1)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}

/* ═══════════════════════════════════════════════
   Trend Chart
   ═══════════════════════════════════════════════ */

function TrendChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 shadow-lg">
      <p className="text-text-secondary text-[10px] mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs font-num" style={{ color: entry.color }}>
          {entry.name}: {entry.name === "Volume" ? formatCurrency(entry.value, 1) : entry.value}
        </p>
      ))}
    </div>
  );
}

function TrendChart({
  data,
  loading,
  period,
}: {
  data: WhaleTrendPoint[];
  loading: boolean;
  period: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Whale Activity Trend
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Transaction count vs. volume over time
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-accent-primary" />
            <span className="text-text-secondary">Count</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-sm bg-accent-secondary" />
            <span className="text-text-secondary">Volume</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex justify-center py-16 text-sm text-text-disabled">
          No trend data available
        </div>
      ) : (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} barGap={0}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#2B3139"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#848E9C", fontSize: 10 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis
                yAxisId="count"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#848E9C", fontSize: 10 }}
                width={35}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#848E9C", fontSize: 10 }}
                width={50}
                tickFormatter={(v: number) => formatCurrency(v, 0)}
              />
              <Tooltip content={<TrendChartTooltip />} />
              <Bar
                yAxisId="count"
                dataKey="count"
                name="Count"
                fill="#F0B90B"
                radius={[2, 2, 0, 0]}
                opacity={0.7}
                barSize={20}
              />
              <Line
                yAxisId="volume"
                dataKey="volume"
                name="Volume"
                stroke="#1E88E5"
                strokeWidth={2}
                dot={false}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
