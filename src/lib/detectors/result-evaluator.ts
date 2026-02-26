/**
 * Result Evaluator — 시그널 적중률 평가기
 *
 * radar_signals WHERE status='active' AND created_at < 1시간 전
 * → 현재 가격 조회 → 적중 판단 → INSERT radar_signal_results
 * → UPDATE radar_signals.status = 'confirmed' | 'failed'
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

const TAG = "[result-evaluator]";
const HIT_THRESHOLD_PERCENT = 5; // 5% 이상 상승 = 적중
const EVALUATION_DELAY_MS = 60 * 60 * 1000; // 1시간 후 평가

/**
 * 메인: 활성 시그널 평가 + 결과 기록
 */
export async function evaluateSignalResults(
  admin: SupabaseClient<Database>,
): Promise<{ evaluated: number; hits: number; misses: number }> {
  const cutoff = new Date(
    Date.now() - EVALUATION_DELAY_MS,
  ).toISOString();

  // 1. 평가 대상: status='active', 1시간+ 경과, price_at_signal 있는 것
  const { data: signals } = await admin
    .from("radar_signals")
    .select("id, token_symbol, score, signal_type, price_at_signal, created_at")
    .eq("status", "active")
    .not("price_at_signal", "is", null)
    .lte("created_at", cutoff)
    .limit(100);

  if (!signals || signals.length === 0) {
    return { evaluated: 0, hits: 0, misses: 0 };
  }

  // 2. 현재 가격 조회 (korean_prices 최신 or token_prices)
  const symbols = [...new Set(signals.map((s) => s.token_symbol))];

  const priceMap = new Map<string, number>();

  // korean_prices에서 최신 가격
  for (const symbol of symbols) {
    const { data: price } = await admin
      .from("korean_prices")
      .select("price_krw")
      .eq("symbol", symbol)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    if (price?.price_krw) {
      priceMap.set(symbol, price.price_krw);
      continue;
    }

    // fallback: token_prices
    const { data: tokenPrice } = await admin
      .from("token_prices")
      .select("current_price")
      .eq("symbol", symbol)
      .single();

    if (tokenPrice?.current_price) {
      priceMap.set(symbol, tokenPrice.current_price);
    }
  }

  // 3. 각 시그널 평가
  let hits = 0;
  let misses = 0;

  for (const signal of signals) {
    const currentPrice = priceMap.get(signal.token_symbol);
    if (!currentPrice || !signal.price_at_signal) {
      // 가격 정보 없으면 skip (다음 평가에서 재시도)
      continue;
    }

    const priceAtSignal = Number(signal.price_at_signal);
    if (priceAtSignal <= 0) continue;

    const priceChange1h =
      ((currentPrice - priceAtSignal) / priceAtSignal) * 100;
    const isHit = priceChange1h >= HIT_THRESHOLD_PERCENT;
    const newStatus = isHit ? "confirmed" : "failed";

    // INSERT radar_signal_results
    const { error: insertErr } = await admin
      .from("radar_signal_results")
      .insert({
        signal_id: signal.id,
        is_hit: isHit,
        price_at_signal: priceAtSignal,
        price_at_evaluation: currentPrice,
        price_change_1h: Math.round(priceChange1h * 100) / 100,
        price_change_24h: Math.round(priceChange1h * 100) / 100, // 1h 기준 (24h는 별도 cron)
        evaluated_at: new Date().toISOString(),
      } as unknown as Database["public"]["Tables"]["radar_signal_results"]["Insert"]);

    if (insertErr) {
      console.error(TAG, `Result insert failed for ${signal.id}:`, insertErr.message);
      continue;
    }

    // UPDATE radar_signals.status
    await admin
      .from("radar_signals")
      .update({ status: newStatus })
      .eq("id", signal.id);

    if (isHit) hits++;
    else misses++;
  }

  const evaluated = hits + misses;
  console.log(
    TAG,
    `Evaluated ${evaluated}/${signals.length} | Hits: ${hits} | Misses: ${misses} | Hit rate: ${evaluated > 0 ? Math.round((hits / evaluated) * 100) : 0}%`,
  );

  return { evaluated, hits, misses };
}
