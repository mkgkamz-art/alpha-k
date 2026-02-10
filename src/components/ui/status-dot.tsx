import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  success: "bg-signal-success",
  danger: "bg-signal-danger",
  warning: "bg-signal-warning",
  info: "bg-signal-info",
  neutral: "bg-text-disabled",
} as const;

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  pulse?: boolean;
  size?: "sm" | "md";
  label?: string;
}

export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ variant = "neutral", pulse = false, size = "sm", label, className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    >
      <span
        className={cn(
          "rounded-full shrink-0",
          size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5",
          variants[variant],
          pulse && "animate-pulse"
        )}
        aria-hidden="true"
      />
      {label && (
        <span className="text-[12px] font-medium text-text-secondary">
          {label}
        </span>
      )}
    </span>
  )
);
StatusDot.displayName = "StatusDot";
