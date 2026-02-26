"use client";

import { useState, useMemo, memo } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
  ReferenceLine,
} from "recharts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercentage, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { useAuthStore } from "@/stores/auth-store";
import { LoginPromptModal } from "@/components/login-prompt-modal";
import { SurgeSideWidget, ListingSideWidget } from "@/components/widgets";
import {
  useRiskDashboard,
  useFearGreed,
  type RiskFilters,
  type RiskOverview,
  type DefiProtocol,
  type StablecoinInfo,
  type FearGreedData,
} from "@/hooks/use-risk";
import { SEVERITY_CARD } from "@/lib/constants";
import type { AlertEvent, Severity } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  lending: "bg-accent-secondary/15 text-accent-secondary",
  dex: "bg-signal-success/15 text-signal-success",
  yield: "bg-accent-primary/15 text-accent-primary",
  "liquid staking": "bg-signal-info/15 text-signal-info",
  bridge: "bg-signal-warning/15 text-signal-warning",
  derivatives: "bg-signal-danger/15 text-signal-danger",
};

function getProtocolRiskLevel(change24h: number): {
  label: string;
  variant: "success" | "warning" | "danger" | "neutral";
} {
  if (change24h <= -30)
    return { label: "Critical", variant: "danger" };
  if (change24h <= -10)
    return { label: "Warning", variant: "warning" };
  if (change24h <= -5)
    return { label: "Caution", variant: "warning" };
  return { label: "Normal", variant: "success" };
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function RiskPage() {
  const [filters, setFilters] = useState<RiskFilters>({
    search: "",
    category: "all",
    chain: "all",
    sort: "tvl",
    order: "desc",
  });
  const [loginModal, setLoginModal] = useState(false);
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useRiskDashboard(filters);
  const { data: fearGreed } = useFearGreed();

  const overview = data?.overview;
  const protocols = data?.protocols ?? [];
  const stablecoins = data?.stablecoins ?? [];
  const riskEvents = data?.riskEvents ?? [];
  const filterOptions = data?.filterOptions;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 space-y-5 max-w-360 w-full mx-auto">
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            DeFi Risk Monitor
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Protocol health, stablecoin stability, and risk alert tracking
          </p>
        </div>

        {/* ── Section 1: Overview Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TvlCard
            tvl={overview?.totalTvl ?? 0}
            change={overview?.avgTvlChange24h ?? 0}
            loading={isLoading}
          />
          <StablecoinHealthCard
            depeggedCount={overview?.depeggedCount ?? 0}
            depeggedCoins={overview?.depeggedCoins ?? []}
            loading={isLoading}
          />
          <AlertCountCard
            breakdown={overview?.alertBreakdown}
            loading={isLoading}
          />
          <FearGreedCard data={fearGreed} />
        </div>

        {/* ── Section 2 + 3: Protocols + Stablecoins ── */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Protocols (60%) */}
          <div className="flex-1 lg:w-[60%] space-y-3">
            <ProtocolSection
              protocols={protocols}
              filters={filters}
              filterOptions={filterOptions}
              loading={isLoading}
              onFiltersChange={setFilters}
              onSetAlert={(protocolName) => {
                if (!user) {
                  setLoginModal(true);
                } else {
                  router.push(`/alerts?protocol=${encodeURIComponent(protocolName)}`);
                }
              }}
              isAuthed={!!user}
            />
          </div>

          {/* Stablecoins (40%) */}
          <div className="lg:w-[40%] space-y-3">
            <StablecoinSection stablecoins={stablecoins} loading={isLoading} />
            {/* Cross-navigation widgets (desktop) */}
            <div className="hidden lg:flex flex-col gap-3">
              <SurgeSideWidget />
              <ListingSideWidget />
            </div>
          </div>
        </div>

        {/* ── Section 4: Risk Alert Feed ── */}
        <RiskAlertFeed events={riskEvents} loading={isLoading} />

        {/* ── Mobile: 관련 기능 ── */}
        <div className="lg:hidden space-y-3">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            관련 기능
          </h3>
          <SurgeSideWidget />
          <ListingSideWidget />
        </div>
      </div>

      <LoginPromptModal
        open={loginModal}
        onClose={() => setLoginModal(false)}
        message="Sign in to set up custom risk alerts"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Section 1: Overview Cards
   ═══════════════════════════════════════════════ */

function OverviewCard({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
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

function TvlCard({
  tvl,
  change,
  loading,
}: {
  tvl: number;
  change: number;
  loading: boolean;
}) {
  return (
    <OverviewCard loading={loading}>
      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
        Total DeFi TVL
      </p>
      <p className="text-2xl font-bold font-num text-text-primary">
        {formatCurrency(tvl, 1)}
      </p>
      <p
        className={cn(
          "text-xs font-num mt-1",
          change >= 0 ? "text-signal-success" : "text-signal-danger"
        )}
      >
        {formatPercentage(change)} (24h avg)
      </p>
    </OverviewCard>
  );
}

function StablecoinHealthCard({
  depeggedCount,
  depeggedCoins,
  loading,
}: {
  depeggedCount: number;
  depeggedCoins: string[];
  loading: boolean;
}) {
  return (
    <OverviewCard loading={loading}>
      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
        Stablecoin Health
      </p>
      {depeggedCount === 0 ? (
        <>
          <p className="text-lg font-bold text-signal-success">All Stable</p>
          <p className="text-xs text-text-secondary mt-1">No depeg warnings</p>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-signal-warning">
            {depeggedCount} Depeg Warning{depeggedCount > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-signal-warning mt-1">
            {depeggedCoins.join(", ")}
          </p>
        </>
      )}
    </OverviewCard>
  );
}

function AlertCountCard({
  breakdown,
  loading,
}: {
  breakdown?: RiskOverview["alertBreakdown"];
  loading: boolean;
}) {
  return (
    <OverviewCard loading={loading}>
      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
        Risk Alerts (24h)
      </p>
      <p className="text-2xl font-bold font-num text-text-primary">
        {breakdown?.total ?? 0}
      </p>
      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
        {(breakdown?.critical ?? 0) > 0 && (
          <span className="text-signal-danger font-medium">
            {breakdown!.critical} critical
          </span>
        )}
        {(breakdown?.high ?? 0) > 0 && (
          <span className="text-signal-warning font-medium">
            {breakdown!.high} high
          </span>
        )}
        {(breakdown?.medium ?? 0) > 0 && (
          <span className="text-accent-primary font-medium">
            {breakdown!.medium} medium
          </span>
        )}
      </div>
    </OverviewCard>
  );
}

/* Fear & Greed Gauge */
function FearGreedCard({ data }: { data?: FearGreedData }) {
  const value = data?.value ?? 50;
  const label = data?.label ?? "Neutral";

  // Color based on value
  const getColor = (v: number) => {
    if (v <= 25) return "#F6465D";
    if (v <= 45) return "#F0B90B";
    if (v <= 55) return "#848E9C";
    if (v <= 75) return "#0ECB81";
    return "#0ECB81";
  };

  const color = getColor(value);
  // Semi-circle gauge: rotation from -90 to +90 degrees
  const rotation = -90 + (value / 100) * 180;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
        Fear & Greed Index
      </p>
      <div className="flex items-center gap-3">
        {/* Gauge */}
        <div className="relative w-16 h-8 shrink-0">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="#2B3139"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Colored arc */}
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(value / 100) * 141.37} 141.37`}
            />
            {/* Needle */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="15"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${rotation} 50 50)`}
            />
            <circle cx="50" cy="50" r="3" fill={color} />
          </svg>
        </div>
        <div>
          <p className="text-xl font-bold font-num" style={{ color }}>
            {value}
          </p>
          <p className="text-[10px] text-text-secondary">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Section 2: Protocol Health Table
   ═══════════════════════════════════════════════ */

function ProtocolSection({
  protocols,
  filters,
  filterOptions,
  loading,
  onFiltersChange,
  onSetAlert,
  isAuthed,
}: {
  protocols: DefiProtocol[];
  filters: RiskFilters;
  filterOptions?: { categories: string[]; chains: string[] };
  loading: boolean;
  onFiltersChange: (f: RiskFilters) => void;
  onSetAlert: (protocolName: string) => void;
  isAuthed: boolean;
}) {
  const toggleSort = (field: string) => {
    if (filters.sort === field) {
      onFiltersChange({
        ...filters,
        order: filters.order === "desc" ? "asc" : "desc",
      });
    } else {
      onFiltersChange({ ...filters, sort: field, order: "desc" });
    }
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border-default">
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          DeFi Protocol Health
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-disabled" />
            <input
              type="text"
              placeholder="Search protocols..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="w-full bg-bg-tertiary border border-border-default rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-disabled outline-none focus:border-border-active"
            />
          </div>
          {/* Category */}
          <select
            value={filters.category}
            onChange={(e) =>
              onFiltersChange({ ...filters, category: e.target.value })
            }
            className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-border-active cursor-pointer"
          >
            <option value="all">All Categories</option>
            {filterOptions?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {/* Chain */}
          <select
            value={filters.chain}
            onChange={(e) =>
              onFiltersChange({ ...filters, chain: e.target.value })
            }
            className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-border-active cursor-pointer capitalize"
          >
            <option value="all">All Chains</option>
            {filterOptions?.chains.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
        </div>
      ) : protocols.length === 0 ? (
        <div className="text-center py-16 text-sm text-text-disabled">
          No protocols found
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="px-4 py-3 text-left text-text-secondary font-medium w-8">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-text-secondary font-medium">
                    Protocol
                  </th>
                  <th className="px-4 py-3 text-left text-text-secondary font-medium">
                    Category
                  </th>
                  <SortableHeader
                    label="TVL"
                    field="tvl"
                    current={filters.sort}
                    order={filters.order}
                    onClick={toggleSort}
                  />
                  <SortableHeader
                    label="24h"
                    field="change_24h"
                    current={filters.sort}
                    order={filters.order}
                    onClick={toggleSort}
                  />
                  <SortableHeader
                    label="7d"
                    field="change_7d"
                    current={filters.sort}
                    order={filters.order}
                    onClick={toggleSort}
                  />
                  <th className="px-4 py-3 text-right text-text-secondary font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {protocols.map((p, i) => (
                  <ProtocolRow
                    key={p.id}
                    protocol={p}
                    rank={i + 1}
                    onSetAlert={onSetAlert}
                    isAuthed={isAuthed}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-border-default/50">
            {protocols.map((p, i) => (
              <ProtocolMobileCard
                key={p.id}
                protocol={p}
                rank={i + 1}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  field,
  current,
  order,
  onClick,
}: {
  label: string;
  field: string;
  current: string;
  order: string;
  onClick: (field: string) => void;
}) {
  const isActive = current === field;
  return (
    <th className="px-4 py-3 text-right">
      <button
        type="button"
        onClick={() => onClick(field)}
        className={cn(
          "inline-flex items-center gap-1 font-medium",
          isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
        )}
      >
        {label}
        {isActive &&
          (order === "desc" ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronUp className="w-3 h-3" />
          ))}
      </button>
    </th>
  );
}

const ProtocolRow = memo(function ProtocolRow({
  protocol: p,
  rank,
  onSetAlert,
  isAuthed,
}: {
  protocol: DefiProtocol;
  rank: number;
  onSetAlert: (protocolName: string) => void;
  isAuthed: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const risk = getProtocolRiskLevel(p.tvl_change_24h);
  const catClass =
    CATEGORY_COLORS[p.category?.toLowerCase() ?? ""] ??
    "bg-bg-tertiary text-text-secondary";

  return (
    <>
      <tr
        className="border-b border-border-default/50 hover:bg-bg-tertiary/50 cursor-pointer transition-colors"
        onClick={() => setExpanded((x) => !x)}
      >
        <td className="px-4 py-3 text-text-disabled font-num">{rank}</td>
        <td className="px-4 py-3">
          <p className="text-text-primary font-medium">{p.protocol_name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {(p.chains ?? []).slice(0, 3).map((c) => (
              <span
                key={c}
                className="text-[9px] text-text-disabled capitalize bg-bg-tertiary px-1.5 py-0.5 rounded"
              >
                {c}
              </span>
            ))}
            {(p.chains ?? []).length > 3 && (
              <span className="text-[9px] text-text-disabled">
                +{p.chains.length - 3}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded capitalize",
              catClass
            )}
          >
            {p.category ?? "—"}
          </span>
        </td>
        <td className="px-4 py-3 text-right font-num text-text-primary">
          {formatCurrency(p.tvl, 1)}
        </td>
        <td
          className={cn(
            "px-4 py-3 text-right font-num",
            p.tvl_change_24h >= 0
              ? "text-signal-success"
              : "text-signal-danger"
          )}
        >
          {formatPercentage(p.tvl_change_24h)}
        </td>
        <td
          className={cn(
            "px-4 py-3 text-right font-num",
            p.tvl_change_7d >= 0
              ? "text-signal-success"
              : "text-signal-danger"
          )}
        >
          {formatPercentage(p.tvl_change_7d)}
        </td>
        <td className="px-4 py-3 text-right">
          <StatusDot variant={risk.variant} label={risk.label} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-3 bg-bg-tertiary/30">
            <div className="flex flex-wrap items-center gap-3">
              {/* Chain breakdown */}
              <div className="flex-1 min-w-40">
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
                  Chain Distribution
                </p>
                <div className="space-y-1">
                  {(p.chains ?? []).map((c, i) => (
                    <div
                      key={c}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-text-primary capitalize">{c}</span>
                      <div className="h-1 flex-1 mx-3 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-secondary rounded-full"
                          style={{
                            width: `${Math.max(100 / (p.chains ?? []).length, 10)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetAlert(p.protocol_name);
                }}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Set Alert for {p.protocol_name}
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

function ProtocolMobileCard({
  protocol: p,
  rank,
}: {
  protocol: DefiProtocol;
  rank: number;
}) {
  const risk = getProtocolRiskLevel(p.tvl_change_24h);
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-text-disabled text-xs font-num">#{rank}</span>
          <span className="text-text-primary font-medium text-sm">
            {p.protocol_name}
          </span>
        </div>
        <StatusDot variant={risk.variant} label={risk.label} />
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div>
          <span className="text-text-secondary">TVL: </span>
          <span className="font-num text-text-primary">
            {formatCurrency(p.tvl, 1)}
          </span>
        </div>
        <div>
          <span className="text-text-secondary">24h: </span>
          <span
            className={cn(
              "font-num",
              p.tvl_change_24h >= 0
                ? "text-signal-success"
                : "text-signal-danger"
            )}
          >
            {formatPercentage(p.tvl_change_24h)}
          </span>
        </div>
        <div>
          <span className="text-text-secondary">7d: </span>
          <span
            className={cn(
              "font-num",
              p.tvl_change_7d >= 0
                ? "text-signal-success"
                : "text-signal-danger"
            )}
          >
            {formatPercentage(p.tvl_change_7d)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Section 3: Stablecoin Monitor
   ═══════════════════════════════════════════════ */

function StablecoinSection({
  stablecoins,
  loading,
}: {
  stablecoins: StablecoinInfo[];
  loading: boolean;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg">
      <div className="p-4 border-b border-border-default">
        <h2 className="text-sm font-semibold text-text-primary">
          Stablecoin Monitor
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
        </div>
      ) : stablecoins.length === 0 ? (
        <div className="text-center py-16 text-sm text-text-disabled">
          No stablecoin data
        </div>
      ) : (
        <div className="divide-y divide-border-default/50">
          {stablecoins.map((s) => (
            <StablecoinCard key={s.id} coin={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function StablecoinCard({ coin }: { coin: StablecoinInfo }) {
  const deviation = coin.peg_deviation;
  const absDeviation = Math.abs(deviation);
  const devColor =
    absDeviation >= 1
      ? "text-signal-danger"
      : absDeviation >= 0.3
        ? "text-signal-warning"
        : "text-signal-success";
  const barColor =
    absDeviation >= 1
      ? "bg-signal-danger"
      : absDeviation >= 0.3
        ? "bg-signal-warning"
        : "bg-signal-success";

  // Map deviation to bar position: -2% to +2% mapped to 0% to 100%
  const position = Math.max(0, Math.min(100, ((deviation + 2) / 4) * 100));

  return (
    <div
      className={cn(
        "p-4 space-y-3 transition-colors",
        coin.is_depegged && "border-l-2 border-l-signal-danger bg-signal-danger/5"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center text-[10px] font-bold text-text-primary">
            {coin.symbol.slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {coin.symbol}
            </p>
            <p className="text-[10px] text-text-secondary">{coin.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-num font-medium text-text-primary">
            ${coin.current_price.toFixed(4)}
          </p>
          {coin.is_depegged && (
            <span className="text-[9px] font-bold text-signal-danger uppercase animate-pulse">
              DEPEG
            </span>
          )}
        </div>
      </div>

      {/* Peg Deviation Bar */}
      <div>
        <div className="relative h-2 bg-bg-tertiary rounded-full">
          {/* Center line (1.00) */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-text-disabled/30" />
          {/* Position indicator */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-bg-secondary",
              barColor
            )}
            style={{ left: `calc(${position}% - 6px)` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1 text-[9px] text-text-disabled">
          <span>$0.98</span>
          <span>$1.00</span>
          <span>$1.02</span>
        </div>
      </div>

      {/* Deviation text */}
      <p className={cn("text-xs font-num", devColor)}>
        Deviation: {deviation >= 0 ? "+" : ""}
        {deviation.toFixed(3)}%
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Section 4: Risk Alert Feed
   ═══════════════════════════════════════════════ */

function RiskAlertFeed({
  events,
  loading,
}: {
  events: AlertEvent[];
  loading: boolean;
}) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => {
      const meta = e.metadata as Record<string, unknown>;
      const cat = (meta?.category as string)?.toLowerCase() ?? "";
      return cat.includes(filter);
    });
  }, [events, filter]);

  const FEED_FILTERS = [
    { value: "all", label: "All" },
    { value: "tvl", label: "TVL Drop" },
    { value: "depeg", label: "Stablecoin Depeg" },
    { value: "exploit", label: "Protocol Exploit" },
    { value: "governance", label: "Governance" },
  ];

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg">
      <div className="p-4 border-b border-border-default flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary">
          Risk Alert Feed
        </h2>
        <div className="flex items-center gap-1 p-0.5 bg-bg-tertiary rounded-lg">
          {FEED_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
                filter === f.value
                  ? "bg-bg-secondary text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-text-disabled">
          No risk alerts found
        </div>
      ) : (
        <div className="divide-y divide-border-default/50">
          {filtered.map((event) => (
            <RiskAlertRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function RiskAlertRow({ event }: { event: AlertEvent }) {
  const sevClass =
    SEVERITY_CARD[event.severity] ?? SEVERITY_CARD.low;

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-bg-tertiary/30 transition-colors">
      <div className="shrink-0 mt-0.5">
        <AlertTriangle
          className={cn(
            "w-4 h-4",
            event.severity === "critical"
              ? "text-signal-danger"
              : event.severity === "high"
                ? "text-signal-warning"
                : "text-text-secondary"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary font-medium truncate">
          {event.title}
        </p>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
          {event.description}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
            sevClass
          )}
        >
          {event.severity}
        </span>
        <span className="text-[10px] text-text-disabled font-num">
          {timeAgo(event.created_at)}
        </span>
      </div>
    </div>
  );
}
