/**
 * GET /api/chirashi/tweets?coin=BTC — 최신 트윗 샘플 (Pro/Whale 전용)
 *
 * Twitter API v2 실시간 조회 → 감성 분석 포함.
 * 2분 캐시로 rate limit 보호.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withCache } from "@/lib/api-error-handler";
import { searchRecentTweets, analyzeSentiment } from "@/lib/exchanges/twitter";
import type { SubscriptionTier } from "@/types";

const COIN_QUERY_MAP: Record<string, string> = {
  BTC: "$BTC",
  ETH: "$ETH",
  XRP: "$XRP",
  SOL: "$SOL",
  DOGE: "$DOGE",
  ADA: "$ADA",
  AVAX: "$AVAX",
  DOT: "$DOT",
  LINK: "$LINK",
  ARB: "$ARB",
  OP: "$OP",
  SUI: "$SUI",
  APT: "$APT",
  NEAR: "$NEAR",
  UNI: "$UNI",
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const coin = url.searchParams.get("coin")?.toUpperCase();

    if (!coin || !COIN_QUERY_MAP[coin]) {
      return NextResponse.json(
        { error: "Invalid coin parameter" },
        { status: 400 },
      );
    }

    // Session auth → tier (Pro/Whale only)
    let tier: SubscriptionTier = "free";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("subscription_tier")
          .eq("id", user.id)
          .single();
        tier = (userData?.subscription_tier as SubscriptionTier) ?? "free";
      }
    } catch {
      // free
    }

    if (tier === "free") {
      return NextResponse.json(
        { error: "Pro 이상 구독이 필요합니다", upgrade: true },
        { status: 403 },
      );
    }

    // Fetch 10 recent tweets
    const query = COIN_QUERY_MAP[coin];
    const { tweets } = await searchRecentTweets(query, 10);
    const sentiment = analyzeSentiment(tweets);

    // Serialize tweets
    const serialized = tweets.slice(0, 5).map((t) => {
      const lower = t.text.toLowerCase();
      const isPositive = ["moon", "pump", "bullish", "breakout", "🚀", "🔥", "💎", "📈"].some((kw) => lower.includes(kw));
      const isNegative = ["crash", "dump", "bearish", "scam", "rug", "💀", "📉"].some((kw) => lower.includes(kw));

      return {
        id: t.id,
        text: t.text.slice(0, 280),
        created_at: t.created_at,
        likes: t.metrics?.like_count ?? 0,
        retweets: t.metrics?.retweet_count ?? 0,
        replies: t.metrics?.reply_count ?? 0,
        sentiment: isPositive ? "positive" : isNegative ? "negative" : "neutral",
      };
    });

    const res = NextResponse.json({
      coin,
      tweets: serialized,
      sentiment: {
        positive_pct: Math.round(sentiment.positiveRatio * 100),
        negative_pct: Math.round(sentiment.negativeRatio * 100),
        neutral_pct: Math.round(sentiment.neutralRatio * 100),
      },
    });

    return withCache(res, 120);
  } catch (err) {
    console.error("[chirashi/tweets] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch tweets" },
      { status: 500 },
    );
  }
}
