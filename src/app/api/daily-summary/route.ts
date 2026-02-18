/**
 * GET /api/daily-summary
 *
 * Returns today's market summary: surge/dump counts, avg kimchi, listings, whales, fear-greed.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export interface DailySummaryResponse {
  surgeCount: number;
  dumpCount: number;
  avgKimchi: number;
  listingCount: number;
  whaleCount: number;
  fearGreed: { value: number | null; label: string } | null;
  date: string;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [surges, dumps, listings, whales] = await Promise.all([
      supabase
        .from("context_alerts")
        .select("*", { count: "exact", head: true })
        .eq("alert_type", "surge")
        .gte("created_at", todayISO),
      supabase
        .from("context_alerts")
        .select("*", { count: "exact", head: true })
        .eq("alert_type", "dump")
        .gte("created_at", todayISO),
      supabase
        .from("new_listings")
        .select("*", { count: "exact", head: true })
        .gte("detected_at", todayISO),
      supabase
        .from("context_alerts")
        .select("*", { count: "exact", head: true })
        .eq("alert_type", "whale")
        .gte("created_at", todayISO),
    ]);

    // Avg kimchi from latest korean_prices
    let avgKimchi = 0;
    const { data: kimchiRows } = await supabase
      .from("korean_prices")
      .select("kimchi_premium")
      .eq("exchange", "upbit")
      .not("kimchi_premium", "is", null)
      .gte("fetched_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order("fetched_at", { ascending: false })
      .limit(200);

    if (kimchiRows && kimchiRows.length > 0) {
      const premiums = kimchiRows.map((r) => Number(r.kimchi_premium) || 0);
      avgKimchi =
        Math.round((premiums.reduce((s, p) => s + p, 0) / premiums.length) * 100) / 100;
    }

    // Fear & Greed (internal fetch)
    let fearGreed: { value: number | null; label: string } | null = null;
    try {
      const fgRes = await fetch("https://api.alternative.me/fng/?limit=1", {
        signal: AbortSignal.timeout(3_000),
      });
      if (fgRes.ok) {
        const fgData = await fgRes.json();
        const entry = fgData?.data?.[0];
        if (entry) {
          const v = Number(entry.value);
          fearGreed = {
            value: v,
            label: v <= 25 ? "극단적 공포" : v <= 45 ? "공포" : v <= 55 ? "중립" : v <= 75 ? "탐욕" : "극단적 탐욕",
          };
        }
      }
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      surgeCount: surges.count ?? 0,
      dumpCount: dumps.count ?? 0,
      avgKimchi,
      listingCount: listings.count ?? 0,
      whaleCount: whales.count ?? 0,
      fearGreed,
      date: todayISO,
    } satisfies DailySummaryResponse);
  } catch (err) {
    console.error("[api/daily-summary] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
