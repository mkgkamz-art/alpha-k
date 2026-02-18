/**
 * GET /api/surge
 *
 * Returns coins with significant price changes (±5%+) from korean_prices.
 *
 * Query params:
 *   exchange  — "upbit" | "bithumb" (default: "upbit")
 *   type      — "pump" | "dump" | "all" (default: "all")
 *   limit     — number (default: 50)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  classifySurge,
  getSurgeType,
  SURGE_THRESHOLD,
  type SurgeItem,
} from "@/lib/surge-detector";
import { withCache } from "@/lib/api-error-handler";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const exchange = searchParams.get("exchange") || "upbit";
    const type = searchParams.get("type") || "all";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const supabase = createAdminClient();

    // Get latest price per symbol for the exchange
    // Using a subquery approach: fetch recent rows, deduplicate on server
    const { data: raw, error } = await supabase
      .from("korean_prices")
      .select(
        "symbol, exchange, price_krw, price_usd, volume_24h, change_24h, kimchi_premium, fetched_at"
      )
      .eq("exchange", exchange)
      .gte(
        "fetched_at",
        new Date(Date.now() - 5 * 60 * 1000).toISOString() // last 5 minutes
      )
      .order("fetched_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Deduplicate: keep only the latest row per symbol
    const seen = new Set<string>();
    const latest: typeof raw = [];
    for (const row of raw ?? []) {
      if (!seen.has(row.symbol)) {
        seen.add(row.symbol);
        latest.push(row);
      }
    }

    // Filter by surge threshold and type
    const items: SurgeItem[] = [];
    for (const row of latest) {
      const change = Number(row.change_24h);
      if (isNaN(change)) continue;

      const level = classifySurge(change);
      if (!level) continue; // below ±5%

      const surgeType = getSurgeType(change);

      if (type === "pump" && surgeType !== "pump") continue;
      if (type === "dump" && surgeType !== "dump") continue;

      items.push({
        symbol: row.symbol,
        exchange: row.exchange,
        price_krw: Number(row.price_krw),
        price_usd: row.price_usd != null ? Number(row.price_usd) : null,
        volume_24h: row.volume_24h != null ? Number(row.volume_24h) : null,
        change_24h: change,
        kimchi_premium:
          row.kimchi_premium != null ? Number(row.kimchi_premium) : null,
        fetched_at: row.fetched_at,
        level,
        type: surgeType,
      });
    }

    // Sort by absolute change descending
    items.sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h));

    // Count pumps and dumps
    const pumpCount = items.filter((i) => i.type === "pump").length;
    const dumpCount = items.filter((i) => i.type === "dump").length;

    return withCache(
      NextResponse.json({
        data: items.slice(0, limit),
        pumpCount,
        dumpCount,
        total: items.length,
        exchange,
        type,
      }),
      10,
      30
    );
  } catch (err) {
    console.error("[api/surge] Error:", err);
    return NextResponse.json(
      { error: "Failed to detect surges" },
      { status: 500 }
    );
  }
}
