"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ── Filter Pill Group ── */
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterPillsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export const FilterPills = forwardRef<HTMLDivElement, FilterPillsProps>(
  ({ options, value, onChange, className, ...props }, ref) => (
    <div
      ref={ref}
      role="radiogroup"
      className={cn("flex items-center gap-2 flex-wrap", className)}
      {...props}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            role="radio"
            type="button"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold border transition-colors",
              isActive
                ? "bg-accent-primary text-bg-primary border-accent-primary"
                : "bg-transparent text-text-secondary border-border-default hover:border-text-secondary hover:text-text-primary"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-num rounded-full px-1.5 py-0.5",
                  isActive
                    ? "bg-bg-primary/20 text-bg-primary"
                    : "bg-bg-tertiary text-text-disabled"
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  )
);
FilterPills.displayName = "FilterPills";
