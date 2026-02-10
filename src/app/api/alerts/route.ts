/**
 * GET /api/alerts?type=&severity=&cursor=&limit=
 *
 * Infinite scroll alert feed with cursor-based pagination.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AlertType, Severity } from "@/types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const VALID_TYPES = new Set<string>(["whale", "risk", "price_signal", "token_unlock", "liquidity"]);
const VALID_SEVERITIES = new Set<string>(["critical", "high", "medium", "low"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const severity = searchParams.get("severity");
  const cursor = searchParams.get("cursor"); // ISO date string
  const limit = Math.min(
    Number(searchParams.get("limit") ?? DEFAULT_LIMIT),
    MAX_LIMIT
  );

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("alert_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit + 1); // +1 to detect next page

  if (type && type !== "all" && VALID_TYPES.has(type)) {
    query = query.eq("type", type as AlertType);
  }

  if (severity && severity !== "all" && VALID_SEVERITIES.has(severity)) {
    query = query.eq("severity", severity as Severity);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hasMore = (data?.length ?? 0) > limit;
  const items = hasMore ? data!.slice(0, limit) : (data ?? []);
  const nextCursor = hasMore ? items[items.length - 1].created_at : null;

  return NextResponse.json({
    items,
    nextCursor,
    hasMore,
  });
}
