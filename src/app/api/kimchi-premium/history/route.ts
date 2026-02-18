/**
 * GET /api/kimchi-premium/history
 *
 * Returns kimchi premium history for charting.
 *
 * Query params:
 *   symbol  — "BTC" (default), "ETH", etc.
 *   period  — "24h" | "7d" | "30d" (default: "24h")
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PERIOD_MS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get("symbol") || "BTC";
    const period = searchParams.get("period") || "24h";

    const ms = PERIOD_MS[period] || PERIOD_MS["24h"];
    const since = new Date(Date.now() - ms).toISOString();

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("kimchi_premium_history")
      .select("symbol, premium_percent, price_krw, price_usd, usd_krw_rate, recorded_at")
      .eq("symbol", symbol)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
      symbol,
      period,
    });
  } catch (err) {
    console.error("[api/kimchi-premium/history] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch kimchi history" },
      { status: 500 }
    );
  }
}
