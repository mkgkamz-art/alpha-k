/**
 * GET /api/exchange-rate
 *
 * Returns current USD/KRW exchange rate.
 * Uses in-memory cache (1 hour TTL).
 */

import { NextResponse } from "next/server";
import { getExchangeRate } from "@/lib/exchanges/coingecko-prices";
import { withCache } from "@/lib/api-error-handler";

export async function GET() {
  try {
    const rate = await getExchangeRate();
    return withCache(NextResponse.json({ rate }), 600, 300);
  } catch {
    return NextResponse.json({ rate: 1450, fallback: true });
  }
}
