/**
 * GET /api/v1/whale/:id — 고래 상세
 *
 * Free: 상위 3 고래만 접근, portfolio 24h 딜레이, trades 3건
 * Pro: 전체 접근, 실시간, trades 20건
 * Whale: Pro + address 전체 공개
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";
import {
  FREE_WHALE_LIMIT,
  serializeWhaleDetail,
} from "@/lib/whale-api";

export const GET = withApiKeyAuth("v1-whale-detail", async (req, ctx) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const whaleId = segments[segments.length - 1];

  if (!whaleId || whaleId.length < 10) {
    return NextResponse.json(
      { error: "Invalid whale ID" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Fetch whale
  const { data: whale, error } = await admin
    .from("whales")
    .select("*")
    .eq("id", whaleId)
    .single();

  if (error || !whale) {
    return NextResponse.json(
      { error: "Whale not found" },
      { status: 404 },
    );
  }

  // Free tier: check if this whale is in top 3 by return_30d_pct
  if (ctx.tier === "free") {
    const { count } = await admin
      .from("whales")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gt("return_30d_pct", whale.return_30d_pct);

    const rank = count ?? 0;
    if (rank >= FREE_WHALE_LIMIT) {
      return NextResponse.json(
        {
          error: "Upgrade to Pro to access this whale profile",
          upgrade_url: "/billing",
        },
        { status: 403 },
      );
    }
  }

  // Fetch portfolio
  const { data: portfolio } = await admin
    .from("whale_portfolios")
    .select("*")
    .eq("whale_id", whaleId)
    .order("weight_pct", { ascending: false });

  // Fetch recent trades (Free: 3, Pro/Whale: 20)
  const tradeLimit = ctx.tier === "free" ? 3 : 20;
  const { data: trades } = await admin
    .from("whale_trades")
    .select("*")
    .eq("whale_id", whaleId)
    .order("created_at", { ascending: false })
    .limit(tradeLimit);

  // Check follow status
  const { data: follow } = await admin
    .from("whale_follows")
    .select("id")
    .eq("user_id", ctx.userId)
    .eq("whale_id", whaleId)
    .maybeSingle();

  const serialized = serializeWhaleDetail(
    whale,
    ctx.tier,
    portfolio ?? [],
    trades ?? [],
    !!follow,
  );

  return NextResponse.json({
    data: serialized,
    meta: { tier: ctx.tier },
  });
});
