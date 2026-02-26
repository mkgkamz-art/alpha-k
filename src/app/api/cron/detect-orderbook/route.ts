/**
 * Cron: 호가벽 감지 (every 2 minutes)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { detectOrderbookWalls } from "@/lib/detectors/orderbook-detector";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const { detected } = await detectOrderbookWalls(admin);

    return NextResponse.json({
      success: true,
      detected,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/detect-orderbook] Error:", err);
    return NextResponse.json(
      { error: "Failed to detect orderbook walls" },
      { status: 500 },
    );
  }
}
