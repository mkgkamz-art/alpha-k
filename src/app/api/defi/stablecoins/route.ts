/**
 * GET /api/defi/stablecoins
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

  const { data, error } = await supabase
    .from("stablecoin_pegs")
    .select("*")
    .order("symbol", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stablecoins = data ?? [];
  const warningCount = stablecoins.filter(
    (s) => s.status === "warning" || s.status === "depeg"
  ).length;

  return NextResponse.json({ stablecoins, warningCount });
}
