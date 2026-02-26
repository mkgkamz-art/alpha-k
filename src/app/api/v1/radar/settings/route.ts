/**
 * GET/PUT /api/v1/radar/settings — 사용자 레이더 설정
 *
 * GET:  현재 설정 반환 (없으면 기본값)
 * PUT:  설정 업데이트 (enabled_signal_types, min_score_alert 등)
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";

const DEFAULT_SETTINGS = {
  signal_types: ["surge", "kimchi", "listing", "signal", "context", "volume", "orderbook", "buzz", "onchain"],
  min_score_alert: 70,
  notify_telegram: true,
  notify_in_app: true,
};

const VALID_SIGNAL_TYPES = new Set([
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

export const GET = withApiKeyAuth(
  "v1-radar-settings-get",
  async (_req, ctx) => {
    const admin = createAdminClient();

    const { data } = await admin
      .from("user_radar_settings")
      .select("*")
      .eq("user_id", ctx.userId)
      .single();

    return NextResponse.json({
      data: data ?? { ...DEFAULT_SETTINGS, user_id: ctx.userId },
      meta: { tier: ctx.tier },
    });
  },
);

export const PUT = withApiKeyAuth(
  "v1-radar-settings-put",
  async (req, ctx) => {
    const body = (await req.json()) as {
      enabled_signal_types?: string[];
      min_score_alert?: number;
      notify_telegram?: boolean;
      notify_in_app?: boolean;
    };

    // 유효성 검증
    const signalTypes = body.enabled_signal_types
      ? body.enabled_signal_types.filter((t) => VALID_SIGNAL_TYPES.has(t))
      : undefined;

    const minScore =
      body.min_score_alert != null
        ? Math.max(0, Math.min(100, body.min_score_alert))
        : undefined;

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("user_radar_settings")
      .upsert(
        {
          user_id: ctx.userId,
          signal_types:
            signalTypes ?? DEFAULT_SETTINGS.signal_types,
          min_score_alert:
            minScore ?? DEFAULT_SETTINGS.min_score_alert,
          notify_telegram:
            body.notify_telegram ?? DEFAULT_SETTINGS.notify_telegram,
          notify_in_app:
            body.notify_in_app ?? DEFAULT_SETTINGS.notify_in_app,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      meta: { tier: ctx.tier },
    });
  },
);
