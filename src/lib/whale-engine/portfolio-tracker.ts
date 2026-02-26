/**
 * [3-2] Portfolio Tracker Worker
 *
 * 5분 간격. 활성 고래 지갑의 토큰 잔액 변동 감지,
 * whale_portfolios 갱신 + 변동분을 whale_trades로 기록.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getRecentTokenTransfers } from "@/lib/exchanges/etherscan";
import { getBinanceTickers } from "@/lib/exchanges/binance";

const BATCH_SIZE = 5; // Etherscan rate: 5 wallets per batch
const BATCH_DELAY_MS = 1200; // 1.2s between batches (stay under 5req/s)
const LOOKBACK_MINUTES = 6; // Slightly more than 5min interval for overlap

type WhaleRow = Database["public"]["Tables"]["whales"]["Row"];

interface TokenDelta {
  symbol: string;
  name: string;
  direction: "buy" | "sell";
  amount: number;
  valueUsd: number;
  txHash: string;
}

/* ── Main Function ── */

export async function trackPortfolios(
  admin: SupabaseClient<Database>,
): Promise<{ tracked: number; trades: number; deactivated: number }> {
  // 1. Get active whales
  const { data: whales } = await admin
    .from("whales")
    .select("id, address, chain, last_trade_at")
    .eq("is_active", true)
    .eq("chain", "ethereum") // Only Ethereum for now
    .order("tier", { ascending: true }) // S first
    .limit(100);

  if (!whales || whales.length === 0) return { tracked: 0, trades: 0, deactivated: 0 };

  // 2. Fetch current prices for valuation
  const priceMap = await fetchPriceMap();

  let tracked = 0;
  let tradesInserted = 0;
  let deactivated = 0;

  // 3. Process in batches
  for (let i = 0; i < whales.length; i += BATCH_SIZE) {
    const batch = whales.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((w) => processWhale(admin, w, priceMap)),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        tracked++;
        tradesInserted += result.value.trades;
        if (result.value.deactivated) deactivated++;
      }
    }

    if (i + BATCH_SIZE < whales.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return { tracked, trades: tradesInserted, deactivated };
}

/* ── Process Single Whale ── */

async function processWhale(
  admin: SupabaseClient<Database>,
  whale: Pick<WhaleRow, "id" | "address" | "chain" | "last_trade_at">,
  priceMap: Map<string, number>,
): Promise<{ trades: number; deactivated: boolean }> {
  const cutoffTime = Math.floor(
    (Date.now() - LOOKBACK_MINUTES * 60_000) / 1000,
  );

  // Fetch recent token transfers
  let transfers: Awaited<ReturnType<typeof getRecentTokenTransfers>>;
  try {
    transfers = await getRecentTokenTransfers(whale.address);
  } catch {
    return { trades: 0, deactivated: false };
  }

  // Filter to recent transfers only
  const recentTransfers = transfers.filter(
    (tx) => Number(tx.timeStamp) >= cutoffTime,
  );

  // Detect buy/sell from transfers
  const deltas: TokenDelta[] = [];
  const whaleAddr = whale.address.toLowerCase();

  for (const tx of recentTransfers) {
    if (!tx.tokenSymbol) continue; // Skip ETH-only transfers
    const isBuy = tx.to.toLowerCase() === whaleAddr;
    const symbol = tx.tokenSymbol.toUpperCase();
    const price = priceMap.get(symbol) ?? 0;
    const valueUsd = tx.value * price;

    if (valueUsd < 100) continue; // Skip dust

    deltas.push({
      symbol,
      name: symbol,
      direction: isBuy ? "buy" : "sell",
      amount: tx.value,
      valueUsd,
      txHash: tx.hash,
    });
  }

  // Insert trades (skip duplicates via tx_hash)
  let tradesCount = 0;
  for (const delta of deltas) {
    const { error } = await admin.from("whale_trades").insert({
      whale_id: whale.id,
      coin_symbol: delta.symbol,
      coin_name: delta.name,
      trade_type: delta.direction,
      amount: delta.amount,
      value_usd: delta.valueUsd,
      price: delta.valueUsd / Math.max(delta.amount, 0.0001),
      tx_hash: delta.txHash,
    });

    if (!error) tradesCount++;
  }

  // Update last_trade_at if we found trades
  if (tradesCount > 0) {
    await admin
      .from("whales")
      .update({
        last_trade_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", whale.id);
  }

  // Deactivate if no trades for 7 days
  let deactivated = false;
  if (whale.last_trade_at) {
    const daysSinceLast =
      (Date.now() - new Date(whale.last_trade_at).getTime()) /
      (24 * 60 * 60_000);
    if (daysSinceLast > 7 && tradesCount === 0) {
      await admin
        .from("whales")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", whale.id);
      deactivated = true;
    }
  }

  // Update portfolio snapshot from current holdings
  await updatePortfolioSnapshot(admin, whale.id, priceMap);

  return { trades: tradesCount, deactivated };
}

/* ── Portfolio Snapshot Update ── */

async function updatePortfolioSnapshot(
  admin: SupabaseClient<Database>,
  whaleId: string,
  priceMap: Map<string, number>,
): Promise<void> {
  // Get existing portfolio
  const { data: portfolio } = await admin
    .from("whale_portfolios")
    .select("*")
    .eq("whale_id", whaleId);

  if (!portfolio || portfolio.length === 0) return;

  // Update current prices
  for (const holding of portfolio) {
    const currentPrice =
      priceMap.get(holding.coin_symbol.toUpperCase()) ?? holding.current_price;

    const unrealizedPnl =
      holding.avg_entry_price > 0
        ? ((currentPrice - holding.avg_entry_price) / holding.avg_entry_price) *
          100
        : 0;

    await admin
      .from("whale_portfolios")
      .update({
        current_price: currentPrice,
        value_usd: holding.amount * currentPrice,
        unrealized_pnl_pct: Math.round(unrealizedPnl * 100) / 100,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", holding.id);
  }

  // Recalculate weight_pct
  const totalValue = portfolio.reduce(
    (sum, h) =>
      sum +
      h.amount *
        (priceMap.get(h.coin_symbol.toUpperCase()) ?? h.current_price),
    0,
  );

  if (totalValue > 0) {
    for (const holding of portfolio) {
      const price =
        priceMap.get(holding.coin_symbol.toUpperCase()) ?? holding.current_price;
      const weight = ((holding.amount * price) / totalValue) * 100;

      await admin
        .from("whale_portfolios")
        .update({ weight_pct: Math.round(weight * 100) / 100 })
        .eq("id", holding.id);
    }
  }
}

/* ── Price Map from Binance ── */

async function fetchPriceMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const tickers = await getBinanceTickers();
    for (const t of tickers) {
      map.set(t.symbol.toUpperCase(), t.lastPrice);
    }
  } catch (err) {
    console.warn("[portfolio-tracker] Failed to fetch Binance prices:", err);
  }
  return map;
}

/* ── Helpers ── */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
