/**
 * Onchain Detector — 온체인 이상 감지기
 *
 * 데이터소스: Etherscan/BscScan 거래소 핫월렛 입출금
 * 대량 출금(매수 시그널) / 대량 입금(매도 시그널)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { scanExchangeWallets, type EthTransfer } from "@/lib/exchanges/etherscan";
import { calculateRadarScore } from "@/lib/radar-scoring";
import { upsertRadarSignal, applyMultiTypeBonus } from "./dedup";
import { matchHistoricalPattern } from "./historical-matcher";

const MIN_SCORE = 50;
const TAG = "[onchain-detector]";
const MIN_ETH_VALUE = 500; // 500 ETH 이상

interface OnchainCandidate {
  symbol: string;
  direction: "inflow" | "outflow";
  totalValue: number;
  transactionCount: number;
  exchanges: string[];
  transferRatio: number; // value / normal 24h avg
}

/**
 * 메인: 온체인 이상 감지 + 시그널 생성
 */
export async function detectOnchainActivity(
  admin: SupabaseClient<Database>,
): Promise<{ detected: number }> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    console.warn(TAG, "ETHERSCAN_API_KEY not set, skipping");
    return { detected: 0 };
  }

  // 1. 거래소 핫월렛 스캔
  let scanResult: Awaited<ReturnType<typeof scanExchangeWallets>>;
  try {
    scanResult = await scanExchangeWallets(MIN_ETH_VALUE);
  } catch (err) {
    console.error(TAG, "Scan failed:", err);
    return { detected: 0 };
  }

  const { inflows, outflows } = scanResult;
  const candidates: OnchainCandidate[] = [];

  // 2. 대량 입금 (매도 시그널) 집계
  if (inflows.length > 0) {
    const totalInflow = inflows.reduce((s, tx) => s + tx.value, 0);
    const exchanges = [...new Set(inflows.map((tx) => tx.exchange))];

    // 대량 입금 비율 추정 (일반적인 거래소 일일 입금량 대비)
    // 참고값: 평균 일일 거래소 ETH 입금 ~50,000 ETH
    const dailyAvgInflow = 50_000;
    const transferRatio = totalInflow / dailyAvgInflow;

    if (transferRatio >= 0.05) {
      // 일일 평균의 5% 이상
      candidates.push({
        symbol: "ETH",
        direction: "inflow",
        totalValue: totalInflow,
        transactionCount: inflows.length,
        exchanges,
        transferRatio,
      });
    }
  }

  // 3. 대량 출금 (매수 시그널) 집계
  if (outflows.length > 0) {
    const totalOutflow = outflows.reduce((s, tx) => s + tx.value, 0);
    const exchanges = [...new Set(outflows.map((tx) => tx.exchange))];

    const dailyAvgOutflow = 50_000;
    const transferRatio = totalOutflow / dailyAvgOutflow;

    if (transferRatio >= 0.05) {
      candidates.push({
        symbol: "ETH",
        direction: "outflow",
        totalValue: totalOutflow,
        transactionCount: outflows.length,
        exchanges,
        transferRatio,
      });
    }
  }

  // 4. 시그널 생성
  let detected = 0;

  for (const c of candidates) {
    // 과거 적중률 조회 (ETH 온체인 시그널)
    const { data: pastResults } = await admin
      .from("radar_signal_results")
      .select("is_hit")
      .eq("signal_id", "placeholder"); // 실제로는 signal_type 기반 JOIN 필요

    // 간단한 적중률 추정
    const historicalHitRate = pastResults
      ? pastResults.filter((r) => r.is_hit).length / Math.max(1, pastResults.length)
      : undefined;

    const { score, strength } = calculateRadarScore({
      type: "onchain",
      data: {
        transferRatio: c.transferRatio,
        direction: c.direction,
        historicalHitRate,
      },
    });

    if (score < MIN_SCORE) continue;

    const pattern = await matchHistoricalPattern(admin, "onchain", score, c.symbol);

    const dirLabel = c.direction === "outflow" ? "대량 출금 🟢" : "대량 입금 🔴";
    const signal = c.direction === "outflow" ? "매수" : "매도";

    // ETH 현재 가격
    const { data: ethPrice } = await admin
      .from("token_prices")
      .select("current_price")
      .eq("symbol", "ETH")
      .single();

    const usdValue = ethPrice
      ? Math.round(c.totalValue * ethPrice.current_price)
      : 0;

    const { id } = await upsertRadarSignal(admin, {
      signal_type: "onchain",
      token_symbol: c.symbol,
      score,
      strength,
      title: `${c.symbol} ${dirLabel} (${signal} 시그널)`,
      description: `${c.totalValue.toFixed(0)} ETH${usdValue ? ` ($${(usdValue / 1_000_000).toFixed(1)}M)` : ""} | ${c.transactionCount}건 | ${c.exchanges.join(", ")}`,
      data_snapshot: {
        direction: c.direction,
        total_value_eth: c.totalValue,
        total_value_usd: usdValue,
        transaction_count: c.transactionCount,
        exchanges: c.exchanges,
        transfer_ratio: c.transferRatio,
      },
      historical_pattern: pattern ?? undefined,
      source: "cron/detect-onchain",
      price_at_signal: ethPrice?.current_price ?? undefined,
    });

    if (id) {
      await applyMultiTypeBonus(admin, c.symbol, id, "onchain");
      detected++;
    }
  }

  console.log(TAG, `${detected} onchain signals`);
  return { detected };
}
