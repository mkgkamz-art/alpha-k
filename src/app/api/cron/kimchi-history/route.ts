/**
 * Cron: Record kimchi premium history (hourly)
 *
 * Snapshots the current kimchi premium for major coins into
 * kimchi_premium_history table for charting.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";

const TARGET_SYMBOLS = [
  "BTC", "ETH", "XRP", "SOL", "DOGE", "ADA", "AVAX", "DOT", "LINK",
];

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  try {
    const supabase = createAdminClient();

    // Get latest upbit prices for target symbols
    // Using direct query instead of view (view may not be in types)
    const { data, error: fetchError } = await supabase
      .from("korean_prices")
      .select("symbol, price_krw, price_usd, kimchi_premium, usd_krw_rate")
      .eq("exchange", "upbit")
      .in("symbol", TARGET_SYMBOLS)
      .order("fetched_at", { ascending: false })
      .limit(TARGET_SYMBOLS.length * 2);

    if (fetchError) {
      console.error("[cron/kimchi-history] Fetch error:", fetchError.message);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Deduplicate: take latest per symbol
    const seen = new Set<string>();
    const latest = data.filter((d) => {
      if (seen.has(d.symbol)) return false;
      seen.add(d.symbol);
      return true;
    });

    const rows = latest
      .filter((d) => d.kimchi_premium != null)
      .map((d) => ({
        symbol: d.symbol,
        premium_percent: d.kimchi_premium!,
        price_krw: d.price_krw,
        price_usd: d.price_usd,
        usd_krw_rate: d.usd_krw_rate,
      }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("kimchi_premium_history")
        .insert(rows);

      if (insertError) {
        console.error("[cron/kimchi-history] Insert error:", insertError.message);
      }
    }

    console.log(`[cron/kimchi-history] Recorded ${rows.length} symbols`);

    return NextResponse.json({
      success: true,
      count: rows.length,
    });
  } catch (err) {
    console.error("[cron/kimchi-history] Error:", err);
    return NextResponse.json(
      { error: "Failed to record kimchi history" },
      { status: 500 }
    );
  }
}
