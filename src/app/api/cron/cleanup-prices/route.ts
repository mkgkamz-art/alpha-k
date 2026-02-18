/**
 * Cron: Clean up old korean_prices data (daily at 03:00 KST / 18:00 UTC)
 *
 * Deletes rows older than 7 days to keep the table lean.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  try {
    const supabase = createAdminClient();
    const cutoff = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error, count } = await supabase
      .from("korean_prices")
      .delete({ count: "exact" })
      .lt("fetched_at", cutoff);

    if (error) {
      console.error("[cron/cleanup-prices] Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[cron/cleanup-prices] Deleted ${count ?? 0} rows older than 7 days`);

    return NextResponse.json({
      success: true,
      deleted: count ?? 0,
    });
  } catch (err) {
    console.error("[cron/cleanup-prices] Error:", err);
    return NextResponse.json(
      { error: "Failed to cleanup prices" },
      { status: 500 }
    );
  }
}
