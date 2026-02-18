import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchMarketPrices,
  fetchFearGreed,
  fetchGasPrice,
} from "@/lib/blockchain/price-fetcher";

/**
 * Dev-only: Manually seed token prices into the database.
 * GET /api/dev/seed-prices
 *
 * In production, this is handled by the cron/fetch-prices job.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Dev-only endpoint" },
      { status: 403 }
    );
  }

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // Fetch market prices
    const prices = await fetchMarketPrices(50);

    if (prices.length === 0) {
      return NextResponse.json({
        error: "CoinGecko returned no data (possible rate limit)",
      });
    }

    // Upsert into token_prices
    const { error: upsertError } = await supabase
      .from("token_prices")
      .upsert(
        prices.map((p) => ({
          token_id: p.token_id,
          symbol: p.symbol,
          name: p.name,
          current_price: p.current_price,
          market_cap: p.market_cap,
          total_volume: p.total_volume,
          price_change_1h: p.price_change_1h,
          price_change_24h: p.price_change_24h,
          price_change_7d: p.price_change_7d,
          last_updated: p.last_updated,
        })),
        { onConflict: "token_id" }
      );

    if (upsertError) throw upsertError;

    // Append to price_history (top 20 only)
    const now = new Date().toISOString();
    await supabase.from("price_history").insert(
      prices.slice(0, 20).map((p) => ({
        token_id: p.token_id,
        price: p.current_price,
        recorded_at: now,
      }))
    );

    // Fetch supplementary data
    const [fearGreed, gas] = await Promise.all([
      fetchFearGreed(),
      fetchGasPrice(),
    ]);

    // Top 10 summary for response
    const top10 = prices.slice(0, 10).map((p) => ({
      symbol: p.symbol,
      price: `$${p.current_price.toLocaleString()}`,
      change24h: p.price_change_24h
        ? `${p.price_change_24h > 0 ? "+" : ""}${p.price_change_24h.toFixed(2)}%`
        : "N/A",
    }));

    return NextResponse.json({
      success: true,
      seeded: prices.length,
      top10,
      fearGreed,
      gas,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[dev/seed-prices] Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
