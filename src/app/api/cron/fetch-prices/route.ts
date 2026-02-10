import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron: Fetch token prices (every 1 minute)
 *
 * Fetches prices for all tokens in watchlists from CoinGecko,
 * and stores the latest price for price_signal alert evaluation.
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // Get distinct token symbols from watchlists
    const { data: watchlistTokens } = await supabase
      .from("watchlist_items")
      .select("token_symbol")
      .limit(100);

    if (!watchlistTokens?.length) {
      return NextResponse.json({ message: "No tokens to track", duration: Date.now() - started });
    }

    const symbols = [...new Set(watchlistTokens.map((t) => t.token_symbol.toLowerCase()))];
    const symbolsParam = symbols.join(",");

    // Fetch prices from CoinGecko
    const apiKey = process.env.COINGECKO_API_KEY;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) headers["x-cg-demo-api-key"] = apiKey;

    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${symbolsParam}&vs_currencies=usd&include_24hr_change=true`,
      { headers, signal: AbortSignal.timeout(10_000) }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko ${res.status}`);
    }

    const prices = (await res.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;

    const priceCount = Object.keys(prices).length;

    console.log(`[cron/fetch-prices] Fetched ${priceCount} prices in ${Date.now() - started}ms`);

    return NextResponse.json({
      success: true,
      priceCount,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/fetch-prices] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
