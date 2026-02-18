/**
 * GET /api/dev/generate-signals
 *
 * Dev-only: Run signal generation immediately using token_prices data.
 * Requires: seed-prices to be run first.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateSignals,
  type TokenData,
} from "@/lib/blockchain/signal-generator";
import type { Json } from "@/types/database.types";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch token prices
    const { data: prices, error: pricesErr } = await supabase
      .from("token_prices")
      .select("*")
      .order("market_cap", { ascending: false })
      .limit(20);

    if (pricesErr) throw pricesErr;
    if (!prices || prices.length === 0) {
      return NextResponse.json({
        error: "No price data. Run /api/dev/seed-prices first.",
      }, { status: 400 });
    }

    // Fetch price history
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const tokenDataList: TokenData[] = [];

    for (const p of prices) {
      const { data: history } = await supabase
        .from("price_history")
        .select("price, recorded_at")
        .eq("token_id", p.token_id)
        .gte("recorded_at", sevenDaysAgo)
        .order("recorded_at", { ascending: false })
        .limit(168);

      tokenDataList.push({
        symbol: p.symbol.toUpperCase(),
        name: p.name,
        currentPrice: Number(p.current_price),
        priceChange1h: p.price_change_1h != null ? Number(p.price_change_1h) : null,
        priceChange24h: p.price_change_24h != null ? Number(p.price_change_24h) : null,
        priceChange7d: p.price_change_7d != null ? Number(p.price_change_7d) : null,
        totalVolume: Number(p.total_volume),
        priceHistory: history ?? [],
      });
    }

    // Generate signals for all timeframes
    const signals1d = generateSignals(tokenDataList, "1D");
    const signals4h = generateSignals(tokenDataList, "4H");
    const signals1w = generateSignals(tokenDataList, "1W");
    const allSignals = [...signals1d, ...signals4h, ...signals1w];

    // Insert into signals table
    let insertCount = 0;
    for (const sig of allSignals) {
      const { error } = await supabase.from("signals").insert({
        token_symbol: sig.tokenSymbol,
        token_name: sig.tokenName,
        signal_type: sig.signalType,
        signal_name: sig.signalName,
        confidence: sig.confidence,
        timeframe: sig.timeframe,
        description: sig.description,
        indicators: sig.indicators as unknown as Json,
        price_at_signal: sig.priceAtSignal,
      });
      if (!error) insertCount++;
    }

    return NextResponse.json({
      success: true,
      tokens_analyzed: tokenDataList.length,
      signals_generated: insertCount,
      signals: allSignals.map((s) => ({
        token: s.tokenSymbol,
        type: s.signalType,
        name: s.signalName,
        confidence: s.confidence,
        timeframe: s.timeframe,
        price: s.priceAtSignal,
      })),
    });
  } catch (err) {
    console.error("[dev/generate-signals] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
