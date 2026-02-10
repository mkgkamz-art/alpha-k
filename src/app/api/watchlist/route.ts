/**
 * GET  /api/watchlist — list user's watchlist
 * POST /api/watchlist — add token to watchlist
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Chain } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    token_symbol: string;
    token_name: string;
    token_address: string;
    chain: string;
  };

  if (!body.token_symbol || !body.chain) {
    return NextResponse.json(
      { error: "token_symbol and chain are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .insert({
      user_id: user.id,
      token_symbol: body.token_symbol,
      token_name: body.token_name || body.token_symbol,
      token_address: body.token_address || "",
      chain: body.chain as Chain,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
