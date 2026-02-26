/**
 * GET /api/surge
 *
 * Returns coins with significant 2-hour price changes (±5%+) from korean_prices.
 * Compares latest price vs price from ~2 hours ago.
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
  SURGE_WINDOW_MS,
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

    const now = Date.now();
    const recentCutoff = new Date(now - 5 * 60 * 1000).toISOString();

    // 2h-ago window: 1h50m ~ 2h10m ago (20min window to find data)
    const oldFrom = new Date(now - SURGE_WINDOW_MS - 10 * 60 * 1000).toISOString();
    const oldTo = new Date(now - SURGE_WINDOW_MS + 10 * 60 * 1000).toISOString();

    // Fetch current + 2h-ago prices in parallel
    const [currentRes, oldRes] = await Promise.all([
      supabase
        .from("korean_prices")
        .select(
          "symbol, exchange, price_krw, price_usd, volume_24h, kimchi_premium, fetched_at",
        )
        .eq("exchange", exchange)
        .gte("fetched_at", recentCutoff)
        .order("fetched_at", { ascending: false }),
      supabase
        .from("korean_prices")
        .select("symbol, price_krw")
        .eq("exchange", exchange)
        .gte("fetched_at", oldFrom)
        .lte("fetched_at", oldTo)
        .order("fetched_at", { ascending: false }),
    ]);

    if (currentRes.error) {
      return NextResponse.json(
        { error: currentRes.error.message },
        { status: 500 },
      );
    }

    // Deduplicate current: keep only the latest row per symbol
    const seenCurrent = new Set<string>();
    const currentMap = new Map<
      string,
      (typeof currentRes.data)[number]
    >();
    for (const row of currentRes.data ?? []) {
      if (!seenCurrent.has(row.symbol)) {
        seenCurrent.add(row.symbol);
        currentMap.set(row.symbol, row);
      }
    }

    // Deduplicate old: keep the closest-to-2h-ago row per symbol
    const seenOld = new Set<string>();
    const oldPriceMap = new Map<string, number>();
    for (const row of oldRes.data ?? []) {
      if (!seenOld.has(row.symbol)) {
        seenOld.add(row.symbol);
        oldPriceMap.set(row.symbol, Number(row.price_krw));
      }
    }

    // Calculate 2h change and filter by surge threshold
    const items: SurgeItem[] = [];
    for (const [symbol, row] of currentMap) {
      const currentPrice = Number(row.price_krw);
      const oldPrice = oldPriceMap.get(symbol);

      // Skip if no 2h-ago data or zero price
      if (!oldPrice || oldPrice === 0 || currentPrice === 0) continue;

      const changePct =
        ((currentPrice - oldPrice) / oldPrice) * 100;

      const level = classifySurge(changePct);
      if (!level) continue; // below ±5%

      const surgeType = getSurgeType(changePct);
      if (type === "pump" && surgeType !== "pump") continue;
      if (type === "dump" && surgeType !== "dump") continue;

      items.push({
        symbol,
        exchange: row.exchange,
        price_krw: currentPrice,
        price_usd: row.price_usd != null ? Number(row.price_usd) : null,
        volume_24h: row.volume_24h != null ? Number(row.volume_24h) : null,
        change_pct: Math.round(changePct * 10) / 10,
        kimchi_premium:
          row.kimchi_premium != null ? Number(row.kimchi_premium) : null,
        fetched_at: row.fetched_at,
        level,
        type: surgeType,
      });
    }

    // Sort by absolute change descending
    items.sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct));

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
      30,
    );
  } catch (err) {
    console.error("[api/surge] Error:", err);
    return NextResponse.json(
      { error: "Failed to detect surges" },
      { status: 500 },
    );
  }
}
