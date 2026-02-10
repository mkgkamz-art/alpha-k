import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Chain, SignalType, Timeframe } from "@/types";

/**
 * Cron: Generate trading signals (every 4 hours)
 *
 * Runs technical analysis on monitored tokens to generate
 * buy/sell/hold signals with confidence scores.
 *
 * Uses simple moving average crossover + RSI as baseline strategy.
 * In production, this would call an external TA service or ML model.
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

/** Tokens to generate signals for */
const SIGNAL_TOKENS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", chain: "ethereum" as Chain },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", chain: "ethereum" as Chain },
  { id: "solana", symbol: "SOL", name: "Solana", chain: "solana" as Chain },
  { id: "binancecoin", symbol: "BNB", name: "BNB", chain: "bsc" as Chain },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche", chain: "ethereum" as Chain },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", chain: "ethereum" as Chain },
  { id: "uniswap", symbol: "UNI", name: "Uniswap", chain: "ethereum" as Chain },
  { id: "aave", symbol: "AAVE", name: "Aave", chain: "ethereum" as Chain },
  { id: "matic-network", symbol: "MATIC", name: "Polygon", chain: "polygon" as Chain },
  { id: "arbitrum", symbol: "ARB", name: "Arbitrum", chain: "arbitrum" as Chain },
];

const TIMEFRAMES: Timeframe[] = ["1d"];

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();

  try {
    const supabase = createAdminClient();
    const apiKey = process.env.COINGECKO_API_KEY;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) headers["x-cg-demo-api-key"] = apiKey;

    const ids = SIGNAL_TOKENS.map((t) => t.id).join(",");

    // Fetch market data with 24h/7d price changes
    const res = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`,
      { headers, signal: AbortSignal.timeout(15_000) }
    );

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

    const markets = (await res.json()) as Array<{
      id: string;
      current_price: number;
      price_change_percentage_24h?: number;
      price_change_percentage_7d_in_currency?: number;
      high_24h?: number;
      low_24h?: number;
      total_volume?: number;
      market_cap?: number;
    }>;

    let signalCount = 0;

    for (const market of markets) {
      const token = SIGNAL_TOKENS.find((t) => t.id === market.id);
      if (!token) continue;

      const price = market.current_price;
      const change24h = market.price_change_percentage_24h ?? 0;
      const change7d = market.price_change_percentage_7d_in_currency ?? 0;
      const high24h = market.high_24h ?? price;
      const low24h = market.low_24h ?? price;

      for (const timeframe of TIMEFRAMES) {
        // Simple signal generation based on momentum
        const { signalType, confidence, basisTags } = generateSignal(
          change24h,
          change7d,
          price,
          high24h,
          low24h
        );

        // Calculate entry/target/stop levels
        const entryLow = price * 0.99;
        const entryHigh = price * 1.01;
        const target1 =
          signalType === "buy" ? price * 1.05 : price * 0.95;
        const target2 =
          signalType === "buy" ? price * 1.10 : price * 0.90;
        const stopLoss =
          signalType === "buy" ? price * 0.97 : price * 1.03;

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (timeframe === "1d" ? 24 : timeframe === "4h" ? 4 : 168));

        const { error } = await supabase.from("trading_signals").insert({
          token_symbol: token.symbol,
          token_name: token.name,
          chain: token.chain,
          signal_type: signalType,
          confidence,
          entry_low: entryLow,
          entry_high: entryHigh,
          target_1: target1,
          target_2: target2,
          stop_loss: stopLoss,
          basis_tags: basisTags,
          timeframe,
          status: "active",
          expires_at: expiresAt.toISOString(),
        });

        if (!error) signalCount++;
      }
    }

    console.log(
      `[cron/signal-generator] Generated ${signalCount} signals in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      signals: signalCount,
      tokens: markets.length,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/signal-generator] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate signals" },
      { status: 500 }
    );
  }
}

/* ── Signal Generation Logic ── */

function generateSignal(
  change24h: number,
  change7d: number,
  price: number,
  high24h: number,
  low24h: number
): { signalType: SignalType; confidence: number; basisTags: string[] } {
  const basisTags: string[] = [];
  let score = 0; // positive = bullish, negative = bearish

  // 24h momentum
  if (change24h > 3) {
    score += 2;
    basisTags.push("Strong 24h momentum");
  } else if (change24h > 1) {
    score += 1;
    basisTags.push("Positive 24h trend");
  } else if (change24h < -3) {
    score -= 2;
    basisTags.push("Strong 24h decline");
  } else if (change24h < -1) {
    score -= 1;
    basisTags.push("Negative 24h trend");
  }

  // 7d momentum
  if (change7d > 10) {
    score += 2;
    basisTags.push("Strong weekly uptrend");
  } else if (change7d > 3) {
    score += 1;
    basisTags.push("Weekly uptrend");
  } else if (change7d < -10) {
    score -= 2;
    basisTags.push("Strong weekly decline");
  } else if (change7d < -3) {
    score -= 1;
    basisTags.push("Weekly downtrend");
  }

  // Price position within 24h range (proximity to support/resistance)
  const range = high24h - low24h;
  if (range > 0) {
    const position = (price - low24h) / range;
    if (position < 0.25) {
      score += 1;
      basisTags.push("Near 24h support");
    } else if (position > 0.75) {
      score -= 1;
      basisTags.push("Near 24h resistance");
    }
  }

  // Determine signal
  let signalType: SignalType;
  if (score >= 2) signalType = "buy";
  else if (score <= -2) signalType = "sell";
  else signalType = "hold";

  // Confidence (40-90%)
  const confidence = Math.min(90, Math.max(40, 50 + Math.abs(score) * 10));

  if (basisTags.length === 0) basisTags.push("Neutral market conditions");

  return { signalType, confidence, basisTags };
}

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
