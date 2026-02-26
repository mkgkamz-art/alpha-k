/**
 * Cron: 시그널 적중률 평가 (every 5 minutes)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { evaluateSignalResults } from "@/lib/detectors/result-evaluator";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const { evaluated, hits, misses } = await evaluateSignalResults(admin);

    return NextResponse.json({
      success: true,
      evaluated,
      hits,
      misses,
      hitRate: evaluated > 0 ? Math.round((hits / evaluated) * 100) : 0,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/evaluate-results] Error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate signal results" },
      { status: 500 },
    );
  }
}
