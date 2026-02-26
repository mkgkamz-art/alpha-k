/**
 * Signal deduplication + multi-type bonus.
 *
 * - findRecentSignal(): 5분 내 동일 타입+심볼 시그널 조회
 * - upsertRadarSignal(): 중복 → 높은 점수 유지, 없으면 INSERT
 * - applyMultiTypeBonus(): 5분 내 다른 타입 시그널 → +10점 보너스
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { insertRadarSignal, type RadarSignalPayload } from "@/lib/radar-scoring";
import { dispatchRadarNotification } from "@/lib/telegram/radar-notifier";

type RadarRow = Database["public"]["Tables"]["radar_signals"]["Row"];
type RadarSignalTypeEnum = Database["public"]["Enums"]["radar_signal_type"];

/**
 * 5분 내 동일 signal_type + token_symbol 시그널 조회.
 * 가장 최근 것 1건만 반환.
 */
export async function findRecentSignal(
  admin: SupabaseClient<Database>,
  symbol: string,
  signalType: RadarSignalTypeEnum,
  withinMinutes = 60,
): Promise<RadarRow | null> {
  const since = new Date(
    Date.now() - withinMinutes * 60 * 1000,
  ).toISOString();

  const { data } = await admin
    .from("radar_signals")
    .select("*")
    .eq("token_symbol", symbol)
    .eq("signal_type", signalType)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Upsert radar signal with dedup logic:
 * - 5분 내 동일 타입+심볼 존재 → 점수가 높으면 UPDATE, 아니면 skip
 * - 없으면 INSERT
 *
 * Returns: inserted/updated signal id or null
 */
export async function upsertRadarSignal(
  admin: SupabaseClient<Database>,
  payload: RadarSignalPayload,
): Promise<{ id: string | null; isNew: boolean }> {
  const existing = await findRecentSignal(
    admin,
    payload.token_symbol,
    payload.signal_type,
  );

  // 기존 시그널이 있고 점수가 더 높거나 같으면 skip
  if (existing && existing.score >= payload.score) {
    return { id: existing.id, isNew: false };
  }

  // 기존 시그널이 있지만 새 점수가 더 높으면 UPDATE
  if (existing) {
    const { error } = await admin
      .from("radar_signals")
      .update({
        score: payload.score,
        strength: payload.strength,
        title: payload.title,
        description: payload.description ?? null,
        data_snapshot: (payload.data_snapshot ?? {}) as unknown as Database["public"]["Tables"]["radar_signals"]["Update"]["data_snapshot"],
        historical_pattern: (payload.historical_pattern ?? {}) as unknown as Database["public"]["Tables"]["radar_signals"]["Update"]["historical_pattern"],
        price_at_signal: payload.price_at_signal ?? null,
      })
      .eq("id", existing.id);

    if (error) {
      console.error("[dedup] Update failed:", error.message);
      return { id: null, isNew: false };
    }

    return { id: existing.id, isNew: false };
  }

  // 새 시그널 INSERT
  const { id, error } = await insertRadarSignal(admin, payload);
  if (error) return { id: null, isNew: true };

  // Fire-and-forget: 텔레그램 알림 발송 (cron 응답 지연 방지)
  if (id) {
    dispatchRadarNotification(admin, id, payload).catch((err) =>
      console.error("[dedup] Notification error:", err),
    );
  }

  return { id, isNew: true };
}

/**
 * 5분 내 다른 타입의 시그널이 있으면 양쪽 모두 +10점 보너스.
 * 한 코인에 surge + kimchi 동시 발생 시 신뢰도 UP.
 */
export async function applyMultiTypeBonus(
  admin: SupabaseClient<Database>,
  symbol: string,
  currentSignalId: string,
  currentSignalType: RadarSignalTypeEnum,
): Promise<number> {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // 5분 내 동일 심볼, 다른 타입 시그널 조회
  const { data: others } = await admin
    .from("radar_signals")
    .select("id, score")
    .eq("token_symbol", symbol)
    .neq("signal_type", currentSignalType)
    .neq("id", currentSignalId)
    .gte("created_at", fiveMinAgo);

  if (!others || others.length === 0) return 0;

  let bonusApplied = 0;

  // 다른 시그널들에 +10 보너스 적용
  for (const other of others) {
    const newScore = Math.min(100, other.score + 10);
    if (newScore !== other.score) {
      await admin
        .from("radar_signals")
        .update({ score: newScore })
        .eq("id", other.id);
      bonusApplied++;
    }
  }

  // 현재 시그널에도 +10 보너스 적용
  const { data: current } = await admin
    .from("radar_signals")
    .select("score")
    .eq("id", currentSignalId)
    .single();

  if (current) {
    const boosted = Math.min(100, current.score + 10);
    if (boosted !== current.score) {
      await admin
        .from("radar_signals")
        .update({ score: boosted })
        .eq("id", currentSignalId);
      bonusApplied++;
    }
  }

  return bonusApplied;
}
