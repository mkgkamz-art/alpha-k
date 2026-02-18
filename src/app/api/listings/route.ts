/**
 * GET /api/listings — Fetch new listing data for the listing page.
 *
 * Query params:
 * - limit (default 50)
 * - exchange: "upbit" | "bithumb" | "all" (default "all")
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export interface NewListingItem {
  id: number;
  exchange: string;
  symbol: string;
  market_code: string;
  coin_name: string | null;
  detected_at: string;
  initial_price_krw: number | null;
  current_price_krw: number | null;
  price_change_since_listing: number | null;
  notified: boolean;
}

export interface ListingsResponse {
  data: NewListingItem[];
  total: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const exchange = searchParams.get("exchange") || "all";

    const supabase = createAdminClient();

    let query = supabase
      .from("new_listings")
      .select("*", { count: "exact" })
      .order("detected_at", { ascending: false })
      .limit(limit);

    if (exchange !== "all") {
      query = query.eq("exchange", exchange);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("[api/listings] Error:", error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
    } satisfies ListingsResponse);
  } catch (err) {
    console.error("[api/listings] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
