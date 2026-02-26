/**
 * Cron: Sync surge data to radar_signals + KimchiDetector (every 2 minutes)
 *
 * 1. Fetch latest korean_prices with surge-level changes
 * 2. KimchiDetector — 통계 기반 김프 감지
 * 3. Insert/upsert scored signals into radar_signals
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { calculateRadarScore } from "@/lib/radar-scoring";
import { upsertRadarSignal } from "@/lib/detectors/dedup";
import { detectKimchiPremium } from "@/lib/detectors/kimchi-detector";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const admin = createAdminClient();
    let surgeCount = 0;
    let kimchiCount = 0;

    // ── 1. Surge detection from korean_prices ──
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
    const { data: prices } = await admin
      .from("korean_prices")
      .select("symbol, exchange, price_krw, change_24h, volume_24h, kimchi_premium")
      .gte("fetched_at", twoHoursAgo)
      .order("fetched_at", { ascending: false });

    if (prices && prices.length > 0) {
      // Deduplicate by symbol across exchanges — keep highest |change|
      const bestBySymbol = new Map<
        string,
        (typeof prices)[number]
      >();
      for (const p of prices) {
        const existing = bestBySymbol.get(p.symbol);
        if (
          !existing ||
          Math.abs(p.change_24h ?? 0) > Math.abs(existing.change_24h ?? 0)
        ) {
          bestBySymbol.set(p.symbol, p);
        }
      }
      const unique = Array.from(bestBySymbol.values());

      // Filter for significant moves (>= 10% change)
      const surges = unique.filter(
        (p) => p.change_24h != null && Math.abs(p.change_24h) >= 10,
      );

      for (const s of surges) {
        const change = s.change_24h ?? 0;
        const { score, strength } = calculateRadarScore({
          type: "surge",
          data: { changePercent: change, volume: s.volume_24h ?? 0 },
        });

        const direction = change > 0 ? "급등" : "급락";
        await upsertRadarSignal(admin, {
          signal_type: "surge",
          token_symbol: s.symbol,
          score,
          strength,
          title: `${s.symbol} ${direction} ${Math.abs(change).toFixed(1)}% (${s.exchange === "upbit" ? "업비트" : "빗썸"})`,
          description: `24시간 변동률 ${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
          data_snapshot: {
            change_24h: change,
            volume_24h: s.volume_24h,
            price_krw: s.price_krw,
            exchange: s.exchange,
          },
          source: "cron/radar-surge-sync",
          price_at_signal: s.price_krw ?? undefined,
        });
        surgeCount++;
      }
    }

    // ── 2. Kimchi premium — 통계 기반 KimchiDetector ──
    try {
      const result = await detectKimchiPremium(admin);
      kimchiCount = result.detected;
    } catch (err) {
      console.warn("[cron/radar-surge-sync] KimchiDetector error:", err);
    }

    console.log(
      `[cron/radar-surge-sync] ${surgeCount} surges, ${kimchiCount} kimchi in ${Date.now() - started}ms`,
    );

    return NextResponse.json({
      success: true,
      surgeCount,
      kimchiCount,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/radar-surge-sync] Error:", err);
    return NextResponse.json(
      { error: "Failed to sync radar signals" },
      { status: 500 },
    );
  }
}
