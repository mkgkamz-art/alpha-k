"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileNav } from "./mobile-nav";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar — hidden on mobile, auto-collapses on tablet */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        {/* Content area — bottom padding for mobile nav + safe area */}
        <main className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — md:hidden inside component */}
      <MobileNav />
    </div>
  );
}
