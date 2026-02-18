import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/prices
 *
 * Returns latest token prices for the client.
 * Query params:
 *   - limit: number of tokens (default 20, max 100)
 *   - ids: comma-separated token_ids for specific tokens
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
  const ids = searchParams.get("ids");

  try {
    const supabase = await createClient();

    let query = supabase
      .from("token_prices")
      .select("*")
      .order("market_cap", { ascending: false });

    if (ids) {
      const tokenIds = ids.split(",").map((id) => id.trim());
      query = query.in("token_id", tokenIds);
    } else {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ prices: data ?? [] });
  } catch (err) {
    console.error("[api/prices] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
