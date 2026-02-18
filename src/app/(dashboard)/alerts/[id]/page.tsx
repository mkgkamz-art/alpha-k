"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  Loader2,
  Waves,
  AlertTriangle,
  TrendingUp,
  Unlock,
  Droplets,
  ExternalLink,
  Clock,
  BarChart3,
  Shield,
  Activity,
  Calendar,
  Target,
  Zap,
  Info,
} from "lucide-react";
import { cn, timeAgo, formatCurrency, formatNumber } from "@/lib/utils";
import { useAlertDetail } from "@/hooks/use-alert-detail";
import { AlertDetail } from "@/components/alerts/alert-detail";
import { AlertCard } from "@/components/alerts/alert-card";
import { SeverityBadge } from "@/components/alerts/severity-badge";
import type { AlertType, AlertEvent } from "@/types";

/* ── Type → Icon map ── */
const typeIcons: Record<AlertType, typeof Waves> = {
  whale: Waves,
  risk: AlertTriangle,
  price_signal: TrendingUp,
  token_unlock: Unlock,
  liquidity: Droplets,
};

/* ── Explorer URL builder ── */
const EXPLORER_MAP: Record<string, string> = {
  BTC: "https://mempool.space/tx/",
  ETH: "https://etherscan.io/tx/",
  SOL: "https://solscan.io/tx/",
  USDT: "https://etherscan.io/tx/",
  USDC: "https://etherscan.io/tx/",
  XRP: "https://xrpscan.com/tx/",
  LINK: "https://etherscan.io/tx/",
  AVAX: "https://snowtrace.io/tx/",
  DOGE: "https://dogechain.info/tx/",
  BNB: "https://bscscan.com/tx/",
};

function getExplorerUrl(meta: Record<string, unknown>): string | undefined {
  const hash = meta.tx_hash as string | undefined;
  if (!hash) return undefined;

  // Validate: EVM hex (0x + 64 hex), BTC hex (64 hex), or base58 (Solana)
  const isValidHex = /^(0x)?[0-9a-fA-F]{64}$/.test(hash);
  const isValidBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,88}$/.test(hash);
  if (!isValidHex && !isValidBase58) return undefined;

  // Use explicit URL if provided
  if (meta.tx_explorer_url) return meta.tx_explorer_url as string;

  // Construct from symbol
  const symbol = ((meta.symbol as string) ?? "").toUpperCase();
  const base = EXPLORER_MAP[symbol];
  return base ? base + hash : undefined;
}

/* ── Parse metadata for transaction details ── */
function parseTxMeta(alert: AlertEvent) {
  const meta = (alert.metadata ?? {}) as Record<string, unknown>;

  const from = meta.from_address
    ? {
        label: (meta.from_label as string) ?? "Unknown",
        tag: (meta.from_tag as string) ?? "Wallet",
        tagColor: (meta.from_tag_color as "purple" | "warning" | "info" | "success" | "neutral") ?? "neutral",
        address: meta.from_address as string,
        subtext: (meta.from_subtext as string) ?? "",
      }
    : undefined;

  const to = meta.to_address
    ? {
        label: (meta.to_label as string) ?? "Unknown",
        tag: (meta.to_tag as string) ?? "Wallet",
        tagColor: (meta.to_tag_color as "purple" | "warning" | "info" | "success" | "neutral") ?? "neutral",
        address: meta.to_address as string,
        subtext: (meta.to_subtext as string) ?? "",
      }
    : undefined;

  const txMeta: { label: string; value: string; href?: string }[] = [];
  if (meta.value_usd) txMeta.push({ label: "Value", value: formatCurrency(meta.value_usd as number) });
  if (meta.tx_hash)
    txMeta.push({
      label: "TxHash",
      value: `${(meta.tx_hash as string).slice(0, 10)}...`,
      href: getExplorerUrl(meta),
    });
  if (meta.block_number) txMeta.push({ label: "Block", value: `#${meta.block_number}` });
  if (meta.gas_used) txMeta.push({ label: "Gas", value: `${meta.gas_used} Gwei` });

  const impactScore = meta.impact_score as number | undefined;
  const impactMetrics = Array.isArray(meta.impact_metrics)
    ? (meta.impact_metrics as { label: string; value: string; trend: "up" | "down" | "neutral" }[])
    : [];

  return { from, to, txMeta, impactScore, impactMetrics };
}

