"use client";

import { memo, useState, useMemo } from "react";
import {
  Unlock,
  Calendar,
  Loader2,
  DollarSign,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Bell,
  ExternalLink,
  BarChart3,
  PieChart,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  List,
  LayoutGrid,
  Timer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercentage,
  timeAgo,
} from "@/lib/utils";
import {
  useUnlockDashboard,
  type EnrichedUnlock,
  type TopImpactUnlock,
  type CategoryBreakdown,
  type CalendarDay,
} from "@/hooks/use-unlock-dashboard";
import { useAuthStore } from "@/stores/auth-store";
import { AuthGate } from "@/components/auth-gate";
import { SurgeSideWidget, KimchiSideWidget } from "@/components/widgets";
import { FilterPills, Tag, Input } from "@/components/ui";
import { SEVERITY_BADGE } from "@/lib/constants";
import type { AlertEvent } from "@/types";

/* ── Constants ── */

const RANGE_OPTIONS = [
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
];

const VIEW_TABS = [
  { value: "timeline", label: "Timeline", icon: List },
  { value: "calendar", label: "Calendar", icon: LayoutGrid },
  { value: "table", label: "Table", icon: BarChart3 },
] as const;

type ViewTab = (typeof VIEW_TABS)[number]["value"];

const CATEGORY_CONFIG: Record<
  string,
  { color: string; badge: string; chartColor: string }
> = {
  investor: {
    color: "text-signal-danger",
    badge: "bg-signal-danger/10 text-signal-danger",
    chartColor: "#F6465D",
  },
  team: {
    color: "text-signal-warning",
    badge: "bg-signal-warning/10 text-signal-warning",
    chartColor: "#F0B90B",
  },
  ecosystem: {
    color: "text-signal-success",
    badge: "bg-signal-success/10 text-signal-success",
    chartColor: "#0ECB81",
  },
  public: {
    color: "text-signal-info",
    badge: "bg-signal-info/10 text-signal-info",
    chartColor: "#1E88E5",
  },
};

function getCategoryConfig(cat: string) {
  return (
    CATEGORY_CONFIG[cat] ?? {
      color: "text-text-secondary",
      badge: "bg-bg-tertiary text-text-secondary",
      chartColor: "#848E9C",
    }
  );
}

function getUrgencyConfig(daysUntil: number) {
  if (daysUntil <= 1)
    return {
      dot: "bg-signal-danger",
      pulse: true,
      text: "text-signal-danger font-bold",
      border: "border-signal-danger/40",
    };
  if (daysUntil <= 3)
    return {
      dot: "bg-signal-warning",
      pulse: false,
      text: "text-signal-warning font-bold",
      border: "border-signal-warning/30",
    };
  if (daysUntil <= 7)
    return {
      dot: "bg-accent-primary",
      pulse: false,
      text: "text-accent-primary",
      border: "border-border-default",
    };
  return {
    dot: "bg-text-secondary",
    pulse: false,
    text: "text-text-secondary",
    border: "border-border-default",
  };
}

function getImpactColor(score: number) {
  if (score >= 8) return "text-signal-danger";
  if (score >= 5) return "text-signal-warning";
  return "text-signal-success";
}

function getImpactBg(score: number) {
  if (score >= 8) return "bg-signal-danger";
  if (score >= 5) return "bg-signal-warning";
  return "bg-signal-success";
}

