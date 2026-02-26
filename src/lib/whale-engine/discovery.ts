/**
 * [3-1] Whale Discovery Worker
 *
 * 매일 1회 실행. Etherscan tokentx로 고수익 지갑 탐색 후
 * whales 테이블에 upsert + tier 재산정.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getRecentTokenTransfers } from "@/lib/exchanges/etherscan";
import { isExchange } from "@/lib/blockchain/labels";

/* ── Known DEX Routers (Ethereum) ── */
const DEX_ROUTERS = [
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
  "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3
  "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap
  "0x1111111254EEB25477B68fb85Ed929f73A960582", // 1inch v5
];

const MIN_TRADE_COUNT = 10;
const MIN_PORTFOLIO_USD = 100_000;
const SCAN_PAGES = 3; // 3 pages × 100 = 300 txs per router

interface WalletProfile {
  address: string;
  tradeCount: number;
  totalVolumeUsd: number;
  uniqueTokens: Set<string>;
  lastTradeAt: Date;
  buyCount: number;
  sellCount: number;
}

/* ── Main Discovery Function ── */

export async function discoverWhales(
  admin: SupabaseClient<Database>,
): Promise<{ discovered: number; tiersUpdated: number }> {
  const walletMap = new Map<string, WalletProfile>();

  // 1. Scan DEX routers for recent token transfers
  for (const router of DEX_ROUTERS) {
    for (let page = 1; page <= SCAN_PAGES; page++) {
      try {
        const transfers = await getRecentTokenTransfers(
          router,
          undefined,
          page,
          100,
        );

        for (const tx of transfers) {
          // Skip exchange wallets and zero-value
          const from = tx.from.toLowerCase();
          const to = tx.to.toLowerCase();
          if (isExchange(from) || isExchange(to)) continue;

          // Track non-exchange wallets interacting with DEX
          for (const addr of [from, to]) {
            if (addr === router.toLowerCase()) continue;

            let profile = walletMap.get(addr);
            if (!profile) {
              profile = {
                address: addr,
                tradeCount: 0,
                totalVolumeUsd: 0,
                uniqueTokens: new Set(),
                lastTradeAt: new Date(0),
                buyCount: 0,
                sellCount: 0,
              };
              walletMap.set(addr, profile);
            }

            profile.tradeCount++;
            profile.totalVolumeUsd += tx.value ?? 0;
            if (tx.tokenSymbol) profile.uniqueTokens.add(tx.tokenSymbol);

            const txDate = new Date(Number(tx.timeStamp) * 1000);
            if (txDate > profile.lastTradeAt) profile.lastTradeAt = txDate;

            if (addr === to) profile.buyCount++;
            else profile.sellCount++;
          }
        }
      } catch (err) {
        console.warn(
          `[whale-discovery] Failed to scan router ${router} page ${page}:`,
          err,
        );
      }

      // Rate limit: 1s between requests
      await sleep(1000);
    }
  }

  // 2. Filter: min trades + min volume
  const candidates = Array.from(walletMap.values()).filter(
    (w) =>
      w.tradeCount >= MIN_TRADE_COUNT &&
      w.totalVolumeUsd >= MIN_PORTFOLIO_USD,
  );

  // 3. Upsert into whales
  let discovered = 0;
  for (const candidate of candidates.slice(0, 50)) {
    // Limit to top 50 per run
    const tradingStyle = inferTradingStyle(candidate);
    const label = `Whale_${candidate.address.slice(0, 6)}`;

    const { error } = await admin
      .from("whales")
      .upsert(
        {
          address: candidate.address,
          label,
          chain: "ethereum",
          profile: {
            trading_style: tradingStyle,
            total_trades_scanned: candidate.tradeCount,
            unique_tokens: candidate.uniqueTokens.size,
            total_volume_usd: candidate.totalVolumeUsd,
          },
          total_trades_30d: candidate.tradeCount,
          last_trade_at: candidate.lastTradeAt.toISOString(),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "address" },
      );

    if (!error) discovered++;
  }

  // 4. Tier re-calculation
  const tiersUpdated = await recalculateTiers(admin);

  return { discovered, tiersUpdated };
}

/* ── Trading Style Inference ── */

function inferTradingStyle(
  profile: WalletProfile,
): "scalp" | "swing" | "position" | "hodl" {
  const avgTradesPerDay =
    profile.tradeCount /
    Math.max(
      1,
      (Date.now() - profile.lastTradeAt.getTime()) / (24 * 60 * 60_000) || 30,
    );

  if (avgTradesPerDay >= 5) return "scalp";
  if (avgTradesPerDay >= 1) return "swing";
  if (avgTradesPerDay >= 0.1) return "position";
  return "hodl";
}

/* ── Tier Recalculation ── */

async function recalculateTiers(
  admin: SupabaseClient<Database>,
): Promise<number> {
  const { data: allWhales } = await admin
    .from("whales")
    .select("id, return_30d_pct")
    .eq("is_active", true)
    .order("return_30d_pct", { ascending: false });

  if (!allWhales || allWhales.length === 0) return 0;

  const total = allWhales.length;
  let updated = 0;

  for (let i = 0; i < total; i++) {
    const pctRank = i / total;
    let tier: Database["public"]["Enums"]["whale_tier"];

    if (pctRank < 0.01) tier = "s";
    else if (pctRank < 0.05) tier = "a";
    else if (pctRank < 0.15) tier = "b";
    else tier = "c";

    const { error } = await admin
      .from("whales")
      .update({ tier })
      .eq("id", allWhales[i].id);

    if (!error) updated++;
  }

  return updated;
}

/* ── Helpers ── */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
