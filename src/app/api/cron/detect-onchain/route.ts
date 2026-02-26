/**
 * Cron: 온체인 이상 감지 (every 5 minutes)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { detectOnchainActivity } from "@/lib/detectors/onchain-detector";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const { detected } = await detectOnchainActivity(admin);

    return NextResponse.json({
      success: true,
      detected,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/detect-onchain] Error:", err);
    return NextResponse.json(
      { error: "Failed to detect onchain activity" },
      { status: 500 },
    );
  }
}
