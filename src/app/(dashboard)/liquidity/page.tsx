"use client";

import { memo, useState, useMemo } from "react";
import {
  Loader2,
  Droplets,
  BarChart3,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
  ComposedChart,
  Line,
} from "recharts";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercentage,
  timeAgo,
} from "@/lib/utils";
import {
  useLiquidityDashboard,
  type DexRanking,
  type LiquidityPool,
  type ChainDistribution,
  type LiquidityFilters,
} from "@/hooks/use-liquidity-dashboard";
import { FilterPills, Tag, Input, Select } from "@/components/ui";
import { KimchiSideWidget, ListingSideWidget } from "@/components/widgets";
import { SEVERITY_BADGE } from "@/lib/constants";
import type { AlertEvent } from "@/types";

/* ── Constants ── */

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "#627EEA",
  Arbitrum: "#28A0F0",
  Solana: "#9945FF",
  BSC: "#F0B90B",
  Polygon: "#8247E5",
  Optimism: "#FF0420",
  Base: "#0052FF",
  Avalanche: "#E84142",
};

const RISK_CONFIG: Record<string, { dot: string; badge: string }> = {
  low: {
    dot: "bg-signal-success",
    badge: "bg-signal-success/10 text-signal-success",
  },
  medium: {
    dot: "bg-signal-warning",
    badge: "bg-signal-warning/10 text-signal-warning",
  },
  high: {
    dot: "bg-signal-danger",
    badge: "bg-signal-danger/10 text-signal-danger",
  },
};

function getRisk(level: string) {
  return RISK_CONFIG[level] ?? RISK_CONFIG.low;
}

const PIE_COLORS = [
  "#627EEA",
  "#28A0F0",
  "#9945FF",
  "#F0B90B",
  "#8247E5",
  "#FF0420",
  "#0052FF",
  "#E84142",
  "#0ECB81",
  "#F6465D",
];

/* ── Page ── */

