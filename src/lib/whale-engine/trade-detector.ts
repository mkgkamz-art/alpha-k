/**
 * [3-3] Trade Detector Worker
 *
 * 2분 간격. 상위 고래 지갑의 최근 트랜잭션을 조회하여
 * DEX 스왑 패턴 감지 → whale_trades 기록 + 팔로워 알림.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  getRecentEthTransfers,
  getRecentTokenTransfers,
} from "@/lib/exchanges/etherscan";
import { isExchange } from "@/lib/blockchain/labels";
import { dispatchWhaleTradeNotifications } from "@/lib/telegram/whale-notifier";

const MAX_WHALES_PER_RUN = 20; // Stay within 30s timeout
const LOOKBACK_SECONDS = 150; // ~2.5 min (overlap with 2min cron)

/* ── Known DEX Routers ── */
const DEX_ROUTERS = new Set([
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2
  "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", // Uniswap Universal
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f", // SushiSwap
  "0x1111111254eeb25477b68fb85ed929f73a960582", // 1inch v5
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff", // 0x Protocol
]);

interface DetectedTrade {
  whaleId: string;
  symbol: string;
  name: string;
  tradeType: "buy" | "sell";
  amount: number;
  valueUsd: number;
  price: number;
  txHash: string;
  dex: string | null;
}

/* ── Main Function ── */

export async function detectTrades(
  admin: SupabaseClient<Database>,
): Promise<{ detected: number; notified: number }> {
  // 1. Get top active whales (S/A tier first)
  const { data: whales } = await admin
    .from("whales")
    .select("id, address, label, tier")
    .eq("is_active", true)
    .eq("chain", "ethereum")
    .order("tier", { ascending: true })
    .limit(MAX_WHALES_PER_RUN);

  if (!whales || whales.length === 0) return { detected: 0, notified: 0 };

  const cutoff = Math.floor((Date.now() - LOOKBACK_SECONDS * 1000) / 1000);
  const allTrades: DetectedTrade[] = [];

  // 2. Scan each whale's recent transactions
  for (const whale of whales) {
    try {
      const trades = await scanWalletTrades(whale, cutoff);
      allTrades.push(...trades);
    } catch (err) {
      console.warn(
        `[trade-detector] Failed to scan ${whale.label}:`,
        err,
      );
    }

    // Rate limit
    await sleep(300);
  }

  // 3. Insert trades (skip duplicates)
  let detected = 0;
  for (const trade of allTrades) {
    const { error } = await admin.from("whale_trades").insert({
      whale_id: trade.whaleId,
      coin_symbol: trade.symbol,
      coin_name: trade.name,
      trade_type: trade.tradeType,
      amount: trade.amount,
      value_usd: trade.valueUsd,
      price: trade.price,
      tx_hash: trade.txHash,
      exchange_or_dex: trade.dex,
    });

    // Duplicate tx_hash will fail → skip
    if (!error) {
      detected++;

      // Update whale's last_trade_at
      await admin
        .from("whales")
        .update({
          last_trade_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", trade.whaleId);
    }
  }

  // 4. Notify followers of new trades via whale-notifier
  let notified = 0;
  if (detected > 0) {
    // Get full whale rows for notification formatting
    const whaleIds = [...new Set(allTrades.map((t) => t.whaleId))];
    const { data: whaleRows } = await admin
      .from("whales")
      .select("*")
      .in("id", whaleIds);

    const whaleMap = new Map(
      (whaleRows ?? []).map((w) => [w.id, w]),
    );

    // Get successfully inserted trades from DB (with IDs)
    const txHashes = allTrades.map((t) => t.txHash);
    const { data: insertedTrades } = await admin
      .from("whale_trades")
      .select("*")
      .in("tx_hash", txHashes)
      .order("created_at", { ascending: false });

    for (const tradeRow of insertedTrades ?? []) {
      const whaleRow = whaleMap.get(tradeRow.whale_id);
      if (!whaleRow) continue;

      const result = await dispatchWhaleTradeNotifications(admin, tradeRow, whaleRow);
      notified += result.sent;
    }
  }

  return { detected, notified };
}

/* ── Scan Single Wallet ── */

async function scanWalletTrades(
  whale: { id: string; address: string; label: string; tier: string },
  cutoffTimestamp: number,
): Promise<DetectedTrade[]> {
  const trades: DetectedTrade[] = [];
  const addr = whale.address.toLowerCase();

  // Token transfers
  const tokenTxs = await getRecentTokenTransfers(whale.address);
  const recentTokenTxs = tokenTxs.filter(
    (tx) => Number(tx.timeStamp) >= cutoffTimestamp,
  );

  for (const tx of recentTokenTxs) {
    const from = tx.from.toLowerCase();
    const to = tx.to.toLowerCase();
    const isDexInteraction = DEX_ROUTERS.has(from) || DEX_ROUTERS.has(to);
    const isFromExchange = isExchange(from);
    const isToExchange = isExchange(to);

    // Only track DEX swaps or exchange withdrawals/deposits
    if (!isDexInteraction && !isFromExchange && !isToExchange) continue;

    const isBuy = to === addr;
    const valueUsd = tx.value ?? 0;
    if (valueUsd < 1000) continue; // Skip small transfers

    let dex: string | null = null;
    if (DEX_ROUTERS.has(from) || DEX_ROUTERS.has(to)) {
      dex = identifyDex(from, to);
    }

    trades.push({
      whaleId: whale.id,
      symbol: (tx.tokenSymbol || "UNKNOWN").toUpperCase(),
      name: tx.tokenSymbol || "Unknown",
      tradeType: isBuy ? "buy" : "sell",
      amount: tx.value ?? 0,
      valueUsd,
      price: valueUsd / Math.max(tx.value ?? 1, 0.0001),
      txHash: tx.hash,
      dex,
    });
  }

  // Also check ETH transfers (large ones)
  try {
    const ethTxs = await getRecentEthTransfers(whale.address, 1);
    const recentEthTxs = ethTxs.filter(
      (tx) => Number(tx.timeStamp) >= cutoffTimestamp,
    );

    for (const tx of recentEthTxs) {
      const isBuy = tx.to.toLowerCase() === addr;

      trades.push({
        whaleId: whale.id,
        symbol: "ETH",
        name: "Ethereum",
        tradeType: isBuy ? "buy" : "sell",
        amount: tx.value,
        valueUsd: tx.value * 3000, // Rough ETH price estimate
        price: 3000,
        txHash: tx.hash,
        dex: null,
      });
    }
  } catch {
    // Non-fatal: ETH transfer scan failure
  }

  return trades;
}

/* ── Identify DEX ── */

function identifyDex(from: string, to: string): string | null {
  const addr = from.toLowerCase();
  const addr2 = to.toLowerCase();

  for (const a of [addr, addr2]) {
    if (a === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d") return "uniswap_v2";
    if (a === "0xe592427a0aece92de3edee1f18e0157c05861564") return "uniswap_v3";
    if (a === "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45") return "uniswap";
    if (a === "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f") return "sushiswap";
    if (a === "0x1111111254eeb25477b68fb85ed929f73a960582") return "1inch";
    if (a === "0xdef1c0ded9bec7f1a1670819833240f027b25eff") return "0x";
  }
  return null;
}

/* ── Helpers ── */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
