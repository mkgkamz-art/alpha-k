/**
 * Cron: Whale Discovery (daily at 4 AM UTC)
 *
 * Scans DEX routers for high-volume wallets and profiles new whales.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { discoverWhales } from "@/lib/whale-engine/discovery";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const result = await discoverWhales(admin);

    console.log(
      `[cron/whale-discovery] +${result.discovered} whales, ${result.tiersUpdated} tiers updated (${Date.now() - started}ms)`,
    );

    return NextResponse.json({
      success: true,
      ...result,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/whale-discovery] Error:", err);
    return NextResponse.json(
      { error: "Failed to discover whales" },
      { status: 500 },
    );
  }
}
