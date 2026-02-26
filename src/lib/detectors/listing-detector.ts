/**
 * Listing Detector — 신규 상장 감지기 (강화)
 *
 * 기존 detect-listings 크론 로직 래핑 + Binance 공지 추가
 * 점수: 업비트 KRW=95, 바이낸스=90, 빗썸 KRW=85, 기타=60
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { calculateRadarScore } from "@/lib/radar-scoring";
import { upsertRadarSignal, applyMultiTypeBonus } from "./dedup";
import { matchHistoricalPattern } from "./historical-matcher";

const TAG = "[listing-detector]";

interface ListingCandidate {
  symbol: string;
  tokenName: string | null;
  exchange: string;
  market: string;
  listedAt: string;
}

/**
 * new_listings 테이블에서 최근 10분 내 신규 상장 조회.
 */
async function getRecentListings(
  admin: SupabaseClient<Database>,
  withinMinutes = 10,
): Promise<ListingCandidate[]> {
  const since = new Date(
    Date.now() - withinMinutes * 60_000,
  ).toISOString();

  const { data } = await admin
    .from("new_listings")
    .select("symbol, coin_name, exchange, market_code, detected_at")
    .gte("detected_at", since)
    .order("detected_at", { ascending: false });

  if (!data) return [];

  return data.map((d) => ({
    symbol: d.symbol,
    tokenName: d.coin_name,
    exchange: d.exchange,
    market: d.market_code,
    listedAt: d.detected_at,
  }));
}

/**
 * Binance 공지에서 신규 상장 감지 (공개 API).
 * announcements API: https://www.binance.com/bapi/composite/v1/public/cms/article/list/query
 */
async function checkBinanceAnnouncements(): Promise<ListingCandidate[]> {
  try {
    const res = await fetch(
      "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=5",
      { signal: AbortSignal.timeout(10_000) },
    );

    if (!res.ok) return [];

    const data = await res.json();
    const articles = data?.data?.catalogs?.[0]?.articles ?? [];
    const listings: ListingCandidate[] = [];

    for (const article of articles) {
      const title: string = article.title ?? "";
      // "Binance Will List XXX (YYY)" 패턴 매칭
      const match = title.match(/Will List\s+(.+?)\s*\((\w+)\)/i);
      if (match) {
        const tokenName = match[1].trim();
        const symbol = match[2].toUpperCase();

        // 1시간 이내 공지만
        const releaseDate = new Date(article.releaseDate ?? 0);
        if (Date.now() - releaseDate.getTime() > 60 * 60_000) continue;

        listings.push({
          symbol,
          tokenName,
          exchange: "binance",
          market: `${symbol}USDT`,
          listedAt: releaseDate.toISOString(),
        });
      }
    }

    return listings;
  } catch (err) {
    console.warn(TAG, "Binance announcements error:", err);
    return [];
  }
}

/**
 * 메인: 신규 상장 감지 + 시그널 생성
 */
export async function detectListings(
  admin: SupabaseClient<Database>,
): Promise<{ detected: number }> {
  // 1. DB에서 최근 상장 조회
  const dbListings = await getRecentListings(admin);

  // 2. Binance 공지 체크
  const binanceListings = await checkBinanceAnnouncements();

  // 3. 합치기 + 중복 제거
  const allListings = [...dbListings, ...binanceListings];
  const seen = new Set<string>();
  const unique = allListings.filter((l) => {
    const key = `${l.symbol}-${l.exchange}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let detected = 0;

  for (const listing of unique) {
    const { score, strength } = calculateRadarScore({
      type: "listing",
      data: { exchange: listing.exchange },
    });

    const pattern = await matchHistoricalPattern(
      admin,
      "listing",
      score,
      listing.symbol,
    );

    const exchangeLabel =
      listing.exchange === "upbit"
        ? "업비트"
        : listing.exchange === "bithumb"
          ? "빗썸"
          : listing.exchange === "binance"
            ? "바이낸스"
            : listing.exchange;

    const { id } = await upsertRadarSignal(admin, {
      signal_type: "listing",
      token_symbol: listing.symbol,
      token_name: listing.tokenName,
      score,
      strength,
      title: `${listing.symbol} ${exchangeLabel} 신규 상장 🆕`,
      description: `${exchangeLabel} ${listing.market} 마켓 상장${listing.tokenName ? ` (${listing.tokenName})` : ""}`,
      data_snapshot: {
        exchange: listing.exchange,
        market: listing.market,
        listed_at: listing.listedAt,
      },
      historical_pattern: pattern ?? undefined,
      source: "cron/detect-listings",
    });

    if (id) {
      await applyMultiTypeBonus(admin, listing.symbol, id, "listing");
      detected++;
    }
  }

  console.log(TAG, `${detected} listing signals from ${unique.length} listings`);
  return { detected };
}
