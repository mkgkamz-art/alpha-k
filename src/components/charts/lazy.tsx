"use client";

import dynamic from "next/dynamic";

export const LazyBarChart = dynamic(
  () => import("./bar-chart").then((m) => ({ default: m.BarChartComponent })),
  { ssr: false }
);

export const LazySparkline = dynamic(
  () => import("./sparkline-chart").then((m) => ({ default: m.SparklineChart })),
  { ssr: false }
);
