"use client";

import { forwardRef, type HTMLAttributes } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export interface SparklineChartProps extends HTMLAttributes<HTMLDivElement> {
  data: number[];
  /** Auto-detect from first vs last if omitted */
  positive?: boolean;
  height?: number;
  strokeWidth?: number;
}

export const SparklineChart = forwardRef<HTMLDivElement, SparklineChartProps>(
  ({ data, positive, height = 40, strokeWidth = 1.5, className, ...props }, ref) => {
    if (data.length < 2) return null;

    const isPositive = positive ?? data[data.length - 1] >= data[0];
    const color = isPositive ? "#0ECB81" : "#F6465D";

    const chartData = data.map((value, index) => ({ index, value }));

    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        style={{ height }}
        aria-hidden="true"
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis domain={["dataMin", "dataMax"]} hide />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={strokeWidth}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);
SparklineChart.displayName = "SparklineChart";
