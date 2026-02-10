"use client";

import { useState } from "react";
import {
  AlertCard,
  AlertFilter,
  TrendingPanel,
  WhalePanel,
} from "@/components/alerts";
import { StatusBar } from "@/components/layout/status-bar";
import type { AlertType, Severity } from "@/types";

interface MockAlert {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  tags: string[];
  time: string;
  isRead: boolean;
  isBookmarked: boolean;
}

const mockAlerts: MockAlert[] = [
  {
    id: "1",
    type: "whale",
    severity: "critical",
    title: "1,250 BTC moved from Binance to unknown wallet",
    description:
      "Large withdrawal detected. Wallet 0x7a25...8f3d received 1,250 BTC ($121.5M) from Binance hot wallet. This wallet has been accumulating since January.",
    tags: ["BTC", "Binance", "CEX Outflow"],
    time: "2m ago",
    isRead: false,
    isBookmarked: false,
  },
  {
    id: "2",
    type: "risk",
    severity: "high",
    title: "USDC peg deviation warning: -0.12%",
    description:
      "USDC trading at $0.9988 across major exchanges. Deviation has persisted for 15 minutes. Reserve ratio monitoring triggered.",
    tags: ["USDC", "Stablecoin", "Peg"],
    time: "5m ago",
    isRead: false,
    isBookmarked: true,
  },
  {
    id: "3",
    type: "price_signal",
    severity: "medium",
    title: "ETH Buy Signal — Confidence 78%",
    description:
      "Technical analysis indicates bullish reversal pattern forming on 1D timeframe. RSI oversold bounce at key support $3,400.",
    tags: ["ETH", "Buy", "1D"],
    time: "12m ago",
    isRead: false,
    isBookmarked: false,
  },
  {
    id: "4",
    type: "token_unlock",
    severity: "high",
    title: "ARB Token Unlock: 92.65M ARB in 3 days",
    description:
      "Arbitrum investor unlock scheduled for Feb 13. 92.65M ARB ($113.9M) representing 3.4% of circulating supply. Impact score: 8.2/10.",
    tags: ["ARB", "Investor", "3.4% Supply"],
    time: "18m ago",
    isRead: true,
    isBookmarked: false,
  },
  {
    id: "5",
    type: "whale",
    severity: "medium",
    title: "Smart Money accumulating SOL",
    description:
      "3 wallets identified as smart money addresses have purchased 125K SOL ($24.8M) in the past 2 hours. Wallets historically 73% accurate.",
    tags: ["SOL", "Smart Money", "Accumulation"],
    time: "25m ago",
    isRead: false,
    isBookmarked: false,
  },
  {
    id: "6",
    type: "liquidity",
    severity: "critical",
    title: "Aave V3 ETH pool utilization at 94%",
    description:
      "Borrowing demand surge has pushed ETH pool utilization to critical levels. Current borrow APY: 12.3%. Liquidation cascades possible above $3,600.",
    tags: ["Aave", "ETH", "Utilization"],
    time: "32m ago",
    isRead: true,
    isBookmarked: true,
  },
  {
    id: "7",
    type: "risk",
    severity: "medium",
    title: "New DeFi protocol anomaly: SushiSwap TVL drop -8%",
    description:
      "SushiSwap experienced unusual TVL decrease of $45M in the past 4 hours. No known exploit reported. Monitoring whale withdrawals from liquidity pools.",
    tags: ["SushiSwap", "TVL", "Anomaly"],
    time: "41m ago",
    isRead: true,
    isBookmarked: false,
  },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState<AlertType | "all">("all");
  const [alerts, setAlerts] = useState(mockAlerts);

  const filteredAlerts =
    filter === "all" ? alerts : alerts.filter((a) => a.type === filter);

  const handleBookmark = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, isBookmarked: !a.isBookmarked } : a
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status Bar */}
      <StatusBar
        items={[
          { label: "BTC", value: "$97,234.50", change: "+2.34%", positive: true },
          { label: "ETH", value: "$3,456.12", change: "-0.87%", positive: false },
          { label: "Gas", value: "23 Gwei", change: "-12%", positive: true },
          { label: "Active Alerts", value: "47" },
          { label: "SOL", value: "$198.45", change: "+5.12%", positive: true },
          { label: "Fear & Greed", value: "72 Greed" },
        ]}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Alert Feed — Left */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="px-4 md:px-6">
            <AlertFilter active={filter} onChange={setFilter} />
          </div>
          <div className="px-4 md:px-6 pb-6 space-y-3">
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                {...alert}
                onBookmark={handleBookmark}
              />
            ))}
            {filteredAlerts.length === 0 && (
              <div className="flex items-center justify-center h-32 text-text-secondary text-[14px]">
                No alerts matching this filter
              </div>
            )}
          </div>
        </div>

        {/* Side Panel — Right (desktop only) */}
        <aside className="hidden lg:block w-[360px] border-l border-border-default overflow-y-auto p-4 space-y-4">
          <TrendingPanel />
          <WhalePanel />
        </aside>
      </div>
    </div>
  );
}
