import { forwardRef, type SVGAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SparklineProps extends SVGAttributes<SVGSVGElement> {
  data: number[];
  positive?: boolean;
  width?: number;
  height?: number;
}

export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(
  ({ data, positive, width = 48, height = 16, className, ...props }, ref) => {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    const isPositive = positive ?? data[data.length - 1] >= data[0];

    return (
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn("overflow-visible", className)}
        aria-hidden="true"
        {...props}
      >
        <polyline
          points={points}
          fill="none"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            isPositive ? "stroke-signal-success" : "stroke-signal-danger"
          )}
        />
      </svg>
    );
  }
);
Sparkline.displayName = "Sparkline";
