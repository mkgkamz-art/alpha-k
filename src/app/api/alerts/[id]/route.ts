/**
 * GET /api/alerts/[id]
 *
 * Single alert detail with related alerts.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch alert
  const { data: alert, error } = await supabase
    .from("alert_events")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !alert) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  // Mark as read
  if (!alert.is_read) {
    await supabase
      .from("alert_events")
      .update({ is_read: true })
      .eq("id", id);
  }

  // Fetch related alerts (same type, last 7 days, max 4)
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: related } = await supabase
    .from("alert_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", alert.type)
    .neq("id", id)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(4);

  return NextResponse.json({
    alert,
    related: related ?? [],
  });
}
