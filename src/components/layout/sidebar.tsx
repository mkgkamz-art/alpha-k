"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio,
  Flame,
  Flag,
  Zap,
  Fish,
  BarChart3,
  Shield,
  Unlock,
  Droplets,
  Star,
  Settings,
  Gem,
  ChevronLeft,
  ChevronRight,
  X,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuthStore } from "@/stores/auth-store";
import { UserMenu } from "./user-menu";

/* ── Nav config ── */
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | null;
}

const HOT_MENU: NavItem[] = [
  { label: "라이브 피드", icon: Radio, href: "/dashboard", badge: null },
  { label: "급등 레이더", icon: Flame, href: "/surge", badge: "NEW" },
  { label: "김치프리미엄", icon: Flag, href: "/kimchi", badge: "NEW" },
  { label: "상장 알림", icon: Zap, href: "/listing", badge: "NEW" },
];

const INTELLIGENCE_MENU: NavItem[] = [
  { label: "고래 추적", icon: Fish, href: "/whale", badge: null },
  { label: "시그널", icon: BarChart3, href: "/signals", badge: null },
  { label: "DeFi 리스크", icon: Shield, href: "/risk", badge: null },
  { label: "토큰 언락", icon: Unlock, href: "/unlocks", badge: null },
  { label: "유동성", icon: Droplets, href: "/liquidity", badge: null },
];

const BOTTOM_MENU: NavItem[] = [
  { label: "워치리스트", icon: Star, href: "/watchlist", badge: null },
  { label: "설정", icon: Settings, href: "/settings", badge: null },
  { label: "Pro 구독", icon: Gem, href: "/billing", badge: null },
];

/* ── Sidebar ── */
export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const toggle = useSidebarStore((s) => s.toggle);
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);
  const closeMobile = useSidebarStore((s) => s.closeMobile);
  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const pathname = usePathname();

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

  // Tier badge for billing item
  const tierLabel =
    tier === "whale" ? "WHALE" : tier === "pro" ? "PRO" : "FREE";

  const sidebarContent = (
    <>
      {/* ── Logo ── */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border-default shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-md bg-accent-primary flex items-center justify-center shrink-0">
            <span className="text-bg-primary font-bold text-[11px]">AK</span>
          </div>
          {!collapsed && (
            <span className="text-[16px] font-bold text-text-primary whitespace-nowrap">
              Alpha K
            </span>
          )}
        </Link>
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

      {/* ── Main nav ── */}
      <nav className="flex-1 overflow-y-auto px-2 mt-3" aria-label="Main navigation">
        {/* HOT section */}
        {!collapsed && (
          <span className="block mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-amber-400">
            HOT 🔥
          </span>
        )}
        <HotSection items={HOT_MENU} collapsed={collapsed} pathname={pathname} />

        {/* Divider */}
        <div className="my-3 mx-2 border-t border-zinc-700/50" />

        {/* INTELLIGENCE section */}
        {!collapsed && (
          <span className="block mb-1.5 px-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            INTELLIGENCE
          </span>
        )}
        <IntelligenceSection items={INTELLIGENCE_MENU} collapsed={collapsed} pathname={pathname} />
      </nav>

      {/* ── Bottom ── */}
      <div className="px-2 pb-2 shrink-0 border-t border-border-default pt-2 space-y-0.5">
        <BottomSection
          items={BOTTOM_MENU}
          collapsed={collapsed}
          pathname={pathname}
          tierLabel={tierLabel}
        />

        {/* User profile or Sign In */}
        {user ? (
          <UserMenu collapsed={collapsed} />
        ) : (
          <div className="mt-2 px-1">
            <Link
              href="/login"
              className={cn(
                "flex items-center gap-2.5 w-full p-2 rounded-md text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors",
                collapsed && "justify-center"
              )}
            >
              <LogIn className="w-4 h-4" />
              {!collapsed && <span className="text-[13px]">로그인</span>}
            </Link>
          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggle}
          className={cn(
            "hidden md:flex items-center gap-3 h-9 rounded-md transition-colors w-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
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
          "hidden md:flex flex-col h-full bg-bg-primary border-r border-border-default transition-[width] duration-200 shrink-0",
          collapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-70 flex flex-col bg-bg-primary border-r border-border-default animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

/* ── HOT section items ── */
function HotSection({
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
              "group flex items-center gap-3 h-11 rounded-md transition-colors relative",
              collapsed ? "justify-center px-0" : "pl-4 pr-3",
              isActive
                ? "bg-amber-500/15 text-amber-300 border-l-2 border-amber-400"
                : "text-zinc-100 hover:bg-amber-500/10"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon
              className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                isActive ? "text-amber-300" : "text-zinc-100 group-hover:text-amber-200"
              )}
            />

            {!collapsed && (
              <span className="flex-1 text-[14px] font-medium truncate">
                {item.label}
              </span>
            )}

            {!collapsed && item.badge && (
              <span className="ml-auto bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}

            {collapsed && item.badge && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

/* ── INTELLIGENCE section items ── */
function IntelligenceSection({
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
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 h-10 rounded-md transition-colors relative",
              collapsed ? "justify-center px-0" : "pl-6 pr-3",
              isActive
                ? "bg-white/10 text-zinc-100"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 rounded-r bg-zinc-400" />
            )}

            <item.icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"
              )}
            />

            {!collapsed && (
              <span className="flex-1 text-[14px] font-normal truncate">
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/* ── Bottom section items ── */
function BottomSection({
  items,
  collapsed,
  pathname,
  tierLabel,
}: {
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
  tierLabel: string;
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const showTierTag = item.href === "/billing" && tierLabel;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 h-10 rounded-md transition-colors relative",
              collapsed ? "justify-center px-0" : "px-3",
              isActive
                ? "bg-bg-secondary text-text-primary"
                : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
              )}
            />

            {!collapsed && (
              <span className="flex-1 text-[13px] font-normal truncate">
                {item.label}
              </span>
            )}

            {!collapsed && showTierTag && (
              <span
                className={cn(
                  "ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                  tierLabel === "WHALE"
                    ? "bg-accent-secondary/15 text-accent-secondary"
                    : tierLabel === "PRO"
                      ? "bg-accent-primary/15 text-accent-primary"
                      : "bg-zinc-700/50 text-zinc-500"
                )}
              >
                {tierLabel}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
