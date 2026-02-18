/**
 * GET /api/dev/seed-all
 *
 * Dev-only: Runs the full data pipeline sequentially.
 * 1. fetch-prices       → CoinGecko market prices
 * 2. (3s wait)          → Let prices propagate
 * 3. fetch-whale-events → Whale Alert API
 * 4. check-stablecoins  → CoinGecko stablecoin prices
 * 5. update-defi-health → DeFi Llama TVL data
 * 6. fetch-token-unlocks→ JSON-based unlock schedule
 * 7. signal-generator   → Rule-based signal analysis
 */

import { NextResponse } from "next/server";

interface StepResult {
  step: string;
  status: "success" | "error";
  duration: number;
  data?: Record<string, unknown>;
  error?: string;
}

const PIPELINE_STEPS = [
  { path: "/api/cron/fetch-prices", label: "fetch-prices" },
  { path: "__wait__", label: "wait-3s" },
  { path: "/api/cron/fetch-whale-events", label: "fetch-whale-events" },
  { path: "/api/cron/check-stablecoins", label: "check-stablecoins" },
  { path: "/api/cron/update-defi-health", label: "update-defi-health" },
  { path: "/api/cron/fetch-token-unlocks", label: "fetch-token-unlocks" },
  { path: "/api/cron/signal-generator", label: "signal-generator" },
] as const;

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not set in environment" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const pipelineStarted = Date.now();
  const results: StepResult[] = [];

  console.log("[seed-all] Starting full data pipeline...");

  for (const step of PIPELINE_STEPS) {
    // Handle wait step
    if (step.path === "__wait__") {
      console.log("[seed-all] Waiting 3 seconds for prices to propagate...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      results.push({
        step: step.label,
        status: "success",
        duration: 3000,
        data: { message: "Waited 3 seconds" },
      });
      continue;
    }

    const stepStarted = Date.now();

    try {
      const res = await fetch(`${baseUrl}${step.path}`, {
        headers: { Authorization: `Bearer ${cronSecret}` },
      });

      const data = await res.json();
      const duration = Date.now() - stepStarted;

      if (res.ok) {
        console.log(`[seed-all] ${step.label} ✓ (${duration}ms)`);
        results.push({
          step: step.label,
          status: "success",
          duration,
          data,
        });
      } else {
        console.error(`[seed-all] ${step.label} ✗ (${duration}ms):`, data);
        results.push({
          step: step.label,
          status: "error",
          duration,
          error: data.error || `HTTP ${res.status}`,
        });
      }
    } catch (err) {
      const duration = Date.now() - stepStarted;
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[seed-all] ${step.label} ✗ (${duration}ms):`, message);
      results.push({
        step: step.label,
        status: "error",
        duration,
        error: message,
      });
    }
  }

  const totalDuration = Date.now() - pipelineStarted;
  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  console.log(
    `[seed-all] Pipeline complete: ${successCount} success, ${errorCount} errors in ${totalDuration}ms`
  );

  return NextResponse.json({
    success: errorCount === 0,
    totalDuration,
    summary: { success: successCount, errors: errorCount },
    results,
  });
}
