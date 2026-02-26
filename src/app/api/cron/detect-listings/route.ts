/**
 * Cron: Detect new exchange listings (every 5 minutes)
 *
 * BASELINE MODE (first run / exchange_listed_coins < 10 rows):
 *   - Register all current coins as baseline
 *   - Do NOT create new_listings entries (these are existing coins)
 *
 * DETECTION MODE (subsequent runs):
 *   1. Load existing market codes from exchange_listed_coins
 *   2. Fetch current Upbit/Bithumb market lists
 *   3. Compare → detect genuinely new listings
 *   4. Insert into new_listings + update exchange_listed_coins
 *   5. Update prices for existing new_listings (within 7 days)
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
import { detectListings } from "@/lib/detectors/listing-detector";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // 1. Load existing market codes
    const { data: existingCoins, count: existingCount } = await supabase
      .from("exchange_listed_coins")
      .select("exchange, market_code", { count: "exact" });

    const existingSet = new Set(
      existingCoins?.map((c) => `${c.exchange}:${c.market_code}`) ?? []
    );

    // 2. Fetch current market lists
    const upbitMarkets = await getUpbitMarkets();
    const bithumbTickers = await getBithumbTickers();

    // ── BASELINE MODE ──
    // If exchange_listed_coins is empty or very small, this is the first run.
    // Register all current coins as baseline WITHOUT creating new_listings.
    const isBaseline = (existingCount ?? 0) < 10;

    if (isBaseline) {
      console.log(
        `[cron/detect-listings] Baseline mode: registering ${upbitMarkets.length} Upbit + ${bithumbTickers.length} Bithumb coins`
      );

      // Batch upsert all Upbit markets
      const upbitRows = upbitMarkets.map((m) => ({
        exchange: "upbit" as const,
        symbol: m.market.replace("KRW-", ""),
        market_code: m.market,
        is_new: false,
      }));
      for (let i = 0; i < upbitRows.length; i += 100) {
        await supabase
          .from("exchange_listed_coins")
          .upsert(upbitRows.slice(i, i + 100), {
            onConflict: "exchange,market_code",
          });
      }

      // Batch upsert all Bithumb markets
      const bithumbRows = bithumbTickers.map((t) => ({
        exchange: "bithumb" as const,
        symbol: t.symbol,
        market_code: `${t.symbol}_KRW`,
        is_new: false,
      }));
      for (let i = 0; i < bithumbRows.length; i += 100) {
        await supabase
          .from("exchange_listed_coins")
          .upsert(bithumbRows.slice(i, i + 100), {
            onConflict: "exchange,market_code",
          });
      }

      const duration = Date.now() - started;
      return NextResponse.json({
        success: true,
        baseline: true,
        registered: upbitRows.length + bithumbRows.length,
        newListings: 0,
        duration,
      });
    }

    // ── DETECTION MODE ── (normal operation after baseline)
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
      const newUpbitCodes = newUpbit.map((m) => m.market);
      const upbitPrices = new Map<string, number>();
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

        await supabase.from("new_listings").upsert(
          {
            exchange: "upbit" as const,
            symbol,
            market_code: market.market,
            coin_name: market.korean_name,
            initial_price_krw: price,
            current_price_krw: price,
          },
          { onConflict: "exchange,market_code" }
        );

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

        await saveContextAlert(
          createListingContext({
            symbol,
            exchange: "upbit",
            coinName: market.korean_name,
          })
        );
      }
    }

    // 5. Process new Bithumb listings
    for (const ticker of newBithumb) {
      await supabase.from("new_listings").upsert(
        {
          exchange: "bithumb" as const,
          symbol: ticker.symbol,
          market_code: `${ticker.symbol}_KRW`,
          coin_name: null,
          initial_price_krw: ticker.closing_price || null,
          current_price_krw: ticker.closing_price || null,
        },
        { onConflict: "exchange,market_code" }
      );

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

      await saveContextAlert(
        createListingContext({
          symbol: ticker.symbol,
          exchange: "bithumb",
          coinName: null,
        })
      );
    }

    // 6. Update prices for recent listings (within 7 days)
    await updateRecentListingPrices(supabase, upbitMarkets, bithumbTickers);

    // 7. ListingDetector — radar_signals에 상장 시그널 생성 (Binance 공지 포함)
    let radarDetected = 0;
    try {
      const result = await detectListings(supabase);
      radarDetected = result.detected;
    } catch (err) {
      console.warn("[cron/detect-listings] Radar listing detector error:", err);
    }

    const duration = Date.now() - started;
    console.log(
      `[cron/detect-listings] new: ${newListings.length}, radar: ${radarDetected}, duration: ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      newListings: newListings.length,
      radarDetected,
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

  const upbitPriceMap = new Map<string, number>();
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
