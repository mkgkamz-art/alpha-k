"use client";

import { forwardRef, type HTMLAttributes } from "react";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

export interface BarChartDatum {
  label: string;
  inflow?: number;
  outflow?: number;
  value?: number;
}

export interface BarChartProps extends HTMLAttributes<HTMLDivElement> {
  data: BarChartDatum[];
  height?: number;
  /** Dual mode: inflow (green) + outflow (red). Single mode: one "value" bar. */
  mode?: "dual" | "single";
  /** Bar color for single mode */
  barColor?: string;
}

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-bg-tertiary border border-border-default rounded px-3 py-2 shadow-lg">
      <p className="text-text-secondary text-[10px] mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="font-num text-xs text-text-primary">
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export const BarChartComponent = forwardRef<HTMLDivElement, BarChartProps>(
  ({ data, height = 200, mode = "dual", barColor = "#0ECB81", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        style={{ height }}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} barGap={2} barSize={mode === "dual" ? 8 : 16}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="#2B3139"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#848E9C", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#848E9C", fontSize: 10 }}
              width={40}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "rgba(43, 49, 57, 0.3)" }}
            />
            {mode === "dual" ? (
              <>
                <Bar
                  dataKey="inflow"
                  name="Inflow"
                  fill="#0ECB81"
                  radius={[2, 2, 0, 0]}
                  opacity={0.8}
                />
                <Bar
                  dataKey="outflow"
                  name="Outflow"
                  fill="#F6465D"
                  radius={[2, 2, 0, 0]}
                  opacity={0.8}
                />
              </>
            ) : (
              <Bar
                dataKey="value"
                name="Value"
                fill={barColor}
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
            )}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  }
);
BarChartComponent.displayName = "BarChartComponent";
