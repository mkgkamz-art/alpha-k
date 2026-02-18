/**
 * GET /api/alerts/whale-movements
 *
 * Returns the 10 largest whale events from the past 24 hours.
 * Publicly accessible — no auth required.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

    const { data: events, error } = await supabase
      .from("whale_events")
      .select("*")
      .gte("detected_at", dayAgo)
      .order("usd_value", { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ events: events ?? [] });
  } catch (err) {
    console.error("[whale-movements] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch whale movements" },
      { status: 500 }
    );
  }
}
