/**
 * GET /api/risk
 *
 * Aggregated DeFi risk dashboard data.
 * Returns protocols, stablecoins, overview stats, and risk alert feed.
 *
 * Query params:
 *   search   - protocol name search
 *   category - protocol category filter
 *   chain    - protocol chain filter
 *   sort     - tvl | change_24h | change_7d (default: tvl)
 *   order    - asc | desc (default: desc)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const search = sp.get("search") ?? "";
    const category = sp.get("category") ?? "all";
    const chain = sp.get("chain") ?? "all";
    const sort = sp.get("sort") ?? "tvl";
    const order = sp.get("order") ?? "desc";

    const supabase = await createClient();

    // Parallel fetches
    const [protocolsRes, stablecoinsRes, riskEventsRes] = await Promise.all([
      supabase
        .from("defi_protocols")
        .select("*")
        .order(
          sort === "change_24h"
            ? "tvl_change_24h"
            : sort === "change_7d"
              ? "tvl_change_7d"
              : "tvl",
          { ascending: order === "asc" }
        ),
      supabase
        .from("stablecoin_status")
        .select("*")
        .order("symbol", { ascending: true }),
      supabase
        .from("alert_events")
        .select("*")
        .eq("type", "risk")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 86_400_000).toISOString()
        )
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (protocolsRes.error) throw protocolsRes.error;
    if (stablecoinsRes.error) throw stablecoinsRes.error;
    if (riskEventsRes.error) throw riskEventsRes.error;

    let protocols = protocolsRes.data ?? [];
    const stablecoins = stablecoinsRes.data ?? [];
    const riskEvents = riskEventsRes.data ?? [];

    // Apply client filters
    if (search) {
      const q = search.toLowerCase();
      protocols = protocols.filter((p) =>
        p.protocol_name.toLowerCase().includes(q)
      );
    }
    if (category !== "all") {
      protocols = protocols.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase()
      );
    }
    if (chain !== "all") {
      protocols = protocols.filter((p) =>
        (p.chains as string[])?.some(
          (c: string) => c.toLowerCase() === chain.toLowerCase()
        )
      );
    }

    // Overview stats
    const totalTvl = (protocolsRes.data ?? []).reduce(
      (s, p) => s + (p.tvl ?? 0),
      0
    );
    const avgTvlChange24h =
      (protocolsRes.data ?? []).length > 0
        ? (protocolsRes.data ?? []).reduce(
            (s, p) => s + (p.tvl_change_24h ?? 0),
            0
          ) / (protocolsRes.data ?? []).length
        : 0;

    const depeggedCount = stablecoins.filter((s) => s.is_depegged).length;
    const depeggedCoins = stablecoins
      .filter((s) => s.is_depegged)
      .map((s) => s.symbol);

    // Risk alert breakdown by severity (last 24h)
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const recentRiskAlerts = riskEvents.filter(
      (e) => e.created_at >= dayAgo
    );
    const alertBreakdown = {
      critical: recentRiskAlerts.filter((e) => e.severity === "critical")
        .length,
      high: recentRiskAlerts.filter((e) => e.severity === "high").length,
      medium: recentRiskAlerts.filter((e) => e.severity === "medium").length,
      low: recentRiskAlerts.filter((e) => e.severity === "low").length,
      total: recentRiskAlerts.length,
    };

    // Extract unique categories and chains for filter options
    const allProtocols = protocolsRes.data ?? [];
    const categories = [
      ...new Set(
        allProtocols.map((p) => p.category).filter(Boolean) as string[]
      ),
    ].sort();
    const chains = [
      ...new Set(allProtocols.flatMap((p) => (p.chains as string[]) ?? [])),
    ].sort();

    return NextResponse.json({
      overview: {
        totalTvl,
        avgTvlChange24h,
        depeggedCount,
        depeggedCoins,
        alertBreakdown,
      },
      protocols,
      stablecoins,
      riskEvents,
      filterOptions: { categories, chains },
    });
  } catch (err) {
    console.error("[risk] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch risk data" },
      { status: 500 }
    );
  }
}
