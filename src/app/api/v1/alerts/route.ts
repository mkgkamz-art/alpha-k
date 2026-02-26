/**
 * GET /api/v1/alerts — 외부 API 키 인증 예시 엔드포인트
 * 유저의 최근 alert_events 50건 반환
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";

export const GET = withApiKeyAuth("v1-alerts", async (_req, ctx) => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("alert_events")
    .select("id, type, severity, title, description, metadata, created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: {
      tier: ctx.tier,
      count: data?.length ?? 0,
    },
  });
});
