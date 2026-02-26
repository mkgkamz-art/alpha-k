/**
 * Cron: 체결량 폭증 감지 (every 2 minutes)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { detectVolumeSurges } from "@/lib/detectors/volume-detector";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const { detected } = await detectVolumeSurges(admin);

    return NextResponse.json({
      success: true,
      detected,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/detect-volume] Error:", err);
    return NextResponse.json(
      { error: "Failed to detect volume surges" },
      { status: 500 },
    );
  }
}
