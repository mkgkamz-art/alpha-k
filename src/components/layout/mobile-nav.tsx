"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio,
  Flame,
  Flag,
  Zap,
  Menu,
  X,
  Fish,
  BarChart3,
  Shield,
  Unlock,
  Droplets,
  Star,
  Settings,
  Gem,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Tab config ── */
interface MobileTab {
  href: string | null;
  label: string;
  icon: LucideIcon;
  isMore?: boolean;
}

const tabs: MobileTab[] = [
  { href: "/dashboard", label: "피드", icon: Radio },
  { href: "/surge", label: "급등", icon: Flame },
  { href: "/kimchi", label: "김프", icon: Flag },
  { href: "/listing", label: "상장", icon: Zap },
  { href: null, label: "더보기", icon: Menu, isMore: true },
];

/* ── Bottom sheet items ── */
interface SheetItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "intelligence" | "bottom";
}

const sheetItems: SheetItem[] = [
  { href: "/whale", label: "고래 추적", icon: Fish, section: "intelligence" },
  { href: "/signals", label: "시그널", icon: BarChart3, section: "intelligence" },
  { href: "/risk", label: "DeFi 리스크", icon: Shield, section: "intelligence" },
  { href: "/unlocks", label: "토큰 언락", icon: Unlock, section: "intelligence" },
  { href: "/liquidity", label: "유동성", icon: Droplets, section: "intelligence" },
  { href: "/watchlist", label: "워치리스트", icon: Star, section: "bottom" },
  { href: "/settings", label: "설정", icon: Settings, section: "bottom" },
  { href: "/billing", label: "구독 관리", icon: Gem, section: "bottom" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close sheet on route change
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const toggleSheet = useCallback(() => {
    setSheetOpen((prev) => !prev);
  }, []);

  const intelligenceItems = sheetItems.filter((i) => i.section === "intelligence");
  const bottomItems = sheetItems.filter((i) => i.section === "bottom");

  return (
    <>
      {/* ── Bottom sheet backdrop + panel ── */}
      {sheetOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 mx-2 mb-1 rounded-2xl bg-zinc-900/95 backdrop-blur-lg border border-zinc-700/50 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 pb-[env(safe-area-inset-bottom)]">
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-8 h-1 rounded-full bg-zinc-600" />
            </div>

            {/* INTELLIGENCE section */}
            <div className="px-3 pt-1 pb-2">
              <span className="block mb-1.5 px-2 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                INTELLIGENCE
              </span>
              <div className="space-y-0.5">
                {intelligenceItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 h-11 px-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-white/10 text-zinc-100"
                          : "text-zinc-400 active:bg-white/5"
                      )}
                    >
                      <item.icon className="w-4.5 h-4.5 shrink-0" />
                      <span className="text-[14px]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-zinc-700/50" />

            {/* BOTTOM section */}
            <div className="px-3 pt-2 pb-3">
              <div className="space-y-0.5">
                {bottomItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 h-11 px-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-white/10 text-zinc-100"
                          : "text-zinc-400 active:bg-white/5"
                      )}
                    >
                      <item.icon className="w-4.5 h-4.5 shrink-0" />
                      <span className="text-[14px]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-700/50 pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-full px-1">
          {tabs.map((tab) => {
            if (tab.isMore) {
              return (
                <button
                  key="more"
                  onClick={toggleSheet}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md transition-colors",
                    sheetOpen ? "text-amber-400" : "text-zinc-500 active:text-zinc-300"
                  )}
                  aria-label="더보기 메뉴"
                  aria-expanded={sheetOpen}
                >
                  {sheetOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                  <span className="text-[10px] font-medium leading-none mt-0.5">
                    {tab.label}
                  </span>
                </button>
              );
            }

            const isActive =
              tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(tab.href!);

            return (
              <Link
                key={tab.href}
                href={tab.href!}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 w-14 h-12 rounded-md transition-colors",
                  isActive ? "text-amber-400" : "text-zinc-500 active:text-zinc-300"
                )}
                aria-current={isActive ? "page" : undefined}
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
    </>
  );
}
