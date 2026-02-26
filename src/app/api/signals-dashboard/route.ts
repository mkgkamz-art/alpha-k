/**
 * GET /api/signals-dashboard
 *
 * Comprehensive signal dashboard data:
 *   - summary: counts by type + avg confidence
 *   - signals: filtered list
 *   - heatmap: per-token signal distribution + confidence
 *   - performance: hit-rate breakdown (Pro/Whale only)
 *   - history: daily signal counts for trend chart
 *
 * Query params:
 *   timeframe - 1D | 4H | 1W (default: all)
 *   type      - buy | sell | alert (default: all)
 *   search    - token symbol search
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionTier } from "@/types";

const VALID_TIMEFRAMES = new Set(["4H", "1D", "1W"]);
const VALID_TYPES = new Set(["buy", "sell", "alert"]);
const LOCKED_TIMEFRAMES = new Set(["4H", "1W"]);

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const timeframe = sp.get("timeframe") ?? "";
    const type = sp.get("type") ?? "";
    const search = sp.get("search") ?? "";

    const supabase = await createClient();

    // Check tier for locked timeframes
    let tier = "free";
    if (timeframe && LOCKED_TIMEFRAMES.has(timeframe)) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({
          signals: [],
          summary: { total: 0, buy: 0, sell: 0, alert: 0, avgConfidence: 0 },
          heatmap: [],
          performance: null,
          history: [],
          message:
            "Sign in and upgrade to Pro for 4H and 1W timeframe signals.",
        });
      }
      const { data: profile } = await supabase
        .from("users")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();

      tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
      if (tier === "free") {
        return NextResponse.json({
          signals: [],
          summary: { total: 0, buy: 0, sell: 0, alert: 0, avgConfidence: 0 },
          heatmap: [],
          performance: null,
          history: [],
          message: "Upgrade to Pro for 4H and 1W timeframe signals.",
        });
      }
    }

    // Fetch all signals + token_prices in parallel
    const [signalsRes, pricesRes] = await Promise.all([
      supabase
        .from("signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("token_prices").select("*"),
    ]);

    if (signalsRes.error) throw signalsRes.error;
    if (pricesRes.error) throw pricesRes.error;

    const rawSignals = signalsRes.data ?? [];
    const prices = pricesRes.data ?? [];

    // Deduplicate: keep most recent per token+signal (already sorted by created_at DESC)
    const seenKeys = new Set<string>();
    const allSignals = rawSignals.filter((s) => {
      const key = `${s.token_symbol}|${s.signal_name}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });

    // Build price map: symbol -> { price, change_24h }
    const priceMap = new Map<
      string,
      { price: number; change_24h: number; change_7d: number }
    >();
    for (const p of prices) {
      priceMap.set(p.symbol, {
        price: p.current_price ?? 0,
        change_24h: p.price_change_24h ?? 0,
        change_7d: p.price_change_7d ?? 0,
      });
    }

    // Apply filters
    let filtered = allSignals;
    if (timeframe && VALID_TIMEFRAMES.has(timeframe)) {
      filtered = filtered.filter((s) => s.timeframe === timeframe);
    }
    if (type && VALID_TYPES.has(type)) {
      filtered = filtered.filter((s) => s.signal_type === type);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.token_symbol.toLowerCase().includes(q) ||
          s.token_name.toLowerCase().includes(q)
      );
    }

    // Summary stats (from filtered signals)
    const buySignals = filtered.filter((s) => s.signal_type === "buy");
    const sellSignals = filtered.filter((s) => s.signal_type === "sell");
    const alertSignals = filtered.filter((s) => s.signal_type === "alert");
    const avgConfidence =
      filtered.length > 0
        ? Math.round(
            filtered.reduce((sum, s) => sum + (s.confidence ?? 0), 0) /
              filtered.length
          )
        : 0;

    const summary = {
      total: filtered.length,
      buy: buySignals.length,
      sell: sellSignals.length,
      alert: alertSignals.length,
      avgConfidence,
    };

    // Heatmap: group by token_symbol, show signal counts + avg confidence + current price
    const heatmapMap = new Map<
      string,
      {
        symbol: string;
        name: string;
        buy: number;
        sell: number;
        alert: number;
        avgConfidence: number;
        totalConfidence: number;
        count: number;
        currentPrice: number;
        change24h: number;
      }
    >();

    for (const s of allSignals) {
      const existing = heatmapMap.get(s.token_symbol) ?? {
        symbol: s.token_symbol,
        name: s.token_name,
        buy: 0,
        sell: 0,
        alert: 0,
        avgConfidence: 0,
        totalConfidence: 0,
        count: 0,
        currentPrice: priceMap.get(s.token_symbol)?.price ?? 0,
        change24h: priceMap.get(s.token_symbol)?.change_24h ?? 0,
      };
      existing.count++;
      existing.totalConfidence += s.confidence ?? 0;
      if (s.signal_type === "buy") existing.buy++;
      else if (s.signal_type === "sell") existing.sell++;
      else existing.alert++;
      heatmapMap.set(s.token_symbol, existing);
    }

    const heatmap = [...heatmapMap.values()]
      .map((h) => ({
        symbol: h.symbol,
        name: h.name,
        buy: h.buy,
        sell: h.sell,
        alert: h.alert,
        total: h.count,
        avgConfidence: h.count > 0 ? Math.round(h.totalConfidence / h.count) : 0,
        currentPrice: h.currentPrice,
        change24h: h.change24h,
        // Signal sentiment: net = buy - sell
        sentiment: h.buy - h.sell,
      }))
      .sort((a, b) => b.total - a.total);

    // Top confidence signals (top 5 by confidence, most recent)
    const topConfidence = [...filtered]
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        symbol: s.token_symbol,
        name: s.token_name,
        signalType: s.signal_type,
        signalName: s.signal_name,
        confidence: s.confidence,
        priceAtSignal: s.price_at_signal,
        currentPrice: priceMap.get(s.token_symbol)?.price ?? 0,
      }));

    // Signal history: daily counts for last 14 days
    const now = new Date();
    const history: { date: string; buy: number; sell: number; alert: number }[] =
      [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const daySignals = allSignals.filter(
        (s) => s.created_at?.startsWith(dateStr)
      );
      history.push({
        date: dateStr,
        buy: daySignals.filter((s) => s.signal_type === "buy").length,
        sell: daySignals.filter((s) => s.signal_type === "sell").length,
        alert: daySignals.filter((s) => s.signal_type === "alert").length,
      });
    }

    // Performance: estimate using price_at_signal vs current_price
    // Only available for Pro/Whale
    let performance = null;
    if (tier === "pro" || tier === "whale") {
      const buyPerf = buySignals.map((s) => {
        const current = priceMap.get(s.token_symbol)?.price ?? s.price_at_signal;
        const pnl =
          s.price_at_signal > 0
            ? ((current - s.price_at_signal) / s.price_at_signal) * 100
            : 0;
        return { ...s, pnl, currentPrice: current };
      });
      const sellPerf = sellSignals.map((s) => {
        const current = priceMap.get(s.token_symbol)?.price ?? s.price_at_signal;
        const pnl =
          s.price_at_signal > 0
            ? ((s.price_at_signal - current) / s.price_at_signal) * 100
            : 0;
        return { ...s, pnl, currentPrice: current };
      });

      const allPerf = [...buyPerf, ...sellPerf];
      const winners = allPerf.filter((s) => s.pnl > 0);
      const avgPnl =
        allPerf.length > 0
          ? allPerf.reduce((sum, s) => sum + s.pnl, 0) / allPerf.length
          : 0;

      performance = {
        totalSignals: allPerf.length,
        winRate:
          allPerf.length > 0
            ? Math.round((winners.length / allPerf.length) * 100)
            : 0,
        avgPnl: Math.round(avgPnl * 100) / 100,
        bestSignal: allPerf.sort((a, b) => b.pnl - a.pnl)[0] ?? null,
        worstSignal: allPerf.sort((a, b) => a.pnl - b.pnl)[0] ?? null,
        recentPerformance: allPerf
          .slice(0, 10)
          .map((s) => ({
            symbol: s.token_symbol,
            signalType: s.signal_type,
            signalName: s.signal_name,
            confidence: s.confidence,
            priceAtSignal: s.price_at_signal,
            currentPrice: s.currentPrice,
            pnl: Math.round(s.pnl * 100) / 100,
          })),
      };
    }

    // Enrich filtered signals with current prices
    const enrichedSignals = filtered.map((s) => ({
      ...s,
      currentPrice: priceMap.get(s.token_symbol)?.price ?? null,
      priceChange:
        s.price_at_signal > 0
          ? Math.round(
              (((priceMap.get(s.token_symbol)?.price ?? s.price_at_signal) -
                s.price_at_signal) /
                s.price_at_signal) *
                10000
            ) / 100
          : null,
    }));

    return NextResponse.json({
      signals: enrichedSignals,
      summary,
      heatmap,
      topConfidence,
      performance,
      history,
    });
  } catch (err) {
    console.error("[signals-dashboard] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch signals dashboard" },
      { status: 500 }
    );
  }
}
