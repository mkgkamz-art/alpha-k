/**
 * GET /api/radar — Unified radar signal feed
 *
 * Query params:
 *   types    — comma-separated: surge,kimchi,listing,signal,context
 *   minScore — minimum score (0-100), default 0
 *   limit    — page size, default 20
 *   cursor   — ISO timestamp cursor for pagination
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withCache } from "@/lib/api-error-handler";
import { getAccess } from "@/lib/subscription";
import type { SubscriptionTier } from "@/types";
import type { Database } from "@/types/database.types";

type RadarSignalTypeDb = Database["public"]["Enums"]["radar_signal_type"];

const VALID_TYPES = new Set<string>([
  "surge", "kimchi", "listing", "signal", "context",
  "volume", "orderbook", "buzz", "onchain",
]);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const typesParam = url.searchParams.get("types");
    const minScore = parseInt(url.searchParams.get("minScore") ?? "0", 10) || 0;
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20);
    const cursor = url.searchParams.get("cursor");

    // Parse types filter
    const types = typesParam
      ? typesParam.split(",").filter((t) => VALID_TYPES.has(t))
      : [];

    // Check subscription tier for signal limits
    let tier: SubscriptionTier = "free";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();
        tier = (userData?.subscription_tier as SubscriptionTier) ?? "free";
      }
    } catch {
      // Unauthenticated = free tier
    }

    const access = getAccess("radar", tier);
    const maxSignals = (access as { maxSignals: number }).maxSignals ?? 5;

    // Build query
    const admin = createAdminClient();
    let query = admin
      .from("radar_signals")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .gte("score", minScore)
      .order("created_at", { ascending: false })
      .order("score", { ascending: false })
      .limit(limit);

    if (types.length > 0) {
      query = query.in("signal_type", types as RadarSignalTypeDb[]);
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: signals, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = signals ?? [];
    const hasMore = items.length === limit;
    const nextCursor = items.length > 0 ? items[items.length - 1].created_at : null;

    // Free tier: limit visible signals, mark rest as locked
    const visibleCount = Math.min(items.length, maxSignals === Infinity ? items.length : maxSignals);
    const visibleItems = items.slice(0, visibleCount);
    const lockedCount = items.length - visibleCount;

    const res = NextResponse.json({
      signals: visibleItems,
      lockedCount,
      hasMore,
      nextCursor,
      tier,
    });

    return withCache(res, 15);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[radar] Error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
