/**
 * GET /api/chirashi — 버즈 피드 (buzz 시그널 전용)
 *
 * Query params:
 *   coin   — 코인 심볼 필터 (e.g., BTC)
 *   limit  — page size, default 20
 *   cursor — ISO timestamp cursor for pagination
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withCache } from "@/lib/api-error-handler";
import { getAccess, effectiveTier } from "@/lib/subscription";
import type { SubscriptionTier } from "@/types";

const FREE_BUZZ_LIMIT = 3;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coin = url.searchParams.get("coin");
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20);
    const cursor = url.searchParams.get("cursor");

    // Session auth → tier
    let tier: SubscriptionTier = "free";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

    const eTier = effectiveTier(tier);
    const access = getAccess("radar", tier);
    const maxSignals = eTier === "free" ? FREE_BUZZ_LIMIT : (access as { maxSignals: number }).maxSignals;

    const admin = createAdminClient();
    let query = admin
      .from("radar_signals")
      .select("*")
      .eq("signal_type", "buzz")
      .gt("expires_at", new Date().toISOString())
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (coin) {
      query = query.eq("token_symbol", coin.toUpperCase());
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: signals, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = signals ?? [];
    const hasMore = items.length === limit;
    const nextCursor = items.length > 0 ? items[items.length - 1].created_at : null;

    const visibleCount = Math.min(items.length, maxSignals === Infinity ? items.length : maxSignals);
    const visibleItems = items.slice(0, visibleCount);
    const lockedCount = items.length - visibleCount;

    const res = NextResponse.json({
      signals: visibleItems,
      lockedCount,
      hasMore,
      nextCursor,
      tier,
    });

    return withCache(res, 30);
  } catch (err) {
    console.error("[chirashi] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
