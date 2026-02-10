import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const borderVariants = {
  none: "",
  primary: "border-l-[3px] border-l-accent-primary",
  success: "border-l-[3px] border-l-signal-success",
  danger: "border-l-[3px] border-l-signal-danger",
  warning: "border-l-[3px] border-l-signal-warning",
  info: "border-l-[3px] border-l-signal-info",
} as const;

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: ReactNode;
  change?: string;
  positive?: boolean;
  borderColor?: keyof typeof borderVariants;
  statusBadge?: ReactNode;
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      label,
      value,
      icon,
      change,
      positive,
      borderColor = "none",
      statusBadge,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "bg-bg-secondary border border-border-default rounded-[8px] p-5 flex items-start justify-between",
        borderVariants[borderColor],
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-[6px] flex items-center justify-center shrink-0 bg-bg-tertiary">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            {label}
          </p>
          <p className="text-[20px] font-bold font-num text-text-primary mt-1 truncate">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                "text-[11px] font-num font-medium mt-0.5",
                positive === true && "text-signal-success",
                positive === false && "text-signal-danger",
                positive === undefined && "text-text-secondary"
              )}
            >
              {change}
            </p>
          )}
        </div>
      </div>
      {statusBadge && <div className="shrink-0">{statusBadge}</div>}
    </div>
  )
);
StatCard.displayName = "StatCard";
