"use client";

import { useQuery } from "@tanstack/react-query";

/* ── Types ── */

export interface TokenPriceRow {
  id: string;
  token_id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_1h: number | null;
  price_change_24h: number | null;
  price_change_7d: number | null;
  last_updated: string;
}

interface PricesResponse {
  prices: TokenPriceRow[];
}

/* ── Query Keys ── */

export const priceKeys = {
  all: ["prices"] as const,
  list: (limit: number) => ["prices", "list", limit] as const,
  byIds: (ids: string[]) => ["prices", "byIds", ids] as const,
};

/* ── Hook: Top market prices ── */

export function usePrices(limit = 20) {
  const query = useQuery<PricesResponse>({
    queryKey: priceKeys.list(limit),
    queryFn: async () => {
      const res = await fetch(`/api/prices?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch prices");
      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds — prices update every minute
    refetchInterval: 60 * 1000, // auto-refresh every 60s
  });

  return {
    prices: query.data?.prices ?? [],
    ...query,
  };
}

/* ── Helpers: Format StatusBar items from prices ── */

export function formatStatusBarItems(prices: TokenPriceRow[]) {
  // Show BTC, ETH, and overall market stats
  const btc = prices.find((p) => p.token_id === "bitcoin");
  const eth = prices.find((p) => p.token_id === "ethereum");
  const sol = prices.find((p) => p.token_id === "solana");
  const bnb = prices.find((p) => p.token_id === "binancecoin");

  const items: Array<{
    label: string;
    value: string;
    change?: string;
    positive?: boolean;
  }> = [];

  const formatPrice = (p: TokenPriceRow) => {
    if (p.current_price >= 1000) {
      return `$${p.current_price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    }
    if (p.current_price >= 1) {
      return `$${p.current_price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    }
    return `$${p.current_price.toFixed(4)}`;
  };

  const formatChange = (change: number | null) => {
    if (change === null) return undefined;
    return `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
  };

  if (btc) {
    items.push({
      label: "BTC",
      value: formatPrice(btc),
      change: formatChange(btc.price_change_24h),
      positive: (btc.price_change_24h ?? 0) >= 0,
    });
  }

  if (eth) {
    items.push({
      label: "ETH",
      value: formatPrice(eth),
      change: formatChange(eth.price_change_24h),
      positive: (eth.price_change_24h ?? 0) >= 0,
    });
  }

  if (sol) {
    items.push({
      label: "SOL",
      value: formatPrice(sol),
      change: formatChange(sol.price_change_24h),
      positive: (sol.price_change_24h ?? 0) >= 0,
    });
  }

  if (bnb) {
    items.push({
      label: "BNB",
      value: formatPrice(bnb),
      change: formatChange(bnb.price_change_24h),
      positive: (bnb.price_change_24h ?? 0) >= 0,
    });
  }

  // Total market cap (sum of all tokens as rough estimate)
  const totalMcap = prices.reduce((sum, p) => sum + p.market_cap, 0);
  if (totalMcap > 0) {
    const trillion = totalMcap / 1e12;
    items.push({
      label: "MCAP",
      value: `$${trillion.toFixed(2)}T`,
    });
  }

  return items;
}

/* ── Helpers: Top movers for TrendingPanel ── */

export function getTopMovers(prices: TokenPriceRow[], count = 5) {
  return [...prices]
    .filter((p) => p.price_change_24h !== null)
    .sort(
      (a, b) =>
        Math.abs(b.price_change_24h ?? 0) - Math.abs(a.price_change_24h ?? 0)
    )
    .slice(0, count);
}
