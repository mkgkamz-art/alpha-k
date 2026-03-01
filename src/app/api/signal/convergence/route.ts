/**
 * GET /api/signal/convergence
 *
 * 수렴 시그널 산출 API.
 * 3개 소스(레이더·고래·찌라시) 중 2개 이상이 동일 코인·동일 방향을 가리킬 때
 * "Alpha Signal"을 발행한다.
 *
 * 소스:
 *   - 레이더: radar_signals (non-buzz, score>=60, active, 24h)
 *   - 고래: whale_trades (6h)
 *   - 찌라시: radar_signals type=buzz (12h, score>=60) — jjirasi_posts 대체
 *
 * Alpha Score 가중:
 *   radar 35% + whale 40% + chirashi 25%
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/* ── Constants ── */

const RADAR_LOOKBACK_MS = 24 * 60 * 60_000;
const WHALE_LOOKBACK_MS = 6 * 60 * 60_000;
const BUZZ_LOOKBACK_MS = 12 * 60 * 60_000;
const MIN_RADAR_SCORE = 60;
const MIN_BUZZ_SCORE = 60;
const MIN_ALPHA_SCORE = 40;

type Direction = "buy" | "sell" | "neutral";

/* ── Response Types ── */

export interface AlphaSignalSource {
  active: boolean;
  direction: Direction;
  score: number;
  detail: string;
}

export interface AlphaSignal {
  id: string;
  coin_symbol: string;
  coin_name: string | null;
  direction: "buy" | "sell";
  alpha_score: number;
  convergence_count: number; // 2 = strong, 3 = perfect
  grade: "perfect" | "strong";
  strength_label: string;
  radar: AlphaSignalSource;
  whale: AlphaSignalSource;
  chirashi: AlphaSignalSource;
  created_at: string;
}

export interface ConvergenceResponse {
  signals: AlphaSignal[];
  meta: {
    computed_at: string;
    total: number;
    perfect_count: number;
    strong_count: number;
  };
}

/* ── Handler ── */

