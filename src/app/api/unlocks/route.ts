/**
 * GET /api/unlocks?range=7d|30d|90d
 *
 * Upcoming token unlock schedules.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const range = searchParams.get("range") ?? "30d";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = RANGE_DAYS[range] ?? 30;
  const futureDate = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("token_unlocks")
    .select("*")
    .gte("unlock_date", new Date().toISOString())
    .lte("unlock_date", futureDate)
    .order("unlock_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute stats
  const unlocks = data ?? [];
  const totalValue = unlocks.reduce((s, u) => s + (u.unlock_value_usd ?? 0), 0);
  const highestImpact = unlocks.reduce(
    (max, u) => ((u.impact_score ?? 0) > max ? (u.impact_score ?? 0) : max),
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
}
