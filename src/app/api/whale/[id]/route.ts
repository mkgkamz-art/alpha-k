/**
 * GET /api/whale/:id — 고래 상세 (내부 세션 인증)
 *
 * Free: 상위 3 고래만 접근, portfolio 24h 딜레이, trades 3건
 * Pro: 전체 접근, 실시간, trades 20건
 * Whale: Pro + address 전체 공개
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FREE_WHALE_LIMIT,
  serializeWhaleDetail,
} from "@/lib/whale-api";
import type { SubscriptionTier } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: whaleId } = await params;

    if (!whaleId || whaleId.length < 10) {
      return NextResponse.json(
        { error: "Invalid whale ID" },
        { status: 400 },
      );
    }

    // Session auth → tier + userId
    let tier: SubscriptionTier = "free";
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const { data: userData } = await supabase
          .from("users")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();
        tier = (userData?.subscription_tier as SubscriptionTier) ?? "free";
      }
    } catch {
      // free
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

    // Free tier: rank check
    if (tier === "free") {
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

    // Fetch recent trades
    const tradeLimit = tier === "free" ? 3 : 20;
    const { data: trades } = await admin
      .from("whale_trades")
      .select("*")
      .eq("whale_id", whaleId)
      .order("created_at", { ascending: false })
      .limit(tradeLimit);

    // Check follow status
    let isFollowed = false;
    if (userId) {
      const { data: follow } = await admin
        .from("whale_follows")
        .select("id")
        .eq("user_id", userId)
        .eq("whale_id", whaleId)
        .maybeSingle();
      isFollowed = !!follow;
    }

    const serialized = serializeWhaleDetail(
      whale,
      tier,
      portfolio ?? [],
      trades ?? [],
      isFollowed,
    );

    return NextResponse.json({
      data: serialized,
      meta: { tier },
    });
  } catch (err) {
    console.error("[whale/detail] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
