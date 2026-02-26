/**
 * Cron: Whale Hot Coin Aggregator (every 5 minutes)
 *
 * Aggregates 24h whale trades by coin and updates the hot coins table.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { aggregateHotCoins } from "@/lib/whale-engine/hot-coin-aggregator";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const result = await aggregateHotCoins(admin);

    console.log(
      `[cron/whale-hot-coins] ${result.updated} coins updated (${Date.now() - started}ms)`,
    );

    return NextResponse.json({
      success: true,
      ...result,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/whale-hot-coins] Error:", err);
    return NextResponse.json(
      { error: "Failed to aggregate hot coins" },
      { status: 500 },
    );
  }
}
