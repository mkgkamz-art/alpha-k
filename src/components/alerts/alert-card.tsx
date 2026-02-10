"use client";

import {
  Waves,
  AlertTriangle,
  TrendingUp,
  Unlock,
  Droplets,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import type { AlertType, Severity } from "@/types";

const typeConfig: Record<
  AlertType,
  { icon: typeof Waves; color: string; label: string }
> = {
  whale: { icon: Waves, color: "text-alert-whale", label: "Whale" },
  risk: { icon: AlertTriangle, color: "text-alert-risk", label: "Risk" },
  price_signal: {
    icon: TrendingUp,
    color: "text-alert-price",
    label: "Signal",
  },
  token_unlock: {
    icon: Unlock,
    color: "text-alert-unlock",
    label: "Unlock",
  },
  liquidity: {
    icon: Droplets,
    color: "text-alert-liquidity",
    label: "Liquidity",
  },
};

const severityBorder: Record<Severity, string> = {
  critical: "border-l-signal-danger",
  high: "border-l-[#FF8C00]",
  medium: "border-l-signal-warning",
  low: "border-l-text-disabled",
};

export interface AlertCardProps {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  tags?: string[];
  time: string;
  isRead?: boolean;
  isBookmarked?: boolean;
  onBookmark?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function AlertCard({
  id,
  type,
  severity,
  title,
  description,
  tags = [],
  time,
  isRead = false,
  isBookmarked = false,
  onBookmark,
  onClick,
}: AlertCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(id)}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(id)}
      className={cn(
        "flex items-start gap-3 p-4 border-l-[3px] rounded-[8px] bg-bg-secondary border border-border-default transition-colors cursor-pointer",
        "hover:border-[#3B4149]",
        severityBorder[severity],
        !isRead && "bg-bg-secondary",
        isRead && "opacity-70"
      )}
    >
      {/* Type Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-[6px] shrink-0",
          config.color,
          "bg-current/10"
        )}
        style={{
          backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)`,
        }}
      >
        <Icon className={cn("w-5 h-5", config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[14px] font-medium text-text-primary leading-snug truncate">
            {title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={severity}>{severity}</Badge>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.(id);
              }}
              className={cn(
                "p-1 rounded transition-colors",
                isBookmarked
                  ? "text-accent-primary"
                  : "text-text-disabled hover:text-text-secondary"
              )}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <Bookmark
                className="w-4 h-4"
                fill={isBookmarked ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>
        <p className="text-[13px] text-text-secondary mt-0.5 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary"
            >
              {tag}
            </span>
          ))}
          <span className="text-[11px] text-text-disabled ml-auto font-num">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
