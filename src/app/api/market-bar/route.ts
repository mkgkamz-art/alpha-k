/**
 * GET /api/market-bar
 *
 * Aggregated data for the MarketBar component:
 *   - BTC KRW price + 24h change + kimchi premium
 *   - Surge count (coins with ±5%+ change)
 *   - Fear & Greed index
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SURGE_THRESHOLD } from "@/lib/surge-detector";
import { withCache } from "@/lib/api-error-handler";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const [btcRes, surgeRes, fgRes] = await Promise.allSettled([
      // BTC price (latest from upbit)
      supabase
        .from("korean_prices")
        .select("price_krw, change_24h, kimchi_premium")
        .eq("symbol", "BTC")
        .eq("exchange", "upbit")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .single(),

      // Surge count: coins with ±5%+ change in last 5 min (upbit)
      supabase
        .from("korean_prices")
        .select("symbol, change_24h")
        .eq("exchange", "upbit")
        .gte("fetched_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order("fetched_at", { ascending: false }),

      // Fear & Greed from external API
      fetch("https://api.alternative.me/fng/?limit=1", {
        signal: AbortSignal.timeout(5_000),
      }).then((r) => r.json()),
    ]);

    // Extract BTC data
    let btc: {
      priceKrw: number | null;
      change24h: number | null;
      kimchiPremium: number | null;
    } = { priceKrw: null, change24h: null, kimchiPremium: null };

    if (btcRes.status === "fulfilled" && btcRes.value.data) {
      const d = btcRes.value.data;
      btc = {
        priceKrw: Number(d.price_krw) || null,
        change24h: Number(d.change_24h) || null,
        kimchiPremium: Number(d.kimchi_premium) || null,
      };
    }

    // Extract surge count (deduplicate by symbol, count ±5%+)
    let surgeCount: number | null = null;
    if (surgeRes.status === "fulfilled" && surgeRes.value.data) {
      const seen = new Set<string>();
      let count = 0;
      for (const row of surgeRes.value.data) {
        if (seen.has(row.symbol)) continue;
        seen.add(row.symbol);
        const change = Number(row.change_24h);
        if (Math.abs(change) >= SURGE_THRESHOLD) count++;
      }
      surgeCount = count;
    }

    // Extract fear & greed
    let fearGreed: { value: number; label: string } | null = null;
    if (fgRes.status === "fulfilled") {
      const entry = fgRes.value?.data?.[0];
      if (entry) {
        const v = Number(entry.value);
        fearGreed = {
          value: v,
          label: getFgLabel(v),
        };
      }
    }

    return withCache(
      NextResponse.json({ btc, surgeCount, fearGreed }),
      30,
      60
    );
  } catch (err) {
    console.error("[market-bar] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch market bar data" },
      { status: 500 }
    );
  }
}

function getFgLabel(v: number): string {
  if (v <= 25) return "극단적 공포";
  if (v <= 45) return "공포";
  if (v <= 55) return "중립";
  if (v <= 75) return "탐욕";
  return "극단적 탐욕";
}
