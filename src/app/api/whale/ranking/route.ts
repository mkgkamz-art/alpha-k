/**
 * GET /api/whale/ranking — 고래 랭킹 (내부 세션 인증)
 *
 * Query:
 *   sort        — return_30d (기본), return_7d, return_90d, win_rate, followers
 *   tier        — s, a, b, c (optional)
 *   limit       — 1~100 (기본 20)
 *   cursor      — "score|id" 커서
 *   followedOnly — "true" → 팔로우한 고래만
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withCache } from "@/lib/api-error-handler";
import { serializeWhaleRanking, FREE_WHALE_LIMIT } from "@/lib/whale-api";
import { effectiveTier } from "@/lib/subscription";
import type { SubscriptionTier } from "@/types";
import type { Database } from "@/types/database.types";

type WhaleRow = Database["public"]["Tables"]["whales"]["Row"];

const SORT_MAP: Record<string, keyof WhaleRow> = {
  return_7d: "return_7d_pct",
  return_30d: "return_30d_pct",
  return_90d: "return_90d_pct",
  win_rate: "win_rate_30d",
  followers: "follower_count",
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sortKey = url.searchParams.get("sort") ?? "return_30d";
    const sortCol = SORT_MAP[sortKey] ?? "return_30d_pct";
    const tierFilter = url.searchParams.get("tier")?.toLowerCase();
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20),
    );
    const cursor = url.searchParams.get("cursor");
    const followedOnly = url.searchParams.get("followedOnly") === "true";

    // Session auth → tier
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
      // Unauthenticated = free
    }

    const admin = createAdminClient();

    // followedOnly: get user's whale_follows first
    let followedWhaleIds: string[] | null = null;
    if (followedOnly && userId) {
      const { data: follows } = await admin
        .from("whale_follows")
        .select("whale_id")
        .eq("user_id", userId);
      followedWhaleIds = (follows ?? []).map((f) => f.whale_id);
      if (followedWhaleIds.length === 0) {
        return NextResponse.json({
          whales: [],
          followed_ids: [],
          next_cursor: null,
          meta: { tier, count: 0, has_more: false },
        });
      }
    }

    // Build query
    let query = admin
      .from("whales")
      .select("*")
      .eq("is_active", true)
      .order(sortCol, { ascending: false })
      .order("id", { ascending: true })
      .limit(limit);

    if (
      tierFilter &&
      ["s", "a", "b", "c"].includes(tierFilter)
    ) {
      query = query.eq(
        "tier",
        tierFilter as Database["public"]["Enums"]["whale_tier"],
      );
    }

    if (followedWhaleIds) {
      query = query.in("id", followedWhaleIds);
    }

    if (cursor) {
      const [cursorScore, cursorId] = cursor.split("|");
      if (cursorScore && cursorId) {
        query = query.or(
          `${sortCol}.lt.${cursorScore},and(${sortCol}.eq.${cursorScore},id.gt.${cursorId})`,
        );
      }
    }

    const { data: whales, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch whale ranking" },
        { status: 500 },
      );
    }

    const whaleIds = (whales ?? []).map((w) => w.id);

    // Batch fetch: last trade per whale
    const { data: trades } =
      whaleIds.length > 0
        ? await admin
            .from("whale_trades")
            .select("*")
            .in("whale_id", whaleIds)
            .order("created_at", { ascending: false })
        : { data: [] };

    const lastTradeMap = new Map<
      string,
      Database["public"]["Tables"]["whale_trades"]["Row"]
    >();
    for (const t of trades ?? []) {
      if (!lastTradeMap.has(t.whale_id)) {
        lastTradeMap.set(t.whale_id, t);
      }
    }

    // Batch fetch: top 3 holdings per whale
    const { data: holdings } =
      whaleIds.length > 0
        ? await admin
            .from("whale_portfolios")
            .select("*")
            .in("whale_id", whaleIds)
            .order("weight_pct", { ascending: false })
        : { data: [] };

    const holdingsMap = new Map<
      string,
      Database["public"]["Tables"]["whale_portfolios"]["Row"][]
    >();
    for (const h of holdings ?? []) {
      const existing = holdingsMap.get(h.whale_id) ?? [];
      if (existing.length < 3) {
        existing.push(h);
        holdingsMap.set(h.whale_id, existing);
      }
    }

    // Batch fetch: user's follows for this page
    let followedIds: string[] = [];
    if (userId && whaleIds.length > 0) {
      const { data: follows } = await admin
        .from("whale_follows")
        .select("whale_id")
        .eq("user_id", userId)
        .in("whale_id", whaleIds);
      followedIds = (follows ?? []).map((f) => f.whale_id);
    }

    // Serialize (effectiveTier for open beta)
    const eTier = effectiveTier(tier);
    const items = (whales ?? []).map((w, i) =>
      serializeWhaleRanking(
        w,
        eTier,
        i,
        lastTradeMap.get(w.id) ?? null,
        holdingsMap.get(w.id),
      ),
    );

    // Free: only first 3 accessible (serializer handles is_accessible)
    const hasMore = items.length === limit;
    const lastItem =
      whales && whales.length > 0 ? whales[whales.length - 1] : null;
    const nextCursor = lastItem
      ? `${lastItem[sortCol]}|${lastItem.id}`
      : null;

    const res = NextResponse.json({
      whales: items,
      followed_ids: followedIds,
      next_cursor: hasMore ? nextCursor : null,
      meta: {
        tier,
        count: items.length,
        has_more: hasMore,
        free_limit: FREE_WHALE_LIMIT,
      },
    });

    return withCache(res, 30);
  } catch (err) {
    console.error("[whale/ranking] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
