"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";

/* ── Route → title + breadcrumbs ── */
const routeMeta: Record<string, { title: string; breadcrumb?: { label: string; href: string }[] }> = {
  "/dashboard": { title: "Dashboard" },
  "/alerts": { title: "Alert Rules" },
  "/alerts/new": {
    title: "New Alert Rule",
    breadcrumb: [{ label: "Alerts", href: "/alerts" }],
  },
  "/watchlist": { title: "My Watchlist" },
  "/signals": { title: "Trading Signals" },
  "/unlocks": { title: "Token Unlocks" },
  "/risk": { title: "DeFi Risk Monitor" },
  "/settings": { title: "Settings" },
  "/more": { title: "More" },
};

function getRouteMeta(pathname: string) {
  return routeMeta[pathname] ?? { title: pathname.split("/").pop() ?? "Page" };
}

interface HeaderProps {
  unreadCount?: number;
  connected?: boolean;
}

export function Header({ unreadCount = 3, connected = true }: HeaderProps) {
  const pathname = usePathname();
  const openMobile = useSidebarStore((s) => s.openMobile);
  const meta = getRouteMeta(pathname);

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 md:px-6 border-b border-border-default bg-bg-primary/95 backdrop-blur-sm"
      role="banner"
    >
      {/* ── Left: hamburger + breadcrumb + title ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={openMobile}
          className="md:hidden flex items-center justify-center w-9 h-9 -ml-1 rounded-[6px] text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        {meta.breadcrumb && meta.breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-[13px]">
            {meta.breadcrumb.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <Link
                  href={crumb.href}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  {crumb.label}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-text-disabled" />
              </span>
            ))}
          </nav>
        )}

        {/* Page title */}
        <h1 className="text-[16px] font-semibold text-text-primary truncate">
          {meta.title}
        </h1>
      </div>

      {/* ── Right: search + status + notification + avatar ── */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Network status (desktop) */}
        <span
          className={cn(
            "hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium mr-1",
            connected ? "text-signal-success" : "text-signal-danger"
          )}
        >
          {connected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          {connected ? "Live" : "Offline"}
        </span>

        {/* Search trigger */}
        <button
          className="flex items-center gap-2 h-9 px-3 rounded-[6px] bg-bg-secondary border border-border-default text-text-secondary text-[13px] hover:border-border-active transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden lg:inline ml-3 text-[11px] text-text-disabled border border-border-default rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>

        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-[6px] text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 bg-signal-danger text-white text-[10px] font-bold rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        <button
          className="flex items-center justify-center w-9 h-9 rounded-full bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          aria-label="User menu"
        >
          <span className="text-[12px] font-bold">U</span>
        </button>
      </div>
    </header>
  );
}
