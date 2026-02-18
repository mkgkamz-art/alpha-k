/**
 * GET /api/liquidity-dashboard
 *
 * Comprehensive liquidity monitoring dashboard:
 *   - overview: total DEX volume, TVL, pool count, alert count
 *   - dexRankings: DEX volumes sorted
 *   - topPools: top liquidity pools by TVL
 *   - chainDistribution: chain-level aggregation
 *   - stablecoinHealth: stablecoin pool overview
 *   - alertFeed: recent liquidity alerts
 *
 * Query params:
 *   search - protocol/pool search
 *   chain  - filter by chain
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const search = sp.get("search") ?? "";
    const chain = sp.get("chain") ?? "all";

    const supabase = await createClient();

    // Parallel fetches
    const [dexRes, poolsRes, alertsRes, btcRes] = await Promise.all([
      supabase
        .from("dex_volumes")
        .select("*")
        .order("daily_volume", { ascending: false }),
      supabase
        .from("liquidity_pools")
        .select("*")
        .order("tvl", { ascending: false }),
      supabase
        .from("alert_events")
        .select("*")
        .eq("type", "liquidity")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("token_prices")
        .select("*")
        .eq("symbol", "BTC")
        .single(),
    ]);

    if (dexRes.error) throw dexRes.error;
    if (poolsRes.error) throw poolsRes.error;
    if (alertsRes.error) throw alertsRes.error;

    const allDex = dexRes.data ?? [];
    const allPools = poolsRes.data ?? [];
    const alertFeed = alertsRes.data ?? [];
    const btcPrice = btcRes.data;

    // Apply filters
    let filteredDex = allDex;
    let filteredPools = allPools;

    if (search) {
      const q = search.toLowerCase();
      filteredDex = filteredDex.filter((d) =>
        d.protocol_name.toLowerCase().includes(q)
      );
      filteredPools = filteredPools.filter(
        (p) =>
          p.pool_name.toLowerCase().includes(q) ||
          p.protocol.toLowerCase().includes(q)
      );
    }

    if (chain !== "all") {
      const c = chain.toLowerCase();
      filteredDex = filteredDex.filter((d) =>
        (d.chains as string[])?.some((ch) => ch.toLowerCase() === c)
      );
      filteredPools = filteredPools.filter(
        (p) => p.chain.toLowerCase() === c
      );
    }

    // ── Overview ──
    const totalVolume24h = allDex.reduce(
      (s, d) => s + (d.daily_volume ?? 0),
      0
    );
    const totalDexTvl = allDex.reduce(
      (s, d) => s + (d.total_tvl ?? 0),
      0
    );
    const poolCount = allPools.length;

    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const alertCount24h = alertFeed.filter(
      (a) => a.created_at >= dayAgo
    ).length;

    // Alert severity breakdown
    const recentAlerts = alertFeed.filter((a) => a.created_at >= dayAgo);
    const alertBreakdown = {
      critical: recentAlerts.filter((a) => a.severity === "critical").length,
      high: recentAlerts.filter((a) => a.severity === "high").length,
      medium: recentAlerts.filter((a) => a.severity === "medium").length,
      low: recentAlerts.filter((a) => a.severity === "low").length,
    };

    const overview = {
      totalVolume24h,
      totalDexTvl,
      poolCount,
      alertCount24h,
      alertBreakdown,
    };

    // ── Chain Distribution ──
    const chainMap = new Map<string, { volume: number; tvl: number; poolCount: number }>();
    for (const d of allDex) {
      for (const ch of (d.chains as string[]) ?? []) {
        const existing = chainMap.get(ch) ?? { volume: 0, tvl: 0, poolCount: 0 };
        existing.volume += d.daily_volume ?? 0;
        existing.tvl += d.total_tvl ?? 0;
        chainMap.set(ch, existing);
      }
    }
    for (const p of allPools) {
      const existing = chainMap.get(p.chain) ?? { volume: 0, tvl: 0, poolCount: 0 };
      existing.poolCount++;
      chainMap.set(p.chain, existing);
    }
    const chainDistribution = [...chainMap.entries()]
      .map(([name, data]) => ({ chain: name, ...data }))
      .sort((a, b) => b.tvl - a.tvl);

    // ── Stablecoin Pool Health ──
    const stablePools = allPools.filter((p) => p.is_stablecoin);
    const stableTotalTvl = stablePools.reduce(
      (s, p) => s + (p.tvl ?? 0),
      0
    );
    const stableAvgApy =
      stablePools.length > 0
        ? stablePools.reduce((s, p) => s + (p.apy ?? 0), 0) /
          stablePools.length
        : 0;
    const flaggedPools = stablePools.filter(
      (p) => p.risk_level === "high" || p.apy > 50
    );

    const stablecoinHealth = {
      totalTvl: stableTotalTvl,
      avgApy: Math.round(stableAvgApy * 100) / 100,
      poolCount: stablePools.length,
      flaggedCount: flaggedPools.length,
      flaggedPools: flaggedPools.map((p) => ({
        poolName: p.pool_name,
        protocol: p.protocol,
        chain: p.chain,
        tvl: p.tvl,
        apy: p.apy,
        tvlChange: p.tvl_change_24h,
        riskLevel: p.risk_level,
      })),
    };

    // ── Unique chains for filter ──
    const chains = [...new Set([
      ...allDex.flatMap((d) => (d.chains as string[]) ?? []),
      ...allPools.map((p) => p.chain),
    ])].sort();

    return NextResponse.json({
      overview,
      dexRankings: filteredDex,
      topPools: filteredPools,
      chainDistribution,
      stablecoinHealth,
      alertFeed,
      btcPrice: btcPrice
        ? { price: btcPrice.current_price, change24h: btcPrice.price_change_24h }
        : null,
      filterOptions: { chains },
    });
  } catch (err) {
    console.error("[liquidity-dashboard] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch liquidity dashboard" },
      { status: 500 }
    );
  }
}
