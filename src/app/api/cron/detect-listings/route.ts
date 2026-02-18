/**
 * Cron: Detect new exchange listings (every 5 minutes)
 *
 * 1. Load existing market codes from exchange_listed_coins
 * 2. Fetch current Upbit/Bithumb market lists
 * 3. Compare → detect new listings
 * 4. Insert into new_listings + update exchange_listed_coins
 * 5. Update prices for existing new_listings (within 7 days)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import {
  getUpbitMarkets,
  getUpbitTickers,
  getBithumbTickers,
  type UpbitMarket,
} from "@/lib/exchanges";
import { createListingContext, saveContextAlert } from "@/lib/context-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // 1. Load existing market codes
    const { data: existingCoins } = await supabase
      .from("exchange_listed_coins")
      .select("exchange, market_code");

    const existingSet = new Set(
      existingCoins?.map((c) => `${c.exchange}:${c.market_code}`) ?? []
    );

    // 2. Fetch current market lists
    const upbitMarkets = await getUpbitMarkets();
    const bithumbTickers = await getBithumbTickers();

    // Build upbit name map for coin_name lookup
    const upbitNameMap = new Map<string, string>();
    for (const m of upbitMarkets) {
      upbitNameMap.set(m.market, m.korean_name);
    }

    // 3. Detect new listings
    const newUpbit = upbitMarkets.filter(
      (m) => !existingSet.has(`upbit:${m.market}`)
    );
    const newBithumb = bithumbTickers.filter(
      (t) => !existingSet.has(`bithumb:${t.symbol}_KRW`)
    );

    const newListings: {
      exchange: string;
      symbol: string;
      market_code: string;
      coin_name: string | null;
      initial_price_krw: number | null;
    }[] = [];

    // 4. Process new Upbit listings
    if (newUpbit.length > 0) {
      // Fetch prices for new upbit coins
      const newUpbitCodes = newUpbit.map((m) => m.market);
      let upbitPrices = new Map<string, number>();
      try {
        const tickers = await getUpbitTickers(newUpbitCodes);
        for (const t of tickers) {
          upbitPrices.set(t.market, t.trade_price);
        }
      } catch {
        // Price fetch failure is non-fatal
      }

      for (const market of newUpbit) {
        const symbol = market.market.replace("KRW-", "");
        const price = upbitPrices.get(market.market) ?? null;

        const listing = {
          exchange: "upbit" as const,
          symbol,
          market_code: market.market,
          coin_name: market.korean_name,
          initial_price_krw: price,
          current_price_krw: price,
        };

        await supabase
          .from("new_listings")
          .upsert(listing, { onConflict: "exchange,market_code" });

        await supabase.from("exchange_listed_coins").upsert(
          {
            exchange: "upbit",
            symbol,
            market_code: market.market,
            is_new: true,
          },
          { onConflict: "exchange,market_code" }
        );

        newListings.push({
          exchange: "upbit",
          symbol,
          market_code: market.market,
          coin_name: market.korean_name,
          initial_price_krw: price,
        });

        // Context Alert
        await saveContextAlert(
          createListingContext({ symbol, exchange: "upbit", coinName: market.korean_name })
        );
      }
    }

    // 5. Process new Bithumb listings
    for (const ticker of newBithumb) {
      const listing = {
        exchange: "bithumb" as const,
        symbol: ticker.symbol,
        market_code: `${ticker.symbol}_KRW`,
        coin_name: null,
        initial_price_krw: ticker.closing_price || null,
        current_price_krw: ticker.closing_price || null,
      };

      await supabase
        .from("new_listings")
        .upsert(listing, { onConflict: "exchange,market_code" });

      await supabase.from("exchange_listed_coins").upsert(
        {
          exchange: "bithumb",
          symbol: ticker.symbol,
          market_code: `${ticker.symbol}_KRW`,
          is_new: true,
        },
        { onConflict: "exchange,market_code" }
      );

      newListings.push({
        exchange: "bithumb",
        symbol: ticker.symbol,
        market_code: `${ticker.symbol}_KRW`,
        coin_name: null,
        initial_price_krw: ticker.closing_price || null,
      });

      // Context Alert
      await saveContextAlert(
        createListingContext({ symbol: ticker.symbol, exchange: "bithumb", coinName: null })
      );
    }

    // 6. Update prices for recent listings (within 7 days)
    await updateRecentListingPrices(supabase, upbitMarkets, bithumbTickers);

    const duration = Date.now() - started;
    console.log(
      `[cron/detect-listings] new: ${newListings.length}, duration: ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      newListings: newListings.length,
      details: newListings,
      duration,
    });
  } catch (err) {
    console.error("[cron/detect-listings] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

/**
 * Update current_price_krw and price_change_since_listing
 * for listings detected within the last 7 days.
 */
async function updateRecentListingPrices(
  supabase: ReturnType<typeof createAdminClient>,
  upbitMarkets: UpbitMarket[],
  bithumbTickers: Awaited<ReturnType<typeof getBithumbTickers>>
) {
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentListings } = await supabase
    .from("new_listings")
    .select("id, exchange, market_code, initial_price_krw")
    .gte("detected_at", sevenDaysAgo);

  if (!recentListings || recentListings.length === 0) return;

  // Build price maps
  const upbitCodes = recentListings
    .filter((l) => l.exchange === "upbit")
    .map((l) => l.market_code);

  let upbitPriceMap = new Map<string, number>();
  if (upbitCodes.length > 0) {
    try {
      const tickers = await getUpbitTickers(upbitCodes);
      for (const t of tickers) {
        upbitPriceMap.set(t.market, t.trade_price);
      }
    } catch {
      // Non-fatal
    }
  }

  const bithumbPriceMap = new Map<string, number>();
  for (const t of bithumbTickers) {
    bithumbPriceMap.set(`${t.symbol}_KRW`, t.closing_price);
  }

  // Update each listing
  for (const listing of recentListings) {
    const priceMap =
      listing.exchange === "upbit" ? upbitPriceMap : bithumbPriceMap;
    const currentPrice = priceMap.get(listing.market_code);
    if (currentPrice == null) continue;

    let priceChange: number | null = null;
    if (listing.initial_price_krw && listing.initial_price_krw > 0) {
      priceChange =
        Math.round(
          ((currentPrice - listing.initial_price_krw) /
            listing.initial_price_krw) *
            100 *
            10000
        ) / 10000;
    }

    await supabase
      .from("new_listings")
      .update({
        current_price_krw: currentPrice,
        price_change_since_listing: priceChange,
      })
      .eq("id", listing.id);
  }
}
