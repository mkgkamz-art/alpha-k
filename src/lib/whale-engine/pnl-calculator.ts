/**
 * [3-5] PnL Calculator Worker
 *
 * 매시 정각. FIFO 기준 수익률 계산 + 기간별 수익률/승률 갱신.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type TradeRow = Database["public"]["Tables"]["whale_trades"]["Row"];

/* ── Main Function ── */

export async function calculatePnl(
  admin: SupabaseClient<Database>,
): Promise<{ sellsEvaluated: number; whalesUpdated: number; portfoliosUpdated: number }> {
  let sellsEvaluated = 0;

  // 1. Find sell trades without realized_pnl_pct
  const { data: pendingSells } = await admin
    .from("whale_trades")
    .select("*")
    .eq("trade_type", "sell")
    .is("realized_pnl_pct", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (pendingSells && pendingSells.length > 0) {
    // Group by whale+coin for batch FIFO
    const groups = new Map<string, TradeRow[]>();
    for (const sell of pendingSells) {
      const key = `${sell.whale_id}|${sell.coin_symbol}`;
      const existing = groups.get(key) ?? [];
      existing.push(sell);
      groups.set(key, existing);
    }

    for (const [key, sells] of groups) {
      const [whaleId, coinSymbol] = key.split("|");

      // Get all buys for this whale+coin, ordered by time (FIFO)
      const { data: buys } = await admin
        .from("whale_trades")
        .select("price, amount, created_at")
        .eq("whale_id", whaleId)
        .eq("coin_symbol", coinSymbol)
        .eq("trade_type", "buy")
        .order("created_at", { ascending: true });

      if (!buys || buys.length === 0) {
        // No buy records → mark as 0% pnl
        for (const sell of sells) {
          await admin
            .from("whale_trades")
            .update({ realized_pnl_pct: 0 })
            .eq("id", sell.id);
          sellsEvaluated++;
        }
        continue;
      }

      // FIFO matching
      let buyIdx = 0;
      let remainingBuyAmount = buys[0].amount;

      for (const sell of sells) {
        let weightedCost = 0;
        let matchedAmount = 0;
        let sellRemaining = sell.amount;

        while (sellRemaining > 0 && buyIdx < buys.length) {
          const available = Math.min(remainingBuyAmount, sellRemaining);
          weightedCost += available * buys[buyIdx].price;
          matchedAmount += available;
          sellRemaining -= available;
          remainingBuyAmount -= available;

          if (remainingBuyAmount <= 0.0001) {
            buyIdx++;
            if (buyIdx < buys.length) {
              remainingBuyAmount = buys[buyIdx].amount;
            }
          }
        }

        // Calculate PnL
        let pnlPct = 0;
        if (matchedAmount > 0) {
          const avgBuyPrice = weightedCost / matchedAmount;
          pnlPct =
            avgBuyPrice > 0
              ? ((sell.price - avgBuyPrice) / avgBuyPrice) * 100
              : 0;
        }

        await admin
          .from("whale_trades")
          .update({ realized_pnl_pct: Math.round(pnlPct * 100) / 100 })
          .eq("id", sell.id);

        sellsEvaluated++;
      }
    }
  }

  // 2. Update unrealized PnL for portfolios
  const portfoliosUpdated = await updateUnrealizedPnl(admin);

  // 3. Recalculate whale return metrics
  const whalesUpdated = await recalculateWhaleReturns(admin);

  return { sellsEvaluated, whalesUpdated, portfoliosUpdated };
}

/* ── Unrealized PnL ── */

async function updateUnrealizedPnl(
  admin: SupabaseClient<Database>,
): Promise<number> {
  const { data: portfolios } = await admin
    .from("whale_portfolios")
    .select("id, avg_entry_price, current_price")
    .gt("avg_entry_price", 0)
    .gt("current_price", 0);

  if (!portfolios) return 0;

  let count = 0;
  for (const p of portfolios) {
    const pnl =
      ((p.current_price - p.avg_entry_price) / p.avg_entry_price) * 100;
    const rounded = Math.round(pnl * 100) / 100;

    if (rounded !== p.current_price) {
      // Avoid no-op updates
      await admin
        .from("whale_portfolios")
        .update({
          unrealized_pnl_pct: rounded,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);
      count++;
    }
  }

  return count;
}

/* ── Whale Return Metrics ── */

async function recalculateWhaleReturns(
  admin: SupabaseClient<Database>,
): Promise<number> {
  const { data: activeWhales } = await admin
    .from("whales")
    .select("id")
    .eq("is_active", true);

  if (!activeWhales) return 0;

  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 60 * 60_000).toISOString();
  const d30 = new Date(now - 30 * 24 * 60 * 60_000).toISOString();
  const d90 = new Date(now - 90 * 24 * 60 * 60_000).toISOString();

  let updated = 0;

  for (const whale of activeWhales) {
    // Get all sells with pnl in each period
    const [r7, r30, r90] = await Promise.all([
      getReturnStats(admin, whale.id, d7),
      getReturnStats(admin, whale.id, d30),
      getReturnStats(admin, whale.id, d90),
    ]);

    // Count total trades in 30d
    const { count: totalTrades30d } = await admin
      .from("whale_trades")
      .select("*", { count: "exact", head: true })
      .eq("whale_id", whale.id)
      .gte("created_at", d30);

    await admin
      .from("whales")
      .update({
        return_7d_pct: r7.avgReturn,
        return_30d_pct: r30.avgReturn,
        return_90d_pct: r90.avgReturn,
        win_rate_30d: r30.winRate,
        total_trades_30d: totalTrades30d ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", whale.id);

    updated++;
  }

  return updated;
}

/* ── Return Stats for Period ── */

async function getReturnStats(
  admin: SupabaseClient<Database>,
  whaleId: string,
  since: string,
): Promise<{ avgReturn: number; winRate: number }> {
  const { data: sells } = await admin
    .from("whale_trades")
    .select("realized_pnl_pct")
    .eq("whale_id", whaleId)
    .eq("trade_type", "sell")
    .not("realized_pnl_pct", "is", null)
    .gte("created_at", since);

  if (!sells || sells.length === 0) {
    return { avgReturn: 0, winRate: 0 };
  }

  const total = sells.length;
  const wins = sells.filter((s) => (s.realized_pnl_pct ?? 0) > 0).length;
  const sumReturn = sells.reduce(
    (sum, s) => sum + (s.realized_pnl_pct ?? 0),
    0,
  );

  return {
    avgReturn: Math.round((sumReturn / total) * 100) / 100,
    winRate: Math.round((wins / total) * 100) / 100,
  };
}
