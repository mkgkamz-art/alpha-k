/**
 * GET /api/v1/radar/signals — 시그널 목록 조회
 *
 * Query:
 *   type       — 콤마 구분 (예: "surge,kimchi")
 *   min_score  — 최소 점수 (기본 0)
 *   status     — "active" (기본) | "all"
 *   limit      — 페이지 크기 (기본 20, 최대 100)
 *   cursor     — 커서 기반 페이지네이션
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";
import { withCache } from "@/lib/api-error-handler";
import {
  serializeSignal,
  getDailyViewCount,
  FREE_DAILY_VIEW_LIMIT,
} from "@/lib/radar-api";
import type { Database } from "@/types/database.types";

type RadarSignalTypeDb = Database["public"]["Enums"]["radar_signal_type"];

const VALID_TYPES = new Set<string>([
  "surge",
  "kimchi",
  "listing",
  "signal",
  "context",
  "volume",
  "orderbook",
  "buzz",
  "onchain",
]);

export const GET = withApiKeyAuth("v1-radar-signals", async (req, ctx) => {
  const url = new URL(req.url);

  // Parse query params
  const typesParam = url.searchParams.get("type");
  const minScore =
    Math.max(
      0,
      parseInt(url.searchParams.get("min_score") ?? "0", 10) || 0,
    );
  const status = url.searchParams.get("status") ?? "active";
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20),
  );
  const cursor = url.searchParams.get("cursor");

  const types = typesParam
    ? typesParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => VALID_TYPES.has(t))
    : [];

  const admin = createAdminClient();

  // Free 유저 일일 열람 수 조회
  let dailyViewCount = 0;
  if (ctx.tier === "free") {
    dailyViewCount = await getDailyViewCount(admin, ctx.userId);
  }

  // Build query
  let query = admin
    .from("radar_signals")
    .select("*")
    .gte("score", minScore)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status === "active") {
    query = query.gt("expires_at", new Date().toISOString());
  }

  if (types.length > 0) {
    query = query.in("signal_type", types as RadarSignalTypeDb[]);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: signals, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 },
    );
  }

  // 전체 active 시그널 수 (meta용)
  const { count: totalActive } = await admin
    .from("radar_signals")
    .select("*", { count: "exact", head: true })
    .gt("expires_at", new Date().toISOString());

  // 30일 적중률 (meta용)
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60_000,
  ).toISOString();
  const { data: results30d } = await admin
    .from("radar_signal_results")
    .select("is_hit")
    .gte("evaluated_at", thirtyDaysAgo);

  const total30d = results30d?.length ?? 0;
  const hits30d = results30d?.filter((r) => r.is_hit).length ?? 0;
  const hitRate30d = total30d > 0 ? Math.round((hits30d / total30d) * 100) / 100 : 0;

  const items = (signals ?? []).map((row) =>
    serializeSignal(row, ctx.tier, dailyViewCount),
  );
  const hasMore = items.length === limit;
  const nextCursor =
    items.length > 0 ? items[items.length - 1].created_at : null;

  const res = NextResponse.json({
    signals: items,
    next_cursor: nextCursor,
    meta: {
      total_active: totalActive ?? 0,
      hit_rate_30d: hitRate30d,
      tier: ctx.tier,
      count: items.length,
      has_more: hasMore,
      ...(ctx.tier === "free" && {
        daily_views_used: dailyViewCount,
        daily_views_limit: FREE_DAILY_VIEW_LIMIT,
      }),
    },
  });

  return withCache(res, 15);
});