export async function GET() {
  try {
    const admin = createAdminClient();
    const now = Date.now();
    const nowIso = new Date().toISOString();

    // 1. Active radar signals (non-buzz, score>=60, last 24h, not expired)
    const { data: radarSignals } = await admin
      .from("radar_signals")
      .select("id, token_symbol, token_name, score, strength, signal_type, created_at")
      .gte("score", MIN_RADAR_SCORE)
      .eq("status", "active")
      .neq("signal_type", "buzz")
      .gte("created_at", new Date(now - RADAR_LOOKBACK_MS).toISOString())
      .gte("expires_at", nowIso);

    // 2. Buzz signals (chirashi proxy, last 12h, score>=60)
    const { data: buzzSignals } = await admin
      .from("radar_signals")
      .select("id, token_symbol, token_name, score, data_snapshot, created_at")
      .eq("signal_type", "buzz")
      .gte("score", MIN_BUZZ_SCORE)
      .gte("created_at", new Date(now - BUZZ_LOOKBACK_MS).toISOString());

    // 3. Whale trades (last 6h)
    const { data: whaleTrades } = await admin
      .from("whale_trades")
      .select("id, whale_id, coin_symbol, coin_name, trade_type, value_usd")
      .gte("created_at", new Date(now - WHALE_LOOKBACK_MS).toISOString());

    // 4. Whale tier lookup
    const whaleIds = [...new Set((whaleTrades ?? []).map((t) => t.whale_id))];
    const whaleTierMap = new Map<string, string>();
    if (whaleIds.length > 0) {
      const { data: whales } = await admin
        .from("whales")
        .select("id, tier")
        .in("id", whaleIds);
      (whales ?? []).forEach((w) => whaleTierMap.set(w.id, w.tier));
    }

    // 5. Collect all coin symbols
    const allSymbols = new Set<string>();
    (radarSignals ?? []).forEach((s) => allSymbols.add(s.token_symbol));
    (buzzSignals ?? []).forEach((s) => allSymbols.add(s.token_symbol));
    (whaleTrades ?? []).forEach((t) => allSymbols.add(t.coin_symbol));

    const alphaSignals: AlphaSignal[] = [];

    for (const symbol of allSymbols) {
      /* ─ Radar source ─ */
      const coinRadar = (radarSignals ?? [])
        .filter((s) => s.token_symbol === symbol)
        .sort((a, b) => b.score - a.score)[0];

      const radarActive = !!coinRadar;
      const radarScore = radarActive ? coinRadar.score : 0;
      // All current radar signals (surge/listing/volume/etc.) are bullish by nature
      const radarDirection: Direction = radarActive ? "buy" : "neutral";
      const radarDetail = radarActive
        ? `${coinRadar.signal_type} · ${coinRadar.score}점`
        : "-";

      /* ─ Chirashi (buzz) source ─ */
      const coinBuzz = (buzzSignals ?? [])
        .filter((s) => s.token_symbol === symbol)
        .sort((a, b) => b.score - a.score)[0];

      let buzzScore = 0;
      let buzzDirection: Direction = "neutral";
      let buzzActive = false;
      let buzzDetail = "-";

      if (coinBuzz) {
        const snap = (coinBuzz.data_snapshot ?? {}) as Record<string, unknown>;
        const positiveRatio =
          typeof snap.positive_ratio === "number" ? snap.positive_ratio : 0.5;
        const spikeRatio =
          typeof snap.spike_ratio === "number" ? snap.spike_ratio : 1;

        const viralBonus = spikeRatio > 3 ? 5 : 0;
        const sentimentBonus = positiveRatio > 0.75 ? 10 : 0;
        buzzScore = Math.min(coinBuzz.score + viralBonus + sentimentBonus, 100);

        if (positiveRatio > 0.55) buzzDirection = "buy";
        else if (positiveRatio < 0.45) buzzDirection = "sell";
        else buzzDirection = "neutral";

        buzzActive = buzzDirection !== "neutral";
        buzzDetail = `신뢰도 ${coinBuzz.score}점 · 긍정 ${Math.round(positiveRatio * 100)}%`;
      }

      /* ─ Whale source ─ */
      const coinTrades = (whaleTrades ?? []).filter(
        (t) => t.coin_symbol === symbol,
      );

      let whaleConvergenceScore = 0;
      let whaleDirection: Direction = "neutral";
      let whaleActive = false;
      let whaleDetail = "-";

      if (coinTrades.length > 0) {
        const buyTrades = coinTrades.filter((t) => t.trade_type === "buy");
        const sellTrades = coinTrades.filter((t) => t.trade_type === "sell");

        // Count unique whales per direction
        const buyWhaleIds = new Set(buyTrades.map((t) => t.whale_id));
        const sellWhaleIds = new Set(sellTrades.map((t) => t.whale_id));
        const buyCount = buyWhaleIds.size;
        const sellCount = sellWhaleIds.size;
        const totalUnique = new Set([...buyWhaleIds, ...sellWhaleIds]).size;

        if (buyCount === sellCount || totalUnique === 0) {
          whaleDirection = "neutral";
        } else if (buyCount > sellCount) {
          whaleDirection = "buy";
        } else {
          whaleDirection = "sell";
        }

        whaleActive = whaleDirection !== "neutral";

        if (whaleActive && totalUnique > 0) {
          const dominantCount =
            whaleDirection === "buy" ? buyCount : sellCount;
          const base = (dominantCount / totalUnique) * 60;

          // Tier bonus — check all involved whale IDs
          const allInvolvedIds =
            whaleDirection === "buy" ? buyWhaleIds : sellWhaleIds;
          let hasSWhale = false;
          let hasAWhale = false;
          allInvolvedIds.forEach((id) => {
            const tier = whaleTierMap.get(id) ?? "";
            if (tier === "s") hasSWhale = true;
            else if (tier === "a") hasAWhale = true;
          });
          const tierBonus = hasSWhale ? 20 : hasAWhale ? 10 : 0;

          // Volume bonus (net dominant-direction USD)
          const buyVol = buyTrades.reduce((s, t) => s + t.value_usd, 0);
          const sellVol = sellTrades.reduce((s, t) => s + t.value_usd, 0);
          const netVol = Math.abs(
            whaleDirection === "buy" ? buyVol - sellVol : sellVol - buyVol,
          );
          const volumeBonus =
            netVol >= 5_000_000 ? 20 : netVol >= 1_000_000 ? 10 : 0;

          whaleConvergenceScore = Math.min(base + tierBonus + volumeBonus, 100);

          const tierLabel = hasSWhale ? " (S급)" : hasAWhale ? " (A급)" : "";
          whaleDetail = `${buyCount}매수 ${sellCount}매도${tierLabel}`;
        }
      }

      /* ─ Convergence check ─ */
      const directions: Direction[] = [
        radarDirection,
        whaleDirection,
        buzzDirection,
      ];
      const buyCount = directions.filter((d) => d === "buy").length;
      const sellCount = directions.filter((d) => d === "sell").length;

      let finalDirection: Direction;
      let convergenceCount: number;
      if (buyCount >= 2) {
        finalDirection = "buy";
        convergenceCount = buyCount;
      } else if (sellCount >= 2) {
        finalDirection = "sell";
        convergenceCount = sellCount;
      } else {
        continue; // no convergence
      }

      /* ─ Alpha Score ─ */
      // Only include components that align with final direction
      const radarComp =
        radarDirection === finalDirection ? radarScore * 0.35 : 0;
      const whaleComp =
        whaleDirection === finalDirection ? whaleConvergenceScore * 0.4 : 0;
      const buzzComp =
        buzzDirection === finalDirection ? buzzScore * 0.25 : 0;
      const alphaScore = Math.round(radarComp + whaleComp + buzzComp);

      if (alphaScore < MIN_ALPHA_SCORE) continue;

      /* ─ Strength label ─ */
      let strengthLabel: string;
      if (finalDirection === "buy") {
        strengthLabel =
          alphaScore >= 80
            ? "강력 매수"
            : alphaScore >= 60
              ? "매수"
              : "약한 매수";
      } else {
        strengthLabel =
          alphaScore >= 80
            ? "강력 매도"
            : alphaScore >= 60
              ? "매도"
              : "약한 매도";
      }

      const coinName =
        coinRadar?.token_name ?? coinBuzz?.token_name ?? null;

      alphaSignals.push({
        id: `alpha-${symbol}-${now}`,
        coin_symbol: symbol,
        coin_name: coinName,
        direction: finalDirection as "buy" | "sell",
        alpha_score: alphaScore,
        convergence_count: convergenceCount,
        grade: convergenceCount >= 3 ? "perfect" : "strong",
        strength_label: strengthLabel,
        radar: {
          active: radarDirection === finalDirection,
          direction: radarDirection,
          score: radarScore,
          detail: radarDetail,
        },
        whale: {
          active: whaleDirection === finalDirection,
          direction: whaleDirection,
          score: Math.round(whaleConvergenceScore),
          detail: whaleDetail,
        },
        chirashi: {
          active: buzzDirection === finalDirection,
          direction: buzzDirection,
          score: Math.round(buzzScore),
          detail: buzzDetail,
        },
        created_at: nowIso,
      });
    }

    // Sort: perfect first, then by alpha_score DESC
    alphaSignals.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade === "perfect" ? -1 : 1;
      return b.alpha_score - a.alpha_score;
    });

    const response = NextResponse.json({
      signals: alphaSignals,
      meta: {
        computed_at: nowIso,
        total: alphaSignals.length,
        perfect_count: alphaSignals.filter((s) => s.grade === "perfect").length,
        strong_count: alphaSignals.filter((s) => s.grade === "strong").length,
      },
    } satisfies ConvergenceResponse);

    // 60s cache, 30s stale-while-revalidate
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=30",
    );
    return response;
  } catch (err) {
    console.error("[signal/convergence] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
