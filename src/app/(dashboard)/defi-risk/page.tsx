"use client";

import {
  Loader2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercentage, timeAgo } from "@/lib/utils";
import { useStablecoins, useProtocols, useRiskEvents } from "@/hooks/use-defi";
import {
  DataTable,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  AlertBanner,
  Badge,
} from "@/components/ui";
import type { StablecoinPeg, DefiProtocolHealth, AlertEvent, RiskLevel } from "@/types";

const riskColors: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-signal-success/20", text: "text-signal-success", label: "Low Risk" },
  medium: { bg: "bg-signal-warning/20", text: "text-signal-warning", label: "Medium Risk" },
  high: { bg: "bg-signal-danger/20", text: "text-signal-danger", label: "High Risk" },
  critical: { bg: "bg-signal-danger/30", text: "text-signal-danger", label: "Critical" },
};

export default function DefiRiskPage() {
  const { stablecoins, warningCount, isLoading: stableLoading } = useStablecoins();
  const { protocols, isLoading: protoLoading } = useProtocols();
  const { events, isLoading: eventsLoading } = useRiskEvents();

  const isLoading = stableLoading || protoLoading || eventsLoading;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-[1440px] w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">DeFi Risk Monitor</h1>
          <span className="text-xs text-text-secondary font-num">
            Updated: {new Date().toISOString().slice(0, 19)} UTC
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 text-text-secondary animate-spin" />
          </div>
        ) : (
          <>
            {/* Warning Banner */}
            {warningCount > 0 && (
              <AlertBanner
                variant="warning"
                pulse
                title={`${warningCount} Stablecoin Warning${warningCount > 1 ? "s" : ""} Detected`}
              />
            )}

            {/* Stablecoin Table */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent-primary" />
                Stablecoin Peg Stability
              </h2>
              {stablecoins.length === 0 ? (
                <p className="text-sm text-text-secondary py-8 text-center">
                  No stablecoin data available.
                </p>
              ) : (
                <DataTable>
                  <TableHead>
                    <TableRow hoverable={false}>
                      <TableHeaderCell>Symbol</TableHeaderCell>
                      <TableHeaderCell align="right">Price</TableHeaderCell>
                      <TableHeaderCell align="right">24h Range</TableHeaderCell>
                      <TableHeaderCell align="right">Deviation%</TableHeaderCell>
                      <TableHeaderCell align="right">Reserve Ratio</TableHeaderCell>
                      <TableHeaderCell align="center">Status</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stablecoins.map((sc) => (
                      <StablecoinRow key={sc.id} coin={sc} />
                    ))}
                  </TableBody>
                </DataTable>
              )}
            </section>

            {/* Protocol Health */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                <ShieldAlert className="size-4 text-accent-primary" />
                Protocol Health
              </h2>
              {protocols.length === 0 ? (
                <p className="text-sm text-text-secondary py-8 text-center">
                  No protocol data available.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {protocols.map((proto) => (
                    <ProtocolCard key={proto.id} protocol={proto} />
                  ))}
                </div>
              )}
            </section>

            {/* Recent Risk Events */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                <AlertTriangle className="size-4 text-accent-primary" />
                Recent Risk Events
              </h2>
              {events.length === 0 ? (
                <p className="text-sm text-text-secondary py-8 text-center">
                  No risk events in the last 7 days.
                </p>
              ) : (
                <DataTable>
                  <TableHead>
                    <TableRow hoverable={false}>
                      <TableHeaderCell>Time</TableHeaderCell>
                      <TableHeaderCell>Event</TableHeaderCell>
                      <TableHeaderCell align="center">Severity</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.map((ev) => (
                      <RiskEventRow key={ev.id} event={ev} />
                    ))}
                  </TableBody>
                </DataTable>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Stablecoin Row ── */
function StablecoinRow({ coin }: { coin: StablecoinPeg }) {
  const isWarning = coin.status !== "normal";
  const deviationColor =
    Math.abs(coin.peg_deviation_pct) >= 0.3
      ? "text-signal-danger"
      : Math.abs(coin.peg_deviation_pct) >= 0.1
        ? "text-signal-warning"
        : "text-signal-success";

  return (
    <TableRow className={isWarning ? "bg-signal-warning/5" : undefined}>
      <TableCell>
        <span className="font-bold text-text-primary">{coin.symbol}</span>
      </TableCell>
      <TableCell align="right" mono className={isWarning ? "text-signal-warning" : ""}>
        ${coin.current_price.toFixed(4)}
      </TableCell>
      <TableCell align="right" mono className="text-text-secondary text-xs">
        {coin.price_24h_low.toFixed(3)} – {coin.price_24h_high.toFixed(3)}
      </TableCell>
      <TableCell align="right" mono className={deviationColor}>
        {formatPercentage(coin.peg_deviation_pct)}
      </TableCell>
      <TableCell align="right" mono>
        {coin.reserve_ratio ? `${(coin.reserve_ratio * 100).toFixed(1)}%` : "–"}
      </TableCell>
      <TableCell align="center">
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
            coin.status === "normal"
              ? "bg-signal-success/20 text-signal-success"
              : coin.status === "warning"
                ? "bg-signal-warning/20 text-signal-warning"
                : "bg-signal-danger/20 text-signal-danger"
          )}
        >
          {coin.status}
        </span>
      </TableCell>
    </TableRow>
  );
}

/* ── Protocol Card ── */
function ProtocolCard({ protocol }: { protocol: DefiProtocolHealth }) {
  const risk = riskColors[protocol.risk_level];

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border-default rounded-lg p-5",
        protocol.anomaly_detected && "border-signal-warning/30"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-text-primary">{protocol.protocol_name}</h3>
          <p className="text-[11px] text-text-secondary uppercase">
            {protocol.chain}
          </p>
        </div>
        <span
          className={cn(
            "px-2 py-1 rounded text-[10px] font-bold uppercase border",
            risk.bg,
            risk.text,
            `border-current/30`
          )}
        >
          {risk.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-bg-primary/50 rounded border border-border-default/50">
          <span className="text-[10px] text-text-secondary uppercase block mb-1">
            Total Value Locked
          </span>
          <span className="text-base font-num font-bold">
            {formatCurrency(protocol.tvl_usd)}
          </span>
        </div>
        <div className="p-3 bg-bg-primary/50 rounded border border-border-default/50">
          <span className="text-[10px] text-text-secondary uppercase block mb-1">
            TVL 24h Change
          </span>
          <span
            className={cn(
              "text-base font-num font-bold",
              protocol.tvl_change_24h >= 0
                ? "text-signal-success"
                : "text-signal-danger"
            )}
          >
            {formatPercentage(protocol.tvl_change_24h)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-text-secondary">Last Audit:</span>
          <span className="text-text-primary font-medium">
            {protocol.last_audit && protocol.audit_firm
              ? `${protocol.audit_firm} (${new Date(protocol.last_audit).toLocaleDateString("en", { month: "short", year: "numeric" })})`
              : "Not audited"}
          </span>
        </div>
        {protocol.anomaly_detected && protocol.anomaly_description && (
          <div className="pt-2 mt-1 border-t border-border-default">
            <p className="text-signal-warning text-xs">
              {protocol.anomaly_description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Risk Event Row ── */
function RiskEventRow({ event }: { event: AlertEvent }) {
  return (
    <TableRow>
      <TableCell mono className="text-text-secondary text-xs whitespace-nowrap">
        {timeAgo(event.created_at)}
      </TableCell>
      <TableCell>
        <p className="text-sm text-text-primary">{event.title}</p>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
          {event.description}
        </p>
      </TableCell>
      <TableCell align="center">
        <Badge variant={event.severity}>{event.severity.toUpperCase()}</Badge>
      </TableCell>
    </TableRow>
  );
}
