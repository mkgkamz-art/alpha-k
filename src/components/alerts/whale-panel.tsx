"use client";

import { Waves, Loader2, ArrowRight } from "lucide-react";
import { cn, formatCurrency, timeAgo, shortenAddress } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useWhaleEvents } from "@/hooks/use-alerts";

export function WhalePanel() {
  const { events, isLoading } = useWhaleEvents();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-accent-secondary" />
          Whale Movements
        </CardTitle>
        <span className="text-[11px] text-text-secondary">Last 24h</span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-text-secondary">
            <Waves className="size-5 mb-2" />
            <p className="text-[11px]">No whale movements detected</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="py-2 px-2 rounded-md hover:bg-bg-tertiary transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-text-primary font-num">
                      {formatAmount(event.amount, event.symbol)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        event.event_type === "exchange_deposit"
                          ? "bg-signal-danger/15 text-signal-danger"
                          : event.event_type === "exchange_withdrawal"
                            ? "bg-signal-success/15 text-signal-success"
                            : "bg-bg-tertiary text-text-secondary"
                      )}
                    >
                      {event.event_type === "exchange_deposit"
                        ? "Deposit"
                        : event.event_type === "exchange_withdrawal"
                          ? "Withdrawal"
                          : "Transfer"}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-secondary font-num">
                    {formatCurrency(event.usd_value, 1)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-text-secondary">
                  <span title={event.from_address} className="truncate max-w-20">
                    {event.from_label !== "Unknown Wallet"
                      ? event.from_label
                      : shortenAddress(event.from_address)}
                  </span>
                  <ArrowRight className="w-3 h-3 shrink-0 text-text-disabled" />
                  <span title={event.to_address} className="truncate max-w-20">
                    {event.to_label !== "Unknown Wallet"
                      ? event.to_label
                      : shortenAddress(event.to_address)}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] text-text-disabled">
                    {timeAgo(event.detected_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatAmount(amount: number, symbol: string): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M ${symbol}`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount).toLocaleString()} ${symbol}`;
  }
  return `${amount.toFixed(2)} ${symbol}`;
}
