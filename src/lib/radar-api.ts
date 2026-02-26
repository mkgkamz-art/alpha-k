/**
 * Radar v1 API shared utilities.
 *
 * - serializeSignal(): DB row → API response (field renaming, computed fields)
 * - isWithinDelay(): 5분 딜레이 윈도우 체크
 * - getDailyViewCount(): Free 유저 일일 열람 수 조회
 * - recordView(): 열람 기록 upsert
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { SubscriptionTier, RadarSignalV1Response } from "@/types";

type RadarRow = Database["public"]["Tables"]["radar_signals"]["Row"];

export const FREE_DELAY_MS = 5 * 60 * 1000; // 5분
export const FREE_DAILY_VIEW_LIMIT = 5;

/** 시그널이 5분 이내에 생성되었는지 확인 */
export function isWithinDelay(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < FREE_DELAY_MS;
}

/** data_snapshot에서 exchange 필드 추출 */
function extractExchange(snapshot: unknown): string | null {
  if (
    snapshot &&
    typeof snapshot === "object" &&
    "exchange" in (snapshot as Record<string, unknown>)
  ) {
    return String((snapshot as Record<string, unknown>).exchange);
  }
  return null;
}

/** DB row → v1 API 응답 변환 (필드 매핑 + 접근 제어) */
export function serializeSignal(
  row: RadarRow,
  tier: SubscriptionTier,
  dailyViewCount: number,
): RadarSignalV1Response {
  const secondsAgo = Math.floor(
    (Date.now() - new Date(row.created_at).getTime()) / 1000,
  );
  const isProOnly = isWithinDelay(row.created_at);

  // Free 게이팅: 5분 딜레이 OR 일 열람 한도 초과
  const isGatedByDelay = tier === "free" && isProOnly;
  const isGatedByViewLimit =
    tier === "free" && dailyViewCount >= FREE_DAILY_VIEW_LIMIT;
  const isAccessible = !isGatedByDelay && !isGatedByViewLimit;

  return {
    id: row.id,
    signal_type: row.signal_type,
    coin_symbol: row.token_symbol,
    coin_name: row.token_name,
    exchange: extractExchange(row.data_snapshot),
    score: row.score,
    strength: row.strength,
    title: row.title,
    description: row.description,
    data_snapshot: isAccessible
      ? (row.data_snapshot as Record<string, unknown>)
      : null,
    historical_pattern: isAccessible
      ? (row.historical_pattern as Record<string, unknown>)
      : null,
    created_at: row.created_at,
    seconds_ago: Math.max(0, secondsAgo),
    is_pro_only: isProOnly,
    is_accessible: isAccessible,
  };
}

/** Free 유저의 오늘 열람 횟수 조회 */
export async function getDailyViewCount(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await admin
    .from("user_radar_views")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("viewed_date", today);
  return count ?? 0;
}

/** 열람 기록 upsert (같은 날 같은 시그널 중복 방지) */
export async function recordView(
  admin: SupabaseClient<Database>,
  userId: string,
  signalId: string,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await admin.from("user_radar_views").upsert(
    { user_id: userId, signal_id: signalId, viewed_date: today },
    { onConflict: "user_id,signal_id,viewed_date" },
  );
}
