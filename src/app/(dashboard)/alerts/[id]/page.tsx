"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  Loader2,
  Waves,
  AlertTriangle,
  TrendingUp,
  Unlock,
  Droplets,
  ExternalLink,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo, formatCurrency, formatNumber } from "@/lib/utils";
import { useAlertDetail } from "@/hooks/use-alert-detail";
import { AlertDetail } from "@/components/alerts/alert-detail";
import { AlertCard } from "@/components/alerts/alert-card";
import { SeverityBadge } from "@/components/alerts/severity-badge";
import type { AlertType, AlertEvent } from "@/types";

/* ── Type → Icon map ── */
const typeIcons: Record<AlertType, typeof Waves> = {
  whale: Waves,
  risk: AlertTriangle,
  price_signal: TrendingUp,
  token_unlock: Unlock,
  liquidity: Droplets,
};

/* ── Parse metadata for transaction details ── */
function parseTxMeta(alert: AlertEvent) {
  const meta = (alert.metadata ?? {}) as Record<string, unknown>;

  const from = meta.from_address
    ? {
        label: (meta.from_label as string) ?? "Unknown",
        tag: (meta.from_tag as string) ?? "Wallet",
        tagColor: (meta.from_tag_color as "purple" | "warning" | "info" | "success" | "neutral") ?? "neutral",
        address: meta.from_address as string,
        subtext: (meta.from_subtext as string) ?? "",
      }
    : undefined;

  const to = meta.to_address
    ? {
        label: (meta.to_label as string) ?? "Unknown",
        tag: (meta.to_tag as string) ?? "Wallet",
        tagColor: (meta.to_tag_color as "purple" | "warning" | "info" | "success" | "neutral") ?? "neutral",
        address: meta.to_address as string,
        subtext: (meta.to_subtext as string) ?? "",
      }
    : undefined;

  const txMeta: { label: string; value: string; href?: string }[] = [];
  if (meta.value_usd) txMeta.push({ label: "Value", value: formatCurrency(meta.value_usd as number) });
  if (meta.tx_hash)
    txMeta.push({
      label: "TxHash",
      value: `${(meta.tx_hash as string).slice(0, 10)}...`,
      href: meta.tx_explorer_url as string | undefined,
    });
  if (meta.block_number) txMeta.push({ label: "Block", value: `#${meta.block_number}` });
  if (meta.gas_used) txMeta.push({ label: "Gas", value: `${meta.gas_used} Gwei` });

  const impactScore = meta.impact_score as number | undefined;
  const impactMetrics = Array.isArray(meta.impact_metrics)
    ? (meta.impact_metrics as { label: string; value: string; trend: "up" | "down" | "neutral" }[])
    : [];

  return { from, to, txMeta, impactScore, impactMetrics };
}

