/**
 * GET /api/alerts/whale-movements
 *
 * 24h whale movement summary grouped by exchange.
 * Returns inflow/outflow USD values per exchange.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

interface MovementMetadata {
  exchange?: string;
  flow_direction?: "inflow" | "outflow";
  value_usd?: number;
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  const { data: events } = await supabase
    .from("alert_events")
    .select("metadata")
    .eq("user_id", user.id)
    .eq("type", "whale")
    .gte("created_at", dayAgo);

  // Aggregate by exchange
  const exchangeMap = new Map<
    string,
    { inflow: number; outflow: number }
  >();

  for (const event of events ?? []) {
    const meta = event.metadata as Json as MovementMetadata;
    const exchange = meta?.exchange ?? "Unknown";
    const direction = meta?.flow_direction ?? "inflow";
    const value = meta?.value_usd ?? 0;

    if (!exchangeMap.has(exchange)) {
      exchangeMap.set(exchange, { inflow: 0, outflow: 0 });
    }

    const entry = exchangeMap.get(exchange)!;
    if (direction === "inflow") {
      entry.inflow += value;
    } else {
      entry.outflow += value;
    }
  }

  const movements = Array.from(exchangeMap.entries())
    .map(([exchange, { inflow, outflow }]) => ({
      exchange,
      inflow,
      outflow,
    }))
    .sort((a, b) => b.inflow + b.outflow - (a.inflow + a.outflow))
    .slice(0, 6);

  return NextResponse.json({ movements });
}
