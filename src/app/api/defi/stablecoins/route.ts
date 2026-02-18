/**
 * GET /api/defi/stablecoins
 *
 * Returns stablecoin peg status. Publicly accessible.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("stablecoin_status")
      .select("*")
      .order("symbol", { ascending: true });

    if (error) throw error;

    const stablecoins = data ?? [];
    const warningCount = stablecoins.filter((s) => s.is_depegged).length;

    return NextResponse.json({ stablecoins, warningCount });
  } catch (err) {
    console.error("[api/defi/stablecoins] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stablecoins" },
      { status: 500 }
    );
  }
}