/* ── Context Panel: Recent Wallet History ── */
function WalletHistoryPanel({ metadata }: { metadata: Record<string, unknown> }) {
  const history = Array.isArray(metadata.wallet_history)
    ? (metadata.wallet_history as { type: string; age: string; value: string }[])
    : [];

  if (history.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
        <Clock className="size-4 text-text-secondary" />
        <h3 className="text-text-primary font-medium text-sm">Recent Wallet History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default text-text-secondary text-xs">
              <th className="px-6 py-3 text-left font-medium">Type</th>
              <th className="px-6 py-3 text-left font-medium">Age</th>
              <th className="px-6 py-3 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border-default/50 last:border-0 hover:bg-bg-tertiary/30 transition-colors"
              >
                <td className="px-6 py-3 text-text-primary">{row.type}</td>
                <td className="px-6 py-3 text-text-secondary font-num">{row.age}</td>
                <td className="px-6 py-3 text-right text-text-primary font-num">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Context Panel: 30-Day Activity ── */
function ActivityPanel({ metadata }: { metadata: Record<string, unknown> }) {
  const activity = Array.isArray(metadata.activity_30d)
    ? (metadata.activity_30d as { label: string; value: number }[])
    : [];

  if (activity.length === 0) return null;

  const maxValue = Math.max(...activity.map((d) => d.value), 1);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border-default flex items-center gap-2">
        <BarChart3 className="size-4 text-text-secondary" />
        <h3 className="text-text-primary font-medium text-sm">30-Day Activity</h3>
      </div>
      <div className="p-6">
        <div className="flex items-end gap-1 h-32">
          {activity.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-accent-secondary/60 rounded-t hover:bg-accent-secondary transition-colors"
                style={{ height: `${(d.value / maxValue) * 100}%`, minHeight: 2 }}
              />
              {i % 5 === 0 && (
                <span className="text-[10px] text-text-disabled font-num">{d.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Similar Wallets Panel ── */
function SimilarWalletsPanel({ metadata }: { metadata: Record<string, unknown> }) {
  const wallets = Array.isArray(metadata.similar_wallets)
    ? (metadata.similar_wallets as { label: string; address: string; similarity: string }[])
    : [];

  if (wallets.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
      <h3 className="text-text-primary font-medium text-sm mb-4 flex items-center gap-2">
        <Waves className="size-4 text-signal-info" />
        Similar Wallets
      </h3>
      <div className="flex flex-col gap-3">
        {wallets.map((w, i) => (
          <div
            key={i}
            className="bg-bg-primary border border-border-default rounded p-3 flex items-center justify-between"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm text-text-primary">{w.label}</span>
              <span className="text-xs text-text-secondary font-num">
                {w.address.slice(0, 6)}...{w.address.slice(-4)}
              </span>
            </div>
            <span className="text-xs text-accent-secondary font-num">{w.similarity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Related Alerts Section ── */
function RelatedAlerts({ alerts }: { alerts: AlertEvent[] }) {
  const router = useRouter();
  if (alerts.length === 0) return null;

  return (
    <div>
      <h3 className="text-text-primary font-medium text-sm mb-4">Related Alerts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            id={alert.id}
            type={alert.type}
            severity={alert.severity}
            title={alert.title}
            description={alert.description}
            time={timeAgo(alert.created_at)}
            isRead={alert.is_read}
            isBookmarked={alert.is_bookmarked}
            onClick={(id) => router.push(`/alerts/${id}`)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useAlertDetail(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-6 text-text-secondary animate-spin" />
      </div>
    );
  }

  if (error || !data?.alert) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-text-secondary text-sm">Alert not found</p>
        <button
          type="button"
          onClick={() => router.push("/alerts")}
          className="text-accent-primary text-sm hover:underline"
        >
          Back to Alerts
        </button>
      </div>
    );
  }

  const { alert, related } = data;
  const metadata = (alert.metadata ?? {}) as Record<string, unknown>;
  const { from, to, txMeta, impactScore, impactMetrics } = parseTxMeta(alert);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">
        {/* Breadcrumb — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-2 text-xs text-text-secondary">
          <Link href="/" className="hover:text-text-primary transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/alerts" className="hover:text-text-primary transition-colors">
            Alerts
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-text-primary">Alert Detail</span>
        </nav>

        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="md:hidden flex items-center gap-2 text-text-secondary text-sm"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        {/* Alert Detail — Hero + Transaction Flow + Impact */}
        <AlertDetail
          id={alert.id}
          type={alert.type}
          severity={alert.severity}
          title={alert.title}
          description={alert.description}
          time={timeAgo(alert.created_at)}
          from={from}
          to={to}
          txMeta={txMeta}
          impactScore={impactScore}
          impactMetrics={impactMetrics}
          onTrackWallet={
            from?.address
              ? () => {
                  window.open(
                    `https://etherscan.io/address/${from.address}`,
                    "_blank"
                  );
                }
              : undefined
          }
        />

        {/* Context Panels: Wallet History + 30-Day Activity */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <WalletHistoryPanel metadata={metadata} />
            <ActivityPanel metadata={metadata} />
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <SimilarWalletsPanel metadata={metadata} />
          </div>
        </div>

        {/* Related Alerts */}
        <RelatedAlerts alerts={related} />
      </div>
    </div>
  );
}
