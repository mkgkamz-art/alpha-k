"use client";

import { Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface WhaleMovement {
  token: string;
  amount: string;
  direction: "in" | "out";
  exchange: string;
  time: string;
}

const mockWhaleMovements: WhaleMovement[] = [
  { token: "BTC", amount: "1,250 BTC", direction: "out", exchange: "Binance", time: "2m" },
  { token: "ETH", amount: "15,000 ETH", direction: "in", exchange: "Coinbase", time: "5m" },
  { token: "SOL", amount: "450K SOL", direction: "out", exchange: "OKX", time: "8m" },
  { token: "USDT", amount: "$50M", direction: "in", exchange: "Kraken", time: "12m" },
  { token: "ETH", amount: "8,200 ETH", direction: "out", exchange: "Binance", time: "15m" },
];

export function WhalePanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-alert-whale" />
          Whale Movements
        </CardTitle>
        <span className="text-[11px] text-text-secondary">Last 1h</span>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {mockWhaleMovements.map((movement, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-2 rounded-[6px] hover:bg-bg-tertiary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-1.5 h-6 rounded-full",
                    movement.direction === "in"
                      ? "bg-signal-success"
                      : "bg-signal-danger"
                  )}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-text-primary font-num">
                      {movement.amount}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-secondary">
                    {movement.direction === "in" ? "→" : "←"}{" "}
                    {movement.exchange}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-text-disabled font-num">
                {movement.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
