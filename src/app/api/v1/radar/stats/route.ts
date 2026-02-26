/**
 * GET /api/v1/radar/stats — 시그널 통계
 *
 * Response:
 *   hit_rate_7d, hit_rate_30d, total_signals_today,
 *   top_signal_today, avg_return_on_hit
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";
import { withCache } from "@/lib/api-error-handler";
import { serializeSignal } from "@/lib/radar-api";

export const GET = withApiKeyAuth("v1-radar-stats", async (_req, ctx) => {
  const admin = createAdminClient();
  const now = new Date();

  // 오늘 시작 (UTC)
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  // 7일 적중률
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60_000,
  ).toISOString();
  const { data: results7d } = await admin
    .from("radar_signal_results")
    .select("is_hit")
    .gte("evaluated_at", sevenDaysAgo);

  const total7d = results7d?.length ?? 0;
  const hits7d = results7d?.filter((r) => r.is_hit).length ?? 0;
  const hitRate7d =
    total7d > 0 ? Math.round((hits7d / total7d) * 100) / 100 : 0;

  // 30일 적중률
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60_000,
  ).toISOString();
  const { data: results30d } = await admin
    .from("radar_signal_results")
    .select("is_hit")
    .gte("evaluated_at", thirtyDaysAgo);

  const total30d = results30d?.length ?? 0;
  const hits30d = results30d?.filter((r) => r.is_hit).length ?? 0;
  const hitRate30d =
    total30d > 0 ? Math.round((hits30d / total30d) * 100) / 100 : 0;

  // 오늘 시그널 수
  const { count: totalToday } = await admin
    .from("radar_signals")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayIso);

  // 오늘 최고 시그널
  const { data: topRows } = await admin
    .from("radar_signals")
    .select("*")
    .gte("created_at", todayIso)
    .order("score", { ascending: false })
    .limit(1);

  const topSignal =
    topRows && topRows.length > 0
      ? serializeSignal(topRows[0], ctx.tier, 0)
      : null;

  // 적중 시그널 평균 수익률 (30일, price_change_24h 기준)
  const { data: hitResults } = await admin
    .from("radar_signal_results")
    .select("price_change_24h")
    .eq("is_hit", true)
    .gte("evaluated_at", thirtyDaysAgo)
    .not("price_change_24h", "is", null);

  const avgReturn =
    hitResults && hitResults.length > 0
      ? Math.round(
          (hitResults.reduce(
            (sum, r) => sum + (r.price_change_24h ?? 0),
            0,
          ) /
            hitResults.length) *
            100,
        ) / 100
      : 0;

  const res = NextResponse.json({
    data: {
      hit_rate_7d: hitRate7d,
      hit_rate_30d: hitRate30d,
      total_signals_today: totalToday ?? 0,
      top_signal_today: topSignal,
      avg_return_on_hit: avgReturn,
    },
    meta: { tier: ctx.tier },
  });

  // 5분 캐시 (통계 데이터는 자주 변하지 않음)
  return withCache(res, 300);
});
