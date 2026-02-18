import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchMarketPrices } from "@/lib/blockchain/price-fetcher";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";

/**
 * Cron: Fetch token prices (every 1 minute)
 *
 * Fetches top 100 market tokens from CoinGecko,
 * upserts into token_prices, and appends top 20 to price_history.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // Fetch top 100 tokens from CoinGecko
    const prices = await fetchMarketPrices(100);

    if (prices.length === 0) {
      return NextResponse.json({
        message: "No prices returned from CoinGecko",
        duration: Date.now() - started,
      });
    }

    // Upsert into token_prices (latest snapshot per token)
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

    if (upsertError) {
      console.error("[cron/fetch-prices] Upsert error:", upsertError);
      throw upsertError;
    }

    // Append top 20 tokens to price_history (time series for charts)
    const top20 = prices.slice(0, 20);
    const now = new Date().toISOString();

    const { error: historyError } = await supabase
      .from("price_history")
      .insert(
        top20.map((p) => ({
          token_id: p.token_id,
          price: p.current_price,
          recorded_at: now,
        }))
      );

    if (historyError) {
      console.error("[cron/fetch-prices] History insert error:", historyError);
    }

    console.log(
      `[cron/fetch-prices] Upserted ${prices.length} prices, ` +
        `${top20.length} history rows in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      priceCount: prices.length,
      historyCount: top20.length,
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
