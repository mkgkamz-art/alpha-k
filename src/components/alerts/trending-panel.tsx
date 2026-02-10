"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface TrendingToken {
  rank: number;
  symbol: string;
  name: string;
  price: string;
  change: number;
  alerts: number;
}

const mockTrending: TrendingToken[] = [
  { rank: 1, symbol: "BTC", name: "Bitcoin", price: "$97,234", change: 2.34, alerts: 12 },
  { rank: 2, symbol: "ETH", name: "Ethereum", price: "$3,456", change: -0.87, alerts: 8 },
  { rank: 3, symbol: "SOL", name: "Solana", price: "$198.45", change: 5.12, alerts: 15 },
  { rank: 4, symbol: "ARB", name: "Arbitrum", price: "$1.23", change: -3.45, alerts: 6 },
  { rank: 5, symbol: "LINK", name: "Chainlink", price: "$18.67", change: 1.89, alerts: 4 },
];

export function TrendingPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trending Tokens</CardTitle>
        <span className="text-[11px] text-text-secondary">24h alerts</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {mockTrending.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center gap-3 py-2 px-2 rounded-[6px] hover:bg-bg-tertiary transition-colors cursor-pointer"
            >
              <span className="text-[11px] text-text-disabled w-4 font-num">
                {token.rank}
              </span>
              <div className="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center text-[11px] font-bold text-text-primary shrink-0">
                {token.symbol.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-text-primary">
                    {token.symbol}
                  </span>
                  <span className="font-num text-[13px] text-text-primary">
                    {token.price}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] text-text-secondary">
                    {token.alerts} alerts
                  </span>
                  <span
                    className={cn(
                      "font-num text-[11px] flex items-center gap-0.5",
                      token.change >= 0
                        ? "text-signal-success"
                        : "text-signal-danger"
                    )}
                  >
                    {token.change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {token.change >= 0 ? "+" : ""}
                    {token.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
