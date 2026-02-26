/**
 * Cron: Clean up expired radar signals (daily at 3 AM UTC)
 *
 * Deletes radar_signals where expires_at < now().
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("radar_signals")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");

    if (error) {
      console.error("[cron/radar-cleanup] Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const count = data?.length ?? 0;
    console.log(`[cron/radar-cleanup] Deleted ${count} expired signals`);

    return NextResponse.json({ success: true, deleted: count });
  } catch (err) {
    console.error("[cron/radar-cleanup] Error:", err);
    return NextResponse.json(
      { error: "Failed to cleanup radar signals" },
      { status: 500 },
    );
  }
}
