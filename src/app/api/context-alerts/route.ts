/**
 * GET /api/context-alerts
 *
 * Query params:
 *   type     — filter by alert_type ('surge', 'dump', 'kimchi', 'listing', 'whale', etc.)
 *   severity — filter by severity ('critical', 'warning', 'info')
 *   limit    — max rows (default 30, max 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

    const supabase = createAdminClient();

    let query = supabase
      .from("context_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type) query = query.eq("alert_type", type);
    if (severity) query = query.eq("severity", severity);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
      count: data?.length ?? 0,
    });
  } catch (err) {
    console.error("[api/context-alerts] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
