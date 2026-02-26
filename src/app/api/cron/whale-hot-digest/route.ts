/**
 * Cron: Whale Hot Coin Daily Digest (daily 9 AM KST = 0 AM UTC)
 *
 * Sends top 3 hot coins digest to Pro/Whale users
 * with whale telegram notifications enabled.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { dispatchWhaleHotCoinDigest } from "@/lib/telegram/whale-notifier";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    const result = await dispatchWhaleHotCoinDigest(admin);

    console.log(
      `[cron/whale-hot-digest] sent=${result.sent} skipped=${result.skipped} (${Date.now() - started}ms)`,
    );

    return NextResponse.json({
      success: true,
      ...result,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/whale-hot-digest] Error:", err);
    return NextResponse.json(
      { error: "Failed to send whale hot coin digest" },
      { status: 500 },
    );
  }
}
