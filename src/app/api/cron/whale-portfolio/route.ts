/**
 * Cron: Whale Portfolio Tracker (every 5 minutes)
 *
 * Updates portfolio holdings and detects token transfers for active whales.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { trackPortfolios } from "@/lib/whale-engine/portfolio-tracker";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const result = await trackPortfolios(admin);

    console.log(
      `[cron/whale-portfolio] ${result.tracked} whales, ${result.trades} trades (${Date.now() - started}ms)`,
    );

    return NextResponse.json({
      success: true,
      ...result,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/whale-portfolio] Error:", err);
    return NextResponse.json(
      { error: "Failed to track portfolios" },
      { status: 500 },
    );
  }
}
