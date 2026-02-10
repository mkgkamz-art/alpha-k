/**
 * GET /api/signals?chain=&timeframe=&type=
 *
 * Trading signals list with tier-based filtering.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Chain, Timeframe, SignalType } from "@/types";

const VALID_CHAINS = new Set<string>(["ethereum", "solana", "bsc", "polygon", "arbitrum"]);
const VALID_TIMEFRAMES = new Set<string>(["4h", "1d", "1w"]);
const VALID_SIGNAL_TYPES = new Set<string>(["buy", "sell", "hold"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const chain = searchParams.get("chain");
  const timeframe = searchParams.get("timeframe");
  const type = searchParams.get("type");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check tier for timeframe access
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier ?? "free";

  // Free users don't get signals
  if (tier === "free") {
    return NextResponse.json({
      signals: [],
      message: "Upgrade to Pro for trading signals.",
    });
  }

  let query = supabase
    .from("trading_signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (chain && chain !== "all" && VALID_CHAINS.has(chain)) {
    query = query.eq("chain", chain as Chain);
  }

  if (timeframe && timeframe !== "all" && VALID_TIMEFRAMES.has(timeframe)) {
    // Pro only gets 1D, Whale gets all
    if (tier === "pro" && timeframe !== "1d") {
      return NextResponse.json({
        signals: [],
        message: "Pro plan only has access to 1D timeframe.",
      });
    }
    query = query.eq("timeframe", timeframe as Timeframe);
  }

  if (type && type !== "all" && VALID_SIGNAL_TYPES.has(type)) {
    query = query.eq("signal_type", type as SignalType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ signals: data ?? [] });
}
