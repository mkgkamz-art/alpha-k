/**
 * GET /api/surge-count
 *
 * Returns the count of coins with ≥5% change in the last 5 minutes (Upbit).
 * Used by MarketBar for the "급등 N건" display.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SURGE_THRESHOLD } from "@/lib/surge-detector";
import { withCache } from "@/lib/api-error-handler";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Get latest prices from upbit within last 5 min, then count surges
    const { data, error } = await supabase
      .from("korean_prices")
      .select("symbol, change_24h")
      .eq("exchange", "upbit")
      .gte("fetched_at", cutoff)
      .order("fetched_at", { ascending: false });

    if (error) {
      return NextResponse.json({ count: 0 });
    }

    // Deduplicate by symbol
    const seen = new Set<string>();
    let count = 0;
    for (const row of data ?? []) {
      if (seen.has(row.symbol)) continue;
      seen.add(row.symbol);
      const change = Number(row.change_24h);
      if (Math.abs(change) >= SURGE_THRESHOLD) count++;
    }

    return withCache(NextResponse.json({ count }), 15, 30);
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