function formatCountdown(hoursUntil: number) {
  if (hoursUntil < 1) return "< 1h";
  if (hoursUntil < 24) return `${hoursUntil}h`;
  const d = Math.floor(hoursUntil / 24);
  const h = hoursUntil % 24;
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

/* ── Page ── */

export default function UnlocksPage() {
  const [range, setRange] = useState("30d");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewTab>("timeline");

  const { data, isLoading } = useUnlockDashboard(range, search);
  const overview = data?.overview;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-360 w-full mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold">Token Unlocks</h1>
            <p className="text-sm text-text-secondary">
              Upcoming vesting schedules and their market impact.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-44">
              <Input
                placeholder="Search token..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <FilterPills
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
            />
          </div>
        </div>

        {/* ── Section 1: Overview Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OverviewCard
            label="Unlocks This Week"
            value={`${overview?.weekCount ?? 0} events`}
            icon={Calendar}
            color="text-accent-primary"
          />
          <OverviewCard
            label="Total Value"
            value={formatCurrency(overview?.weekTotalValue ?? 0)}
            icon={DollarSign}
            color="text-signal-warning"
          />
          <OverviewCard
            label="Highest Impact"
            value={
              overview?.highestImpact
                ? `${overview.highestImpact.symbol} — ${overview.highestImpact.percentOfSupply}%`
                : "—"
            }
            icon={AlertTriangle}
            color={
              (overview?.highestImpact?.percentOfSupply ?? 0) > 5
                ? "text-signal-danger"
                : "text-signal-warning"
            }
            sub={
              overview?.highestImpact
                ? `Impact: ${overview.highestImpact.impactScore}/10`
                : undefined
            }
          />
          <NextUnlockCard
            symbol={overview?.nextUnlock?.symbol ?? null}
            hoursUntil={overview?.nextUnlock?.hoursUntil ?? null}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 text-text-secondary animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Section 2 & 3: Main + Sidebar ── */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main content (65%) */}
              <div className="flex-1 lg:w-[65%] flex flex-col gap-4">
                {/* View tabs */}
                <div className="flex items-center gap-1 bg-bg-secondary border border-border-default rounded-lg p-1">
                  {VIEW_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setView(tab.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        view === tab.value
                          ? "bg-bg-tertiary text-text-primary"
                          : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      <tab.icon className="size-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* View content */}
                {(data?.unlocks.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-text-secondary bg-bg-secondary rounded-lg border border-border-default">
                    <Unlock className="size-8 mb-2 text-text-disabled" />
                    <p className="text-sm">No unlocks in this period.</p>
                  </div>
                ) : view === "timeline" ? (
                  <TimelineView unlocks={data?.unlocks ?? []} />
                ) : view === "calendar" ? (
                  <CalendarView calendarData={data?.calendarData ?? []} />
                ) : (
                  <TableView unlocks={data?.unlocks ?? []} />
                )}
              </div>

              {/* Sidebar (35%) */}
              <div className="lg:w-[35%] flex flex-col gap-4">
                <HighImpactWidget items={data?.impact.topImpact ?? []} />
                <CategoryWidget
                  breakdown={data?.impact.categoryBreakdown ?? []}
                />
                <PriceCorrelationWidget
                  correlation={data?.impact.priceCorrelation ?? []}
                  avgChange={data?.impact.avgPriceChange ?? 0}
                />
                {/* Cross-navigation widgets (desktop) */}
                <div className="hidden lg:flex flex-col gap-4">
                  <SurgeSideWidget />
                  <KimchiSideWidget />
                </div>
              </div>
            </div>

            {/* ── Section 4: Alert Feed ── */}
            <AlertFeed alerts={data?.alertFeed ?? []} />

            {/* ── Mobile: 관련 기능 ── */}
            <div className="lg:hidden space-y-3">
              <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                관련 기능
              </h3>
              <SurgeSideWidget />
              <KimchiSideWidget />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Overview Card ── */

function OverviewCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: typeof Calendar;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", color)} />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <span className="text-base font-bold font-num text-text-primary truncate">
        {value}
      </span>
      {sub && (
        <span className="text-[10px] text-text-disabled">{sub}</span>
      )}
    </div>
  );
}

/* ── Next Unlock Card with countdown ── */

function NextUnlockCard({
  symbol,
  hoursUntil,
}: {
  symbol: string | null;
  hoursUntil: number | null;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Timer className="size-4 text-signal-info" />
        <span className="text-xs text-text-secondary">Next Unlock</span>
      </div>
      {symbol && hoursUntil !== null ? (
        <>
          <span className="text-base font-bold text-text-primary">
            {symbol}{" "}
            <span className="text-sm font-num text-accent-primary">
              in {formatCountdown(hoursUntil)}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <Clock className="size-3 text-text-disabled" />
            <span className="text-[10px] text-text-disabled font-num">
              Countdown active
            </span>
          </div>
        </>
      ) : (
        <span className="text-base font-bold text-text-disabled">—</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TIMELINE VIEW
   ═══════════════════════════════════════════ */

function TimelineView({ unlocks }: { unlocks: EnrichedUnlock[] }) {
  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, EnrichedUnlock[]>();
    for (const u of unlocks) {
      const dateStr = new Date(u.unlock_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const arr = map.get(dateStr) ?? [];
      arr.push(u);
      map.set(dateStr, arr);
    }
    return [...map.entries()];
  }, [unlocks]);

  return (
    <div className="flex flex-col gap-1">
      {grouped.map(([dateLabel, items]) => {
        const daysUntil = items[0].daysUntil;
        const dLabel =
          daysUntil <= 0
            ? "Today"
            : daysUntil === 1
              ? "Tomorrow"
              : `${daysUntil} days away`;

        return (
          <div key={dateLabel}>
            {/* Date header */}
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-border-default" />
              <span className="text-xs font-medium text-text-secondary shrink-0">
                {dateLabel}{" "}
                <span className="text-text-disabled">({dLabel})</span>
              </span>
              <div className="h-px flex-1 bg-border-default" />
            </div>

            {/* Events */}
            <div className="flex flex-col gap-3 pl-4 border-l-2 border-border-default ml-3">
              {items.map((u) => (
                <TimelineCard key={u.id} unlock={u} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TimelineCard = memo(function TimelineCard({
  unlock,
}: {
  unlock: EnrichedUnlock;
}) {
  const [expanded, setExpanded] = useState(false);
  const urgency = getUrgencyConfig(unlock.daysUntil);
  const catConfig = getCategoryConfig(unlock.category);
  const impactScore = Number(unlock.impact_score);

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute -left-5.25 top-4 w-2.5 h-2.5 rounded-full border-2 border-bg-primary",
          urgency.dot,
          urgency.pulse && "animate-pulse"
        )}
      />

      <div
        className={cn(
          "bg-bg-secondary border rounded-lg transition-all",
          urgency.border
        )}
      >
        {/* Main row */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <div className="flex-1 min-w-0">
            {/* Line 1: Token + D-day */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-text-primary">
                {unlock.token_symbol}
              </span>
              <span className="text-xs text-text-secondary">
                {unlock.token_name}
              </span>
              <span className={cn("text-xs font-num", urgency.text)}>
                {unlock.daysUntil <= 0
                  ? "TODAY"
                  : `D-${unlock.daysUntil}`}
              </span>
            </div>

            {/* Line 2: Amount + USD */}
            <p className="text-base font-num font-bold text-text-primary">
              {formatNumber(Number(unlock.amount))}{" "}
              {unlock.token_symbol}{" "}
              <span className="text-sm text-text-secondary">
                ({formatCurrency(Number(unlock.usd_value_estimate))})
              </span>
            </p>

            {/* Line 3: Supply % */}
            <p className="text-xs text-text-secondary mt-0.5">
              {Number(unlock.percent_of_supply).toFixed(1)}% of circulating
              supply
            </p>
          </div>

          {/* Right: category + impact + chevron */}
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                catConfig.badge
              )}
            >
              {unlock.category}
            </span>

            {/* Impact bar */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-14 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", getImpactBg(impactScore))}
                  style={{ width: `${(impactScore / 10) * 100}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-num font-bold",
                  getImpactColor(impactScore)
                )}
              >
                {impactScore}/10
              </span>
            </div>

            {expanded ? (
              <ChevronUp className="size-4 text-text-secondary" />
            ) : (
              <ChevronDown className="size-4 text-text-secondary" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 pt-0 border-t border-border-default">
            <div className="pt-3 flex flex-col gap-3">
              {/* Price info */}
              {unlock.currentPrice !== null && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] uppercase text-text-disabled">
                      Current Price
                    </span>
                    <p className="text-sm font-num font-bold text-text-primary">
                      {formatCurrency(unlock.currentPrice)}
                    </p>
                  </div>
                  {unlock.priceChange24h !== null && (
                    <div>
                      <span className="text-[10px] uppercase text-text-disabled">
                        24h Change
                      </span>
                      <p
                        className={cn(
                          "text-sm font-num font-bold",
                          unlock.priceChange24h >= 0
                            ? "text-signal-success"
                            : "text-signal-danger"
                        )}
                      >
                        {formatPercentage(unlock.priceChange24h)}
                      </p>
                    </div>
                  )}
                  {unlock.priceChange7d !== null && (
                    <div>
                      <span className="text-[10px] uppercase text-text-disabled">
                        7d Change
                      </span>
                      <p
                        className={cn(
                          "text-sm font-num font-bold",
                          unlock.priceChange7d >= 0
                            ? "text-signal-success"
                            : "text-signal-danger"
                        )}
                      >
                        {formatPercentage(unlock.priceChange7d)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Info tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <Tag color="neutral">
                  {new Date(unlock.unlock_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Tag>
                {Number(unlock.percent_of_supply) >= 5 && (
                  <Tag color="danger" uppercase>
                    High Supply Impact
                  </Tag>
                )}
                {unlock.is_notified_3d && (
                  <Tag color="info">D-3 Notified</Tag>
                )}
                {unlock.is_notified_1d && (
                  <Tag color="warning">D-1 Notified</Tag>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-1">
                <AuthGate message="Sign in to set unlock alerts">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary/10 text-accent-primary text-xs font-medium rounded-md hover:bg-accent-primary/20 transition-colors">
                    <Bell className="size-3.5" />
                    Set Alert
                  </button>
                </AuthGate>
                <a
                  href={`https://www.coingecko.com/en/coins/${unlock.token_name.toLowerCase().replace(/\s+/g, "-")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary text-text-secondary text-xs font-medium rounded-md hover:text-text-primary transition-colors"
                >
                  <ExternalLink className="size-3.5" />
                  Token Details
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════
   CALENDAR VIEW
   ═══════════════════════════════════════════ */

function CalendarView({ calendarData }: { calendarData: CalendarDay[] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const monthLabel = baseDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    for (const d of calendarData) {
      map.set(d.date, d);
    }
    return map;
  }, [calendarData]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonthOffset((m) => m - 1)}
          className="p-1 rounded text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-bold text-text-primary">
          {monthLabel}
        </span>
        <button
          onClick={() => setMonthOffset((m) => m + 1)}
          className="p-1 rounded text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] text-text-disabled font-medium py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-12" />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayData = calendarMap.get(dateStr);
          const isToday = dateStr === todayStr;

          const dotColor = dayData
            ? dayData.totalUsd >= 100_000_000
              ? "bg-signal-danger"
              : dayData.totalUsd >= 10_000_000
                ? "bg-signal-warning"
                : "bg-text-disabled"
            : "";

          return (
            <button
              key={dateStr}
              onClick={() => dayData && setSelectedDay(dayData)}
              className={cn(
                "h-12 rounded-md flex flex-col items-center justify-center gap-0.5 text-xs transition-colors relative",
                isToday && "ring-1 ring-accent-primary",
                dayData
                  ? "hover:bg-bg-tertiary cursor-pointer"
                  : "cursor-default",
                selectedDay?.date === dateStr && "bg-bg-tertiary"
              )}
            >
              <span
                className={cn(
                  "font-num",
                  isToday
                    ? "text-accent-primary font-bold"
                    : "text-text-secondary"
                )}
              >
                {day}
              </span>
              {dayData && (
                <div className="flex items-center gap-0.5">
                  {dayData.events.map((e, j) => (
                    <div
                      key={j}
                      className={cn("w-1.5 h-1.5 rounded-full", dotColor)}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day popover */}
      {selectedDay && (
        <div className="mt-3 p-3 bg-bg-tertiary rounded-lg border border-border-default">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-text-primary">
              {new Date(selectedDay.date + "T00:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" }
              )}
            </span>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-text-secondary hover:text-text-primary"
            >
              <ChevronUp className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {selectedDay.events.map((e, i) => {
              const cat = getCategoryConfig(e.category);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary">
                      {e.symbol}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                        cat.badge
                      )}
                    >
                      {e.category}
                    </span>
                  </div>
                  <span className="font-num text-text-primary">
                    {formatCurrency(e.usd)}
                  </span>
                </div>
              );
            })}
            <div className="text-[10px] text-text-disabled mt-1">
              Total: {formatCurrency(selectedDay.totalUsd)}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[9px] text-text-disabled">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-signal-danger" />
          {">$100M"}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-signal-warning" />
          {">$10M"}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-text-disabled" />
          {"<$10M"}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TABLE VIEW
   ═══════════════════════════════════════════ */

function TableView({ unlocks }: { unlocks: EnrichedUnlock[] }) {
  const [sortKey, setSortKey] = useState<string>("unlock_date");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    return [...unlocks].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "unlock_date":
          cmp =
            new Date(a.unlock_date).getTime() -
            new Date(b.unlock_date).getTime();
          break;
        case "usd_value":
          cmp =
            Number(a.usd_value_estimate) - Number(b.usd_value_estimate);
          break;
        case "impact":
          cmp = Number(a.impact_score) - Number(b.impact_score);
          break;
        case "supply":
          cmp =
            Number(a.percent_of_supply) - Number(b.percent_of_supply);
          break;
        default:
          cmp = 0;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [unlocks, sortKey, sortAsc]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "unlock_date");
    }
  };

  const SortIcon = ({
    active,
    asc,
  }: {
    active: boolean;
    asc: boolean;
  }) =>
    active ? (
      asc ? (
        <ChevronUp className="size-3" />
      ) : (
        <ChevronDown className="size-3" />
      )
    ) : (
      <ChevronDown className="size-3 text-text-disabled" />
    );

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-left py-3 px-3 text-text-secondary font-medium">
              Token
            </th>
            <th
              className="text-left py-3 px-3 text-text-secondary font-medium cursor-pointer hover:text-text-primary"
              onClick={() => toggleSort("unlock_date")}
            >
              <span className="inline-flex items-center gap-1">
                Date
                <SortIcon
                  active={sortKey === "unlock_date"}
                  asc={sortAsc}
                />
              </span>
            </th>
            <th className="text-right py-3 px-3 text-text-secondary font-medium">
              Amount
            </th>
            <th
              className="text-right py-3 px-3 text-text-secondary font-medium cursor-pointer hover:text-text-primary"
              onClick={() => toggleSort("usd_value")}
            >
              <span className="inline-flex items-center gap-1 justify-end">
                USD Value
                <SortIcon
                  active={sortKey === "usd_value"}
                  asc={sortAsc}
                />
              </span>
            </th>
            <th
              className="text-right py-3 px-3 text-text-secondary font-medium cursor-pointer hover:text-text-primary"
              onClick={() => toggleSort("supply")}
            >
              <span className="inline-flex items-center gap-1 justify-end">
                Supply %
                <SortIcon
                  active={sortKey === "supply"}
                  asc={sortAsc}
                />
              </span>
            </th>
            <th className="text-center py-3 px-3 text-text-secondary font-medium">
              Category
            </th>
            <th
              className="text-right py-3 px-3 text-text-secondary font-medium cursor-pointer hover:text-text-primary"
              onClick={() => toggleSort("impact")}
            >
              <span className="inline-flex items-center gap-1 justify-end">
                Impact
                <SortIcon
                  active={sortKey === "impact"}
                  asc={sortAsc}
                />
              </span>
            </th>
            <th className="text-right py-3 px-3 text-text-secondary font-medium">
              24h %
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((u) => {
            const urgency = getUrgencyConfig(u.daysUntil);
            const catConfig = getCategoryConfig(u.category);
            const impactScore = Number(u.impact_score);

            return (
              <tr
                key={u.id}
                className="border-b border-border-default last:border-0 hover:bg-bg-tertiary/50"
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-text-primary">
                      {u.token_symbol}
                    </span>
                    <span className="text-text-disabled">{u.token_name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-num text-text-primary">
                      {new Date(u.unlock_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className={cn("text-[10px] font-num", urgency.text)}>
                      D-{u.daysUntil}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-num text-text-primary">
                  {formatNumber(Number(u.amount))}
                </td>
                <td className="py-2.5 px-3 text-right font-num font-bold text-text-primary">
                  {formatCurrency(Number(u.usd_value_estimate))}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span
                    className={cn(
                      "font-num",
                      Number(u.percent_of_supply) >= 5
                        ? "text-signal-danger font-bold"
                        : "text-text-primary"
                    )}
                  >
                    {Number(u.percent_of_supply).toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                      catConfig.badge
                    )}
                  >
                    {u.category}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span
                    className={cn(
                      "font-num font-bold",
                      getImpactColor(impactScore)
                    )}
                  >
                    {impactScore}/10
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {u.priceChange24h !== null ? (
                    <span
                      className={cn(
                        "font-num inline-flex items-center gap-0.5",
                        u.priceChange24h >= 0
                          ? "text-signal-success"
                          : "text-signal-danger"
                      )}
                    >
                      {u.priceChange24h >= 0 ? (
                        <ArrowUpRight className="size-3" />
                      ) : (
                        <ArrowDownRight className="size-3" />
                      )}
                      {formatPercentage(u.priceChange24h)}
                    </span>
                  ) : (
                    <span className="text-text-disabled">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SIDEBAR WIDGETS
   ═══════════════════════════════════════════ */

/* ── Widget A: High Impact ── */

function HighImpactWidget({ items }: { items: TopImpactUnlock[] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="size-4 text-signal-danger" />
        <h3 className="text-sm font-bold text-text-primary">
          High Impact Unlocks
        </h3>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((item) => {
          const catConfig = getCategoryConfig(item.category);
          return (
            <div
              key={item.id}
              className="flex items-center gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-text-primary">
                    {item.symbol}
                  </span>
                  <span
                    className={cn("text-[10px] font-num", getUrgencyConfig(item.daysUntil).text)}
                  >
                    D-{item.daysUntil}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] px-1 py-0.5 rounded font-bold uppercase",
                      catConfig.badge
                    )}
                  >
                    {item.category}
                  </span>
                </div>
                {/* Impact bar */}
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        getImpactBg(item.impactScore)
                      )}
                      style={{
                        width: `${(item.impactScore / 10) * 100}%`,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-num font-bold w-6 text-right",
                      getImpactColor(item.impactScore)
                    )}
                  >
                    {item.impactScore}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-num text-text-secondary shrink-0">
                {formatCurrency(item.usdValue)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-text-disabled mt-3">
        Supply ratio above 5% may indicate significant sell pressure.
      </p>
    </div>
  );
}

/* ── Widget B: Category Breakdown ── */

function CategoryWidget({
  breakdown,
}: {
  breakdown: CategoryBreakdown[];
}) {
  if (breakdown.length === 0) return null;

  const total = breakdown.reduce((s, b) => s + b.totalUsd, 0);
  const largest = breakdown[0]; // already sorted desc by totalUsd

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="size-4 text-accent-primary" />
        <h3 className="text-sm font-bold text-text-primary">
          Category Breakdown
        </h3>
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-3">
        {breakdown.map((b) => {
          const config = getCategoryConfig(b.category);
          const pct = total > 0 ? (b.totalUsd / total) * 100 : 0;
          return (
            <div
              key={b.category}
              className="h-full"
              style={{
                width: `${pct}%`,
                backgroundColor: config.chartColor,
              }}
            />
          );
        })}
      </div>

      {/* Legend items */}
      <div className="flex flex-col gap-2">
        {breakdown.map((b) => {
          const config = getCategoryConfig(b.category);
          const pct = total > 0 ? ((b.totalUsd / total) * 100).toFixed(0) : "0";
          return (
            <div key={b.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: config.chartColor }}
                />
                <span className="text-xs text-text-primary capitalize">
                  {b.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-num text-text-secondary">
                  {b.count} events
                </span>
                <span className="text-xs font-num font-bold text-text-primary">
                  {formatCurrency(b.totalUsd)}
                </span>
                <span className="text-[10px] font-num text-text-disabled">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {largest && (
        <p className="text-[10px] text-text-disabled mt-3">
          {largest.category.charAt(0).toUpperCase() +
            largest.category.slice(1)}{" "}
          unlocks represent the largest upcoming sell pressure.
        </p>
      )}
    </div>
  );
}

/* ── Widget C: Price Correlation ── */

function PriceCorrelationWidget({
  correlation,
  avgChange,
}: {
  correlation: {
    symbol: string;
    priceChange24h: number;
  }[];
  avgChange: number;
}) {
  if (correlation.length === 0) return null;

  const chartData = correlation.map((c) => ({
    name: c.symbol,
    change: c.priceChange24h,
  }));

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="size-4 text-signal-danger" />
        <h3 className="text-sm font-bold text-text-primary">
          Unlock vs Price
        </h3>
      </div>

      <p className="text-xs text-text-secondary mb-3">
        Avg 24h price change near unlock:{" "}
        <span
          className={cn(
            "font-num font-bold",
            avgChange >= 0 ? "text-signal-success" : "text-signal-danger"
          )}
        >
          {formatPercentage(avgChange)}
        </span>
      </p>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2B3139"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#848E9C", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#848E9C", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickFormatter={(v: number) => `${v}%`}
            />
            <RechartsTooltip
              contentStyle={{
                background: "#1E2329",
                border: "1px solid #2B3139",
                borderRadius: 6,
                fontSize: 11,
              }}
              formatter={(value) => [
                `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(2)}%`,
                "24h Change",
              ]}
            />
            <Bar dataKey="change" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.change >= 0 ? "#0ECB81" : "#F6465D"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION 4: ALERT FEED
   ═══════════════════════════════════════════ */

function AlertFeed({ alerts }: { alerts: AlertEvent[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="size-4 text-accent-primary" />
        <h3 className="text-sm font-bold text-text-primary">
          Unlock Alert History
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 py-2 border-b border-border-default last:border-0"
          >
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5",
                SEVERITY_BADGE[alert.severity] ?? SEVERITY_BADGE.low
              )}
            >
              {alert.severity}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary">
                {alert.title}
              </p>
              <p className="text-[10px] text-text-secondary truncate">
                {alert.description}
              </p>
            </div>
            <span className="text-[10px] text-text-disabled shrink-0">
              {timeAgo(alert.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
