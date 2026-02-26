/**
 * Orderbook Detector — 호가벽 감지기
 *
 * 데이터소스: Upbit/Bithumb orderbook API (상/하 15-30호가)
 * 단일 호가 ≥ 전체 30% → 벽 감지
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getUpbitOrderbook, type UpbitOrderbook } from "@/lib/exchanges/upbit";
import { getUpbitMarkets } from "@/lib/exchanges/upbit";
import { calculateRadarScore } from "@/lib/radar-scoring";
import { upsertRadarSignal, applyMultiTypeBonus } from "./dedup";
import { matchHistoricalPattern } from "./historical-matcher";

const MIN_SCORE = 50;
const WALL_THRESHOLD = 0.3; // 단일 호가 ≥ 전체 30%
const TAG = "[orderbook-detector]";

interface WallDetection {
  symbol: string;
  side: "bid" | "ask"; // bid=매수벽, ask=매도벽
  wallPrice: number;
  wallSize: number;
  totalSize: number;
  wallRatio: number;
  currentPrice: number;
  priceProximityPercent: number;
}

/**
 * 단일 호가가 전체 물량의 WALL_THRESHOLD 이상인 벽 감지.
 */
function detectWalls(orderbooks: UpbitOrderbook[]): WallDetection[] {
  const walls: WallDetection[] = [];

  for (const ob of orderbooks) {
    const symbol = ob.market.replace("KRW-", "");
    const units = ob.orderbook_units;
    if (!units || units.length === 0) continue;

    // 현재가: 최고 매수가와 최저 매도가의 중간
    const currentPrice =
      units.length > 0
        ? (units[0].bid_price + units[0].ask_price) / 2
        : 0;

    if (currentPrice <= 0) continue;

    // 매수벽 체크
    const totalBid = ob.total_bid_size;
    if (totalBid > 0) {
      for (const unit of units) {
        const ratio = unit.bid_size / totalBid;
        if (ratio >= WALL_THRESHOLD) {
          const proximity =
            Math.abs(currentPrice - unit.bid_price) / currentPrice * 100;
          walls.push({
            symbol,
            side: "bid",
            wallPrice: unit.bid_price,
            wallSize: unit.bid_size,
            totalSize: totalBid,
            wallRatio: ratio,
            currentPrice,
            priceProximityPercent: proximity,
          });
        }
      }
    }

    // 매도벽 체크
    const totalAsk = ob.total_ask_size;
    if (totalAsk > 0) {
      for (const unit of units) {
        const ratio = unit.ask_size / totalAsk;
        if (ratio >= WALL_THRESHOLD) {
          const proximity =
            Math.abs(currentPrice - unit.ask_price) / currentPrice * 100;
          walls.push({
            symbol,
            side: "ask",
            wallPrice: unit.ask_price,
            wallSize: unit.ask_size,
            totalSize: totalAsk,
            wallRatio: ratio,
            currentPrice,
            priceProximityPercent: proximity,
          });
        }
      }
    }
  }

  return walls.sort((a, b) => b.wallRatio - a.wallRatio);
}

/**
 * 메인: 호가벽 감지 + 시그널 생성
 */
export async function detectOrderbookWalls(
  admin: SupabaseClient<Database>,
): Promise<{ detected: number }> {
  // Upbit 전체 마켓 호가 조회 (상위 30개만)
  let markets: string[];
  try {
    // 거래량 상위 마켓 가져오기 (korean_prices에서)
    const { data: topCoins } = await admin
      .from("korean_prices")
      .select("symbol")
      .eq("exchange", "upbit")
      .order("volume_24h", { ascending: false })
      .limit(30);

    markets = (topCoins ?? []).map((c) => `KRW-${c.symbol}`);
  } catch {
    // fallback: Upbit markets API
    const allMarkets = await getUpbitMarkets();
    markets = allMarkets.slice(0, 30).map((m) => m.market);
  }

  if (markets.length === 0) return { detected: 0 };

  let orderbooks: UpbitOrderbook[];
  try {
    orderbooks = await getUpbitOrderbook(markets);
  } catch (err) {
    console.error(TAG, "Orderbook fetch failed:", err);
    return { detected: 0 };
  }

  const walls = detectWalls(orderbooks);
  let detected = 0;

  for (const wall of walls) {
    const { score, strength } = calculateRadarScore({
      type: "orderbook",
      data: {
        wallRatio: wall.wallRatio,
        priceProximityPercent: wall.priceProximityPercent,
      },
    });

    if (score < MIN_SCORE) continue;

    const pattern = await matchHistoricalPattern(
      admin,
      "orderbook",
      score,
      wall.symbol,
    );

    const sideLabel = wall.side === "bid" ? "매수벽" : "매도벽";
    const emoji = wall.side === "bid" ? "🟢" : "🔴";
    const pctStr = (wall.wallRatio * 100).toFixed(0);

    const { id } = await upsertRadarSignal(admin, {
      signal_type: "orderbook",
      token_symbol: wall.symbol,
      score,
      strength,
      title: `${wall.symbol} ${sideLabel} 감지 ${emoji} (전체의 ${pctStr}%)`,
      description: `₩${wall.wallPrice.toLocaleString()} 호가에 전체 ${wall.side === "bid" ? "매수" : "매도"} 물량의 ${pctStr}% 집중`,
      data_snapshot: {
        side: wall.side,
        wall_price: wall.wallPrice,
        wall_size: wall.wallSize,
        total_size: wall.totalSize,
        wall_ratio: wall.wallRatio,
        price_proximity_percent: wall.priceProximityPercent,
      },
      historical_pattern: pattern ?? undefined,
      source: "cron/detect-orderbook",
      price_at_signal: wall.currentPrice,
    });

    if (id) {
      await applyMultiTypeBonus(admin, wall.symbol, id, "orderbook");
      detected++;
    }
  }

  console.log(TAG, `${detected} wall signals from ${walls.length} walls`);
  return { detected };
}
