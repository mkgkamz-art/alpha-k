"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts } from "@/hooks/use-alerts";
import { AlertCard } from "@/components/alerts/alert-card";
import { AlertFilter } from "@/components/alerts/alert-filter";
import { SeverityFilter } from "@/components/alerts/severity-filter";
import { TrendingPanel } from "@/components/alerts/trending-panel";
import { WhalePanel } from "@/components/alerts/whale-panel";
import { timeAgo } from "@/lib/utils";
import type { AlertType, Severity } from "@/types";

export default function AlertsPage() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<AlertType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">(
    "all"
  );

  const {
    alerts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    toggleBookmark,
    markAsRead,
  } = useAlerts({ type: typeFilter, severity: severityFilter });

  /* ── Infinite Scroll via IntersectionObserver ── */
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleObserver]);

  /* ── Handlers ── */
  const handleAlertClick = (id: string) => {
    markAsRead(id);
    router.push(`/alerts/${id}`);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Main Alert Feed (left, ~65%) ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:border-r lg:border-border-default">
        {/* Filter Bar */}
        <div className="px-4 py-3 border-b border-border-default flex flex-col gap-2 md:flex-row md:items-center md:justify-between shrink-0">
          <AlertFilter active={typeFilter} onChange={setTypeFilter} />
          <SeverityFilter
            active={severityFilter}
            onChange={setSeverityFilter}
          />
        </div>

        {/* Feed List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-text-secondary animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
              <p className="text-[14px]">No alerts yet</p>
              <p className="text-[13px] mt-1">
                Alerts will appear here when triggered by your rules.
              </p>
            </div>
          ) : (
            <>
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
                  onBookmark={toggleBookmark}
                  onClick={handleAlertClick}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" aria-hidden="true" />

              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-text-secondary animate-spin" />
                </div>
              )}

              {!hasNextPage && alerts.length > 0 && (
                <p className="text-center text-[12px] text-text-disabled py-4">
                  All alerts loaded
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Right Side Panel (~35%) — hidden on mobile ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col",
          "w-[35%] min-w-80 max-w-120",
          "bg-[#0E1114] overflow-y-auto"
        )}
      >
        <div className="flex-1 border-b border-border-default">
          <TrendingPanel />
        </div>
        <div className="flex-1">
          <WhalePanel />
        </div>
      </aside>
    </div>
  );
}
