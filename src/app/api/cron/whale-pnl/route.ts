/**
 * Cron: Whale PnL Calculator (every hour)
 *
 * FIFO-based realized PnL calculation + unrealized PnL + period returns.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { calculatePnl } from "@/lib/whale-engine/pnl-calculator";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const result = await calculatePnl(admin);

    console.log(
      `[cron/whale-pnl] ${result.sellsEvaluated} sells, ${result.whalesUpdated} whales, ${result.portfoliosUpdated} portfolios (${Date.now() - started}ms)`,
    );

    return NextResponse.json({
      success: true,
      ...result,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/whale-pnl] Error:", err);
    return NextResponse.json(
      { error: "Failed to calculate PnL" },
      { status: 500 },
    );
  }
}
