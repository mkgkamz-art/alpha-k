"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types";

const severityConfig: Record<
  Severity,
  { bg: string; text: string; border: string; label: string }
> = {
  critical: {
    bg: "bg-signal-danger/15",
    text: "text-signal-danger",
    border: "border-signal-danger/20",
    label: "CRITICAL",
  },
  high: {
    bg: "bg-[#FF8C00]/15",
    text: "text-[#FF8C00]",
    border: "border-[#FF8C00]/20",
    label: "HIGH",
  },
  medium: {
    bg: "bg-signal-warning/15",
    text: "text-signal-warning",
    border: "border-signal-warning/20",
    label: "MEDIUM",
  },
  low: {
    bg: "bg-bg-tertiary",
    text: "text-text-secondary",
    border: "border-border-default",
    label: "LOW",
  },
};

export interface SeverityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity: Severity;
}

export const SeverityBadge = forwardRef<HTMLSpanElement, SeverityBadgeProps>(
  ({ severity, className, ...props }, ref) => {
    const config = severityConfig[severity];

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
          config.bg,
          config.text,
          config.border,
          className
        )}
        {...props}
      >
        {config.label}
      </span>
    );
  }
);
SeverityBadge.displayName = "SeverityBadge";
