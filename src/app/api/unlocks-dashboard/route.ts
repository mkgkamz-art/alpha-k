/**
 * GET /api/unlocks-dashboard
 *
 * Comprehensive token unlock dashboard data:
 *   - overview: 7-day summary (count, totalValue, highestImpact, nextUnlock)
 *   - unlocks: all upcoming (30/90d) with enriched price data
 *   - impact: top-impact unlocks + category breakdown + price correlation
 *   - alertFeed: recent unlock-type alert_events
 *
 * Query params:
 *   range  - 30d | 90d (default: 30d)
 *   search - token symbol search
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RANGE_DAYS: Record<string, number> = { "30d": 30, "90d": 90 };

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const range = sp.get("range") ?? "30d";
    const search = sp.get("search") ?? "";

    const supabase = await createClient();
    const days = RANGE_DAYS[range] ?? 30;
    const now = new Date();
    const futureDate = new Date(
      now.getTime() + days * 86_400_000
    ).toISOString();
    const weekAhead = new Date(
      now.getTime() + 7 * 86_400_000
    ).toISOString();

    // Parallel fetches
    const [unlocksRes, pricesRes, alertsRes] = await Promise.all([
      supabase
        .from("token_unlocks")
        .select("*")
        .gte("unlock_date", now.toISOString())
        .lte("unlock_date", futureDate)
        .order("unlock_date", { ascending: true }),
      supabase.from("token_prices").select("*"),
      supabase
        .from("alert_events")
        .select("*")
        .eq("type", "token_unlock")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (unlocksRes.error) throw unlocksRes.error;
    if (pricesRes.error) throw pricesRes.error;
    if (alertsRes.error) throw alertsRes.error;

    const allUnlocks = unlocksRes.data ?? [];
    const prices = pricesRes.data ?? [];
    const alertFeed = alertsRes.data ?? [];

    // Price map
    const priceMap = new Map<
      string,
      {
        price: number;
        change24h: number;
        change7d: number;
      }
    >();
    for (const p of prices) {
      priceMap.set(p.symbol, {
        price: p.current_price ?? 0,
        change24h: p.price_change_24h ?? 0,
        change7d: p.price_change_7d ?? 0,
      });
    }

    // Apply search filter
    let filtered = allUnlocks;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.token_symbol.toLowerCase().includes(q) ||
          u.token_name.toLowerCase().includes(q)
      );
    }

    // Enrich unlocks with price data + D-day
    const enriched = filtered.map((u) => {
      const unlockDate = new Date(u.unlock_date);
      const msUntil = unlockDate.getTime() - now.getTime();
      const daysUntil = Math.ceil(msUntil / 86_400_000);
      const hoursUntil = Math.max(0, Math.floor(msUntil / 3_600_000));
      const priceInfo = priceMap.get(u.token_symbol);

      return {
        ...u,
        daysUntil,
        hoursUntil,
        currentPrice: priceInfo?.price ?? null,
        priceChange24h: priceInfo?.change24h ?? null,
        priceChange7d: priceInfo?.change7d ?? null,
      };
    });

    // ── Overview: 7-day window ──
    const weekUnlocks = enriched.filter(
      (u) => new Date(u.unlock_date).toISOString() <= weekAhead
    );
    const weekTotalValue = weekUnlocks.reduce(
      (s, u) => s + (Number(u.usd_value_estimate) || 0),
      0
    );
    const highestImpactUnlock = weekUnlocks.reduce<(typeof enriched)[0] | null>(
      (best, u) =>
        !best || (Number(u.impact_score) || 0) > (Number(best.impact_score) || 0)
          ? u
          : best,
      null
    );
    const nextUnlock = enriched[0] ?? null; // already sorted ASC

    const overview = {
      weekCount: weekUnlocks.length,
      weekTotalValue,
      highestImpact: highestImpactUnlock
        ? {
            symbol: highestImpactUnlock.token_symbol,
            percentOfSupply: Number(highestImpactUnlock.percent_of_supply),
            impactScore: Number(highestImpactUnlock.impact_score),
          }
        : null,
      nextUnlock: nextUnlock
        ? {
            symbol: nextUnlock.token_symbol,
            hoursUntil: nextUnlock.hoursUntil,
            daysUntil: nextUnlock.daysUntil,
          }
        : null,
    };

    // ── Impact Analysis ──

    // Top 5 by impact_score
    const topImpact = [...enriched]
      .sort((a, b) => (Number(b.impact_score) || 0) - (Number(a.impact_score) || 0))
      .slice(0, 5)
      .map((u) => ({
        id: u.id,
        symbol: u.token_symbol,
        name: u.token_name,
        daysUntil: u.daysUntil,
        impactScore: Number(u.impact_score),
        usdValue: Number(u.usd_value_estimate),
        percentOfSupply: Number(u.percent_of_supply),
        category: u.category,
      }));

    // Category breakdown
    const categoryMap = new Map<
      string,
      { count: number; totalUsd: number }
    >();
    for (const u of enriched) {
      const cat = u.category ?? "ecosystem";
      const existing = categoryMap.get(cat) ?? { count: 0, totalUsd: 0 };
      existing.count++;
      existing.totalUsd += Number(u.usd_value_estimate) || 0;
      categoryMap.set(cat, existing);
    }
    const categoryBreakdown = [...categoryMap.entries()]
      .map(([category, data]) => ({
        category,
        count: data.count,
        totalUsd: data.totalUsd,
      }))
      .sort((a, b) => b.totalUsd - a.totalUsd);

    // Price correlation: for each unlock, compute hypothetical post-unlock price impact
    // Using current price change as proxy (since we don't have historical price-at-unlock)
    const priceCorrelation = enriched
      .filter((u) => u.priceChange24h !== null)
      .slice(0, 10)
      .map((u) => ({
        symbol: u.token_symbol,
        category: u.category,
        impactScore: Number(u.impact_score),
        percentOfSupply: Number(u.percent_of_supply),
        priceChange24h: u.priceChange24h ?? 0,
      }));

    const avgPriceChange =
      priceCorrelation.length > 0
        ? priceCorrelation.reduce((s, p) => s + p.priceChange24h, 0) /
          priceCorrelation.length
        : 0;

    const impact = {
      topImpact,
      categoryBreakdown,
      priceCorrelation,
      avgPriceChange: Math.round(avgPriceChange * 100) / 100,
    };

    // ── Calendar data: group by date ──
    const calendarMap = new Map<
      string,
      { date: string; count: number; totalUsd: number; events: { symbol: string; usd: number; category: string }[] }
    >();
    for (const u of enriched) {
      const dateStr = new Date(u.unlock_date).toISOString().split("T")[0];
      const existing = calendarMap.get(dateStr) ?? {
        date: dateStr,
        count: 0,
        totalUsd: 0,
        events: [],
      };
      existing.count++;
      existing.totalUsd += Number(u.usd_value_estimate) || 0;
      existing.events.push({
        symbol: u.token_symbol,
        usd: Number(u.usd_value_estimate) || 0,
        category: u.category ?? "ecosystem",
      });
      calendarMap.set(dateStr, existing);
    }
    const calendarData = [...calendarMap.values()].sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      overview,
      unlocks: enriched,
      impact,
      calendarData,
      alertFeed,
    });
  } catch (err) {
    console.error("[unlocks-dashboard] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch unlocks dashboard" },
      { status: 500 }
    );
  }
}
