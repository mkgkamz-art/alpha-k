"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bell,
  Star,
  TrendingUp,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Tab config ── */
import type { LucideIcon } from "lucide-react";

interface MobileTab {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  isFab?: boolean;
}

const tabs: MobileTab[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: 3 },
  { href: "__fab__", label: "Alert", icon: Plus, isFab: true },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-bg-primary/95 backdrop-blur-sm border-t border-border-default pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-full px-1">
        {tabs.map((tab) => {
          if (tab.isFab) {
            return (
              <Link
                key="fab"
                href="/alerts/new"
                className="relative -mt-5 flex items-center justify-center w-12 h-12 rounded-full bg-accent-primary shadow-lg shadow-accent-primary/20 text-bg-primary active:scale-95 transition-transform"
                aria-label="Create new alert rule"
              >
                <Plus className="w-6 h-6" />
              </Link>
            );
          }

          const isActive = pathname.startsWith(tab.href);
          const badgeCount = "badge" in tab ? tab.badge : undefined;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-[6px] transition-colors",
                isActive ? "text-accent-primary" : "text-text-secondary active:text-text-primary"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <tab.icon className="w-5 h-5" />
                {badgeCount !== undefined && badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 bg-signal-danger text-white text-[9px] font-bold rounded-full">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
