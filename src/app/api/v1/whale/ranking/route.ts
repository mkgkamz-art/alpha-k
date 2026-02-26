/**
 * GET /api/v1/whale/ranking — 고래 랭킹
 *
 * Query:
 *   sort    — 'return_30d' (기본), 'return_7d', 'return_90d', 'win_rate', 'followers'
 *   tier    — 'S', 'A', 'B', 'C' (optional)
 *   limit   — 1~100 (기본 20)
 *   cursor  — 커서 기반 페이지네이션
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";
import { withCache } from "@/lib/api-error-handler";
import { serializeWhaleRanking } from "@/lib/whale-api";
import type { Database } from "@/types/database.types";

type WhaleRow = Database["public"]["Tables"]["whales"]["Row"];

const SORT_MAP: Record<string, keyof WhaleRow> = {
  return_7d: "return_7d_pct",
  return_30d: "return_30d_pct",
  return_90d: "return_90d_pct",
  win_rate: "win_rate_30d",
  followers: "follower_count",
};

export const GET = withApiKeyAuth("v1-whale-ranking", async (req, ctx) => {
  const url = new URL(req.url);

  const sortKey = url.searchParams.get("sort") ?? "return_30d";
  const sortCol = SORT_MAP[sortKey] ?? "return_30d_pct";
  const tierFilter = url.searchParams.get("tier")?.toLowerCase();
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20),
  );
  const cursor = url.searchParams.get("cursor");

  const admin = createAdminClient();

  // Build query
  let query = admin
    .from("whales")
    .select("*")
    .eq("is_active", true)
    .order(sortCol, { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);

  if (tierFilter && ["s", "a", "b", "c"].includes(tierFilter)) {
    query = query.eq(
      "tier",
      tierFilter as Database["public"]["Enums"]["whale_tier"],
    );
  }

  if (cursor) {
    // cursor = "score|id" format for stable pagination
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
  const { data: trades } = whaleIds.length > 0
    ? await admin
        .from("whale_trades")
        .select("*")
        .in("whale_id", whaleIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Group last trade per whale
  const lastTradeMap = new Map<string, Database["public"]["Tables"]["whale_trades"]["Row"]>();
  for (const t of trades ?? []) {
    if (!lastTradeMap.has(t.whale_id)) {
      lastTradeMap.set(t.whale_id, t);
    }
  }

  // Batch fetch: top 3 holdings per whale
  const { data: holdings } = whaleIds.length > 0
    ? await admin
        .from("whale_portfolios")
        .select("*")
        .in("whale_id", whaleIds)
        .order("weight_pct", { ascending: false })
    : { data: [] };

  // Group holdings per whale (max 3)
  const holdingsMap = new Map<string, Database["public"]["Tables"]["whale_portfolios"]["Row"][]>();
  for (const h of holdings ?? []) {
    const existing = holdingsMap.get(h.whale_id) ?? [];
    if (existing.length < 3) {
      existing.push(h);
      holdingsMap.set(h.whale_id, existing);
    }
  }

  // Serialize
  const items = (whales ?? []).map((w, i) =>
    serializeWhaleRanking(
      w,
      ctx.tier,
      i,
      lastTradeMap.get(w.id) ?? null,
      holdingsMap.get(w.id),
    ),
  );

  const hasMore = items.length === limit;
  const lastItem = whales && whales.length > 0 ? whales[whales.length - 1] : null;
  const nextCursor = lastItem
    ? `${lastItem[sortCol]}|${lastItem.id}`
    : null;

  const res = NextResponse.json({
    whales: items,
    next_cursor: hasMore ? nextCursor : null,
    meta: {
      tier: ctx.tier,
      count: items.length,
      has_more: hasMore,
    },
  });

  return withCache(res, 30);
});
