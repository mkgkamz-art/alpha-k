/**
 * Whale v1 API shared utilities.
 *
 * - Access control constants per tier
 * - Serialization helpers for ranking, detail, trades, hot coins
 */

import type { SubscriptionTier } from "@/types";
import type { Database } from "@/types/database.types";
import { shortenAddress } from "@/lib/utils";

/* ── Types ── */

type WhaleRow = Database["public"]["Tables"]["whales"]["Row"];
type PortfolioRow = Database["public"]["Tables"]["whale_portfolios"]["Row"];
type TradeRow = Database["public"]["Tables"]["whale_trades"]["Row"];
type HotCoinRow = Database["public"]["Tables"]["whale_hot_coins"]["Row"];

/* ── Access Control Constants ── */

export const FREE_WHALE_LIMIT = 3;
export const FREE_HOT_COIN_LIMIT = 3;
export const FREE_TRADE_LIMIT = 3;
export const FREE_PORTFOLIO_DELAY_MS = 24 * 60 * 60_000; // 24h
export const FREE_FOLLOW_LIMIT = 0;
export const PRO_FOLLOW_LIMIT = 10;

/* ── Follow Limit ── */

export function getFollowLimit(tier: SubscriptionTier): number {
  if (tier === "whale") return Infinity;
  if (tier === "pro") return PRO_FOLLOW_LIMIT;
  return FREE_FOLLOW_LIMIT;
}

/* ── Tier label ── */

const TIER_LABEL: Record<string, string> = {
  s: "S",
  a: "A",
  b: "B",
  c: "C",
};

/* ── Ranking Serialization ── */

export interface WhaleRankingItem {
  id: string;
  label: string;
  address_short: string;
  tier: string;
  return_7d_pct: number;
  return_30d_pct: number;
  return_90d_pct: number;
  win_rate_30d: number;
  total_trades_30d: number;
  follower_count: number;
  last_trade_at: string | null;
  last_trade_summary: {
    type: string;
    coin_symbol: string;
    value_usd: number;
    minutes_ago: number;
  } | null;
  top_holdings: { coin_symbol: string; weight_pct: number }[];
  profile: Record<string, unknown>;
  is_accessible: boolean;
}

export function serializeWhaleRanking(
  row: WhaleRow,
  tier: SubscriptionTier,
  rank: number,
  lastTrade?: TradeRow | null,
  topHoldings?: PortfolioRow[],
): WhaleRankingItem {
  const isAccessible = tier !== "free" || rank < FREE_WHALE_LIMIT;

  let lastTradeSummary: WhaleRankingItem["last_trade_summary"] = null;
  if (lastTrade) {
    const minutesAgo = Math.max(
      0,
      Math.floor((Date.now() - new Date(lastTrade.created_at).getTime()) / 60_000),
    );
    lastTradeSummary = {
      type: lastTrade.trade_type,
      coin_symbol: lastTrade.coin_symbol,
      value_usd: lastTrade.value_usd,
      minutes_ago: minutesAgo,
    };
  }

  return {
    id: row.id,
    label: row.label,
    address_short: shortenAddress(row.address),
    tier: TIER_LABEL[row.tier] ?? row.tier,
    return_7d_pct: row.return_7d_pct,
    return_30d_pct: row.return_30d_pct,
    return_90d_pct: row.return_90d_pct,
    win_rate_30d: row.win_rate_30d,
    total_trades_30d: row.total_trades_30d,
    follower_count: row.follower_count,
    last_trade_at: row.last_trade_at,
    last_trade_summary: isAccessible ? lastTradeSummary : null,
    top_holdings: isAccessible
      ? (topHoldings ?? []).slice(0, 3).map((h) => ({
          coin_symbol: h.coin_symbol,
          weight_pct: h.weight_pct,
        }))
      : [],
    profile: isAccessible
      ? (row.profile as Record<string, unknown>) ?? {}
      : {},
    is_accessible: isAccessible,
  };
}

/* ── Detail Serialization ── */

export interface WhaleDetailResponse {
  whale: {
    id: string;
    label: string;
    address: string | null;
    chain: string;
    tier: string;
    return_7d_pct: number;
    return_30d_pct: number;
    return_90d_pct: number;
    win_rate_30d: number;
    total_trades_30d: number;
    follower_count: number;
    profile: Record<string, unknown>;
  };
  portfolio: {
    coin_symbol: string;
    coin_name: string;
    weight_pct: number;
    value_usd: number;
    unrealized_pnl_pct: number;
    first_bought_at: string | null;
  }[];
  recent_trades: SerializedTrade[];
  is_followed: boolean;
}

