/**
 * GET /api/defi/protocols
 *
 * Returns DeFi protocol TVL data. Publicly accessible.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("defi_protocols")
      .select("*")
      .order("tvl", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ protocols: data ?? [] });
  } catch (err) {
    console.error("[api/defi/protocols] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch protocols" },
      { status: 500 }
    );
  }
}
