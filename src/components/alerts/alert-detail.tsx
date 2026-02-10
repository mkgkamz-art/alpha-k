"use client";

import {
  Waves,
  AlertTriangle,
  TrendingUp,
  Unlock,
  Droplets,
  ArrowRight,
  ExternalLink,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Tag, ProgressRing, CopyAddress } from "@/components/ui";
import type { AlertType, Severity } from "@/types";

/* ── Type Config ── */
const typeConfig: Record<
  AlertType,
  { icon: typeof Waves; color: string; bgTint: string }
> = {
  whale: { icon: Waves, color: "text-signal-info", bgTint: "bg-signal-info/10 border-signal-info/20" },
  risk: { icon: AlertTriangle, color: "text-signal-danger", bgTint: "bg-signal-danger/10 border-signal-danger/20" },
  price_signal: { icon: TrendingUp, color: "text-signal-success", bgTint: "bg-signal-success/10 border-signal-success/20" },
  token_unlock: { icon: Unlock, color: "text-signal-warning", bgTint: "bg-signal-warning/10 border-signal-warning/20" },
  liquidity: { icon: Droplets, color: "text-[#8B5CF6]", bgTint: "bg-[#8B5CF6]/10 border-[#8B5CF6]/20" },
};

/* ── Transaction Address ── */
interface TxAddress {
  label: string;
  tag: string;
  tagColor: "purple" | "warning" | "info" | "success" | "neutral";
  address: string;
  subtext: string;
}

/* ── Transaction Meta ── */
interface TxMeta {
  label: string;
  value: string;
  href?: string;
}

/* ── Impact Metric ── */
interface ImpactMetric {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
}

/* ── Props ── */
export interface AlertDetailProps {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  time: string;
  /** Transaction flow */
  from?: TxAddress;
  to?: TxAddress;
  txMeta?: TxMeta[];
  /** Impact analysis */
  impactScore?: number;
  impactMetrics?: ImpactMetric[];
  onTrackWallet?: () => void;
}

/* ── Hero Section ── */
function AlertHero({
  type,
  severity,
  title,
  description,
  time,
  id,
  onTrackWallet,
}: Pick<AlertDetailProps, "type" | "severity" | "title" | "description" | "time" | "id" | "onTrackWallet">) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-6 flex flex-col md:flex-row items-start justify-between gap-6">
      <div className="flex items-start gap-5">
        <div
          className={cn(
            "size-16 rounded-xl flex items-center justify-center shrink-0 border",
            config.bgTint
          )}
        >
          <Icon className={cn("size-8", config.color)} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={severity}>{severity.toUpperCase()}</Badge>
            <span className="text-text-secondary text-xs font-num">ID: #{id.slice(0, 12)}</span>
            <span className="text-text-secondary text-xs">{time}</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary leading-tight">{title}</h1>
          <p className="text-text-secondary text-sm max-w-2xl">{description}</p>
        </div>
      </div>
      {onTrackWallet && (
        <button
          type="button"
          onClick={onTrackWallet}
          className="bg-accent-primary hover:bg-accent-primary/90 text-bg-primary font-semibold text-sm px-4 py-2 rounded transition-colors flex items-center gap-2 shrink-0"
        >
          <ExternalLink className="size-4" />
          Track Wallet
        </button>
      )}
    </div>
  );
}

/* ── Transaction Flow Card ── */
function TransactionFlowCard({
  from,
  to,
  txMeta = [],
}: {
  from: TxAddress;
  to: TxAddress;
  txMeta: TxMeta[];
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
        <h3 className="text-text-primary font-medium flex items-center gap-2 text-sm">
          <ArrowRight className="size-4 text-text-secondary" />
          Transaction Flow
        </h3>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-signal-success animate-pulse" />
          <span className="text-xs text-signal-success">Confirmed</span>
        </div>
      </div>

      {/* From / To */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {/* Arrow Divider */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center size-10 rounded-full bg-bg-tertiary border border-border-default z-10">
          <ArrowRight className="size-4 text-text-secondary" />
        </div>

        {/* From */}
        <AddressBox address={from} direction="From" />
        {/* To */}
        <AddressBox address={to} direction="To" />
      </div>

      {/* Meta Grid */}
      {txMeta.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border-default border-t border-border-default">
          {txMeta.map((m) => (
            <div key={m.label} className="bg-bg-secondary p-4 flex flex-col gap-1">
              <span className="text-xs text-text-secondary">{m.label}</span>
              {m.href ? (
                <a
                  href={m.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-signal-info hover:text-signal-info/80 font-num text-sm truncate underline decoration-signal-info/30 underline-offset-2"
                >
                  {m.value}
                </a>
              ) : (
                <span className="text-text-primary font-num text-sm">{m.value}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddressBox({ address, direction }: { address: TxAddress; direction: string }) {
  return (
    <div className="flex flex-col gap-4 bg-bg-primary/50 p-4 rounded-lg border border-border-default/50">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
          {direction}
        </span>
        <Tag color={address.tagColor}>{address.tag}</Tag>
      </div>
      <div className="flex items-center gap-2">
        <CopyAddress address={address.address} chars={6} />
      </div>
      <span className="text-xs text-text-secondary">{address.subtext}</span>
    </div>
  );
}

/* ── Impact Panel ── */
function ImpactPanel({
  score,
  metrics = [],
}: {
  score: number;
  metrics: ImpactMetric[];
}) {
  const ringColor =
    score >= 7 ? "danger" : score >= 4 ? "warning" : "success";

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
      <h3 className="text-text-primary font-medium mb-6 flex items-center gap-2 text-sm">
        <AlertTriangle className="size-4 text-signal-warning" />
        Impact Analysis
      </h3>

      <div className="flex justify-center mb-8">
        <ProgressRing
          value={score}
          max={10}
          size="lg"
          color={ringColor}
          label="Score"
        />
      </div>

      <div className="flex flex-col gap-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-bg-primary border border-border-default rounded p-3 flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="text-xs text-text-secondary">{m.label}</span>
              <span
                className={cn(
                  "text-sm font-num font-medium",
                  m.trend === "up" && "text-signal-success",
                  m.trend === "down" && "text-signal-danger",
                  m.trend === "neutral" && "text-signal-warning"
                )}
              >
                {m.value}
              </span>
            </div>
            <TrendingUp
              className={cn(
                "size-5",
                m.trend === "up" && "text-signal-success",
                m.trend === "down" && "text-signal-danger rotate-180",
                m.trend === "neutral" && "text-signal-warning"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main AlertDetail ── */
export function AlertDetail({
  id,
  type,
  severity,
  title,
  description,
  time,
  from,
  to,
  txMeta = [],
  impactScore,
  impactMetrics = [],
  onTrackWallet,
}: AlertDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <AlertHero
        id={id}
        type={type}
        severity={severity}
        title={title}
        description={description}
        time={time}
        onTrackWallet={onTrackWallet}
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Transaction Flow */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {from && to && (
            <TransactionFlowCard from={from} to={to} txMeta={txMeta} />
          )}
        </div>

        {/* Right: Impact Analysis */}
        {impactScore !== undefined && (
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <ImpactPanel score={impactScore} metrics={impactMetrics} />
          </div>
        )}
      </div>
    </div>
  );
}
