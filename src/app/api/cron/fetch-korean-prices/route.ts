/**
 * Cron: Fetch Korean exchange prices (every minute)
 *
 * 1. Get USD/KRW exchange rate
 * 2. Fetch Upbit KRW tickers
 * 3. Fetch Bithumb KRW tickers
 * 4. Fetch CoinGecko global USD prices
 * 5. Calculate kimchi premium
 * 6. Batch insert into korean_prices
 * 7. Update exchange_listed_coins (for listing detection)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import {
  getUpbitMarkets,
  getUpbitTickers,
  getBithumbTickers,
  getExchangeRate,
  getGlobalPricesUsd,
  SYMBOL_TO_COINGECKO,
  type UpbitMarket,
  type BithumbTicker,
} from "@/lib/exchanges";
import {
  createSurgeContext,
  createKimchiContext,
  saveContextAlert,
} from "@/lib/context-engine";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // 1. Exchange rate
    const usdKrwRate = await getExchangeRate();

    // 2. Upbit data
    const upbitMarkets = await getUpbitMarkets();
    const upbitCodes = upbitMarkets.map((m) => m.market);
    const upbitTickers = await getUpbitTickers(upbitCodes);

    // 3. Bithumb data
    const bithumbTickers = await getBithumbTickers();

    // 4. CoinGecko global USD prices
    const allSymbols = new Set([
      ...upbitTickers.map((t) => t.market.replace("KRW-", "")),
      ...bithumbTickers.map((t) => t.symbol),
    ]);
    const geckoIds = [...allSymbols]
      .map((s) => SYMBOL_TO_COINGECKO[s])
      .filter(Boolean);

    const globalPrices = await getGlobalPricesUsd(geckoIds);

    // Build reverse map: symbol → USD price
    const symbolToUsd = new Map<string, number>();
    for (const [sym, geckoId] of Object.entries(SYMBOL_TO_COINGECKO)) {
      const usd = globalPrices[geckoId];
      if (usd != null) symbolToUsd.set(sym, usd);
    }

    // 5. Build rows
    const now = new Date().toISOString();
    const rows: {
      symbol: string;
      exchange: string;
      price_krw: number;
      price_usd: number | null;
      volume_24h: number | null;
      change_24h: number | null;
      kimchi_premium: number | null;
      usd_krw_rate: number;
      fetched_at: string;
    }[] = [];

    // Upbit rows
    for (const ticker of upbitTickers) {
      const symbol = ticker.market.replace("KRW-", "");
      const globalUsd = symbolToUsd.get(symbol) ?? null;
      let kimchi: number | null = null;

      if (globalUsd && globalUsd > 0 && usdKrwRate > 0) {
        const globalKrw = globalUsd * usdKrwRate;
        kimchi =
          Math.round(
            ((ticker.trade_price - globalKrw) / globalKrw) * 100 * 10000
          ) / 10000;
      }

      rows.push({
        symbol,
        exchange: "upbit",
        price_krw: ticker.trade_price,
        price_usd: globalUsd,
        volume_24h: ticker.acc_trade_price_24h,
        change_24h:
          Math.round(ticker.signed_change_rate * 100 * 10000) / 10000,
        kimchi_premium: kimchi,
        usd_krw_rate: usdKrwRate,
        fetched_at: now,
      });
    }

    // Bithumb rows
    for (const ticker of bithumbTickers) {
      const globalUsd = symbolToUsd.get(ticker.symbol) ?? null;
      let kimchi: number | null = null;

      if (globalUsd && globalUsd > 0 && usdKrwRate > 0) {
        const globalKrw = globalUsd * usdKrwRate;
        kimchi =
          Math.round(
            ((ticker.closing_price - globalKrw) / globalKrw) * 100 * 10000
          ) / 10000;
      }

      rows.push({
        symbol: ticker.symbol,
        exchange: "bithumb",
        price_krw: ticker.closing_price,
        price_usd: globalUsd,
        volume_24h: ticker.acc_trade_value_24H,
        change_24h:
          Math.round(ticker.fluctate_rate_24H * 10000) / 10000,
        kimchi_premium: kimchi,
        usd_krw_rate: usdKrwRate,
        fetched_at: now,
      });
    }

    // 6. Batch insert
    let insertCount = 0;
    if (rows.length > 0) {
      const { error } = await supabase.from("korean_prices").insert(rows);
      if (error) {
        console.error("[cron/fetch-korean-prices] Insert error:", error.message);
      } else {
        insertCount = rows.length;
      }
    }

    // 7. Generate context alerts for significant moves
    await generateContextAlerts(rows);

    // 8. Update listed coins
    await updateListedCoins(supabase, upbitMarkets, bithumbTickers);

    const duration = Date.now() - started;
    console.log(
      `[cron/fetch-korean-prices] upbit: ${upbitTickers.length}, bithumb: ${bithumbTickers.length}, inserted: ${insertCount}, rate: ${usdKrwRate} in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      upbit: upbitTickers.length,
      bithumb: bithumbTickers.length,
      inserted: insertCount,
      usdKrwRate,
      duration,
    });
  } catch (err) {
    console.error("[cron/fetch-korean-prices] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

/**
 * Detect significant price moves and kimchi premium spikes,
 * then generate context alerts. Only fires for >=10% moves (upbit only, to avoid dupes).
 */
