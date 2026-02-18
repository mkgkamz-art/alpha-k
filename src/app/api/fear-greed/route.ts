/**
 * GET /api/fear-greed
 *
 * Crypto Fear & Greed Index (from alternative.me)
 */

import { NextResponse } from "next/server";
import { withCache } from "@/lib/api-error-handler";

export async function GET() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      signal: AbortSignal.timeout(5_000),
      next: { revalidate: 300 }, // 5 min cache
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const entry = data?.data?.[0];
    if (!entry) throw new Error("No data");

    const value = Number(entry.value);
    return withCache(
      NextResponse.json({
        value,
        classification: entry.value_classification,
        label: getFearGreedLabel(value),
      }),
      300,
      600
    );
  } catch {
    return NextResponse.json({ value: null, label: "데이터 없음" });
  }
}

function getFearGreedLabel(value: number): string {
  if (value <= 25) return "극단적 공포";
  if (value <= 45) return "공포";
  if (value <= 55) return "중립";
  if (value <= 75) return "탐욕";
  return "극단적 탐욕";
}
