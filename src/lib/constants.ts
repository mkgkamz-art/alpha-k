/**
 * Shared UI constants used across multiple dashboard pages.
 * Avoids duplicating severity/color config in every page component.
 */

/* ── Severity badge styles ── */

/** Compact badge: bg + text only (used in feed lists, tables) */
export const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-signal-danger/10 text-signal-danger",
  high: "bg-signal-warning/10 text-signal-warning",
  medium: "bg-accent-primary/10 text-accent-primary",
  low: "bg-text-secondary/10 text-text-secondary",
};

/** Card badge: bg + text + border (used in overview cards, panels) */
export const SEVERITY_CARD: Record<string, string> = {
  critical: "bg-signal-danger/15 text-signal-danger border-signal-danger/30",
  high: "bg-signal-warning/15 text-signal-warning border-signal-warning/30",
  medium: "bg-accent-primary/15 text-accent-primary border-accent-primary/30",
  low: "bg-bg-tertiary text-text-secondary border-border-default",
};

/** Severity with labels (used in whale tracker, detailed views) */
export const SEVERITY_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  critical: { label: "CRITICAL", color: "text-signal-danger" },
  high: { label: "HIGH", color: "text-signal-warning" },
  medium: { label: "MEDIUM", color: "text-accent-primary" },
  low: { label: "LOW", color: "text-text-secondary" },
};

/* ── Time constants ── */
export const ONE_DAY_MS = 86_400_000;
export const ONE_HOUR_MS = 3_600_000;
