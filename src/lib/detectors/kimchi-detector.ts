/**
 * Kimchi Premium Detector — 통계 기반 김프/역프 감지기
 *
 * 기존 radar-surge-sync의 단순 ≥3% 로직 대체.
 * 30일 이동평균 + 2σ 이탈 → 시그널
 *
 * 데이터소스: Upbit KRW + Binance USDT + 환율
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getBinanceTickers, type BinanceTicker } from "@/lib/exchanges/binance";
import { getExchangeRate } from "@/lib/exchanges/coingecko-prices";
import { calculateRadarScore } from "@/lib/radar-scoring";
import { upsertRadarSignal, applyMultiTypeBonus } from "./dedup";
import { matchHistoricalPattern } from "./historical-matcher";

const MIN_SCORE = 40;
const TAG = "[kimchi-detector]";

interface KimchiCandidate {
  symbol: string;
  premiumPercent: number;
  ma30: number;
  stddev: number;
  zScore: number;
  priceKrw: number;
  priceUsd: number;
  exchange: string;
}

/**
 * kimchi_premium_history에서 30일 MA + stddev 조회.
 */
async function getHistoricalStats(
  admin: SupabaseClient<Database>,
  symbol: string,
): Promise<{ ma30: number; stddev: number } | null> {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60_000,
  ).toISOString();

  const { data } = await admin
    .from("kimchi_premium_history")
    .select("premium_percent")
    .eq("symbol", symbol)
    .gte("recorded_at", thirtyDaysAgo)
    .order("recorded_at", { ascending: false })
    .limit(500);

  if (!data || data.length < 10) return null;

  const values = data.map((d) => d.premium_percent);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const stddev = Math.sqrt(variance);

  return { ma30: Math.round(mean * 100) / 100, stddev: Math.round(stddev * 100) / 100 };
}

/**
 * 메인: 통계 기반 김프 감지 + 시그널 생성
 */
export async function detectKimchiPremium(
  admin: SupabaseClient<Database>,
): Promise<{ detected: number }> {
  // 1. 현재 김프 데이터 가져오기 (korean_prices + Binance + 환율)
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();

  const { data: krwPrices } = await admin
    .from("korean_prices")
    .select("symbol, exchange, price_krw, kimchi_premium")
    .gte("fetched_at", fiveMinAgo)
    .order("fetched_at", { ascending: false });

  if (!krwPrices || krwPrices.length === 0) return { detected: 0 };

  // 심볼별 최신 데이터만
  const latestKrw = new Map<string, { price_krw: number; exchange: string; kimchi_premium: number | null }>();
  for (const p of krwPrices) {
    if (!latestKrw.has(p.symbol)) {
      latestKrw.set(p.symbol, {
        price_krw: p.price_krw ?? 0,
        exchange: p.exchange,
        kimchi_premium: p.kimchi_premium,
      });
    }
  }

  // Binance USD 가격 가져오기
  let binanceTickers: BinanceTicker[];
  try {
    binanceTickers = await getBinanceTickers();
  } catch (err) {
    console.error(TAG, "Binance fetch failed:", err);
    return { detected: 0 };
  }

  const binanceMap = new Map<string, number>();
  for (const t of binanceTickers) {
    binanceMap.set(t.symbol, t.lastPrice);
  }

  const exchangeRate = await getExchangeRate();

  // 2. 각 코인 김프 계산 + 통계 이상치 판별
  const candidates: KimchiCandidate[] = [];

  for (const [symbol, krw] of latestKrw) {
    const usdPrice = binanceMap.get(symbol);
    if (!usdPrice || usdPrice <= 0 || krw.price_krw <= 0) continue;

    // 실제 김프 계산
    const expectedKrw = usdPrice * exchangeRate;
    const premium =
      ((krw.price_krw - expectedKrw) / expectedKrw) * 100;

    // DB에 저장된 값과 비교 (없으면 계산값 사용)
    const currentPremium = krw.kimchi_premium ?? premium;

    // 30일 통계
    const stats = await getHistoricalStats(admin, symbol);

    if (!stats) {
      // 통계 없으면 단순 절대값 기준 (기존 로직)
      if (Math.abs(currentPremium) >= 3) {
        candidates.push({
          symbol,
          premiumPercent: currentPremium,
          ma30: 0,
          stddev: 0,
          zScore: 0,
          priceKrw: krw.price_krw,
          priceUsd: usdPrice,
          exchange: krw.exchange,
        });
      }
      continue;
    }

    // z-score 계산
    const zScore =
      stats.stddev > 0
        ? (currentPremium - stats.ma30) / stats.stddev
        : 0;

    // 2σ 이탈 또는 절대값 5% 이상
    if (Math.abs(zScore) >= 2 || Math.abs(currentPremium) >= 5) {
      candidates.push({
        symbol,
        premiumPercent: currentPremium,
        ma30: stats.ma30,
        stddev: stats.stddev,
        zScore,
        priceKrw: krw.price_krw,
        priceUsd: usdPrice,
        exchange: krw.exchange,
      });
    }
  }

  // 3. 시그널 생성
  let detected = 0;

  for (const c of candidates) {
    const { score, strength } = calculateRadarScore({
      type: "kimchi",
      data: { premiumPercent: c.premiumPercent },
    });

    if (score < MIN_SCORE) continue;

    const pattern = await matchHistoricalPattern(admin, "kimchi", score, c.symbol);

    const label = c.premiumPercent > 0 ? "김프" : "역프";
    const zLabel =
      Math.abs(c.zScore) >= 3
        ? " ⚠️ 극단"
        : Math.abs(c.zScore) >= 2
          ? " 🔶 이상치"
          : "";

    const { id } = await upsertRadarSignal(admin, {
      signal_type: "kimchi",
      token_symbol: c.symbol,
      score,
      strength,
      title: `${c.symbol} ${label} ${c.premiumPercent > 0 ? "+" : ""}${c.premiumPercent.toFixed(1)}%${zLabel}`,
      description: `30일 평균 ${c.ma30.toFixed(1)}% | z-score ${c.zScore.toFixed(2)} | ${c.exchange === "upbit" ? "업비트" : "빗썸"}`,
      data_snapshot: {
        premium_percent: c.premiumPercent,
        ma_30d: c.ma30,
        stddev_30d: c.stddev,
        z_score: c.zScore,
        price_krw: c.priceKrw,
        price_usd: c.priceUsd,
        exchange_rate: exchangeRate,
        exchange: c.exchange,
      },
      historical_pattern: pattern ?? undefined,
      source: "cron/detect-kimchi",
      price_at_signal: c.priceKrw,
    });

    if (id) {
      await applyMultiTypeBonus(admin, c.symbol, id, "kimchi");
      detected++;
    }
  }

  console.log(TAG, `${detected} kimchi signals from ${candidates.length} candidates`);
  return { detected };
}
