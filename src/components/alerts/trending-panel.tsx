"use client";

import { Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { usePrices, getTopMovers } from "@/hooks/use-prices";

export function TrendingPanel() {
  const { prices, isLoading } = usePrices(50);
  const topMovers = getTopMovers(prices, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Movers</CardTitle>
        <span className="text-[11px] text-text-secondary">24h change</span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
          </div>
        ) : topMovers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-text-secondary">
            <TrendingUp className="size-5 mb-2" />
            <p className="text-[11px]">No price data yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topMovers.map((token, idx) => {
              const change = token.price_change_24h ?? 0;
              const isPositive = change >= 0;

              return (
                <div
                  key={token.token_id}
                  className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  <span className="text-[11px] text-text-disabled w-4 font-num">
                    {idx + 1}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center text-[11px] font-bold text-text-primary shrink-0">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-text-primary">
                        {token.symbol}
                      </span>
                      <span
                        className={cn(
                          "font-num text-[12px] font-medium",
                          isPositive
                            ? "text-signal-success"
                            : "text-signal-danger"
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {change.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-text-secondary font-num">
                      ${token.current_price >= 1
                        ? token.current_price.toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })
                        : token.current_price.toFixed(4)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
