/**
 * GET /api/defi/risk-events
 *
 * Recent risk-type alert events (last 7 days). Publicly accessible.
 * Shows system-generated risk events (depegging, TVL drops) regardless of user.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("alert_events")
      .select("*")
      .eq("type", "risk")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ events: data ?? [] });
  } catch (err) {
    console.error("[api/defi/risk-events] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch risk events" },
      { status: 500 }
    );
  }
}
