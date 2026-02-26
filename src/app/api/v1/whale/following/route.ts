/**
 * GET /api/v1/whale/following — 내가 팔로우한 고래 목록
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";
import { serializeWhaleRanking } from "@/lib/whale-api";

export const GET = withApiKeyAuth("v1-whale-following", async (_req, ctx) => {
  const admin = createAdminClient();

  // Get user's follows
  const { data: follows, error } = await admin
    .from("whale_follows")
    .select("whale_id, alert_telegram, alert_push, created_at")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch following list" },
      { status: 500 },
    );
  }

  if (!follows || follows.length === 0) {
    return NextResponse.json({
      whales: [],
      meta: { tier: ctx.tier, count: 0 },
    });
  }

  const whaleIds = follows.map((f) => f.whale_id);

  // Fetch whale profiles
  const { data: whales } = await admin
    .from("whales")
    .select("*")
    .in("id", whaleIds);

  const whaleMap = new Map(
    (whales ?? []).map((w) => [w.id, w]),
  );

  // Serialize with follow metadata
  const items = follows
    .map((f) => {
      const whale = whaleMap.get(f.whale_id);
      if (!whale) return null;

      return {
        ...serializeWhaleRanking(whale, ctx.tier, 0),
        alert_telegram: f.alert_telegram,
        alert_push: f.alert_push,
        followed_at: f.created_at,
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    whales: items,
    meta: {
      tier: ctx.tier,
      count: items.length,
    },
  });
});
