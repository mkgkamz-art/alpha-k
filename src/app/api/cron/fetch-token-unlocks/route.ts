import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchTokenUnlocks } from "@/lib/blockchain/token-unlock-fetcher";

/**
 * Cron: Fetch token unlock events (daily at 06:00 UTC)
 *
 * Fetches upcoming token unlock schedules from Token Unlocks API,
 * upserts into token_unlocks table.
 */

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();

  try {
    const events = await fetchTokenUnlocks(90); // 90 days ahead
    const supabase = createAdminClient();

    let upsertCount = 0;

    for (const e of events) {
      const { error } = await supabase.from("token_unlocks").upsert(
        {
          token_symbol: e.tokenSymbol,
          token_name: e.tokenName,
          unlock_date: e.unlockDate,
          unlock_amount: e.unlockAmount,
          unlock_value_usd: e.unlockValueUsd,
          pct_of_circulating: e.pctOfCirculating,
          unlock_type: e.unlockType,
          vesting_info: e.vestingInfo,
          impact_score: e.impactScore,
          source_url: e.sourceUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token_symbol,unlock_date" }
      );

      if (!error) upsertCount++;
    }

    // Log high-impact unlocks
    const highImpact = events.filter((e) => e.impactScore >= 7);
    if (highImpact.length > 0) {
      for (const e of highImpact) {
        console.log(
          `[cron/fetch-token-unlocks] HIGH IMPACT: ${e.tokenSymbol} ${e.unlockAmount.toLocaleString()} tokens ($${(e.unlockValueUsd / 1e6).toFixed(1)}M) on ${e.unlockDate}`
        );
      }
    }

    console.log(
      `[cron/fetch-token-unlocks] ${upsertCount}/${events.length} events upserted, ${highImpact.length} high-impact in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      total: events.length,
      upserted: upsertCount,
      highImpact: highImpact.length,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/fetch-token-unlocks] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch token unlocks" },
      { status: 500 }
    );
  }
}

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
