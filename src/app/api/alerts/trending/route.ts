/**
 * GET /api/alerts/trending
 *
 * Top 5 tokens by alert count in the last 24h.
 * Enriched with mock price data (real price feed TODO).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  // Get alert counts per token by parsing metadata.token_symbol
  const { data: events } = await supabase
    .from("alert_events")
    .select("metadata, title")
    .eq("user_id", user.id)
    .gte("created_at", dayAgo);

  // Aggregate token mentions from title
  const tokenCounts = new Map<string, number>();
  for (const event of events ?? []) {
    // Extract token symbol from title (first uppercase word 2-5 chars)
    const match = (event.title as string).match(/\b([A-Z]{2,5})\b/);
    if (match) {
      const sym = match[1];
      tokenCounts.set(sym, (tokenCounts.get(sym) ?? 0) + 1);
    }
  }

  const trending = Array.from(tokenCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([symbol, alertCount], i) => ({
      rank: i + 1,
      symbol,
      alertCount,
    }));

  return NextResponse.json({ trending });
}
