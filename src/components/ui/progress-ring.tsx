import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { size: 80, strokeWidth: 4, fontSize: "text-[16px]", subFontSize: "text-[10px]" },
  md: { size: 120, strokeWidth: 5, fontSize: "text-[24px]", subFontSize: "text-[11px]" },
  lg: { size: 160, strokeWidth: 6, fontSize: "text-[32px]", subFontSize: "text-[12px]" },
} as const;

const colorMap = {
  primary: "stroke-accent-primary",
  success: "stroke-signal-success",
  danger: "stroke-signal-danger",
  warning: "stroke-signal-warning",
  info: "stroke-signal-info",
} as const;

export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: keyof typeof sizeMap;
  color?: keyof typeof colorMap;
  label?: string;
}

export const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    { value, max = 10, size = "md", color = "primary", label, className, ...props },
    ref
  ) => {
    const { size: dim, strokeWidth, fontSize, subFontSize } = sizeMap[size];
    const radius = (dim - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min(value / max, 1);
    const offset = circumference * (1 - pct);

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: dim, height: dim }}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? `${value}/${max}`}
        {...props}
      >
        <svg
          className="-rotate-90"
          width={dim}
          height={dim}
          viewBox={`0 0 ${dim} ${dim}`}
        >
          {/* Background Ring */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-border-default"
          />
          {/* Progress Ring */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(colorMap[color], "transition-[stroke-dashoffset] duration-500")}
          />
        </svg>
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold font-num text-text-primary", fontSize)}>
            {value}
          </span>
          {label && (
            <span className={cn("text-text-secondary", subFontSize)}>
              {label}
            </span>
          )}
        </div>
      </div>
    );
  }
);
ProgressRing.displayName = "ProgressRing";
