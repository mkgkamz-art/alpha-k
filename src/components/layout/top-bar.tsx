"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
  Wifi,
  WifiOff,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";

/* ── Route → title + breadcrumbs ── */
const routeMeta: Record<
  string,
  { title: string; breadcrumb?: { label: string; href: string }[] }
> = {
  "/dashboard": { title: "라이브 피드" },
  "/surge": { title: "급등 레이더" },
  "/kimchi": { title: "김치프리미엄" },
  "/listing": { title: "상장 알림" },
  "/whale": { title: "고래 추적" },
  "/signals": { title: "시그널" },
  "/risk": { title: "DeFi 리스크" },
  "/unlocks": { title: "토큰 언락" },
  "/liquidity": { title: "유동성" },
  "/watchlist": { title: "워치리스트" },
  "/alerts": { title: "알림 규칙" },
  "/alerts/new": {
    title: "새 알림 규칙",
    breadcrumb: [{ label: "알림", href: "/alerts" }],
  },
  "/settings": { title: "설정" },
  "/billing": { title: "구독 관리" },
  "/more": { title: "더보기" },
};

function getRouteMeta(pathname: string) {
  return routeMeta[pathname] ?? { title: pathname.split("/").pop() ?? "Page" };
}

export interface TopBarProps {
  unreadCount?: number;
  connected?: boolean;
}

export function TopBar({ unreadCount = 3, connected = true }: TopBarProps) {
  const pathname = usePathname();
  const openMobile = useSidebarStore((s) => s.openMobile);
  const user = useAuthStore((s) => s.user);
  const meta = getRouteMeta(pathname);

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email
      ? user.email[0].toUpperCase()
      : null;

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between h-14 px-4 md:px-6 border-b border-border-default bg-bg-primary/95 backdrop-blur-sm"
      role="banner"
    >
      {/* Left: hamburger + breadcrumb + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={openMobile}
          className="md:hidden flex items-center justify-center w-9 h-9 -ml-1 rounded-md text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {meta.breadcrumb && meta.breadcrumb.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center gap-1 text-[13px]"
          >
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

        <h1 className="text-[16px] font-semibold text-text-primary truncate">
          {meta.title}
        </h1>
      </div>

      {/* Right: search + status + notification + avatar / sign in */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Network status */}
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
          className="flex items-center gap-2 h-9 px-3 rounded-md bg-bg-secondary border border-border-default text-text-secondary text-[13px] hover:border-border-active transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden lg:inline ml-3 text-[11px] text-text-disabled border border-border-default rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>

        {/* Notification bell — only for authenticated users */}
        {user && (
          <button
            className="relative flex items-center justify-center w-9 h-9 rounded-md text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 bg-signal-danger text-white text-[10px] font-bold rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* User avatar (authenticated) or Sign In (unauthenticated) */}
        {user ? (
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors overflow-hidden"
            aria-label="User menu"
          >
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName ?? "User avatar"}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-[12px] font-bold">{initials}</span>
            )}
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium text-accent-primary hover:bg-bg-secondary transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