export function serializeWhaleDetail(
  row: WhaleRow,
  tier: SubscriptionTier,
  portfolio: PortfolioRow[],
  trades: TradeRow[],
  isFollowed: boolean,
): WhaleDetailResponse {
  // Whale tier: full address; others: shortened
  const address =
    tier === "whale" ? row.address : shortenAddress(row.address);

  // Free: portfolio 24h delay filter
  const filteredPortfolio =
    tier === "free"
      ? portfolio.filter(
          (p) =>
            Date.now() - new Date(p.last_updated_at).getTime() >=
            FREE_PORTFOLIO_DELAY_MS,
        )
      : portfolio;

  // Free: trades limited to 3
  const limitedTrades =
    tier === "free" ? trades.slice(0, FREE_TRADE_LIMIT) : trades;

  return {
    whale: {
      id: row.id,
      label: row.label,
      address,
      chain: row.chain,
      tier: TIER_LABEL[row.tier] ?? row.tier,
      return_7d_pct: row.return_7d_pct,
      return_30d_pct: row.return_30d_pct,
      return_90d_pct: row.return_90d_pct,
      win_rate_30d: row.win_rate_30d,
      total_trades_30d: row.total_trades_30d,
      follower_count: row.follower_count,
      profile: (row.profile as Record<string, unknown>) ?? {},
    },
    portfolio: filteredPortfolio.map((p) => ({
      coin_symbol: p.coin_symbol,
      coin_name: p.coin_name,
      weight_pct: p.weight_pct,
      value_usd: p.value_usd,
      unrealized_pnl_pct: p.unrealized_pnl_pct,
      first_bought_at: p.first_bought_at,
    })),
    recent_trades: limitedTrades.map((t) => serializeTrade(t)),
    is_followed: isFollowed,
  };
}

/* ── Trade Serialization ── */

export interface SerializedTrade {
  id: string;
  whale_id: string;
  whale_label?: string;
  whale_tier?: string;
  trade_type: string;
  coin_symbol: string;
  coin_name: string;
  amount: number;
  value_usd: number;
  price: number;
  exchange_or_dex: string | null;
  realized_pnl_pct: number | null;
  created_at: string;
  minutes_ago: number;
}

export function serializeTrade(
  row: TradeRow,
  whaleRow?: WhaleRow | null,
): SerializedTrade {
  const minutesAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(row.created_at).getTime()) / 60_000),
  );

  return {
    id: row.id,
    whale_id: row.whale_id,
    ...(whaleRow && {
      whale_label: whaleRow.label,
      whale_tier: TIER_LABEL[whaleRow.tier] ?? whaleRow.tier,
    }),
    trade_type: row.trade_type,
    coin_symbol: row.coin_symbol,
    coin_name: row.coin_name,
    amount: row.amount,
    value_usd: row.value_usd,
    price: row.price,
    exchange_or_dex: row.exchange_or_dex,
    realized_pnl_pct: row.realized_pnl_pct,
    created_at: row.created_at,
    minutes_ago: minutesAgo,
  };
}

/* ── Hot Coin Serialization ── */

export interface SerializedHotCoin {
  coin_symbol: string;
  coin_name: string;
  buy_whale_count_24h: number;
  sell_whale_count_24h: number;
  net_buy_volume_usd_24h: number;
  top_buyers: string[];
  signal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
}

export function deriveSignal(
  buy: number,
  sell: number,
): SerializedHotCoin["signal"] {
  if (buy > sell * 2) return "strong_buy";
  if (buy > sell) return "buy";
  if (sell > buy * 2) return "strong_sell";
  if (sell > buy) return "sell";
  return "neutral";
}

export function serializeHotCoin(
  row: HotCoinRow,
  topBuyers: string[],
): SerializedHotCoin {
  return {
    coin_symbol: row.coin_symbol,
    coin_name: row.coin_name,
    buy_whale_count_24h: row.buy_whale_count_24h,
    sell_whale_count_24h: row.sell_whale_count_24h,
    net_buy_volume_usd_24h: row.net_buy_volume_usd_24h,
    top_buyers: topBuyers,
    signal: deriveSignal(row.buy_whale_count_24h, row.sell_whale_count_24h),
  };
}
