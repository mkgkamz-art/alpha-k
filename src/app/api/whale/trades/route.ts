/**
 * GET /api/whale/trades — 고래 매매 피드 (내부 세션 인증)
 *
 * Query:
 *   coin_symbol   — 코인 필터
 *   trade_type    — buy | sell
 *   min_value_usd — 최소 금액
 *   whale_tier    — s, a, b, c
 *   limit         — 1~50 (기본 20)
 *   cursor        — ISO date 커서
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withCache } from "@/lib/api-error-handler";
import { FREE_TRADE_LIMIT, serializeTrade } from "@/lib/whale-api";
import type { SubscriptionTier } from "@/types";
import type { Database } from "@/types/database.types";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coinSymbol = url.searchParams.get("coin_symbol");
    const tradeType = url.searchParams.get("trade_type");
    const minValueUsd =
      parseInt(url.searchParams.get("min_value_usd") ?? "0", 10) || 0;
    const whaleTier = url.searchParams.get("whale_tier")?.toLowerCase();
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20),
    );
    const cursor = url.searchParams.get("cursor");

    // Session auth → tier
    let tier: SubscriptionTier = "free";
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

    const admin = createAdminClient();

    // Whale tier filter
    let whaleIdFilter: string[] | null = null;
    if (whaleTier && ["s", "a", "b", "c"].includes(whaleTier)) {
      const { data: tierWhales } = await admin
        .from("whales")
        .select("id")
        .eq("tier", whaleTier as Database["public"]["Enums"]["whale_tier"]);
      whaleIdFilter = (tierWhales ?? []).map((w) => w.id);
      if (whaleIdFilter.length === 0) {
        return NextResponse.json({
          trades: [],
          lockedCount: 0,
          next_cursor: null,
          meta: { tier, count: 0, has_more: false },
        });
      }
    }

    let query = admin
      .from("whale_trades")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (coinSymbol) {
      query = query.eq("coin_symbol", coinSymbol.toUpperCase());
    }
    if (tradeType === "buy" || tradeType === "sell") {
      query = query.eq(
        "trade_type",
        tradeType as Database["public"]["Enums"]["whale_trade_type"],
      );
    }
    if (minValueUsd > 0) {
      query = query.gte("value_usd", minValueUsd);
    }
    if (whaleIdFilter) {
      query = query.in("whale_id", whaleIdFilter);
    }
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: trades, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch whale trades" },
        { status: 500 },
      );
    }

    const allTrades = trades ?? [];
    const visibleTrades =
      tier === "free" ? allTrades.slice(0, FREE_TRADE_LIMIT) : allTrades;
    const lockedCount = allTrades.length - visibleTrades.length;

    // Batch fetch whale info
    const whaleIds = [...new Set(visibleTrades.map((t) => t.whale_id))];
    const { data: whales } =
      whaleIds.length > 0
        ? await admin.from("whales").select("*").in("id", whaleIds)
        : { data: [] };

    const whaleMap = new Map((whales ?? []).map((w) => [w.id, w]));

    const items = visibleTrades.map((t) =>
      serializeTrade(t, whaleMap.get(t.whale_id) ?? null),
    );

    const hasMore = allTrades.length === limit;
    const lastTrade =
      allTrades.length > 0 ? allTrades[allTrades.length - 1] : null;

    const res = NextResponse.json({
      trades: items,
      lockedCount,
      next_cursor: hasMore ? (lastTrade?.created_at ?? null) : null,
      meta: { tier, count: items.length, has_more: hasMore },
    });

    return withCache(res, 15);
  } catch (err) {
    console.error("[whale/trades] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
