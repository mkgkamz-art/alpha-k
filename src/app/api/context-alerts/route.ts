/**
 * GET /api/context-alerts
 *
 * Query params:
 *   type     — filter by alert_type ('surge', 'dump', 'kimchi', 'listing', 'whale', etc.)
 *   severity — filter by severity ('critical', 'warning', 'info')
 *   limit    — max rows per page (default 20, max 50)
 *   cursor   — created_at cursor for pagination (ISO string)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const cursor = searchParams.get("cursor");

    const supabase = createAdminClient();

    let query = supabase
      .from("context_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit + 1); // fetch one extra to detect hasMore

    if (type) query = query.eq("alert_type", type);
    if (severity) query = query.eq("severity", severity);
    if (cursor) query = query.lt("created_at", cursor);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].created_at : null;

    return NextResponse.json({
      data: page,
      count: page.length,
      nextCursor,
    });
  } catch (err) {
    console.error("[api/context-alerts] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
