"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLatestCriticalAlert, type ContextAlertRow } from "@/hooks/use-context-alerts";

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 5_000;

const SEVERITY_COLORS: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/10",
  warning: "border-orange-500/40 bg-orange-500/10",
  info: "border-blue-500/40 bg-blue-500/10",
};

const TYPE_ICONS: Record<string, string> = {
  surge: "🔥",
  dump: "💧",
  kimchi: "🇰🇷",
  listing: "⚡",
  whale: "🐋",
};

/**
 * Global toast provider that polls for critical alerts
 * and shows toasts for new ones.
 */
export function ToastProvider() {
  const { data } = useLatestCriticalAlert();
  const [toasts, setToasts] = useState<ContextAlertRow[]>([]);
  const seenIds = useRef(new Set<number>());
  const router = useRouter();

  // When a new critical alert arrives, add it to toasts
  useEffect(() => {
    if (!data?.data?.length) return;
    const latest = data.data[0];
    if (seenIds.current.has(latest.id)) return;

    // Only show if created within the last 2 minutes
    const age = Date.now() - new Date(latest.created_at).getTime();
    if (age > 2 * 60 * 1000) {
      seenIds.current.add(latest.id);
      return;
    }

    seenIds.current.add(latest.id);
    setToasts((prev) => [latest, ...prev].slice(0, MAX_TOASTS));
  }, [data]);

  // Auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback(
    (toast: ContextAlertRow) => {
      dismiss(toast.id);
      if (toast.related_page) router.push(toast.related_page);
    },
    [dismiss, router]
  );

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const color = SEVERITY_COLORS[toast.severity] ?? SEVERITY_COLORS.info;
        const icon = TYPE_ICONS[toast.alert_type] ?? "📌";

        return (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg cursor-pointer",
              "animate-in slide-in-from-right fade-in-0 duration-200",
              color
            )}
            onClick={() => navigate(toast)}
          >
            <span className="text-base shrink-0 mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {toast.what_title}
              </p>
              {toast.related_page && (
                <span className="text-[10px] text-accent-secondary flex items-center gap-0.5 mt-0.5">
                  자세히 보기 <ArrowRight className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(toast.id);
              }}
              className="p-0.5 rounded text-text-secondary hover:text-text-primary shrink-0"
              aria-label="닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
