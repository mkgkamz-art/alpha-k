"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonGroupOption {
  value: string;
  label: string;
}

export interface ButtonGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: ButtonGroupOption[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ options, value, onChange, size = "md", className, ...props }, ref) => (
    <div
      ref={ref}
      role="radiogroup"
      className={cn(
        "inline-flex rounded-[6px] border border-border-default overflow-hidden",
        className
      )}
      {...props}
    >
      {options.map((option, i) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            role="radio"
            type="button"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "font-medium transition-colors",
              size === "sm"
                ? "px-3 py-1.5 text-[12px]"
                : "px-4 py-2 text-[13px]",
              isActive
                ? "bg-accent-primary text-bg-primary"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary",
              i > 0 && "border-l border-border-default"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  )
);
ButtonGroup.displayName = "ButtonGroup";