/* ── Context Panel: Recent History (type-aware title) ── */
const HISTORY_TITLES: Record<AlertType, string> = {
  whale: "Recent Wallet History",
  risk: "Recent Protocol Events",
  price_signal: "Signal History",
  token_unlock: "Recent Unlock Events",
  liquidity: "Recent Pool Activity",
};

function WalletHistoryPanel({ metadata, alertType }: { metadata: Record<string, unknown>; alertType: AlertType }) {
  const history = Array.isArray(metadata.wallet_history)
    ? (metadata.wallet_history as { type: string; age: string; value: string }[])
    : [];

  if (history.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
        <Clock className="size-4 text-text-secondary" />
        <h3 className="text-text-primary font-medium text-sm">{HISTORY_TITLES[alertType]}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default text-text-secondary text-xs">
              <th className="px-6 py-3 text-left font-medium">Type</th>
              <th className="px-6 py-3 text-left font-medium">Age</th>
              <th className="px-6 py-3 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border-default/50 last:border-0 hover:bg-bg-tertiary/30 transition-colors"
              >
                <td className="px-6 py-3 text-text-primary">{row.type}</td>
                <td className="px-6 py-3 text-text-secondary font-num">{row.age}</td>
                <td className="px-6 py-3 text-right text-text-primary font-num">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Context Panel: 30-Day Activity ── */
function ActivityPanel({ metadata }: { metadata: Record<string, unknown> }) {
  const activity = Array.isArray(metadata.activity_30d)
    ? (metadata.activity_30d as { label: string; value: number }[])
    : [];

  if (activity.length === 0) return null;

  const maxValue = Math.max(...activity.map((d) => d.value), 1);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
        <BarChart3 className="size-4 text-text-secondary" />
        <h3 className="text-text-primary font-medium text-sm">30-Day Activity</h3>
      </div>
      <div className="p-6">
        <div className="flex items-end gap-1 h-32">
          {activity.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-accent-secondary/60 rounded-t hover:bg-accent-secondary transition-colors"
                style={{ height: `${(d.value / maxValue) * 100}%`, minHeight: 2 }}
              />
              {i % 5 === 0 && (
                <span className="text-[10px] text-text-disabled font-num">{d.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Similar Wallets / Related Entities Panel ── */
const SIMILAR_TITLES: Record<AlertType, string> = {
  whale: "Similar Wallets",
  risk: "Related Protocols",
  price_signal: "Correlated Assets",
  token_unlock: "Similar Unlock Events",
  liquidity: "Similar Pools",
};

function SimilarWalletsPanel({ metadata, alertType }: { metadata: Record<string, unknown>; alertType: AlertType }) {
  const wallets = Array.isArray(metadata.similar_wallets)
    ? (metadata.similar_wallets as { label: string; address: string; similarity: string }[])
    : [];

  if (wallets.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
      <h3 className="text-text-primary font-medium text-sm mb-4 flex items-center gap-2">
        <Waves className="size-4 text-signal-info" />
        {SIMILAR_TITLES[alertType]}
      </h3>
      <div className="flex flex-col gap-3">
        {wallets.map((w, i) => (
          <div
            key={i}
            className="bg-bg-primary border border-border-default rounded p-3 flex items-center justify-between"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm text-text-primary">{w.label}</span>
              <span className="text-xs text-text-secondary font-num">
                {w.address.slice(0, 6)}...{w.address.slice(-4)}
              </span>
            </div>
            <span className="text-xs text-accent-secondary font-num">{w.similarity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TYPE-SPECIFIC DETAIL PANELS
   ═══════════════════════════════════════════ */

/* ── Reusable: Stats Grid ── */
function StatsGrid({
  title,
  icon: Icon,
  stats,
}: {
  title: string;
  icon: typeof Shield;
  stats: { label: string; value: string }[];
}) {
  if (stats.length === 0) return null;
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
        <Icon className="size-4 text-text-secondary" />
        <h3 className="text-text-primary font-medium text-sm">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border-default">
        {stats.map((s) => (
          <div key={s.label} className="bg-bg-secondary p-4 flex flex-col gap-1">
            <span className="text-xs text-text-secondary">{s.label}</span>
            <span className="text-sm text-text-primary font-num font-medium">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Risk Detail Panels ── */
function RiskDetailPanels({ metadata }: { metadata: Record<string, unknown> }) {
  const protocolStats = Array.isArray(metadata.protocol_stats)
    ? (metadata.protocol_stats as { label: string; value: string }[])
    : [];
  const riskFactors = Array.isArray(metadata.risk_factors)
    ? (metadata.risk_factors as { name: string; score: number; max_score: number; description: string }[])
    : [];
  const affectedPools = Array.isArray(metadata.affected_pools)
    ? (metadata.affected_pools as { name: string; tvl: string; change_24h: string }[])
    : [];
  const similarIncidents = Array.isArray(metadata.similar_incidents)
    ? (metadata.similar_incidents as { protocol: string; date: string; change: string; recovery_days: number }[])
    : [];

  return (
    <>
      {/* Protocol Overview */}
      <StatsGrid title="Protocol Overview" icon={Shield} stats={protocolStats} />

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <AlertTriangle className="size-4 text-signal-warning" />
            <h3 className="text-text-primary font-medium text-sm">Risk Factors</h3>
          </div>
          <div className="p-6 flex flex-col gap-4">
            {riskFactors.map((rf) => (
              <div key={rf.name} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{rf.name}</span>
                  <span className="text-xs text-text-secondary font-num">
                    {rf.score}/{rf.max_score}
                  </span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      rf.score / rf.max_score >= 0.7
                        ? "bg-signal-danger"
                        : rf.score / rf.max_score >= 0.4
                          ? "bg-signal-warning"
                          : "bg-signal-success"
                    )}
                    style={{ width: `${(rf.score / rf.max_score) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text-secondary">{rf.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affected Pools */}
      {affectedPools.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <Droplets className="size-4 text-text-secondary" />
            <h3 className="text-text-primary font-medium text-sm">Affected Pools</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-text-secondary text-xs">
                <th className="px-6 py-3 text-left font-medium">Pool</th>
                <th className="px-6 py-3 text-right font-medium">TVL</th>
                <th className="px-6 py-3 text-right font-medium">24h Change</th>
              </tr>
            </thead>
            <tbody>
              {affectedPools.map((p) => (
                <tr
                  key={p.name}
                  className="border-b border-border-default/50 last:border-0 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <td className="px-6 py-3 text-text-primary">{p.name}</td>
                  <td className="px-6 py-3 text-right text-text-primary font-num">{p.tvl}</td>
                  <td
                    className={cn(
                      "px-6 py-3 text-right font-num",
                      p.change_24h.startsWith("-") ? "text-signal-danger" : "text-signal-success"
                    )}
                  >
                    {p.change_24h}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Similar Historical Incidents */}
      {similarIncidents.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <Clock className="size-4 text-text-secondary" />
            <h3 className="text-text-primary font-medium text-sm">Similar Historical Incidents</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-text-secondary text-xs">
                <th className="px-6 py-3 text-left font-medium">Protocol</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-right font-medium">Change</th>
                <th className="px-6 py-3 text-right font-medium">Recovery</th>
              </tr>
            </thead>
            <tbody>
              {similarIncidents.map((inc, i) => (
                <tr
                  key={i}
                  className="border-b border-border-default/50 last:border-0 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <td className="px-6 py-3 text-text-primary">{inc.protocol}</td>
                  <td className="px-6 py-3 text-text-secondary font-num">{inc.date}</td>
                  <td className="px-6 py-3 text-right text-signal-danger font-num">{inc.change}</td>
                  <td className="px-6 py-3 text-right text-text-primary font-num">{inc.recovery_days}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ── Signal Detail Panels ── */
function SignalDetailPanels({ metadata }: { metadata: Record<string, unknown> }) {
  const signalType = metadata.signal_type as string | undefined;
  const confidence = metadata.confidence as number | undefined;
  const timeframe = metadata.timeframe as string | undefined;
  const tokenSymbol = metadata.token_symbol as string | undefined;
  const priceAtSignal = metadata.price_at_signal as number | undefined;
  const currentPrice = metadata.current_price as number | undefined;
  const priceChange24h = metadata.price_change_24h as number | undefined;
  const priceChange7d = metadata.price_change_7d as number | undefined;
  const marketCap = metadata.market_cap as string | undefined;
  const volume24h = metadata.volume_24h as string | undefined;
  const technicalIndicators = Array.isArray(metadata.technical_indicators)
    ? (metadata.technical_indicators as { name: string; value: string; signal: string; description: string }[])
    : [];
  const keyLevels = Array.isArray(metadata.key_levels)
    ? (metadata.key_levels as { type: string; price: number; label: string }[])
    : [];
  const confidenceFactors = Array.isArray(metadata.confidence_factors)
    ? (metadata.confidence_factors as { factor: string; weight: number; contribution: string }[])
    : [];

  const signalColorMap: Record<string, string> = {
    buy: "text-signal-success",
    sell: "text-signal-danger",
    alert: "text-signal-warning",
  };
  const signalBgMap: Record<string, string> = {
    buy: "bg-signal-success/10 border-signal-success/30",
    sell: "bg-signal-danger/10 border-signal-danger/30",
    alert: "bg-signal-warning/10 border-signal-warning/30",
  };

  return (
    <>
      {/* Signal Overview */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
          <Activity className="size-4 text-text-secondary" />
          <h3 className="text-text-primary font-medium text-sm">Signal Overview</h3>
        </div>
        <div className="p-6">
          {/* Signal type + Confidence */}
          <div className="flex items-center gap-4 mb-6">
            {signalType && (
              <span
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-bold uppercase border",
                  signalBgMap[signalType] ?? "bg-bg-tertiary"
                )}
              >
                {signalType}
              </span>
            )}
            {timeframe && (
              <span className="px-3 py-1.5 rounded text-xs font-medium bg-bg-tertiary text-text-secondary border border-border-default">
                {timeframe}
              </span>
            )}
            {tokenSymbol && (
              <span className="text-sm text-text-primary font-medium">{tokenSymbol}</span>
            )}
          </div>

          {/* Confidence bar */}
          {confidence !== undefined && (
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-text-secondary">Confidence</span>
                <span
                  className={cn(
                    "text-sm font-num font-bold",
                    confidence >= 80
                      ? "text-signal-success"
                      : confidence >= 60
                        ? "text-signal-warning"
                        : "text-signal-danger"
                  )}
                >
                  {confidence}%
                </span>
              </div>
              <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    confidence >= 80
                      ? "bg-signal-success"
                      : confidence >= 60
                        ? "bg-signal-warning"
                        : "bg-signal-danger"
                  )}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          )}

          {/* Price context grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {priceAtSignal !== undefined && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">Signal Price</span>
                <span className="text-sm text-text-primary font-num font-medium">
                  ${priceAtSignal < 1 ? priceAtSignal.toFixed(6) : priceAtSignal.toLocaleString()}
                </span>
              </div>
            )}
            {currentPrice !== undefined && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">Current Price</span>
                <span className="text-sm text-text-primary font-num font-medium">
                  ${currentPrice < 1 ? currentPrice.toFixed(6) : currentPrice.toLocaleString()}
                </span>
              </div>
            )}
            {priceChange24h !== undefined && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">24h Change</span>
                <span
                  className={cn(
                    "text-sm font-num font-medium",
                    priceChange24h >= 0 ? "text-signal-success" : "text-signal-danger"
                  )}
                >
                  {priceChange24h >= 0 ? "+" : ""}
                  {priceChange24h.toFixed(1)}%
                </span>
              </div>
            )}
            {priceChange7d !== undefined && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">7d Change</span>
                <span
                  className={cn(
                    "text-sm font-num font-medium",
                    priceChange7d >= 0 ? "text-signal-success" : "text-signal-danger"
                  )}
                >
                  {priceChange7d >= 0 ? "+" : ""}
                  {priceChange7d.toFixed(1)}%
                </span>
              </div>
            )}
            {marketCap && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">Market Cap</span>
                <span className="text-sm text-text-primary font-num font-medium">{marketCap}</span>
              </div>
            )}
            {volume24h && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">Volume 24h</span>
                <span className="text-sm text-text-primary font-num font-medium">{volume24h}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      {technicalIndicators.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <BarChart3 className="size-4 text-text-secondary" />
            <h3 className="text-text-primary font-medium text-sm">Technical Indicators</h3>
          </div>
          <div className="divide-y divide-border-default/50">
            {technicalIndicators.map((ind) => (
              <div key={ind.name} className="px-6 py-3 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-text-primary">{ind.name}</span>
                  <span className="text-xs text-text-secondary">{ind.description}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-primary font-num">{ind.value}</span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded font-medium",
                      ind.signal === "bullish"
                        ? "bg-signal-success/10 text-signal-success"
                        : ind.signal === "bearish"
                          ? "bg-signal-danger/10 text-signal-danger"
                          : "bg-signal-warning/10 text-signal-warning"
                    )}
                  >
                    {ind.signal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Levels */}
      {keyLevels.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <Target className="size-4 text-text-secondary" />
            <h3 className="text-text-primary font-medium text-sm">Key Price Levels</h3>
          </div>
          <div className="divide-y divide-border-default/50">
            {keyLevels.map((lvl, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded font-medium uppercase",
                      lvl.type === "support"
                        ? "bg-signal-success/10 text-signal-success"
                        : "bg-signal-danger/10 text-signal-danger"
                    )}
                  >
                    {lvl.type}
                  </span>
                  <span className="text-sm text-text-secondary">{lvl.label}</span>
                </div>
                <span className="text-sm text-text-primary font-num font-medium">
                  ${lvl.price < 1 ? lvl.price.toFixed(6) : lvl.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Factors */}
      {confidenceFactors.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <Zap className="size-4 text-signal-warning" />
            <h3 className="text-text-primary font-medium text-sm">Confidence Breakdown</h3>
          </div>
          <div className="p-6 flex flex-col gap-3">
            {confidenceFactors.map((cf) => (
              <div
                key={cf.factor}
                className="bg-bg-primary border border-border-default rounded p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      cf.contribution === "positive" ? "bg-signal-success" : "bg-signal-danger"
                    )}
                  />
                  <span className="text-sm text-text-primary">{cf.factor}</span>
                </div>
                <span className="text-xs text-text-secondary font-num">Weight: {cf.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Unlock Detail Panels ── */
function UnlockDetailPanels({ metadata }: { metadata: Record<string, unknown> }) {
  const tokenSymbol = metadata.token_symbol as string | undefined;
  const amount = metadata.amount as number | undefined;
  const usdValue = metadata.usd_value as number | undefined;
  const percentOfSupply = metadata.percent_of_supply as number | undefined;
  const category = metadata.category as string | undefined;
  const vestingType = metadata.vesting_type as string | undefined;
  const daysUntil = metadata.days_until as number | undefined;
  const unlockDate = metadata.unlock_date as string | undefined;
  const tokenStats = Array.isArray(metadata.token_stats)
    ? (metadata.token_stats as { label: string; value: string }[])
    : [];
  const historicalUnlocks = Array.isArray(metadata.historical_unlocks)
    ? (metadata.historical_unlocks as { date: string; amount_usd: string; price_impact: string; recovery_days: number }[])
    : [];
  const upcomingUnlocks = Array.isArray(metadata.upcoming_unlocks)
    ? (metadata.upcoming_unlocks as { token: string; date_label: string; amount: string; usd_value: string }[])
    : [];

  return (
    <>
      {/* Unlock Overview Card */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
          <Calendar className="size-4 text-signal-warning" />
          <h3 className="text-text-primary font-medium text-sm">Unlock Details</h3>
        </div>
        <div className="p-6">
          {/* Countdown */}
          {daysUntil !== undefined && (
            <div className="flex items-center justify-center mb-6">
              <div
                className={cn(
                  "px-6 py-3 rounded-lg border text-center",
                  daysUntil <= 1
                    ? "bg-signal-danger/10 border-signal-danger/30"
                    : daysUntil <= 3
                      ? "bg-signal-warning/10 border-signal-warning/30"
                      : "bg-bg-tertiary border-border-default"
                )}
              >
                <span
                  className={cn(
                    "text-3xl font-num font-bold",
                    daysUntil <= 1
                      ? "text-signal-danger"
                      : daysUntil <= 3
                        ? "text-signal-warning"
                        : "text-text-primary"
                  )}
                >
                  {daysUntil <= 0 ? "TODAY" : `D-${daysUntil}`}
                </span>
                {unlockDate && (
                  <span className="block text-xs text-text-secondary mt-1">
                    {new Date(unlockDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Unlock stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {tokenSymbol && amount !== undefined && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">Amount</span>
                <span className="text-sm text-text-primary font-num font-medium">
                  {amount.toLocaleString()} {tokenSymbol}
                </span>
              </div>
            )}
            {usdValue !== undefined && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">USD Value</span>
                <span className="text-sm text-text-primary font-num font-medium">
                  ${(usdValue / 1_000_000).toFixed(1)}M
                </span>
              </div>
            )}
            {percentOfSupply !== undefined && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">% of Supply</span>
                <span className="text-sm text-signal-warning font-num font-medium">
                  {percentOfSupply}%
                </span>
              </div>
            )}
            {(category || vestingType) && (
              <div className="bg-bg-primary border border-border-default rounded p-3">
                <span className="text-xs text-text-secondary block">Category</span>
                <span className="text-sm text-text-primary font-medium capitalize">
                  {vestingType ?? category}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Token Stats */}
      {tokenStats.length > 0 && (
        <StatsGrid title="Token Statistics" icon={Info} stats={tokenStats} />
      )}

      {/* Historical Unlocks */}
      {historicalUnlocks.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <Clock className="size-4 text-text-secondary" />
            <h3 className="text-text-primary font-medium text-sm">Historical Unlock Impact</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-text-secondary text-xs">
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-right font-medium">Value</th>
                <th className="px-6 py-3 text-right font-medium">Price Impact</th>
                <th className="px-6 py-3 text-right font-medium">Recovery</th>
              </tr>
            </thead>
            <tbody>
              {historicalUnlocks.map((hu, i) => (
                <tr
                  key={i}
                  className="border-b border-border-default/50 last:border-0 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <td className="px-6 py-3 text-text-secondary font-num">{hu.date}</td>
                  <td className="px-6 py-3 text-right text-text-primary font-num">{hu.amount_usd}</td>
                  <td className="px-6 py-3 text-right text-signal-danger font-num">{hu.price_impact}</td>
                  <td className="px-6 py-3 text-right text-text-primary font-num">{hu.recovery_days}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upcoming Unlocks */}
      {upcomingUnlocks.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <Calendar className="size-4 text-text-secondary" />
            <h3 className="text-text-primary font-medium text-sm">Upcoming Unlocks</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-text-secondary text-xs">
                <th className="px-6 py-3 text-left font-medium">Token</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
                <th className="px-6 py-3 text-right font-medium">USD Value</th>
              </tr>
            </thead>
            <tbody>
              {upcomingUnlocks.map((uu, i) => (
                <tr
                  key={i}
                  className="border-b border-border-default/50 last:border-0 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <td className="px-6 py-3 text-text-primary font-medium">{uu.token}</td>
                  <td className="px-6 py-3 text-text-secondary font-num">{uu.date_label}</td>
                  <td className="px-6 py-3 text-right text-text-primary font-num">{uu.amount}</td>
                  <td className="px-6 py-3 text-right text-text-primary font-num">{uu.usd_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ── Liquidity Detail Panels ── */
function LiquidityDetailPanels({ metadata }: { metadata: Record<string, unknown> }) {
  const poolStats = Array.isArray(metadata.pool_stats)
    ? (metadata.pool_stats as { label: string; value: string }[])
    : [];
  const lpActivity = Array.isArray(metadata.lp_activity)
    ? (metadata.lp_activity as { type: string; age: string; value: string; address_label: string }[])
    : [];
  const relatedPools = Array.isArray(metadata.related_pools)
    ? (metadata.related_pools as { name: string; dex: string; tvl: string; apy: string; chain: string }[])
    : [];

  return (
    <>
      {/* Pool Stats */}
      <StatsGrid title="Pool Overview" icon={Droplets} stats={poolStats} />

      {/* LP Activity */}
      {lpActivity.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <Activity className="size-4 text-text-secondary" />
            <h3 className="text-text-primary font-medium text-sm">Recent LP Activity</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-text-secondary text-xs">
                <th className="px-6 py-3 text-left font-medium">Type</th>
                <th className="px-6 py-3 text-left font-medium">Address</th>
                <th className="px-6 py-3 text-left font-medium">Age</th>
                <th className="px-6 py-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {lpActivity.map((lp, i) => (
                <tr
                  key={i}
                  className="border-b border-border-default/50 last:border-0 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <td
                    className={cn(
                      "px-6 py-3 font-medium",
                      lp.type === "Withdrawal" || lp.type === "Remove"
                        ? "text-signal-danger"
                        : "text-signal-success"
                    )}
                  >
                    {lp.type}
                  </td>
                  <td className="px-6 py-3 text-text-secondary font-num">{lp.address_label}</td>
                  <td className="px-6 py-3 text-text-secondary font-num">{lp.age}</td>
                  <td className="px-6 py-3 text-right text-text-primary font-num">{lp.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Related Pools */}
      {relatedPools.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
            <Waves className="size-4 text-signal-info" />
            <h3 className="text-text-primary font-medium text-sm">Related Pools</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-text-secondary text-xs">
                <th className="px-6 py-3 text-left font-medium">Pool</th>
                <th className="px-6 py-3 text-left font-medium">DEX</th>
                <th className="px-6 py-3 text-left font-medium">Chain</th>
                <th className="px-6 py-3 text-right font-medium">TVL</th>
                <th className="px-6 py-3 text-right font-medium">APY</th>
              </tr>
            </thead>
            <tbody>
              {relatedPools.map((rp, i) => (
                <tr
                  key={i}
                  className="border-b border-border-default/50 last:border-0 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <td className="px-6 py-3 text-text-primary font-medium">{rp.name}</td>
                  <td className="px-6 py-3 text-text-secondary">{rp.dex}</td>
                  <td className="px-6 py-3 text-text-secondary">{rp.chain}</td>
                  <td className="px-6 py-3 text-right text-text-primary font-num">{rp.tvl}</td>
                  <td className="px-6 py-3 text-right text-signal-success font-num">{rp.apy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ── Related Alerts Section ── */
function RelatedAlerts({ alerts }: { alerts: AlertEvent[] }) {
  const router = useRouter();
  if (alerts.length === 0) return null;

  return (
    <div>
      <h3 className="text-text-primary font-medium text-sm mb-4">Related Alerts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            id={alert.id}
            type={alert.type}
            severity={alert.severity}
            title={alert.title}
            description={alert.description}
            time={timeAgo(alert.created_at)}
            isRead={alert.is_read}
            isBookmarked={alert.is_bookmarked}
            onClick={(id) => router.push(`/alerts/${id}`)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useAlertDetail(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-6 text-text-secondary animate-spin" />
      </div>
    );
  }

  if (error || !data?.alert) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-text-secondary text-sm">Alert not found</p>
        <button
          type="button"
          onClick={() => router.push("/alerts")}
          className="text-accent-primary text-sm hover:underline"
        >
          Back to Alerts
        </button>
      </div>
    );
  }

  const { alert, related } = data;
  const metadata = (alert.metadata ?? {}) as Record<string, unknown>;
  const { from, to, txMeta, impactScore, impactMetrics } = parseTxMeta(alert);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-350 w-full mx-auto">
        {/* Breadcrumb — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-2 text-xs text-text-secondary">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/alerts" className="hover:text-text-primary transition-colors">
            Alerts
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-text-primary">Alert Detail</span>
        </nav>

        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="md:hidden flex items-center gap-2 text-text-secondary text-sm"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        {/* Alert Detail — Hero + Type-specific Content + Impact */}
        <AlertDetail
          id={alert.id}
          type={alert.type}
          severity={alert.severity}
          title={alert.title}
          description={alert.description}
          time={timeAgo(alert.created_at)}
          from={from}
          to={to}
          txMeta={txMeta}
          impactScore={impactScore}
          impactMetrics={impactMetrics}
          onTrackWallet={
            from?.address
              ? () => {
                  window.open(
                    `https://etherscan.io/address/${from.address}`,
                    "_blank"
                  );
                }
              : undefined
          }
        >
          {/* Type-specific left-column content (shown when no Transaction Flow) */}
          {alert.type === "risk" && <RiskDetailPanels metadata={metadata} />}
          {alert.type === "price_signal" && <SignalDetailPanels metadata={metadata} />}
          {alert.type === "token_unlock" && <UnlockDetailPanels metadata={metadata} />}
          {alert.type === "liquidity" && <LiquidityDetailPanels metadata={metadata} />}
        </AlertDetail>

        {/* Context Panels: History + Activity + Sidebar */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <WalletHistoryPanel metadata={metadata} alertType={alert.type} />
            <ActivityPanel metadata={metadata} />
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <SimilarWalletsPanel metadata={metadata} alertType={alert.type} />
          </div>
        </div>

        {/* Related Alerts */}
        <RelatedAlerts alerts={related} />
      </div>
    </div>
  );
}
