"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface StatusBarItem {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export interface StatusBarProps extends HTMLAttributes<HTMLDivElement> {
  items: StatusBarItem[];
}

export const StatusBar = forwardRef<HTMLDivElement, StatusBarProps>(
  ({ items, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-6 h-12 px-4 md:px-6 border-b border-border-default overflow-x-auto scrollbar-none",
        className
      )}
      role="status"
      aria-label="Market ticker"
      {...props}
    >
      {items.map((stat) => (
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
  )
);
StatusBar.displayName = "StatusBar";
