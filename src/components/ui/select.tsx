"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-9 w-full appearance-none rounded-[6px] border bg-bg-tertiary px-3 pr-8 text-[14px] text-text-primary",
          "transition-colors",
          "focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-signal-danger"
            : "border-text-disabled",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
