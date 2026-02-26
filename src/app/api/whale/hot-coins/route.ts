/**
 * GET /api/whale/hot-coins — 고래 핫 코인 (내부 세션 인증)
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withCache } from "@/lib/api-error-handler";
import { FREE_HOT_COIN_LIMIT, serializeHotCoin } from "@/lib/whale-api";
import type { SubscriptionTier } from "@/types";

export async function GET(req: NextRequest) {
  try {
    // Session auth → tier
    let tier: SubscriptionTier = "free";
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();
        tier = (userData?.subscription_tier as SubscriptionTier) ?? "free";
      }
    } catch {
      // free
    }

    const admin = createAdminClient();

    const { data: hotCoins, error } = await admin
      .from("whale_hot_coins")
      .select("*")
      .order("net_buy_volume_usd_24h", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch hot coins" },
        { status: 500 },
      );
    }

    const coins = hotCoins ?? [];
    const visibleCoins =
      tier === "free" ? coins.slice(0, FREE_HOT_COIN_LIMIT) : coins;
    const lockedCount = coins.length - visibleCoins.length;

    // Fetch top buyers per coin
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

    const results = await Promise.all(
      visibleCoins.map(async (coin) => {
        const { data: buyTrades } = await admin
          .from("whale_trades")
          .select("whale_id")
          .eq("coin_symbol", coin.coin_symbol)
          .eq("trade_type", "buy")
          .gte("created_at", oneDayAgo)
          .order("value_usd", { ascending: false })
          .limit(5);

        const buyerWhaleIds = [
          ...new Set((buyTrades ?? []).map((t) => t.whale_id)),
        ].slice(0, 3);

        let topBuyers: string[] = [];
        if (buyerWhaleIds.length > 0) {
          const { data: whales } = await admin
            .from("whales")
            .select("label")
            .in("id", buyerWhaleIds);
          topBuyers = (whales ?? []).map((w) => w.label);
        }

        return serializeHotCoin(coin, topBuyers);
      }),
    );

    const res = NextResponse.json({
      hot_coins: results,
      lockedCount,
      meta: { tier, count: results.length, total: coins.length },
    });

    return withCache(res, 60);
  } catch (err) {
    console.error("[whale/hot-coins] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
