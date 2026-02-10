"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Target,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { useSignals } from "@/hooks/use-signals";
import { FilterPills, Badge, Tag } from "@/components/ui";
import type { TradingSignal, Chain, Timeframe, SignalType } from "@/types";

const chainOptions = [
  { value: "all", label: "All Chains" },
  { value: "ethereum", label: "ETH" },
  { value: "solana", label: "SOL" },
  { value: "bsc", label: "BSC" },
  { value: "polygon", label: "POLY" },
  { value: "arbitrum", label: "ARB" },
];

const timeframeOptions = [
  { value: "all", label: "All" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
];

const typeOptions = [
  { value: "all", label: "All" },
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
  { value: "hold", label: "Hold" },
];

const signalColors: Record<SignalType, { border: string; badge: string }> = {
  buy: { border: "border-l-signal-success", badge: "bg-signal-success/10 text-signal-success" },
  sell: { border: "border-l-signal-danger", badge: "bg-signal-danger/10 text-signal-danger" },
  hold: { border: "border-l-signal-warning", badge: "bg-signal-warning/10 text-signal-warning" },
};

export default function SignalsPage() {
  const [chain, setChain] = useState<Chain | "all">("all");
  const [timeframe, setTimeframe] = useState<Timeframe | "all">("all");
  const [type, setType] = useState<SignalType | "all">("all");

  const { signals, message, isLoading } = useSignals({ chain, timeframe, type });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-[1440px] w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold">Trading Signals</h1>
          <p className="text-sm text-text-secondary">
            Data-driven entry, target, and stop-loss levels.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <FilterPills
            options={chainOptions}
            value={chain}
            onChange={(v) => setChain(v as Chain | "all")}
          />
          <div className="h-px sm:h-auto sm:w-px bg-border-default" />
          <FilterPills
            options={timeframeOptions}
            value={timeframe}
            onChange={(v) => setTimeframe(v as Timeframe | "all")}
          />
          <div className="h-px sm:h-auto sm:w-px bg-border-default" />
          <FilterPills
            options={typeOptions}
            value={type}
            onChange={(v) => setType(v as SignalType | "all")}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 text-text-secondary animate-spin" />
          </div>
        ) : message ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <p className="text-sm">{message}</p>
          </div>
        ) : signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <p className="text-sm">No signals match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {signals.map((signal) => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[11px] text-text-disabled text-center mt-4">
          Trading signals are for informational purposes only. Not financial advice.
          Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}

/* ── Signal Card ── */
function SignalCard({ signal }: { signal: TradingSignal }) {
  const colors = signalColors[signal.signal_type];
  const SignalIcon =
    signal.signal_type === "buy"
      ? TrendingUp
      : signal.signal_type === "sell"
        ? TrendingDown
        : Minus;

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border-default rounded-lg p-5 flex flex-col gap-4 border-l-[3px]",
        colors.border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary">
            {signal.token_symbol}
          </span>
          <span className="text-xs text-text-secondary">{signal.token_name}</span>
        </div>
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
            colors.badge
          )}
        >
          {signal.signal_type}
        </span>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              signal.confidence >= 70
                ? "bg-signal-success"
                : signal.confidence >= 40
                  ? "bg-signal-warning"
                  : "bg-signal-danger"
            )}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
        <span className="text-xs font-num text-text-secondary">
          {signal.confidence}%
        </span>
      </div>

      {/* Levels */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-text-secondary uppercase">Entry</span>
          <span className="text-sm font-num text-text-primary">
            {formatCurrency(signal.entry_low)} - {formatCurrency(signal.entry_high)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
            <Target className="size-3" /> Target
          </span>
          <span className="text-sm font-num text-signal-success">
            {formatCurrency(signal.target_1)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-text-secondary uppercase">Target 2</span>
          <span className="text-sm font-num text-signal-success">
            {formatCurrency(signal.target_2)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-text-secondary uppercase flex items-center gap-1">
            <ShieldAlert className="size-3" /> Stop Loss
          </span>
          <span className="text-sm font-num text-signal-danger">
            {formatCurrency(signal.stop_loss)}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Tag color="neutral">{signal.timeframe}</Tag>
        <Tag color="neutral">{signal.chain}</Tag>
        {signal.basis_tags.slice(0, 3).map((tag) => (
          <Tag key={tag} color="info">
            {tag}
          </Tag>
        ))}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            "font-medium",
            signal.status === "active"
              ? "text-signal-success"
              : signal.status === "hit_target"
                ? "text-accent-primary"
                : signal.status === "stopped_out"
                  ? "text-signal-danger"
                  : "text-text-disabled"
          )}
        >
          {signal.status.replace("_", " ").toUpperCase()}
        </span>
        {signal.result_pnl !== null && (
          <span
            className={cn(
              "font-num font-medium",
              signal.result_pnl >= 0
                ? "text-signal-success"
                : "text-signal-danger"
            )}
          >
            {formatPercentage(signal.result_pnl)}
          </span>
        )}
      </div>
    </div>
  );
}
