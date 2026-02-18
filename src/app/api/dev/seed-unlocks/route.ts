/**
 * GET /api/dev/seed-unlocks
 *
 * Dev-only: Seed token_unlocks from upcoming-unlocks.json.
 * Inserts all events and generates sample alert_events.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadUpcomingUnlocks } from "@/lib/blockchain/token-unlock-fetcher";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const events = loadUpcomingUnlocks(90);

    // Upsert all unlock events
    const rows = events.map((e) => ({
      token_symbol: e.tokenSymbol,
      token_name: e.tokenName,
      unlock_date: e.unlockDate,
      amount: e.unlockAmount,
      usd_value_estimate: e.unlockValueUsd,
      percent_of_supply: e.pctOfSupply,
      category: e.category,
      impact_score: e.impactScore,
      is_notified_3d: false,
      is_notified_1d: false,
    }));

    const { data: upserted, error: upsertErr } = await supabase
      .from("token_unlocks")
      .upsert(rows, { onConflict: "token_symbol,unlock_date" })
      .select("id");

    if (upsertErr) throw upsertErr;

    return NextResponse.json({
      success: true,
      unlocks_upserted: upserted?.length ?? 0,
      events: events.map((e) => ({
        token: e.tokenSymbol,
        date: e.unlockDate.slice(0, 10),
        amount: e.unlockAmount,
        usd: e.unlockValueUsd,
        pct: e.pctOfSupply,
        category: e.category,
        impact: e.impactScore,
      })),
    });
  } catch (err) {
    console.error("[dev/seed-unlocks] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to seed unlocks" },
      { status: 500 }
    );
  }
}
