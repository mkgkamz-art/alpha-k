/**
 * GET /api/v1/radar/signals/:id — 시그널 상세 조회
 *
 * - 기본 시그널 + data_snapshot 전체 + historical_pattern 전체
 * - 관련 코인 현재 시세 (가격, 24h 변동률, 거래량)
 * - 해당 코인 최근 24시간 시그널 이력
 *
 * Free: 5분 이내 시그널 차단, 일 5개 열람 제한
 * 열람 시 user_radar_views 카운트 +1
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";
import {
  serializeSignal,
  isWithinDelay,
  getDailyViewCount,
  recordView,
  FREE_DAILY_VIEW_LIMIT,
  FREE_DELAY_MS,
} from "@/lib/radar-api";

export const GET = withApiKeyAuth(
  "v1-radar-signal-detail",
  async (req, ctx) => {
    // URL pathname에서 signal ID 파싱
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const signalId = segments[segments.length - 1];

    if (!signalId || signalId.length < 10) {
      return NextResponse.json(
        { error: "Invalid signal ID" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // 시그널 조회
    const { data: signal, error } = await admin
      .from("radar_signals")
      .select("*")
      .eq("id", signalId)
      .single();

    if (error || !signal) {
      return NextResponse.json(
        { error: "Signal not found" },
        { status: 404 },
      );
    }

    // Free 티어 게이팅
    if (ctx.tier === "free") {
      // 5분 딜레이 체크
      if (isWithinDelay(signal.created_at)) {
        const remainMs =
          FREE_DELAY_MS - (Date.now() - new Date(signal.created_at).getTime());
        return NextResponse.json(
          {
            error:
              "This signal is available to Pro users only for the first 5 minutes",
            upgrade_url: "/billing",
            available_in_seconds: Math.ceil(remainMs / 1000),
          },
          { status: 403 },
        );
      }

      // 일일 열람 한도 체크
      const dailyViewCount = await getDailyViewCount(admin, ctx.userId);
      if (dailyViewCount >= FREE_DAILY_VIEW_LIMIT) {
        return NextResponse.json(
          {
            error: "Daily signal view limit reached. Upgrade to Pro for unlimited access.",
            limit: FREE_DAILY_VIEW_LIMIT,
            used: dailyViewCount,
            upgrade_url: "/billing",
          },
          { status: 403 },
        );
      }
    }

    // 열람 기록 upsert
    await recordView(admin, ctx.userId, signalId);

    // 현재 시세 조회 (token_prices 테이블)
    const { data: priceRow } = await admin
      .from("token_prices")
      .select("current_price, price_change_24h, total_volume")
      .eq("symbol", signal.token_symbol.toLowerCase())
      .single();

    // 관련 시그널 (같은 코인, 24시간 이내, 최대 5개)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const { data: relatedRows } = await admin
      .from("radar_signals")
      .select("*")
      .eq("token_symbol", signal.token_symbol)
      .neq("id", signalId)
      .gte("created_at", oneDayAgo)
      .order("score", { ascending: false })
      .limit(5);

    // 열람 후 view count (+1)
    const newDailyCount =
      ctx.tier === "free"
        ? (await getDailyViewCount(admin, ctx.userId))
        : 0;

    // 직렬화 (상세 페이지는 게이트 통과 후이므로 full access)
    const serialized = serializeSignal(signal, ctx.tier, 0);

    return NextResponse.json({
      data: {
        ...serialized,
        is_accessible: true,
        data_snapshot: signal.data_snapshot as Record<string, unknown>,
        historical_pattern: signal.historical_pattern as Record<
          string,
          unknown
        >,
        current_price: priceRow?.current_price ?? null,
        price_change_24h: priceRow?.price_change_24h ?? null,
        volume_24h: priceRow?.total_volume ?? null,
        related_signals: (relatedRows ?? []).map((r) =>
          serializeSignal(r, ctx.tier, newDailyCount),
        ),
      },
      meta: {
        tier: ctx.tier,
        ...(ctx.tier === "free" && {
          daily_views_used: newDailyCount,
          daily_views_limit: FREE_DAILY_VIEW_LIMIT,
        }),
      },
    });
  },
);
