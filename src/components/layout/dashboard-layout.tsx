"use client";

import type { ReactNode } from "react";
import Script from "next/script";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MarketBar } from "./market-bar";
import { MobileNav } from "./mobile-nav";
import { useAuthInit } from "@/hooks/use-auth-init";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Sync Supabase session → Zustand (works for both auth & unauth)
  useAuthInit();

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* Lemon Squeezy overlay checkout script */}
      <Script
        src="https://app.lemonsqueezy.com/js/lemon.js"
        strategy="lazyOnload"
      />

      {/* ── MarketBar: sticky top ── */}
      <MarketBar />

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />

          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>

      {/* ── Mobile tab bar ── */}
      <MobileNav />
    </div>
  );
}
