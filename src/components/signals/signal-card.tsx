"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SignalType, Timeframe, SignalStatus } from "@/types";

/* ── Signal Type Config ── */
const signalConfig: Record<SignalType, { color: string; icon: typeof TrendingUp; label: string }> = {
  buy: { color: "text-signal-success", icon: TrendingUp, label: "BUY" },
  sell: { color: "text-signal-danger", icon: TrendingDown, label: "SELL" },
  hold: { color: "text-signal-warning", icon: Minus, label: "HOLD" },
};

const statusConfig: Record<SignalStatus, { bg: string; text: string }> = {
  active: { bg: "bg-signal-success/10", text: "text-signal-success" },
  hit_target: { bg: "bg-signal-info/10", text: "text-signal-info" },
  stopped_out: { bg: "bg-signal-danger/10", text: "text-signal-danger" },
  expired: { bg: "bg-bg-tertiary", text: "text-text-disabled" },
};

export interface SignalCardProps extends HTMLAttributes<HTMLDivElement> {
  tokenSymbol: string;
  tokenName: string;
  signalType: SignalType;
  confidence: number;
  entryLow: number;
  entryHigh: number;
  target1: number;
  target2: number;
  stopLoss: number;
  timeframe: Timeframe;
  status: SignalStatus;
  basisTags?: string[];
  resultPnl?: number | null;
  onClick?: () => void;
}

export const SignalCard = forwardRef<HTMLDivElement, SignalCardProps>(
  (
    {
      tokenSymbol,
      tokenName,
      signalType,
      confidence,
      entryLow,
      entryHigh,
      target1,
      target2,
      stopLoss,
      timeframe,
      status,
      basisTags = [],
      resultPnl,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const signal = signalConfig[signalType];
    const statusStyle = statusConfig[status];
    const Icon = signal.icon;

    const borderColor =
      signalType === "buy"
        ? "border-l-signal-success"
        : signalType === "sell"
          ? "border-l-signal-danger"
          : "border-l-signal-warning";

    return (
      <div
        ref={ref}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => e.key === "Enter" && onClick?.()}
        className={cn(
          "bg-bg-secondary border border-border-default border-l-[3px] rounded-lg p-4 transition-colors",
          borderColor,
          onClick && "cursor-pointer hover:border-[#3B4149]",
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn("size-4", signal.color)} />
            <span className={cn("text-xs font-bold uppercase tracking-wider", signal.color)}>
              {signal.label}
            </span>
            <span className="text-[11px] text-text-disabled font-num">{timeframe.toUpperCase()}</span>
          </div>
          <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded", statusStyle.bg, statusStyle.text)}>
            {status.replace("_", " ")}
          </span>
        </div>

        {/* Token Info */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-text-primary font-semibold text-sm">{tokenSymbol}</span>
            <span className="text-text-secondary text-xs ml-1.5">{tokenName}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-secondary">Confidence</span>
            <span className={cn(
              "font-num text-xs font-bold",
              confidence >= 70 ? "text-signal-success" : confidence >= 40 ? "text-signal-warning" : "text-signal-danger"
            )}>
              {confidence}%
            </span>
          </div>
        </div>

        {/* Price Levels */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-bg-primary/50 rounded p-2">
            <span className="text-[10px] text-text-secondary block">Entry</span>
            <span className="font-num text-xs text-text-primary">
              ${entryLow.toLocaleString()} – ${entryHigh.toLocaleString()}
            </span>
          </div>
          <div className="bg-bg-primary/50 rounded p-2">
            <span className="text-[10px] text-text-secondary block">Stop Loss</span>
            <span className="font-num text-xs text-signal-danger">
              ${stopLoss.toLocaleString()}
            </span>
          </div>
          <div className="bg-bg-primary/50 rounded p-2">
            <span className="text-[10px] text-text-secondary block">Target 1</span>
            <span className="font-num text-xs text-signal-success">
              ${target1.toLocaleString()}
            </span>
          </div>
          <div className="bg-bg-primary/50 rounded p-2">
            <span className="text-[10px] text-text-secondary block">Target 2</span>
            <span className="font-num text-xs text-signal-success">
              ${target2.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Basis Tags + PnL */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {basisTags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
          {resultPnl != null && (
            <span
              className={cn(
                "font-num text-xs font-bold",
                resultPnl >= 0 ? "text-signal-success" : "text-signal-danger"
              )}
            >
              {resultPnl >= 0 ? "+" : ""}
              {resultPnl.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    );
  }
);
SignalCard.displayName = "SignalCard";
