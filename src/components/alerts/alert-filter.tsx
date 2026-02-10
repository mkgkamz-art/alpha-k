"use client";

import { cn } from "@/lib/utils";
import type { AlertType } from "@/types";

const filters: { value: AlertType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "whale", label: "Whale" },
  { value: "risk", label: "Risk" },
  { value: "price_signal", label: "Signal" },
  { value: "token_unlock", label: "Unlock" },
  { value: "liquidity", label: "Liquidity" },
];

interface AlertFilterProps {
  active: AlertType | "all";
  onChange: (value: AlertType | "all") => void;
}

export function AlertFilter({ active, onChange }: AlertFilterProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange(filter.value)}
          className={cn(
            "px-3 py-1.5 rounded-[6px] text-[13px] font-medium whitespace-nowrap transition-colors",
            active === filter.value
              ? "bg-accent-primary text-bg-primary"
              : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
