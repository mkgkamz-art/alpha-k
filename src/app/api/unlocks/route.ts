/**
 * GET /api/unlocks?range=7d|30d|90d
 *
 * Upcoming token unlock schedules. Publicly accessible.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const range = searchParams.get("range") ?? "30d";

    const supabase = await createClient();

    const days = RANGE_DAYS[range] ?? 30;
    const now = new Date().toISOString();
    const futureDate = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("token_unlocks")
      .select("*")
      .gte("unlock_date", now)
      .lte("unlock_date", futureDate)
      .order("unlock_date", { ascending: true });

    if (error) throw error;

    const unlocks = data ?? [];
    const totalValue = unlocks.reduce(
      (s, u) => s + (Number(u.usd_value_estimate) || 0),
      0
    );
    const highestImpact = unlocks.reduce(
      (max, u) => {
        const score = Number(u.impact_score) || 0;
        return score > max ? score : max;
      },
      0
    );

    return NextResponse.json({
      unlocks,
      stats: {
        count: unlocks.length,
        totalValue,
        highestImpact,
      },
    });
  } catch (err) {
    console.error("[api/unlocks] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch unlocks" },
      { status: 500 }
    );
  }
}
