/**
 * Cron: Whale Trade Detector (every 2 minutes)
 *
 * Polls Etherscan for recent transactions from top whales,
 * detects DEX swaps and exchange flows.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { detectTrades } from "@/lib/whale-engine/trade-detector";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const result = await detectTrades(admin);

    console.log(
      `[cron/whale-trades] ${result.detected} trades, ${result.notified} notifs (${Date.now() - started}ms)`,
    );

    return NextResponse.json({
      success: true,
      ...result,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/whale-trades] Error:", err);
    return NextResponse.json(
      { error: "Failed to detect whale trades" },
      { status: 500 },
    );
  }
}
