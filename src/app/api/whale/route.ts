/**
 * GET /api/whale
 *
 * Comprehensive whale tracking endpoint.
 * Returns paginated events + aggregated stats for sidebar widgets + trend data.
 *
 * Query params:
 *   blockchain - filter by chain (default: all)
 *   minAmount  - minimum USD value (default: 0)
 *   eventType  - exchange_deposit | exchange_withdrawal | transfer | all (default: all)
 *   period     - 1h | 24h | 7d | 30d (default: 24h)
 *   cursor     - ISO date cursor for pagination
 *   limit      - page size (default: 20, max 50)
 *   stats      - include aggregated stats (default: false)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PERIOD_MAP: Record<string, number> = {
  "1h": 3_600_000,
  "24h": 86_400_000,
  "7d": 604_800_000,
  "30d": 2_592_000_000,
};

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const blockchain = sp.get("blockchain") ?? "all";
    const minAmount = Number(sp.get("minAmount") ?? "0");
    const eventType = sp.get("eventType") ?? "all";
    const period = sp.get("period") ?? "24h";
    const cursor = sp.get("cursor");
    const limit = Math.min(Number(sp.get("limit") ?? "20"), 50);
    const includeStats = sp.get("stats") === "true";

    const supabase = await createClient();
    const periodMs = PERIOD_MAP[period] ?? PERIOD_MAP["24h"];
    const since = new Date(Date.now() - periodMs).toISOString();

    /* ── Feed query ── */
    let feedQuery = supabase
      .from("whale_events")
      .select("*")
      .gte("detected_at", since)
      .gte("usd_value", minAmount)
      .order("detected_at", { ascending: false })
      .limit(limit + 1); // +1 to check hasMore

    if (blockchain !== "all") {
      feedQuery = feedQuery.ilike("blockchain", blockchain);
    }
    if (eventType !== "all") {
      feedQuery = feedQuery.eq("event_type", eventType);
    }
    if (cursor) {
      feedQuery = feedQuery.lt("detected_at", cursor);
    }

    const { data: rawEvents, error: feedError } = await feedQuery;
    if (feedError) throw feedError;

    const events = rawEvents ?? [];
    const hasMore = events.length > limit;
    const pageEvents = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore
      ? pageEvents[pageEvents.length - 1].detected_at
      : null;

    /* ── Stats (only on first load) ── */
    let stats = null;
    if (includeStats) {
      let statsQuery = supabase
        .from("whale_events")
        .select("*")
        .gte("detected_at", since)
        .gte("usd_value", minAmount);

      if (blockchain !== "all") {
        statsQuery = statsQuery.ilike("blockchain", blockchain);
      }
      if (eventType !== "all") {
        statsQuery = statsQuery.eq("event_type", eventType);
      }

      const { data: allEvents, error: statsError } = await statsQuery;
      if (statsError) throw statsError;

      const all = allEvents ?? [];

      // Summary
      const totalCount = all.length;
      const totalVolume = all.reduce((s, e) => s + (e.usd_value ?? 0), 0);
      const largest = all.reduce(
        (max, e) => ((e.usd_value ?? 0) > (max?.usd_value ?? 0) ? e : max),
        all[0] ?? null
      );

      // Flow direction
      const inflowTypes = ["exchange_deposit", "deposit"];
      const outflowTypes = ["exchange_withdrawal", "withdrawal"];
      const inflow = all
        .filter((e) => inflowTypes.includes(e.event_type))
        .reduce((s, e) => s + (e.usd_value ?? 0), 0);
      const outflow = all
        .filter((e) => outflowTypes.includes(e.event_type))
        .reduce((s, e) => s + (e.usd_value ?? 0), 0);

      // Top movers by entity
      const entityMap = new Map<
        string,
        { count: number; volume: number }
      >();
      for (const e of all) {
        for (const label of [e.from_label, e.to_label]) {
          if (!label) continue;
          const cur = entityMap.get(label) ?? { count: 0, volume: 0 };
          cur.count += 1;
          cur.volume += e.usd_value ?? 0;
          entityMap.set(label, cur);
        }
      }
      const topMovers = Array.from(entityMap.entries())
        .map(([entity, v]) => ({ entity, ...v }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5);

      // Asset breakdown
      const assetMap = new Map<string, number>();
      for (const e of all) {
        assetMap.set(
          e.symbol,
          (assetMap.get(e.symbol) ?? 0) + (e.usd_value ?? 0)
        );
      }
      const assetBreakdown = Array.from(assetMap.entries())
        .map(([symbol, volume]) => ({
          symbol,
          volume,
          percentage: totalVolume > 0 ? (volume / totalVolume) * 100 : 0,
        }))
        .sort((a, b) => b.volume - a.volume);

      // Trend data (daily buckets for last 7/30 days)
      const trendMap = new Map<string, { count: number; volume: number }>();
      for (const e of all) {
        const day = e.detected_at.slice(0, 10); // YYYY-MM-DD
        const cur = trendMap.get(day) ?? { count: 0, volume: 0 };
        cur.count += 1;
        cur.volume += e.usd_value ?? 0;
        trendMap.set(day, cur);
      }
      const trend = Array.from(trendMap.entries())
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date));

      stats = {
        summary: {
          totalCount,
          totalVolume,
          largest: largest
            ? {
                symbol: largest.symbol,
                amount: largest.amount,
                usdValue: largest.usd_value,
              }
            : null,
        },
        flow: { inflow, outflow, netFlow: outflow - inflow },
        topMovers,
        assetBreakdown,
        trend,
      };
    }

    return NextResponse.json({
      events: pageEvents,
      hasMore,
      nextCursor,
      ...(stats ? { stats } : {}),
    });
  } catch (err) {
    console.error("[whale] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch whale data" },
      { status: 500 }
    );
  }
}
