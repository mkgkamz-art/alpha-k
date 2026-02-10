"use client";

import { cn } from "@/lib/utils";
import type { Severity } from "@/types";

const severityFilters: { value: Severity | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const severityColors: Record<string, string> = {
  critical: "border-signal-danger text-signal-danger",
  high: "border-[#FF8C00] text-[#FF8C00]",
  medium: "border-signal-warning text-signal-warning",
  low: "border-text-disabled text-text-disabled",
};

interface SeverityFilterProps {
  active: Severity | "all";
  onChange: (value: Severity | "all") => void;
}

export function SeverityFilter({ active, onChange }: SeverityFilterProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
      {severityFilters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border transition-colors",
            active === filter.value
              ? filter.value === "all"
                ? "bg-accent-primary text-bg-primary border-accent-primary"
                : cn(
                    "bg-transparent",
                    severityColors[filter.value],
                  )
              : "bg-transparent text-text-secondary border-border-default hover:border-text-secondary hover:text-text-primary"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
