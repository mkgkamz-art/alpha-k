/**
 * Cron: 커뮤니티 버즈 감지 (every 5 minutes)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { detectBuzz } from "@/lib/detectors/buzz-detector";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const { detected } = await detectBuzz(admin);

    return NextResponse.json({
      success: true,
      detected,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/detect-buzz] Error:", err);
    return NextResponse.json(
      { error: "Failed to detect community buzz" },
      { status: 500 },
    );
  }
}
