"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ── Tag ── */
const colorMap = {
  danger: "bg-signal-danger/10 text-signal-danger border-signal-danger/20",
  success: "bg-signal-success/10 text-signal-success border-signal-success/20",
  warning: "bg-signal-warning/10 text-signal-warning border-signal-warning/20",
  info: "bg-signal-info/10 text-signal-info border-signal-info/20",
  purple: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20",
  neutral: "bg-bg-tertiary text-text-secondary border-border-default",
} as const;

export type TagColor = keyof typeof colorMap;

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  color?: TagColor;
  /** Uppercase + tracking-wider for severity labels */
  uppercase?: boolean;
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ color = "neutral", uppercase = false, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap",
        colorMap[color],
        uppercase && "uppercase tracking-wider text-[10px] font-bold",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);
Tag.displayName = "Tag";