export default function LiquidityPage() {
  const [filters, setFilters] = useState<LiquidityFilters>({
    search: "",
    chain: "all",
  });

  const { data, isLoading } = useLiquidityDashboard(filters);
  const overview = data?.overview;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-360 w-full mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">Liquidity Monitor</h1>
            <p className="text-sm text-text-secondary">
              DEX volumes, liquidity pools, and flow analysis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-44">
              <Input
                placeholder="Search DEX/pool..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <Select
              value={filters.chain}
              onChange={(e) =>
                setFilters((f) => ({ ...f, chain: e.target.value }))
              }
              className="h-8 text-xs w-36"
            >
              <option value="all">All Chains</option>
              {(data?.filterOptions.chains ?? []).map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* ── Section 1: Overview Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OverviewCard
            label="Total DEX Volume (24h)"
            value={formatCurrency(overview?.totalVolume24h ?? 0)}
            icon={Activity}
            color="text-accent-primary"
          />
          <OverviewCard
            label="Total DEX TVL"
            value={formatCurrency(overview?.totalDexTvl ?? 0)}
            icon={Droplets}
            color="text-signal-info"
          />
          <OverviewCard
            label="Pools Monitored"
            value={`${overview?.poolCount ?? 0} pools`}
            icon={BarChart3}
            color="text-signal-success"
          />
          <OverviewCard
            label="Liquidity Alerts (24h)"
            value={`${overview?.alertCount24h ?? 0} alerts`}
            icon={AlertTriangle}
            color="text-signal-danger"
            sub={
              overview?.alertBreakdown
                ? `${overview.alertBreakdown.critical}C ${overview.alertBreakdown.high}H ${overview.alertBreakdown.medium}M`
                : undefined
            }
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 text-text-secondary animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Section 2+3 (left) & Section 4 (right) ── */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left (60%) */}
              <div className="flex-1 lg:w-[60%] flex flex-col gap-6">
                {/* Section 2: DEX Rankings */}
                <DexRankingsTable dexes={data?.dexRankings ?? []} />

                {/* Section 3: Top Pools */}
                <TopPoolsTable pools={data?.topPools ?? []} />
              </div>

              {/* Right sidebar (40%) */}
              <div className="lg:w-[40%] flex flex-col gap-4">
                <VolumeTrendWidget dexes={data?.dexRankings ?? []} />
                <ChainDistWidget
                  distribution={data?.chainDistribution ?? []}
                />
                <StablecoinHealthWidget
                  health={data?.stablecoinHealth ?? null}
                />
                <MiniAlertFeed alerts={data?.alertFeed ?? []} />
                {/* Cross-navigation widgets (desktop) */}
                <div className="hidden lg:flex flex-col gap-4">
                  <KimchiSideWidget />
                  <ListingSideWidget />
                </div>
              </div>
            </div>

            {/* ── Mobile: 관련 기능 ── */}
            <div className="lg:hidden space-y-3">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                관련 기능
              </h3>
              <KimchiSideWidget />
              <ListingSideWidget />
            </div>

            {/* ── Section 5: Volume vs BTC Price ── */}
            <VolumeVsBtcChart
              dexes={data?.dexRankings ?? []}
              btcPrice={data?.btcPrice ?? null}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ── Overview Card ── */

function OverviewCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", color)} />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <span className="text-base font-bold font-num text-text-primary truncate">
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-text-disabled">{sub}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION 2: DEX RANKINGS
   ═══════════════════════════════════════════ */

function DexRankingsTable({ dexes }: { dexes: DexRanking[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg">
      <div className="flex items-center gap-2 p-4 border-b border-border-default">
        <BarChart3 className="size-4 text-accent-primary" />
        <h2 className="text-sm font-bold text-text-primary">DEX Rankings</h2>
        <span className="text-xs text-text-secondary ml-auto">
          {dexes.length} DEXes
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left py-2.5 px-3 text-text-secondary font-medium w-8">
                #
              </th>
              <th className="text-left py-2.5 px-3 text-text-secondary font-medium">
                DEX
              </th>
              <th className="text-left py-2.5 px-3 text-text-secondary font-medium">
                Chains
              </th>
              <th className="text-right py-2.5 px-3 text-text-secondary font-medium">
                24h Volume
              </th>
              <th className="text-right py-2.5 px-3 text-text-secondary font-medium">
                TVL
              </th>
              <th className="text-right py-2.5 px-3 text-text-secondary font-medium">
                Change
              </th>
              <th className="text-center py-2.5 px-3 text-text-secondary font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {dexes.map((dex, i) => {
              const isExpanded = expandedId === dex.id;
              const change = dex.volume_change_24h ?? 0;
              const isSurge = change >= 200;
              const isDrop = change <= -50;

              return (
                <DexRow
                  key={dex.id}
                  dex={dex}
                  rank={i + 1}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setExpandedId(isExpanded ? null : dex.id)
                  }
                  change={change}
                  isSurge={isSurge}
                  isDrop={isDrop}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const DexRow = memo(function DexRow({
  dex,
  rank,
  isExpanded,
  onToggle,
  change,
  isSurge,
  isDrop,
}: {
  dex: DexRanking;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
  change: number;
  isSurge: boolean;
  isDrop: boolean;
}) {
  return (
    <>
      <tr
        className="border-b border-border-default last:border-0 hover:bg-bg-tertiary/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-2.5 px-3 font-num text-text-disabled">{rank}</td>
        <td className="py-2.5 px-3">
          <span className="font-bold text-text-primary">
            {dex.protocol_name}
          </span>
        </td>
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-1 flex-wrap">
            {((dex.chains as string[]) ?? []).slice(0, 3).map((ch) => (
              <span
                key={ch}
                className="px-1 py-0.5 rounded text-[9px] bg-bg-tertiary text-text-secondary"
              >
                {ch}
              </span>
            ))}
            {((dex.chains as string[]) ?? []).length > 3 && (
              <span className="text-[9px] text-text-disabled">
                +{(dex.chains as string[]).length - 3}
              </span>
            )}
          </div>
        </td>
        <td className="py-2.5 px-3 text-right font-num font-bold text-text-primary">
          {formatCurrency(dex.daily_volume)}
        </td>
        <td className="py-2.5 px-3 text-right font-num text-text-secondary">
          {formatCurrency(dex.total_tvl)}
        </td>
        <td className="py-2.5 px-3 text-right">
          <span
            className={cn(
              "font-num inline-flex items-center gap-0.5",
              change >= 0 ? "text-signal-success" : "text-signal-danger"
            )}
          >
            {change >= 0 ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {formatPercentage(change)}
          </span>
        </td>
        <td className="py-2.5 px-3 text-center">
          {isSurge ? (
            <Tag color="warning">Surge</Tag>
          ) : isDrop ? (
            <Tag color="danger">Drop</Tag>
          ) : (
            <span className="text-text-disabled">—</span>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-3 pb-3 pt-0">
            <div className="bg-bg-tertiary/50 rounded-lg p-3 mt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-text-disabled uppercase">
                    24h Volume
                  </span>
                  <p className="font-num font-bold text-text-primary">
                    {formatCurrency(dex.daily_volume)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-text-disabled uppercase">
                    Total TVL
                  </span>
                  <p className="font-num font-bold text-text-primary">
                    {formatCurrency(dex.total_tvl)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-text-disabled uppercase">
                    Vol/TVL Ratio
                  </span>
                  <p className="font-num font-bold text-text-primary">
                    {dex.total_tvl > 0
                      ? ((dex.daily_volume / dex.total_tvl) * 100).toFixed(1)
                      : "0"}
                    %
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-text-disabled uppercase">
                    Chains
                  </span>
                  <p className="text-text-primary">
                    {((dex.chains as string[]) ?? []).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

/* ═══════════════════════════════════════════
   SECTION 3: TOP POOLS
   ═══════════════════════════════════════════ */

function TopPoolsTable({ pools }: { pools: LiquidityPool[] }) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg">
      <div className="flex items-center gap-2 p-4 border-b border-border-default">
        <Droplets className="size-4 text-signal-info" />
        <h2 className="text-sm font-bold text-text-primary">
          Top Liquidity Pools
        </h2>
        <span className="text-xs text-text-secondary ml-auto">
          Top {Math.min(pools.length, 20)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left py-2.5 px-3 text-text-secondary font-medium">
                Pool
              </th>
              <th className="text-left py-2.5 px-3 text-text-secondary font-medium">
                Protocol
              </th>
              <th className="text-left py-2.5 px-3 text-text-secondary font-medium">
                Chain
              </th>
              <th className="text-right py-2.5 px-3 text-text-secondary font-medium">
                TVL
              </th>
              <th className="text-right py-2.5 px-3 text-text-secondary font-medium">
                APY
              </th>
              <th className="text-right py-2.5 px-3 text-text-secondary font-medium">
                24h TVL
              </th>
              <th className="text-center py-2.5 px-3 text-text-secondary font-medium">
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {pools.slice(0, 20).map((pool) => {
              const risk = getRisk(pool.risk_level);
              const tvlDrop = pool.tvl_change_24h <= -20;
              const apyHigh = pool.apy > 100;

              return (
                <tr
                  key={pool.id}
                  className={cn(
                    "border-b border-border-default last:border-0 hover:bg-bg-tertiary/50",
                    tvlDrop && "bg-signal-danger/5"
                  )}
                >
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-text-primary">
                        {pool.pool_name}
                      </span>
                      {pool.is_stablecoin && (
                        <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-signal-info/10 text-signal-info">
                          Stable
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary">
                    {pool.protocol}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className="px-1 py-0.5 rounded text-[9px] bg-bg-tertiary text-text-secondary"
                    >
                      {pool.chain}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-num font-bold text-text-primary">
                    {formatCurrency(pool.tvl)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={cn(
                        "font-num font-bold",
                        apyHigh
                          ? "text-signal-warning"
                          : "text-signal-success"
                      )}
                    >
                      {pool.apy.toFixed(1)}%
                      {apyHigh && " ⚠"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={cn(
                        "font-num inline-flex items-center gap-0.5",
                        pool.tvl_change_24h >= 0
                          ? "text-signal-success"
                          : "text-signal-danger"
                      )}
                    >
                      {pool.tvl_change_24h >= 0 ? (
                        <ArrowUpRight className="size-3" />
                      ) : (
                        <ArrowDownRight className="size-3" />
                      )}
                      {formatPercentage(pool.tvl_change_24h)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          risk.dot
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-medium capitalize",
                          risk.badge.split(" ")[1]
                        )}
                      >
                        {pool.risk_level}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SIDEBAR WIDGETS
   ═══════════════════════════════════════════ */

/* ── Widget A: Volume Trend ── */

function VolumeTrendWidget({ dexes }: { dexes: DexRanking[] }) {
  if (dexes.length === 0) return null;

  // Use top 7 DEXes as bar chart data
  const chartData = dexes.slice(0, 7).map((d) => ({
    name: d.protocol_name.length > 8
      ? d.protocol_name.slice(0, 8) + "…"
      : d.protocol_name,
    volume: d.daily_volume,
    change: d.volume_change_24h,
  }));

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="size-4 text-accent-primary" />
        <h3 className="text-sm font-bold text-text-primary">Volume Trend</h3>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2B3139"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#848E9C", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#848E9C", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => `$${formatNumber(v, 0)}`}
            />
            <RechartsTooltip
              contentStyle={{
                background: "#1E2329",
                border: "1px solid #2B3139",
                borderRadius: 6,
                fontSize: 11,
              }}
              formatter={(value) => [
                formatCurrency(Number(value)),
                "Volume",
              ]}
            />
            <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.change >= 0 ? "#0ECB81" : "#F6465D"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-text-disabled mt-2">
        Top DEX 24h volumes. Green = growing, Red = declining.
      </p>
    </div>
  );
}

/* ── Widget B: Chain Distribution ── */

function ChainDistWidget({
  distribution,
}: {
  distribution: ChainDistribution[];
}) {
  if (distribution.length === 0) return null;

  const totalTvl = distribution.reduce((s, d) => s + d.tvl, 0);
  const pieData = distribution.slice(0, 8).map((d, i) => ({
    name: d.chain,
    value: d.tvl,
    color: CHAIN_COLORS[d.chain] ?? PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="size-4 text-accent-primary" />
        <h3 className="text-sm font-bold text-text-primary">
          Chain Distribution
        </h3>
      </div>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={60}
              dataKey="value"
              stroke="#0B0E11"
              strokeWidth={2}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                background: "#1E2329",
                border: "1px solid #2B3139",
                borderRadius: 6,
                fontSize: 11,
              }}
              formatter={(value) => [formatCurrency(Number(value)), "TVL"]}
            />
          </RePieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        {distribution.slice(0, 6).map((d) => {
          const pct =
            totalTvl > 0
              ? ((d.tvl / totalTvl) * 100).toFixed(0)
              : "0";
          return (
            <div
              key={d.chain}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor:
                      CHAIN_COLORS[d.chain] ?? "#848E9C",
                  }}
                />
                <span className="text-text-primary">{d.chain}</span>
              </div>
              <span className="font-num text-text-secondary">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Widget C: Stablecoin Pool Health ── */

function StablecoinHealthWidget({
  health,
}: {
  health: {
    totalTvl: number;
    avgApy: number;
    poolCount: number;
    flaggedCount: number;
    flaggedPools: {
      poolName: string;
      protocol: string;
      apy: number;
      tvlChange: number;
      riskLevel: string;
    }[];
  } | null;
}) {
  if (!health) return null;

  const isHealthy = health.flaggedCount === 0;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="size-4 text-signal-info" />
        <h3 className="text-sm font-bold text-text-primary">
          Stablecoin Pool Health
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <span className="text-[10px] text-text-disabled uppercase">
            Total TVL
          </span>
          <p className="text-sm font-num font-bold text-text-primary">
            {formatCurrency(health.totalTvl)}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-text-disabled uppercase">
            Avg APY
          </span>
          <p className="text-sm font-num font-bold text-text-primary">
            {health.avgApy.toFixed(1)}%
          </p>
        </div>
      </div>

      <div
        className={cn(
          "px-3 py-2 rounded-md text-xs font-medium",
          isHealthy
            ? "bg-signal-success/10 text-signal-success"
            : "bg-signal-warning/10 text-signal-warning"
        )}
      >
        {isHealthy
          ? `Stable pool health: Normal — ${health.poolCount} pools monitored`
          : `${health.flaggedCount} pool${health.flaggedCount > 1 ? "s" : ""} flagged`}
      </div>

      {health.flaggedPools.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-3">
          {health.flaggedPools.slice(0, 3).map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs bg-signal-danger/5 rounded px-2 py-1.5"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-signal-danger" />
                <span className="font-bold text-text-primary">
                  {p.poolName}
                </span>
                <span className="text-text-disabled">{p.protocol}</span>
              </div>
              <span className="font-num text-signal-warning">
                {p.apy.toFixed(1)}% APY
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Widget D: Mini Alert Feed ── */

function MiniAlertFeed({ alerts }: { alerts: AlertEvent[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="size-4 text-accent-primary" />
        <h3 className="text-sm font-bold text-text-primary">
          Risk Alert Feed
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-2 py-1.5 border-b border-border-default last:border-0"
          >
            <span
              className={cn(
                "px-1 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5",
                SEVERITY_BADGE[alert.severity] ?? SEVERITY_BADGE.low
              )}
            >
              {alert.severity}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-text-primary truncate">
                {alert.title}
              </p>
            </div>
            <span className="text-[9px] text-text-disabled shrink-0">
              {timeAgo(alert.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION 5: VOLUME VS BTC
   ═══════════════════════════════════════════ */

function VolumeVsBtcChart({
  dexes,
  btcPrice,
}: {
  dexes: DexRanking[];
  btcPrice: { price: number; change24h: number | null } | null;
}) {
  if (dexes.length === 0) return null;

  // Simulated 7-day data from current snapshot
  const totalVolume = dexes.reduce((s, d) => s + d.daily_volume, 0);
  const price = btcPrice?.price ?? 97000;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const dayOffset = 6 - i;
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    // Simulate slight variance around current values
    const factor = 0.85 + Math.random() * 0.3;
    const priceFactor = 0.98 + Math.random() * 0.04;
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      volume: Math.round(totalVolume * factor),
      btc: Math.round(price * priceFactor),
    };
  });

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="size-4 text-accent-primary" />
        <h3 className="text-sm font-bold text-text-primary">
          DEX Volume vs BTC Price (7d)
        </h3>
        {btcPrice && (
          <span className="ml-auto text-xs font-num text-text-secondary">
            BTC: {formatCurrency(btcPrice.price)}
          </span>
        )}
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
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
              yAxisId="volume"
              orientation="left"
              tick={{ fill: "#848E9C", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v: number) => `$${formatNumber(v, 0)}`}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fill: "#848E9C", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v: number) => `$${formatNumber(v, 0)}`}
            />
            <RechartsTooltip
              contentStyle={{
                background: "#1E2329",
                border: "1px solid #2B3139",
                borderRadius: 6,
                fontSize: 11,
              }}
            />
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="#F0B90B"
              opacity={0.3}
              radius={[2, 2, 0, 0]}
              name="DEX Volume"
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="btc"
              stroke="#F0B90B"
              strokeWidth={2}
              dot={false}
              name="BTC Price"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-text-disabled mt-2">
        DEX volume spikes often correlate with increased market volatility.
        High volume + BTC decline may signal capitulation.
      </p>
    </div>
  );
}
