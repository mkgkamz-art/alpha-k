/**
 * Local Cron Simulator
 *
 * Runs the same cron schedules as vercel.json against localhost.
 * Usage: npx tsx scripts/local-cron.ts
 *
 * Automatically waits for the dev server to be ready before starting.
 */

import cron from "node-cron";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(__dirname, "../.env.local") });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("ERROR: CRON_SECRET not found in .env.local");
  process.exit(1);
}

/** Wait for the dev server to respond before scheduling jobs */
async function waitForServer(maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`, {
        signal: AbortSignal.timeout(2_000),
      }).catch(() => fetch(BASE_URL, { signal: AbortSignal.timeout(2_000) }));
      if (res.ok || res.status === 404) return; // server is up
    } catch {
      // not ready yet
    }
    const secs = Math.min(2 + i, 5);
    process.stdout.write(`\r  Waiting for server... (${i + 1}/${maxRetries})`);
    await new Promise((r) => setTimeout(r, secs * 1000));
  }
  console.warn("\n  Server not detected — starting cron anyway.");
}

interface CronJob {
  path: string;
  schedule: string;
  label: string;
}

const jobs: CronJob[] = [
  // ── 매분 (핵심 데이터) ──
  { path: "/api/cron/fetch-korean-prices", schedule: "* * * * *", label: "fetch-korean-prices (1min)" },
  { path: "/api/cron/fetch-prices", schedule: "* * * * *", label: "fetch-prices (1min)" },
  { path: "/api/cron/check-stablecoins", schedule: "* * * * *", label: "check-stablecoins (1min)" },
  // ── 2분 간격 ──
  { path: "/api/cron/check-price-alerts", schedule: "*/2 * * * *", label: "check-price-alerts (2min)" },
  { path: "/api/cron/fetch-whale-events", schedule: "*/2 * * * *", label: "fetch-whale-events (2min)" },
  // ── 5분 간격 ──
  { path: "/api/cron/detect-listings", schedule: "*/5 * * * *", label: "detect-listings (5min)" },
  { path: "/api/cron/update-defi-health", schedule: "*/5 * * * *", label: "update-defi-health (5min)" },
  { path: "/api/cron/update-liquidity", schedule: "*/5 * * * *", label: "update-liquidity (5min)" },
  // ── 시간/일 단위 ──
  { path: "/api/cron/kimchi-history", schedule: "0 * * * *", label: "kimchi-history (hourly)" },
  { path: "/api/cron/signal-generator", schedule: "0 */4 * * *", label: "signal-generator (4h)" },
  { path: "/api/cron/fetch-token-unlocks", schedule: "0 0 * * *", label: "fetch-token-unlocks (daily)" },
  { path: "/api/cron/cleanup-prices", schedule: "0 18 * * *", label: "cleanup-prices (daily 18UTC)" },
  { path: "/api/cron/email-digest", schedule: "0 8 * * *", label: "email-digest (daily 8am)" },
];

async function callCron(job: CronJob) {
  const started = Date.now();
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });

  try {
    const res = await fetch(`${BASE_URL}${job.path}`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });

    const data = await res.json();
    const ms = Date.now() - started;

    if (res.ok) {
      console.log(`[${time}] ✓ ${job.label} (${ms}ms)`, JSON.stringify(data).slice(0, 120));
    } else {
      console.error(`[${time}] ✗ ${job.label} (${ms}ms)`, data.error || `HTTP ${res.status}`);
    }
  } catch (err) {
    const ms = Date.now() - started;
    console.error(
      `[${time}] ✗ ${job.label} (${ms}ms)`,
      err instanceof Error ? err.message : "Unknown error"
    );
  }
}

// Main
async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║    Alpha K Local Cron Simulator          ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Base URL: ${BASE_URL.padEnd(29)}║`);
  console.log(`║  Jobs: ${jobs.length} registered${" ".repeat(22)}║`);
  console.log("╚══════════════════════════════════════════╝");
  console.log("");

  await waitForServer();
  console.log("\n  Server ready!\n");

  console.log("Registered schedules:");

  for (const job of jobs) {
    const valid = cron.validate(job.schedule);
    console.log(`  ${valid ? "✓" : "✗"} ${job.schedule.padEnd(15)} ${job.label}`);

    if (valid) {
      cron.schedule(job.schedule, () => callCron(job));
    }
  }

  console.log("");
  console.log("Cron simulator running. Press Ctrl+C to stop.");
  console.log("─".repeat(50));
}

main();
