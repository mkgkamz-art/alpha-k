import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const severityVariants = {
  critical: "bg-badge-critical-bg text-badge-critical",
  high: "bg-badge-high-bg text-badge-high",
  medium: "bg-badge-medium-bg text-badge-medium",
  low: "bg-badge-low-bg text-badge-low",
} as const;

const statusVariants = {
  success: "bg-signal-success/15 text-signal-success",
  danger: "bg-signal-danger/15 text-signal-danger",
  warning: "bg-signal-warning/15 text-signal-warning",
  info: "bg-signal-info/15 text-signal-info",
  neutral: "bg-bg-tertiary text-text-secondary",
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof severityVariants | keyof typeof statusVariants;
  size?: "sm" | "md";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", size = "sm", ...props }, ref) => {
    const variantClass =
      severityVariants[variant as keyof typeof severityVariants] ??
      statusVariants[variant as keyof typeof statusVariants];

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-[4px]",
          size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-[13px]",
          variantClass,
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
