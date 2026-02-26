/**
 * Twitter API v2 client (Bearer Token auth).
 * Docs: https://developer.twitter.com/en/docs/twitter-api
 *
 * Required env: TWITTER_BEARER_TOKEN
 * Rate limit: 450 req/15min (recent search)
 */

const TWITTER_API = "https://api.twitter.com/2";
const REQUEST_TIMEOUT_MS = 10_000;

/* ── Types ── */

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  /** Public metrics (likes, retweets, replies) */
  metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
}

export interface TweetSearchResult {
  tweets: Tweet[];
  totalCount: number;
}

/* ── Sentiment Keywords ── */

const POSITIVE_KEYWORDS = [
  "moon", "pump", "bullish", "breakout", "ath", "buy",
  "surge", "rocket", "explode", "fomo", "gem", "100x",
  "🚀", "🔥", "💎", "📈",
];

const NEGATIVE_KEYWORDS = [
  "crash", "dump", "bearish", "scam", "rug", "sell",
  "collapse", "tank", "plunge", "rekt", "dead",
  "💀", "📉", "🔻",
];

/* ── API Functions ── */

function getToken(): string {
  return process.env.TWITTER_BEARER_TOKEN ?? "";
}

/**
 * Search recent tweets (last 7 days) for a given query.
 */
export async function searchRecentTweets(
  query: string,
  maxResults = 100,
): Promise<TweetSearchResult> {
  const token = getToken();
  if (!token) {
    console.warn("[twitter] TWITTER_BEARER_TOKEN not set");
    return { tweets: [], totalCount: 0 };
  }

  const params = new URLSearchParams({
    query: `${query} -is:retweet lang:en`,
    max_results: String(Math.min(100, Math.max(10, maxResults))),
    "tweet.fields": "created_at,author_id,public_metrics",
  });

  try {
    const res = await fetch(
      `${TWITTER_API}/tweets/search/recent?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!res.ok) {
      if (res.status === 429) {
        console.warn("[twitter] Rate limited");
      }
      return { tweets: [], totalCount: 0 };
    }

    const data = await res.json();
    const tweets: Tweet[] = (data.data ?? []).map(
      (t: {
        id: string;
        text: string;
        created_at: string;
        author_id: string;
        public_metrics?: {
          like_count: number;
          retweet_count: number;
          reply_count: number;
        };
      }) => ({
        id: t.id,
        text: t.text,
        created_at: t.created_at,
        author_id: t.author_id,
        metrics: t.public_metrics ?? undefined,
      }),
    );

    const totalCount = data.meta?.result_count ?? tweets.length;

    return { tweets, totalCount };
  } catch (err) {
    console.warn("[twitter] Search error:", err);
    return { tweets: [], totalCount: 0 };
  }
}

/**
 * Simple keyword-based sentiment analysis.
 * Returns: { positiveRatio, negativeRatio, neutralRatio }
 */
export function analyzeSentiment(tweets: Tweet[]): {
  positiveRatio: number;
  negativeRatio: number;
  neutralRatio: number;
} {
  if (tweets.length === 0) {
    return { positiveRatio: 0, negativeRatio: 0, neutralRatio: 1 };
  }

  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const tweet of tweets) {
    const lower = tweet.text.toLowerCase();
    const hasPositive = POSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
    const hasNegative = NEGATIVE_KEYWORDS.some((kw) => lower.includes(kw));

    if (hasPositive && !hasNegative) positive++;
    else if (hasNegative && !hasPositive) negative++;
    else neutral++;
  }

  const total = tweets.length;
  return {
    positiveRatio: Math.round((positive / total) * 100) / 100,
    negativeRatio: Math.round((negative / total) * 100) / 100,
    neutralRatio: Math.round((neutral / total) * 100) / 100,
  };
}

/**
 * Get tweet count for a query in the last N hours.
 * Uses search endpoint and counts results.
 */
export async function getTweetCount(
  query: string,
  lastHours = 1,
): Promise<number> {
  const token = getToken();
  if (!token) return 0;

  const startTime = new Date(
    Date.now() - lastHours * 60 * 60 * 1000,
  ).toISOString();

  const params = new URLSearchParams({
    query: `${query} -is:retweet`,
    start_time: startTime,
    max_results: "100",
    "tweet.fields": "created_at",
  });

  try {
    const res = await fetch(
      `${TWITTER_API}/tweets/search/recent?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );

    if (!res.ok) return 0;

    const data = await res.json();
    return data.meta?.result_count ?? 0;
  } catch {
    return 0;
  }
}
