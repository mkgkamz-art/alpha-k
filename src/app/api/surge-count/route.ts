/**
 * GET /api/surge-count
 *
 * Returns the count of coins with ≥5% change in the last 2 hours (Upbit).
 * Used by MarketBar for the "급등 N건" display.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SURGE_THRESHOLD, SURGE_WINDOW_MS } from "@/lib/surge-detector";
import { withCache } from "@/lib/api-error-handler";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const now = Date.now();
    const recentCutoff = new Date(now - 5 * 60 * 1000).toISOString();
    const oldFrom = new Date(now - SURGE_WINDOW_MS - 10 * 60 * 1000).toISOString();
    const oldTo = new Date(now - SURGE_WINDOW_MS + 10 * 60 * 1000).toISOString();

    const [currentRes, oldRes] = await Promise.all([
      supabase
        .from("korean_prices")
        .select("symbol, price_krw")
        .eq("exchange", "upbit")
        .gte("fetched_at", recentCutoff)
        .order("fetched_at", { ascending: false }),
      supabase
        .from("korean_prices")
        .select("symbol, price_krw")
        .eq("exchange", "upbit")
        .gte("fetched_at", oldFrom)
        .lte("fetched_at", oldTo)
        .order("fetched_at", { ascending: false }),
    ]);

    if (currentRes.error) {
      return NextResponse.json({ count: 0 });
    }

    // Deduplicate current
    const currentMap = new Map<string, number>();
    for (const row of currentRes.data ?? []) {
      if (!currentMap.has(row.symbol)) {
        currentMap.set(row.symbol, Number(row.price_krw));
      }
    }

    // Deduplicate old
    const oldMap = new Map<string, number>();
    for (const row of oldRes.data ?? []) {
      if (!oldMap.has(row.symbol)) {
        oldMap.set(row.symbol, Number(row.price_krw));
      }
    }

    // Count surges based on 2h change
    let count = 0;
    for (const [symbol, currentPrice] of currentMap) {
      const oldPrice = oldMap.get(symbol);
      if (!oldPrice || oldPrice === 0) continue;
      const changePct = Math.abs(((currentPrice - oldPrice) / oldPrice) * 100);
      if (changePct >= SURGE_THRESHOLD) count++;
    }

    return withCache(NextResponse.json({ count }), 15, 30);
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
