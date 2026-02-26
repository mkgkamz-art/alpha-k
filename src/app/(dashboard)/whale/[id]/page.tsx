"use client";

import { useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Fish,
  Heart,
  Loader2,
  Lock,
  Users,
  Zap,
} from "lucide-react";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  useWhaleDetail,
  useFollowWhale,
  useUnfollowWhale,
} from "@/hooks/use-whale-tracker";
import type { WhaleDetailResponse, SerializedTrade } from "@/lib/whale-api";

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  S: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  A: { bg: "bg-zinc-400/15", text: "text-zinc-300", border: "border-zinc-400/30" },
  B: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
  C: { bg: "bg-zinc-600/15", text: "text-zinc-500", border: "border-zinc-600/30" },
};

function timeAgoKR(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function WhaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, error } = useWhaleDetail(id);
  const followMut = useFollowWhale();
  const unfollowMut = useUnfollowWhale();

  const isForbidden = error && (error as { status?: number }).status === 403;

  const handleFollow = useCallback(() => {
    if (!user || !data) return;
    if (data.data.is_followed) {
      unfollowMut.mutate(id);
    } else {
      followMut.mutate(id);
    }
  }, [user, data, id, followMut, unfollowMut]);

  // Forbidden — free user can't access this whale
  if (isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
        <Lock className="w-12 h-12 text-text-disabled mb-4" />
        <h2 className="text-lg font-bold text-text-primary mb-2">
          Pro 전용 콘텐츠
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          이 고래 프로필은 Pro 멤버만 확인할 수 있습니다
        </p>
        <Link
          href="/billing"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Pro 업그레이드
        </Link>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-3 text-xs text-text-secondary hover:text-text-primary"
        >
          ← 돌아가기
        </button>
      </div>
    );
  }

  // Loading
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-6 h-6 text-text-secondary animate-spin" />
        <span className="ml-2 text-sm text-text-secondary">
          고래 프로필 로딩 중...
        </span>
      </div>
    );
  }

  const { whale, portfolio, recent_trades, is_followed } = data.data;
  const tierStyle = TIER_STYLES[whale.tier] ?? TIER_STYLES.C;
  const profile = whale.profile as Record<string, string | number | string[]>;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 max-w-3xl w-full mx-auto space-y-5">
        {/* Back + Follow */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </button>
          {user && (
            <button
              type="button"
              onClick={handleFollow}
              disabled={followMut.isPending || unfollowMut.isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                is_followed
                  ? "bg-signal-danger/10 text-signal-danger"
                  : "bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20",
              )}
            >
              <Heart
                className={cn("w-3.5 h-3.5", is_followed && "fill-current")}
              />
              {is_followed ? "팔로잉" : "팔로우"}
            </button>
          )}
        </div>

        {/* Profile header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Fish className="w-8 h-8 text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary truncate">
                  {whale.label}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded text-[12px] font-bold border",
                    tierStyle.bg,
                    tierStyle.text,
                    tierStyle.border,
                  )}
                >
                  {whale.tier}
                </span>
              </div>
              {whale.address && (
                <p className="text-xs text-text-disabled font-mono mt-0.5">
                  {whale.address} · {whale.chain}
                </p>
              )}
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox
              label="30일 수익률"
              value={formatPercentage(whale.return_30d_pct)}
              positive={whale.return_30d_pct >= 0}
            />
            <StatBox
              label="승률"
              value={`${(whale.win_rate_30d * 100).toFixed(0)}%`}
              positive={whale.win_rate_30d >= 0.5}
            />
            <StatBox
              label="거래 (30일)"
              value={`${whale.total_trades_30d}회`}
              neutral
            />
            <StatBox
              label="팔로워"
              value={whale.follower_count.toLocaleString()}
              neutral
              icon={<Users className="w-3 h-3" />}
            />
          </div>
        </div>

        {/* Trading profile */}
        {profile && Object.keys(profile).length > 0 && (
          <section className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
              트레이딩 프로필
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {profile.trading_style && (
                <ProfileItem
                  label="스타일"
                  value={String(profile.trading_style)}
                />
              )}
              {profile.avg_hold_days != null && (
                <ProfileItem
                  label="평균 보유"
                  value={`${profile.avg_hold_days}일`}
                />
              )}
              {profile.avg_profit_pct != null && (
                <ProfileItem
                  label="평균 익절"
                  value={formatPercentage(Number(profile.avg_profit_pct))}
                />
              )}
              {profile.avg_loss_pct != null && (
                <ProfileItem
                  label="평균 손절"
                  value={formatPercentage(Number(profile.avg_loss_pct))}
                />
              )}
              {Array.isArray(profile.preferred_sectors) && (
                <ProfileItem
                  label="선호 섹터"
                  value={(profile.preferred_sectors as string[]).join(", ")}
                />
              )}
              {profile.portfolio_size_usd != null && (
                <ProfileItem
                  label="포트폴리오 규모"
                  value={formatCurrency(Number(profile.portfolio_size_usd))}
                />
              )}
            </div>
          </section>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <section className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
              현재 포트폴리오
            </h3>

            {/* Stacked bar */}
            <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden flex mb-3">
              {portfolio.slice(0, 6).map((p, i) => {
                const COLORS = [
                  "#F0B90B",
                  "#1E88E5",
                  "#0ECB81",
                  "#F6465D",
                  "#9945FF",
                  "#627EEA",
                ];
                return (
                  <div
                    key={p.coin_symbol}
                    className="h-full"
                    style={{
                      width: `${p.weight_pct}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                );
              })}
            </div>

            {/* Holdings list */}
            <div className="space-y-2">
              {portfolio.map((p) => (
                <div
                  key={p.coin_symbol}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-text-primary">
                      {p.coin_symbol}
                    </span>
                    <span className="text-text-disabled truncate">
                      {p.coin_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-text-secondary">
                      {p.weight_pct.toFixed(0)}%
                    </span>
                    <span className="font-mono text-text-primary">
                      {formatCurrency(p.value_usd)}
                    </span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        p.unrealized_pnl_pct >= 0
                          ? "text-signal-success"
                          : "text-signal-danger",
                      )}
                    >
                      {formatPercentage(p.unrealized_pnl_pct)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent trades */}
        {recent_trades.length > 0 && (
          <section className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
              최근 매매
            </h3>
            <div className="space-y-2">
              {recent_trades.map((t) => (
                <CompactTradeRow key={t.id} trade={t} />
              ))}
            </div>
          </section>
        )}

        {/* Return stats */}
        <section className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
            기간별 수익률
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <ReturnCard label="7일" value={whale.return_7d_pct} />
            <ReturnCard label="30일" value={whale.return_30d_pct} />
            <ReturnCard label="90일" value={whale.return_90d_pct} />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════ */

function StatBox({
  label,
  value,
  positive,
  neutral,
  icon,
}: {
  label: string;
  value: string;
  positive?: boolean;
  neutral?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3">
      <p className="text-[10px] text-text-disabled uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="flex items-center gap-1">
        {icon}
        <p
          className={cn(
            "text-lg font-bold font-mono",
            neutral
              ? "text-text-primary"
              : positive
                ? "text-signal-success"
                : "text-signal-danger",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-text-disabled text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className="text-text-primary font-medium mt-0.5">{value}</p>
    </div>
  );
}

function ReturnCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-tertiary rounded-lg p-3 text-center">
      <p className="text-[10px] text-text-disabled mb-1">{label}</p>
      <p
        className={cn(
          "text-lg font-bold font-mono",
          value >= 0 ? "text-signal-success" : "text-signal-danger",
        )}
      >
        {formatPercentage(value)}
      </p>
    </div>
  );
}

const CompactTradeRow = memo(function CompactTradeRow({
  trade,
}: {
  trade: SerializedTrade;
}) {
  const isBuy = trade.trade_type === "buy";
  return (
    <div className="flex items-center gap-2 text-xs py-1.5">
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          isBuy ? "bg-signal-success" : "bg-signal-danger",
        )}
      />
      <span className="text-text-disabled w-16 shrink-0">
        {timeAgoKR(trade.created_at)}
      </span>
      <span
        className={cn(
          "font-medium w-6 shrink-0",
          isBuy ? "text-signal-success" : "text-signal-danger",
        )}
      >
        {isBuy ? "매수" : "매도"}
      </span>
      <span className="font-mono font-bold text-text-primary">
        {trade.coin_symbol}
      </span>
      <span className="font-mono text-text-primary ml-auto shrink-0">
        {formatCurrency(trade.value_usd)}
      </span>
      {trade.realized_pnl_pct != null && trade.realized_pnl_pct !== 0 && (
        <span
          className={cn(
            "font-mono font-bold shrink-0",
            trade.realized_pnl_pct > 0
              ? "text-signal-success"
              : "text-signal-danger",
          )}
        >
          ({formatPercentage(trade.realized_pnl_pct)})
        </span>
      )}
    </div>
  );
});
