/**
 * [3-4] Hot Coin Aggregator Worker
 *
 * 5분 간격. 최근 24시간 whale_trades를 집계하여
 * whale_hot_coins 테이블 갱신.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const TIER_SCORE: Record<string, number> = {
  s: 4,
  a: 3,
  b: 2,
  c: 1,
};

interface CoinAgg {
  coinSymbol: string;
  coinName: string;
  buyWhaleIds: Set<string>;
  sellWhaleIds: Set<string>;
  buyVolume: number;
  sellVolume: number;
  tierScores: number[];
}

/* ── Main Function ── */

export async function aggregateHotCoins(
  admin: SupabaseClient<Database>,
): Promise<{ updated: number }> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  // 1. Fetch recent trades with whale tier
  const { data: trades } = await admin
    .from("whale_trades")
    .select("coin_symbol, coin_name, trade_type, value_usd, whale_id")
    .gte("created_at", oneDayAgo);

  if (!trades || trades.length === 0) {
    // Clear hot coins if no recent trades
    await admin
      .from("whale_hot_coins")
      .update({
        buy_whale_count_24h: 0,
        sell_whale_count_24h: 0,
        net_buy_volume_usd_24h: 0,
        avg_whale_tier: 0,
        updated_at: new Date().toISOString(),
      })
      .gte("updated_at", "2000-01-01"); // Match all rows

    return { updated: 0 };
  }

  // Get whale tiers for scoring
  const whaleIds = [...new Set(trades.map((t) => t.whale_id))];
  const { data: whales } = await admin
    .from("whales")
    .select("id, tier")
    .in("id", whaleIds);

  const tierMap = new Map(
    (whales ?? []).map((w) => [w.id, w.tier]),
  );

  // 2. Aggregate by coin
  const aggMap = new Map<string, CoinAgg>();

  for (const trade of trades) {
    let agg = aggMap.get(trade.coin_symbol);
    if (!agg) {
      agg = {
        coinSymbol: trade.coin_symbol,
        coinName: trade.coin_name,
        buyWhaleIds: new Set(),
        sellWhaleIds: new Set(),
        buyVolume: 0,
        sellVolume: 0,
        tierScores: [],
      };
      aggMap.set(trade.coin_symbol, agg);
    }

    if (trade.trade_type === "buy") {
      agg.buyWhaleIds.add(trade.whale_id);
      agg.buyVolume += trade.value_usd;
      const score = TIER_SCORE[tierMap.get(trade.whale_id) ?? "c"] ?? 1;
      agg.tierScores.push(score);
    } else {
      agg.sellWhaleIds.add(trade.whale_id);
      agg.sellVolume += trade.value_usd;
    }
  }

  // 3. Upsert into whale_hot_coins
  let updated = 0;

  for (const agg of aggMap.values()) {
    const avgTier =
      agg.tierScores.length > 0
        ? agg.tierScores.reduce((a, b) => a + b, 0) / agg.tierScores.length
        : 0;

    const { error } = await admin.from("whale_hot_coins").upsert(
      {
        coin_symbol: agg.coinSymbol,
        coin_name: agg.coinName,
        buy_whale_count_24h: agg.buyWhaleIds.size,
        sell_whale_count_24h: agg.sellWhaleIds.size,
        net_buy_volume_usd_24h:
          Math.round((agg.buyVolume - agg.sellVolume) * 100) / 100,
        avg_whale_tier: Math.round(avgTier * 100) / 100,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "coin_symbol" },
    );

    if (!error) updated++;
  }

  // 4. Remove stale coins (not in current aggregation)
  const activeSymbols = [...aggMap.keys()];
  if (activeSymbols.length > 0) {
    await admin
      .from("whale_hot_coins")
      .delete()
      .not(
        "coin_symbol",
        "in",
        `(${activeSymbols.map((s) => `"${s}"`).join(",")})`,
      );
  }

  return { updated };
}
