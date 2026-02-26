/**
 * GET /api/v1/whale/hot-coins — 고래 핫 코인
 *
 * Free: 상위 3개만
 * Pro/Whale: 전체
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";
import { withCache } from "@/lib/api-error-handler";
import {
  FREE_HOT_COIN_LIMIT,
  serializeHotCoin,
} from "@/lib/whale-api";

export const GET = withApiKeyAuth("v1-whale-hot-coins", async (_req, ctx) => {
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

  // Free: top 3 only
  const visibleCoins =
    ctx.tier === "free" ? coins.slice(0, FREE_HOT_COIN_LIMIT) : coins;

  // Fetch top buyers per coin (최근 24h 매수 고래 label)
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
    meta: {
      tier: ctx.tier,
      count: results.length,
      total: coins.length,
    },
  });

  return withCache(res, 60);
});
