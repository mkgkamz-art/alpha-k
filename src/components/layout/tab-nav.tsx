"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Fish, MessageCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

/* ── Tab config ── */
interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: "/radar", label: "레이더", icon: Flame },
  { href: "/whale", label: "고래", icon: Fish },
  { href: "/chirashi", label: "찌라시", icon: MessageCircle },
];

function isTabActive(tabHref: string, pathname: string): boolean {
  if (tabHref === "/radar") {
    return pathname === "/radar" || pathname.startsWith("/radar/");
  }
  return pathname.startsWith(tabHref);
}

/* ── Desktop icon sidebar ── */
function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden md:flex flex-col items-center h-full w-16 bg-bg-primary border-r border-border-default shrink-0">
      {/* Logo */}
      <Link
        href="/radar"
        className="flex items-center justify-center w-full h-14 border-b border-border-default shrink-0"
      >
        <div className="w-8 h-8 rounded-md bg-accent-primary flex items-center justify-center">
          <span className="text-bg-primary font-bold text-[11px]">AK</span>
        </div>
      </Link>

      {/* Main tabs */}
      <nav className="flex-1 flex flex-col items-center gap-1 pt-3" aria-label="Main navigation">
        {TABS.map((tab) => {
          const active = isTabActive(tab.href, pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors group",
                active
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
              )}
              aria-current={active ? "page" : undefined}
              title={tab.label}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-amber-400" />
              )}
              <tab.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium mt-0.5 leading-none">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user menu */}
      <div className="pb-2 shrink-0 border-t border-border-default pt-2 w-full px-1">
        <UserMenu collapsed />
      </div>
    </aside>
  );
}

/* ── Mobile bottom tab bar ── */
function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-700/50 pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-full px-4">
        {TABS.map((tab) => {
          const active = isTabActive(tab.href, pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-md transition-colors",
                active ? "text-amber-400" : "text-zinc-500 active:text-zinc-300",
              )}
              aria-current={active ? "page" : undefined}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none mt-0.5">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ── Combined export ── */
export function TabNav() {
  const pathname = usePathname();

  return (
    <>
      <DesktopNav pathname={pathname} />
      <MobileTabBar pathname={pathname} />
    </>
  );
}
