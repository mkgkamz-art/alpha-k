"use client";

import { useState } from "react";
import {
  Unlock,
  Calendar,
  Loader2,
  TrendingDown,
  DollarSign,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { useUnlocks } from "@/hooks/use-unlocks";
import { FilterPills, StatCard, Badge, ProgressRing } from "@/components/ui";
import type { TokenUnlock, UnlockType } from "@/types";

const rangeOptions = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
];

const unlockTypeColors: Record<UnlockType, string> = {
  team: "text-signal-danger",
  investor: "text-signal-warning",
  ecosystem: "text-signal-info",
  public: "text-signal-success",
};

export default function UnlocksPage() {
  const [range, setRange] = useState("30d");
  const { unlocks, stats, isLoading } = useUnlocks(range);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-[1440px] w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">Token Unlocks</h1>
            <p className="text-sm text-text-secondary">
              Upcoming vesting schedules and their market impact.
            </p>
          </div>
          <FilterPills
            options={rangeOptions}
            value={range}
            onChange={setRange}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="This Period"
            value={stats.count}
            icon={<Calendar className="size-5 text-accent-primary" />}
            borderColor="primary"
          />
          <StatCard
            label="Total Value"
            value={formatCurrency(stats.totalValue)}
            icon={<DollarSign className="size-5 text-signal-warning" />}
            borderColor="warning"
          />
          <StatCard
            label="Highest Impact"
            value={`${stats.highestImpact}/10`}
            icon={<AlertTriangle className="size-5 text-signal-danger" />}
            borderColor="danger"
          />
          <StatCard
            label="Avg Impact"
            value={
              unlocks.length > 0
                ? `${(unlocks.reduce((s, u) => s + u.impact_score, 0) / unlocks.length).toFixed(1)}/10`
                : "–"
            }
            icon={<BarChart3 className="size-5 text-signal-info" />}
            borderColor="info"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 text-text-secondary animate-spin" />
          </div>
        ) : unlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <Unlock className="size-8 mb-2" />
            <p className="text-sm">No unlocks scheduled in this period.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {unlocks.map((unlock) => (
              <UnlockCard key={unlock.id} unlock={unlock} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Unlock Card ── */
function UnlockCard({ unlock }: { unlock: TokenUnlock }) {
  const impactColor =
    unlock.impact_score >= 7
      ? "danger"
      : unlock.impact_score >= 4
        ? "warning"
        : "success";

  const unlockDate = new Date(unlock.unlock_date);
  const now = new Date();
  const daysUntil = Math.ceil(
    (unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
      {/* Date Column */}
      <div className="flex flex-col items-center shrink-0 w-16">
        <span className="text-xs text-text-secondary uppercase">
          {unlockDate.toLocaleDateString("en", { month: "short" })}
        </span>
        <span className="text-2xl font-bold font-num text-text-primary">
          {unlockDate.getDate()}
        </span>
        <span className={cn(
          "text-[10px] font-bold",
          daysUntil <= 3 ? "text-signal-danger" : "text-text-secondary"
        )}>
          {daysUntil <= 0 ? "TODAY" : `${daysUntil}d`}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-text-primary">
            {unlock.token_symbol}
          </span>
          <span className="text-xs text-text-secondary">{unlock.token_name}</span>
          <Badge variant={unlock.impact_score >= 7 ? "critical" : unlock.impact_score >= 4 ? "medium" : "low"}>
            {unlock.unlock_type.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
          <span className="font-num">
            {formatNumber(unlock.unlock_amount)} tokens
          </span>
          <span className="font-num font-medium text-text-primary">
            {formatCurrency(unlock.unlock_value_usd)}
          </span>
          <span className={cn("font-num", unlockTypeColors[unlock.unlock_type])}>
            {formatPercentage(unlock.pct_of_circulating)} of circ.
          </span>
        </div>
        {unlock.vesting_info && (
          <p className="text-xs text-text-disabled mt-1">{unlock.vesting_info}</p>
        )}
      </div>

      {/* Impact Score */}
      <div className="shrink-0">
        <ProgressRing
          value={unlock.impact_score}
          max={10}
          size="sm"
          color={impactColor}
          label="Impact"
        />
      </div>
    </div>
  );
}
