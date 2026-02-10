"use client";

import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

const mockStats: StatItem[] = [
  { label: "BTC", value: "$97,234.50", change: "+2.34%", positive: true },
  { label: "ETH", value: "$3,456.12", change: "-0.87%", positive: false },
  { label: "Gas", value: "23 Gwei", change: "-12%", positive: true },
  { label: "Active Alerts", value: "47" },
  { label: "SOL", value: "$198.45", change: "+5.12%", positive: true },
  { label: "Fear & Greed", value: "72 Greed" },
];

export function StatusBar() {
  return (
    <div className="flex items-center gap-6 h-12 px-4 md:px-6 border-b border-border-default overflow-x-auto scrollbar-none">
      {mockStats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-text-secondary uppercase tracking-wider">
            {stat.label}
          </span>
          <span className="font-num text-[13px] font-medium text-text-primary">
            {stat.value}
          </span>
          {stat.change && (
            <span
              className={cn(
                "font-num text-[11px] font-medium",
                stat.positive ? "text-signal-success" : "text-signal-danger"
              )}
            >
              {stat.change}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
