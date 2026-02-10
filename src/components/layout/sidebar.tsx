"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bell,
  Star,
  TrendingUp,
  Unlock,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";

/* ── Nav config ── */
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: 3 },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/signals", label: "Signals", icon: TrendingUp },
];

const monitorNav: NavItem[] = [
  { href: "/unlocks", label: "Token Unlocks", icon: Unlock },
  { href: "/defi-risk", label: "DeFi Risk", icon: ShieldAlert },
];

const bottomNav: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings?tab=billing", label: "Billing", icon: CreditCard },
];

/* ── Sidebar ── */
export function Sidebar() {
  const { collapsed, mobileOpen, toggle, setCollapsed, closeMobile } =
    useSidebarStore();
  const { user } = useAuthStore();
  const pathname = usePathname();

  const tierLabel =
    user?.subscriptionTier === "whale"
      ? "Whale Plan"
      : user?.subscriptionTier === "pro"
        ? "Pro Plan"
        : "Free Plan";

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // Auto-collapse on tablet (768-1023)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setCollapsed(true);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setCollapsed]);

  // Close mobile overlay on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Close mobile overlay on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) closeMobile();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileOpen, closeMobile]);

  const sidebarContent = (
    <>
      {/* ── Logo ── */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border-default shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-[6px] bg-accent-primary flex items-center justify-center shrink-0">
            <span className="text-bg-primary font-bold text-[14px]">B</span>
          </div>
          {!collapsed && (
            <span className="text-[16px] font-bold text-text-primary whitespace-nowrap">
              BLOSAFE
            </span>
          )}
        </Link>
        {/* Mobile close */}
        {mobileOpen && (
          <button
            onClick={closeMobile}
            className="md:hidden p-1 rounded text-text-secondary hover:text-text-primary"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Create Alert ── */}
      <div className="px-3 mt-4 mb-2 shrink-0">
        <Link href="/alerts/new">
          {collapsed ? (
            <Button
              size="sm"
              className="w-full justify-center px-0"
              aria-label="Create Alert Rule"
            >
              <Plus className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" className="w-full">
              <Plus className="w-4 h-4" />
              New Alert Rule
            </Button>
          )}
        </Link>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 overflow-y-auto px-2 mt-1" aria-label="Main navigation">
        <NavSection items={mainNav} collapsed={collapsed} pathname={pathname} />

        {/* Divider + section label */}
        <div className="my-3 px-1">
          <div className="border-t border-border-default" />
          {!collapsed && (
            <span className="block mt-3 mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-text-disabled">
              Monitoring
            </span>
          )}
        </div>

        <NavSection items={monitorNav} collapsed={collapsed} pathname={pathname} />
      </nav>

      {/* ── Bottom ── */}
      <div className="px-2 pb-2 space-y-0.5 shrink-0 border-t border-border-default pt-2">
        <NavSection items={bottomNav} collapsed={collapsed} pathname={pathname} />

        {/* ── User profile ── */}
        <div
          className={cn(
            "flex items-center gap-2.5 mt-2 p-2 rounded-[6px] hover:bg-bg-secondary transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-accent-secondary/20 flex items-center justify-center shrink-0">
            <span className="text-[12px] font-bold text-accent-secondary">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-text-primary truncate">
                {user?.displayName ?? "Guest"}
              </p>
              <p className="text-[11px] text-signal-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-success inline-block" />
                {tierLabel}
              </p>
            </div>
          )}
        </div>

        {/* ── Collapse toggle (desktop only) ── */}
        <button
          onClick={toggle}
          className={cn(
            "hidden md:flex items-center gap-3 h-9 rounded-[6px] transition-colors w-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
            collapsed ? "justify-center px-0" : "px-3"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span className="text-[12px]">Collapse</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop / Tablet sidebar ── */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen bg-bg-primary border-r border-border-default transition-[width] duration-200 shrink-0",
          collapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60"
            onClick={closeMobile}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-bg-primary border-r border-border-default animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

/* ── Nav section helper ── */
function NavSection({
  items,
  collapsed,
  pathname,
}: {
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 h-10 rounded-[6px] transition-colors relative",
              collapsed ? "justify-center px-0" : "px-3",
              isActive
                ? "bg-bg-secondary text-text-primary"
                : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {/* Active gold left bar */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-accent-primary" />
            )}

            <item.icon
              className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                isActive ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
              )}
            />

            {!collapsed && (
              <span className="flex-1 text-[14px] font-medium truncate">
                {item.label}
              </span>
            )}

            {/* Badge */}
            {!collapsed && item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto bg-accent-primary text-bg-primary text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {item.badge}
              </span>
            )}
            {collapsed && item.badge !== undefined && item.badge > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
