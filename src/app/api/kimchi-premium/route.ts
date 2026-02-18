/**
 * GET /api/kimchi-premium
 *
 * Returns latest kimchi premium data for all coins (or a specific symbol).
 *
 * Query params:
 *   symbol  — filter by specific symbol (e.g. "BTC")
 *   sort    — "premium_desc" | "premium_asc" | "volume_desc" (default: premium_desc)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withCache } from "@/lib/api-error-handler";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get("symbol");
    const sort = searchParams.get("sort") || "premium_desc";

    const supabase = createAdminClient();

    // Fetch latest upbit prices (last 5 min) with kimchi premium
    let query = supabase
      .from("korean_prices")
      .select(
        "symbol, exchange, price_krw, price_usd, volume_24h, change_24h, kimchi_premium, usd_krw_rate, fetched_at"
      )
      .eq("exchange", "upbit")
      .not("kimchi_premium", "is", null)
      .gte(
        "fetched_at",
        new Date(Date.now() - 5 * 60 * 1000).toISOString()
      )
      .order("fetched_at", { ascending: false });

    if (symbol) {
      query = query.eq("symbol", symbol);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Deduplicate: keep latest per symbol
    const seen = new Set<string>();
    const latest = (data ?? []).filter((row) => {
      if (seen.has(row.symbol)) return false;
      seen.add(row.symbol);
      return true;
    });

    // Sort
    const sorted = [...latest].sort((a, b) => {
      const ap = Number(a.kimchi_premium) || 0;
      const bp = Number(b.kimchi_premium) || 0;
      const av = Number(a.volume_24h) || 0;
      const bv = Number(b.volume_24h) || 0;

      switch (sort) {
        case "premium_asc":
          return ap - bp;
        case "volume_desc":
          return bv - av;
        default:
          return bp - ap;
      }
    });

    // Average kimchi premium
    const premiums = sorted.map((d) => Number(d.kimchi_premium) || 0);
    const avgPremium =
      premiums.length > 0
        ? Math.round(
            (premiums.reduce((s, p) => s + p, 0) / premiums.length) * 100
          ) / 100
        : 0;

    // USD/KRW rate from first row
    const usdKrwRate = sorted[0]?.usd_krw_rate
      ? Number(sorted[0].usd_krw_rate)
      : null;

    return withCache(
      NextResponse.json({
        data: sorted,
        count: sorted.length,
        avgPremium,
        usdKrwRate,
      }),
      30,
      60
    );
  } catch (err) {
    console.error("[api/kimchi-premium] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch kimchi premium data" },
      { status: 500 }
    );
  }
}
