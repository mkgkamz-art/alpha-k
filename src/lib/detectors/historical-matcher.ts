/**
 * Historical pattern matching engine.
 *
 * 90일 내 동일 타입 + 유사 점수(±10) 시그널 조회 후
 * radar_signal_results JOIN으로 가격 변동 통계 반환.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type RadarSignalTypeEnum = Database["public"]["Enums"]["radar_signal_type"];

export interface HistoricalPattern {
  /** 유사 시그널 발생 횟수 */
  similar_occurrences: number;
  /** 1시간 후 수익 확률 (0-1) */
  profit_probability_1h: number;
  /** 1시간 평균 수익률 (%) */
  avg_return_1h: number;
  /** 24시간 평균 수익률 (%) */
  avg_return_24h: number;
  /** 최대 수익률 (%) */
  max_return_24h: number;
  /** 최소 수익률 (%) */
  min_return_24h: number;
  /** Index signature for Record<string, unknown> 호환 */
  [key: string]: unknown;
}

const MIN_SAMPLES = 10;
const LOOKBACK_DAYS = 90;
const SCORE_RANGE = 10;

/**
 * 과거 유사 패턴 매칭.
 *
 * @returns HistoricalPattern or null (10건 미만이면 의미 없음)
 */
export async function matchHistoricalPattern(
  admin: SupabaseClient<Database>,
  signalType: RadarSignalTypeEnum,
  score: number,
  symbol?: string,
): Promise<HistoricalPattern | null> {
  const ninetyDaysAgo = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60_000,
  ).toISOString();

  // Step 1: 동일 타입 + 유사 점수(±10) 시그널 ID 조회
  let query = admin
    .from("radar_signals")
    .select("id")
    .eq("signal_type", signalType)
    .gte("score", score - SCORE_RANGE)
    .lte("score", score + SCORE_RANGE)
    .gte("created_at", ninetyDaysAgo);

  // 심볼 필터 (선택적 — 범용 패턴 vs 코인별 패턴)
  if (symbol) {
    query = query.eq("token_symbol", symbol);
  }

  const { data: signals } = await query.limit(500);

  if (!signals || signals.length < MIN_SAMPLES) {
    // 코인별 데이터 부족 시 범용 패턴으로 fallback
    if (symbol) {
      return matchHistoricalPattern(admin, signalType, score);
    }
    return null;
  }

  const signalIds = signals.map((s) => s.id);

  // Step 2: radar_signal_results에서 가격 변동 통계
  const { data: results } = await admin
    .from("radar_signal_results")
    .select("is_hit, price_change_1h, price_change_24h")
    .in("signal_id", signalIds);

  if (!results || results.length < MIN_SAMPLES) return null;

  // Step 3: 통계 계산
  const validResults = results.filter(
    (r) => r.price_change_24h != null,
  );

  if (validResults.length < MIN_SAMPLES) return null;

  const hits1h = validResults.filter(
    (r) => r.price_change_1h != null && r.price_change_1h > 0,
  ).length;

  const returns1h = validResults
    .filter((r) => r.price_change_1h != null)
    .map((r) => r.price_change_1h!);

  const returns24h = validResults.map((r) => r.price_change_24h!);

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  return {
    similar_occurrences: validResults.length,
    profit_probability_1h:
      returns1h.length > 0
        ? Math.round((hits1h / returns1h.length) * 100) / 100
        : 0,
    avg_return_1h: Math.round(avg(returns1h) * 100) / 100,
    avg_return_24h: Math.round(avg(returns24h) * 100) / 100,
    max_return_24h: Math.round(Math.max(...returns24h) * 100) / 100,
    min_return_24h: Math.round(Math.min(...returns24h) * 100) / 100,
  };
}
