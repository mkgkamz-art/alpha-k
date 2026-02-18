"use client";

import { useState, memo } from "react";
import Link from "next/link";
import {
  Loader2,
  RefreshCw,
  Flame,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  useKimchiPremium,
  useKimchiHistory,
  type KimchiPriceRow,
} from "@/hooks/use-kimchi";
import { useSurge } from "@/hooks/use-surge";

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */

const SORT_OPTIONS = [
  { value: "premium_desc", label: "김프 높은순" },
  { value: "premium_asc", label: "김프 낮은순" },
  { value: "volume_desc", label: "거래대금순" },
];

const CHART_SYMBOLS = ["BTC", "ETH", "XRP", "SOL", "DOGE"];
const CHART_PERIODS = [
  { value: "24h", label: "24시간" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
];

function formatVolume(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}조`;
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`;
  if (value >= 10_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  return `${(value / 10_000).toFixed(0)}만`;
}

function getPremiumColor(premium: number): string {
  if (premium >= 10) return "text-red-400";
  if (premium >= 5) return "text-orange-400";
  if (premium >= 2) return "text-amber-300";
  if (premium >= 0) return "text-zinc-300";
  return "text-blue-400";
}

function getPremiumRowBg(premium: number): string {
  if (premium >= 10) return "bg-red-500/5";
  if (premium >= 5) return "bg-orange-500/5";
  return "";
}

/* ═══════════════════════════════════════════════
   Interpretation logic
   ═══════════════════════════════════════════════ */

interface KimchiInterpretation {
  emoji: string;
  title: string;
  color: string;
  description: string;
}

function getKimchiInterpretation(avgPremium: number): KimchiInterpretation {
  if (avgPremium >= 10)
    return {
      emoji: "🔴",
      color: "text-red-400",
      title: "극단적 과열",
      description:
        "김프 10% 이상은 역사적으로 상위 5% 수준. 2021년 불마켓 수준의 국내 과열. 해외 대비 심각한 고평가. 신규 매수 극도로 주의.",
    };
  if (avgPremium >= 5)
    return {
      emoji: "🟠",
      color: "text-orange-400",
      title: "과열 주의",
      description:
        "국내 수요가 해외보다 강한 상태. 대규모 자금 유입 또는 특정 이벤트(규제 변화, 거래소 프로모션) 가능성. 추격 매수 리스크 높음.",
    };
  if (avgPremium >= 2)
    return {
      emoji: "🟡",
      color: "text-amber-300",
      title: "보통 수준",
      description:
        "평균 범위(2-3%) 내. 한국 시장의 구조적 프리미엄(송금 제한, 수급 비대칭) 반영. 정상적인 시장 상황.",
    };
  if (avgPremium >= 0)
    return {
      emoji: "⚪",
      color: "text-zinc-300",
      title: "낮은 김프",
      description:
        "글로벌 가격과 거의 동일. 차익거래 기회 제한적. 시장이 안정적이거나 국내 수요가 약한 상태.",
    };
  return {
    emoji: "🔵",
    color: "text-blue-400",
    title: "역프리미엄 (디스카운트)",
    description:
      "한국 가격이 글로벌보다 저렴. 매우 드문 상황. 대규모 매도 압력 또는 글로벌 급등 시 국내 반응 지연 가능성.",
  };
}

/* ═══════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════ */

export default function KimchiPage() {
  const [sort, setSort] = useState("premium_desc");
  const [chartSymbol, setChartSymbol] = useState("BTC");
  const [chartPeriod, setChartPeriod] = useState("24h");

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } =
    useKimchiPremium(sort);

  const items = data?.data ?? [];
  const avgPremium = data?.avgPremium ?? 0;
  const usdKrwRate = data?.usdKrwRate ?? null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 space-y-5 max-w-360 w-full mx-auto">
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              🇰🇷 김치프리미엄
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              한국 거래소 vs 글로벌 가격차 실시간 모니터
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-1.5 rounded-md hover:bg-bg-secondary transition-colors"
              aria-label="새로고침"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isFetching && "animate-spin")}
              />
            </button>
            {dataUpdatedAt > 0 && (
              <span className="tabular-nums">
                {new Date(dataUpdatedAt).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
          </div>
        ) : (
          <>
            {/* ── Hero Section ── */}
            <KimchiHero avgPremium={avgPremium} usdKrwRate={usdKrwRate} />

            {/* ── Main content: Chart + Surge widget ── */}
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="flex-1 lg:w-[70%]">
                <KimchiChart
                  symbol={chartSymbol}
                  period={chartPeriod}
                  onSymbolChange={setChartSymbol}
                  onPeriodChange={setChartPeriod}
                />
              </div>
              <div className="lg:w-[30%]">
                <SurgeSideWidget />
              </div>
            </div>

            {/* ── Full table ── */}
            <KimchiTableSection
              items={items}
              sort={sort}
              onSortChange={setSort}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Hero Section
   ═══════════════════════════════════════════════ */

function KimchiHero({
  avgPremium,
  usdKrwRate,
}: {
  avgPremium: number;
  usdKrwRate: number | null;
}) {
  const interp = getKimchiInterpretation(avgPremium);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-text-secondary mb-1">전 종목 평균 김프</p>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums",
              getPremiumColor(avgPremium)
            )}
          >
            {avgPremium >= 0 ? "+" : ""}
            {avgPremium.toFixed(2)}%
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {avgPremium > 0
              ? "한국 거래소 가격이 글로벌 대비 비쌈"
              : avgPremium < 0
                ? "한국 거래소 가격이 글로벌 대비 저렴"
                : "글로벌 가격과 동일"}
          </p>
        </div>

        <div className="sm:text-right space-y-2">
          <div className="flex items-center gap-2 sm:justify-end">
            <span>{interp.emoji}</span>
            <span className={cn("text-sm font-semibold", interp.color)}>
              {interp.title}
            </span>
          </div>
          <p className="text-xs text-text-secondary max-w-sm">
            {interp.description}
          </p>
          {usdKrwRate != null && (
            <p className="text-[11px] text-text-disabled mt-1">
              환율: $1 = ₩{usdKrwRate.toLocaleString("ko-KR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Kimchi Chart
   ═══════════════════════════════════════════════ */

function KimchiChart({
  symbol,
  period,
  onSymbolChange,
  onPeriodChange,
}: {
  symbol: string;
  period: string;
  onSymbolChange: (s: string) => void;
  onPeriodChange: (p: string) => void;
}) {
  const { data, isLoading } = useKimchiHistory(symbol, period);
  const points = data?.data ?? [];

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary">
            {symbol} 김프 추이
          </h3>
          <div className="flex items-center gap-0.5 ml-2">
            {CHART_SYMBOLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSymbolChange(s)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium transition-colors",
                  symbol === s
                    ? "bg-amber-500/15 text-amber-300"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-bg-tertiary rounded-lg">
          {CHART_PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onPeriodChange(p.value)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                period === p.value
                  ? "bg-bg-secondary text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
        </div>
      ) : points.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-sm text-text-disabled">
          <p>히스토리 데이터가 없습니다</p>
          <p className="text-xs mt-1">
            kimchi-history cron이 실행되면 데이터가 축적됩니다
          </p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#2B3139"
              />
              <XAxis
                dataKey="recorded_at"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#848E9C", fontSize: 10 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  if (period === "24h") {
                    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
                  }
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#848E9C", fontSize: 10 }}
                width={40}
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                y={0}
                stroke="#F6465D"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={5}
                stroke="#F0B90B"
                strokeDasharray="4 4"
                strokeOpacity={0.3}
                label={{
                  value: "5%",
                  position: "right",
                  fill: "#F0B90B",
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="premium_percent"
                stroke="#F0B90B"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#F0B90B" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const premium = payload[0].value;
  const d = label ? new Date(label) : null;
  return (
    <div className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 shadow-lg">
      {d && (
        <p className="text-text-secondary text-[10px] mb-1">
          {d.toLocaleString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
      <p
        className={cn(
          "text-sm font-bold tabular-nums",
          getPremiumColor(premium)
        )}
      >
        {premium >= 0 ? "+" : ""}
        {premium.toFixed(2)}%
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Full Table Section
   ═══════════════════════════════════════════════ */

function KimchiTableSection({
  items,
  sort,
  onSortChange,
}: {
  items: KimchiPriceRow[];
  sort: string;
  onSortChange: (s: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary">
          전 종목 김프 ({items.length}개)
        </h2>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-border-active cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_130px_130px_90px_100px] gap-2 px-4 py-2.5 border-b border-border-default text-[11px] text-text-secondary uppercase tracking-wider">
            <span>코인</span>
            <span className="text-right">한국 가격</span>
            <span className="text-right">글로벌 가격</span>
            <span className="text-right">김프</span>
            <span className="text-right">거래대금</span>
          </div>
          {items.map((item) => (
            <KimchiRow key={item.symbol} item={item} />
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {items.map((item) => (
          <KimchiCardMobile key={item.symbol} item={item} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Table Row (Desktop)
   ═══════════════════════════════════════════════ */

const KimchiRow = memo(function KimchiRow({
  item,
}: {
  item: KimchiPriceRow;
}) {
  const premium = Number(item.kimchi_premium);

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_130px_130px_90px_100px] gap-2 px-4 py-3 items-center border-b border-border-default/50 last:border-b-0",
        getPremiumRowBg(premium)
      )}
    >
      <span className="text-sm font-semibold text-text-primary">
        {item.symbol}
      </span>

      <span className="text-sm text-text-primary tabular-nums text-right">
        {Number(item.price_krw).toLocaleString("ko-KR")}원
      </span>

      <span className="text-sm text-text-secondary tabular-nums text-right">
        {item.price_usd != null
          ? `$${Number(item.price_usd).toLocaleString("en-US", { maximumFractionDigits: 4 })}`
          : "—"}
      </span>

      <span
        className={cn(
          "text-sm font-semibold tabular-nums text-right",
          getPremiumColor(premium)
        )}
      >
        {premium >= 0 ? "+" : ""}
        {premium.toFixed(2)}%
      </span>

      <span className="text-xs text-text-secondary tabular-nums text-right">
        {item.volume_24h != null ? formatVolume(Number(item.volume_24h)) : "—"}
      </span>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Mobile Card
   ═══════════════════════════════════════════════ */

const KimchiCardMobile = memo(function KimchiCardMobile({
  item,
}: {
  item: KimchiPriceRow;
}) {
  const premium = Number(item.kimchi_premium);

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border-default rounded-lg p-3",
        getPremiumRowBg(premium)
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-text-primary">
          {item.symbol}
        </span>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            getPremiumColor(premium)
          )}
        >
          {premium >= 0 ? "+" : ""}
          {premium.toFixed(2)}%
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <p className="text-text-primary tabular-nums">
            🇰🇷 {Number(item.price_krw).toLocaleString("ko-KR")}원
          </p>
          <p className="text-text-secondary tabular-nums">
            🌐{" "}
            {item.price_usd != null
              ? `$${Number(item.price_usd).toLocaleString("en-US", { maximumFractionDigits: 4 })}`
              : "—"}
          </p>
        </div>
        {item.volume_24h != null && (
          <span className="text-text-secondary tabular-nums">
            {formatVolume(Number(item.volume_24h))}
          </span>
        )}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   Surge Side Widget
   ═══════════════════════════════════════════════ */

function SurgeSideWidget() {
  const { data, isLoading } = useSurge(
    { exchange: "upbit", type: "pump" },
    30_000
  );
  const surges = data?.data?.slice(0, 5) ?? [];

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          지금 급등 중
        </h3>
        <Link
          href="/surge"
          className="text-[10px] text-accent-secondary hover:text-accent-secondary/80 flex items-center gap-0.5"
        >
          전체 보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
        </div>
      ) : surges.length === 0 ? (
        <p className="text-xs text-text-disabled py-4 text-center">
          현재 급등 코인 없음
        </p>
      ) : (
        <div className="space-y-2.5">
          {surges.map((s) => (
            <div
              key={s.symbol}
              className="flex items-center justify-between"
            >
              <span className="text-sm font-medium text-text-primary">
                {s.symbol}
              </span>
              <span className="text-sm font-semibold tabular-nums text-emerald-400">
                +{s.change_24h.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
