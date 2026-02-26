/**
 * Volume Detector — 체결량 폭증 감지기
 *
 * 데이터소스: korean_prices (최근 5분 vs 1시간 평균)
 * + Upbit orderbook (매수/매도 비율)
 *
 * Score ≥ 50 → radar_signals INSERT
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getUpbitOrderbook } from "@/lib/exchanges/upbit";
import { calculateRadarScore } from "@/lib/radar-scoring";
import { upsertRadarSignal, applyMultiTypeBonus } from "./dedup";
import { matchHistoricalPattern } from "./historical-matcher";

const MIN_SCORE = 50;
const TAG = "[volume-detector]";

interface VolumeCandidate {
  symbol: string;
  exchange: string;
  currentVolume: number;
  avgVolume: number;
  volumeChangeRatio: number;
  priceChangePercent: number;
  currentPrice: number;
}

/**
 * korean_prices에서 최근 체결량 vs 1시간 평균 비교.
 * volume_24h 필드를 5분 단위 스냅샷으로 활용.
 */
async function findVolumeSurges(
  admin: SupabaseClient<Database>,
): Promise<VolumeCandidate[]> {
  const now = Date.now();
  const fiveMinAgo = new Date(now - 5 * 60_000).toISOString();
  const oneHourAgo = new Date(now - 60 * 60_000).toISOString();

  // 최근 5분 가격 데이터
  const { data: recentPrices } = await admin
    .from("korean_prices")
    .select("symbol, exchange, volume_24h, change_24h, price_krw")
    .gte("fetched_at", fiveMinAgo)
    .order("fetched_at", { ascending: false });

  if (!recentPrices || recentPrices.length === 0) return [];

  // 심볼별 최신 데이터만 추출
  const latestMap = new Map<string, typeof recentPrices[0]>();
  for (const p of recentPrices) {
    const key = `${p.symbol}-${p.exchange}`;
    if (!latestMap.has(key)) latestMap.set(key, p);
  }

  // 1시간 전 데이터 (평균 볼륨 계산용)
  const { data: hourPrices } = await admin
    .from("korean_prices")
    .select("symbol, exchange, volume_24h")
    .gte("fetched_at", oneHourAgo)
    .lt("fetched_at", fiveMinAgo);

  // 심볼별 평균 볼륨 계산
  const avgVolumeMap = new Map<string, { sum: number; count: number }>();
  for (const p of hourPrices ?? []) {
    if (!p.volume_24h) continue;
    const key = `${p.symbol}-${p.exchange}`;
    const entry = avgVolumeMap.get(key) ?? { sum: 0, count: 0 };
    entry.sum += p.volume_24h;
    entry.count++;
    avgVolumeMap.set(key, entry);
  }

  const candidates: VolumeCandidate[] = [];

  for (const [key, latest] of latestMap) {
    const avgEntry = avgVolumeMap.get(key);
    if (!avgEntry || avgEntry.count < 2 || !latest.volume_24h) continue;

    const avgVolume = avgEntry.sum / avgEntry.count;
    if (avgVolume <= 0) continue;

    const ratio = latest.volume_24h / avgVolume;

    // 거래량이 평균의 2배 이상이면 후보
    if (ratio >= 2) {
      candidates.push({
        symbol: latest.symbol,
        exchange: latest.exchange,
        currentVolume: latest.volume_24h,
        avgVolume,
        volumeChangeRatio: ratio,
        priceChangePercent: latest.change_24h ?? 0,
        currentPrice: latest.price_krw ?? 0,
      });
    }
  }

  return candidates.sort((a, b) => b.volumeChangeRatio - a.volumeChangeRatio);
}

/**
 * Upbit orderbook에서 매수/매도 비율 조회.
 */
async function getBuyRatios(
  symbols: string[],
): Promise<Map<string, number>> {
  const ratioMap = new Map<string, number>();
  if (symbols.length === 0) return ratioMap;

  const markets = symbols.map((s) => `KRW-${s}`);

  try {
    const orderbooks = await getUpbitOrderbook(markets);
    for (const ob of orderbooks) {
      const sym = ob.market.replace("KRW-", "");
      const totalBid = ob.total_bid_size;
      const totalAsk = ob.total_ask_size;
      const total = totalBid + totalAsk;
      ratioMap.set(sym, total > 0 ? totalBid / total : 0.5);
    }
  } catch (err) {
    console.warn(TAG, "Orderbook fetch error:", err);
  }

  return ratioMap;
}

/**
 * 메인: 체결량 폭증 감지 + 시그널 생성
 */
export async function detectVolumeSurges(
  admin: SupabaseClient<Database>,
): Promise<{ detected: number }> {
  const candidates = await findVolumeSurges(admin);
  if (candidates.length === 0) return { detected: 0 };

  // 상위 20개만 처리 (API rate limit 고려)
  const top = candidates.slice(0, 20);
  const symbols = [...new Set(top.filter((c) => c.exchange === "upbit").map((c) => c.symbol))];
  const buyRatios = await getBuyRatios(symbols);

  let detected = 0;

  for (const c of top) {
    const buyRatio = buyRatios.get(c.symbol) ?? 0.5;

    const { score, strength } = calculateRadarScore({
      type: "volume",
      data: {
        volumeChangeRatio: c.volumeChangeRatio,
        buyRatio,
        priceChangePercent: c.priceChangePercent,
      },
    });

    if (score < MIN_SCORE) continue;

    // 과거 패턴 매칭
    const pattern = await matchHistoricalPattern(
      admin,
      "volume",
      score,
      c.symbol,
    );

    const direction = c.priceChangePercent > 0 ? "📈" : c.priceChangePercent < 0 ? "📉" : "";
    const buyPct = Math.round(buyRatio * 100);

    const { id } = await upsertRadarSignal(admin, {
      signal_type: "volume",
      token_symbol: c.symbol,
      score,
      strength,
      title: `${c.symbol} 거래량 ${c.volumeChangeRatio.toFixed(1)}배 폭증 ${direction}`,
      description: `${c.exchange === "upbit" ? "업비트" : "빗썸"} 기준 평균 대비 ${c.volumeChangeRatio.toFixed(1)}배 | 매수비 ${buyPct}%`,
      data_snapshot: {
        volume_change_ratio: c.volumeChangeRatio,
        buy_ratio: buyRatio,
        price_change_percent: c.priceChangePercent,
        current_volume: c.currentVolume,
        avg_volume: c.avgVolume,
        exchange: c.exchange,
      },
      historical_pattern: pattern ?? undefined,
      source: "cron/detect-volume",
      price_at_signal: c.currentPrice || undefined,
    });

    if (id) {
      await applyMultiTypeBonus(admin, c.symbol, id, "volume");
      detected++;
    }
  }

  console.log(TAG, `${detected} volume signals from ${candidates.length} candidates`);
  return { detected };
}
