/**
 * Buzz Detector — 커뮤니티 버즈 감지기
 *
 * 데이터소스: Twitter API v2 recent search
 * 1시간 언급 수 vs 24시간 평균 → 200% 이상 = 시그널
 * + 간단한 키워드 기반 감성 분석
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  searchRecentTweets,
  analyzeSentiment,
  getTweetCount,
} from "@/lib/exchanges/twitter";
import { calculateRadarScore } from "@/lib/radar-scoring";
import { upsertRadarSignal, applyMultiTypeBonus } from "./dedup";
import { matchHistoricalPattern } from "./historical-matcher";

const MIN_SCORE = 50;
const MIN_SPIKE_RATIO = 2.0; // 200% 이상
const TAG = "[buzz-detector]";

/** 감시 대상 코인 + 검색 키워드 */
const WATCH_COINS = [
  { symbol: "BTC", queries: ["$BTC", "Bitcoin"] },
  { symbol: "ETH", queries: ["$ETH", "Ethereum"] },
  { symbol: "XRP", queries: ["$XRP", "Ripple"] },
  { symbol: "SOL", queries: ["$SOL", "Solana"] },
  { symbol: "DOGE", queries: ["$DOGE", "Dogecoin"] },
  { symbol: "ADA", queries: ["$ADA", "Cardano"] },
  { symbol: "AVAX", queries: ["$AVAX", "Avalanche"] },
  { symbol: "DOT", queries: ["$DOT", "Polkadot"] },
  { symbol: "LINK", queries: ["$LINK", "Chainlink"] },
  { symbol: "ARB", queries: ["$ARB", "Arbitrum"] },
  { symbol: "OP", queries: ["$OP", "Optimism"] },
  { symbol: "SUI", queries: ["$SUI", "SUI crypto"] },
  { symbol: "APT", queries: ["$APT", "Aptos"] },
  { symbol: "NEAR", queries: ["$NEAR", "NEAR Protocol"] },
  { symbol: "UNI", queries: ["$UNI", "Uniswap"] },
];

interface BuzzCandidate {
  symbol: string;
  mentionCount1h: number;
  avgMentions24h: number;
  spikeRatio: number;
  positiveRatio: number;
  negativeRatio: number;
  channelCount: number; // 검색어 수 (여러 쿼리에서 발견)
}

/**
 * 메인: 커뮤니티 버즈 감지 + 시그널 생성
 */
export async function detectBuzz(
  admin: SupabaseClient<Database>,
): Promise<{ detected: number }> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    console.warn(TAG, "TWITTER_BEARER_TOKEN not set, skipping");
    return { detected: 0 };
  }

  const candidates: BuzzCandidate[] = [];

  // 각 코인별 1시간/24시간 언급 수 비교
  for (const coin of WATCH_COINS) {
    try {
      let total1h = 0;
      let total24h = 0;
      let channelCount = 0;

      for (const query of coin.queries) {
        const count1h = await getTweetCount(query, 1);
        const count24h = await getTweetCount(query, 24);

        total1h += count1h;
        total24h += count24h;
        if (count1h > 0) channelCount++;

        // Rate limit: 450 req/15min → ~30/min → sleep between queries
        await new Promise((r) => setTimeout(r, 2500));
      }

      const avg24hPer1h = total24h / 24;

      if (avg24hPer1h <= 0 || total1h < 5) continue; // 너무 적으면 무시

      const spikeRatio = total1h / avg24hPer1h;

      if (spikeRatio >= MIN_SPIKE_RATIO) {
        // 감성 분석: 최근 트윗 50개
        const { tweets } = await searchRecentTweets(
          coin.queries[0],
          50,
        );
        const sentiment = analyzeSentiment(tweets);

        candidates.push({
          symbol: coin.symbol,
          mentionCount1h: total1h,
          avgMentions24h: avg24hPer1h,
          spikeRatio,
          positiveRatio: sentiment.positiveRatio,
          negativeRatio: sentiment.negativeRatio,
          channelCount,
        });
      }
    } catch (err) {
      console.warn(TAG, `Error for ${coin.symbol}:`, err);
    }
  }

  let detected = 0;

  for (const c of candidates) {
    const { score, strength } = calculateRadarScore({
      type: "buzz",
      data: {
        mentionSpikeRatio: c.spikeRatio,
        positiveRatio: c.positiveRatio,
        channelCount: c.channelCount,
      },
    });

    if (score < MIN_SCORE) continue;

    const pattern = await matchHistoricalPattern(admin, "buzz", score, c.symbol);

    const sentimentEmoji =
      c.positiveRatio > 0.5 ? "🟢" : c.negativeRatio > 0.5 ? "🔴" : "⚪";

    const { id } = await upsertRadarSignal(admin, {
      signal_type: "buzz",
      token_symbol: c.symbol,
      score,
      strength,
      title: `${c.symbol} 소셜 버즈 ${c.spikeRatio.toFixed(1)}배 ${sentimentEmoji}`,
      description: `1시간 언급 ${c.mentionCount1h}건 (24시간 평균 대비 ${c.spikeRatio.toFixed(1)}배) | 긍정 ${Math.round(c.positiveRatio * 100)}%`,
      data_snapshot: {
        mention_count_1h: c.mentionCount1h,
        avg_mentions_24h: c.avgMentions24h,
        spike_ratio: c.spikeRatio,
        positive_ratio: c.positiveRatio,
        negative_ratio: c.negativeRatio,
        channel_count: c.channelCount,
      },
      historical_pattern: pattern ?? undefined,
      source: "cron/detect-buzz",
    });

    if (id) {
      await applyMultiTypeBonus(admin, c.symbol, id, "buzz");
      detected++;
    }
  }

  console.log(TAG, `${detected} buzz signals from ${candidates.length} candidates`);
  return { detected };
}
