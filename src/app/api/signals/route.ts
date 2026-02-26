/**
 * GET /api/signals?timeframe=&type=
 *
 * Trading signals from the `signals` table.
 *
 * Access:
 * - 1D timeframe: Public (all users)
 * - 4H, 1W timeframes: Pro/Whale only
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { effectiveTier } from "@/lib/subscription";
import type { SubscriptionTier } from "@/types";

const VALID_TIMEFRAMES = new Set<string>(["4H", "1D", "1W"]);
const VALID_TYPES = new Set<string>(["buy", "sell", "alert"]);
const LOCKED_TIMEFRAMES = new Set<string>(["4H", "1W"]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const timeframe = searchParams.get("timeframe");
    const type = searchParams.get("type");

    const supabase = await createClient();

    // Check tier for locked timeframes
    let tier: SubscriptionTier = "free";
    if (timeframe && LOCKED_TIMEFRAMES.has(timeframe)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({
          signals: [],
          message: "Sign in and upgrade to Pro for 4H and 1W timeframe signals.",
        });
      }

      const { data: profile } = await supabase
        .from("users")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();

      tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;

      if (effectiveTier(tier) === "free") {
        return NextResponse.json({
          signals: [],
          message: "Upgrade to Pro for 4H and 1W timeframe signals.",
        });
      }
    }

    let query = supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (timeframe && VALID_TIMEFRAMES.has(timeframe)) {
      query = query.eq("timeframe", timeframe);
    }

    if (type && VALID_TYPES.has(type)) {
      query = query.eq("signal_type", type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ signals: data ?? [] });
  } catch (err) {
    console.error("[api/signals] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