async function generateContextAlerts(
  rows: {
    symbol: string;
    exchange: string;
    change_24h: number | null;
    volume_24h: number | null;
    kimchi_premium: number | null;
  }[]
) {
  try {
    // Surge/Dump alerts — only upbit to avoid duplicate alerts per symbol
    const upbitRows = rows.filter((r) => r.exchange === "upbit");

    for (const row of upbitRows) {
      const change = row.change_24h;
      if (change == null || Math.abs(change) < 10) continue;

      await saveContextAlert(
        createSurgeContext({
          symbol: row.symbol,
          change,
          volume: row.volume_24h ?? 0,
          kimchi: row.kimchi_premium,
          exchange: "upbit",
        })
      );
    }

    // Kimchi premium alert — once per cron cycle if avg >= 5%
    const premiums = upbitRows
      .map((r) => r.kimchi_premium)
      .filter((p): p is number => p != null);

    if (premiums.length > 0) {
      const avg = premiums.reduce((s, p) => s + p, 0) / premiums.length;
      if (avg >= 5) {
        const topRow = upbitRows.reduce(
          (best, r) =>
            (r.kimchi_premium ?? 0) > (best.kimchi_premium ?? 0) ? r : best,
          upbitRows[0]
        );

        await saveContextAlert(
          createKimchiContext({
            avgPremium: Math.round(avg * 100) / 100,
            topSymbol: topRow.symbol,
            topPremium: topRow.kimchi_premium ?? 0,
          })
        );
      }
    }
  } catch (err) {
    // Context alert generation failures are non-fatal
    console.error("[cron/fetch-korean-prices] Context alert error:", err);
  }
}

async function updateListedCoins(
  supabase: ReturnType<typeof createAdminClient>,
  upbitMarkets: UpbitMarket[],
  bithumbTickers: BithumbTicker[]
) {
  const upbitCoins = upbitMarkets.map((m) => ({
    exchange: "upbit",
    symbol: m.market.replace("KRW-", ""),
    market_code: m.market,
  }));

  const bithumbCoins = bithumbTickers.map((t) => ({
    exchange: "bithumb",
    symbol: t.symbol,
    market_code: `${t.symbol}_KRW`,
  }));

  const allCoins = [...upbitCoins, ...bithumbCoins];
  if (allCoins.length > 0) {
    await supabase
      .from("exchange_listed_coins")
      .upsert(allCoins, {
        onConflict: "exchange,market_code",
        ignoreDuplicates: true,
      });
  }
}
