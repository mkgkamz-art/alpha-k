"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/* ── Context ── */
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs compound components must be used within <Tabs>");
  return ctx;
}

/* ── Tabs Root ── */
export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  children: ReactNode;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, className, children, ...props }, ref) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab }}>
        <div ref={ref} className={cn("", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

/* ── Tab List ── */
export const TabList = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "flex items-center gap-0 border-b border-border-default",
        className
      )}
      {...props}
    />
  )
);
TabList.displayName = "TabList";

/* ── Tab Trigger ── */
export interface TabTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabTrigger = forwardRef<HTMLButtonElement, TabTriggerProps>(
  ({ value, className, children, ...props }, ref) => {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        onClick={() => setActiveTab(value)}
        className={cn(
          "px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap -mb-px",
          isActive
            ? "border-b-accent-primary text-text-primary"
            : "border-b-transparent text-text-secondary hover:text-text-primary hover:border-b-border-default",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabTrigger.displayName = "TabTrigger";

/* ── Tab Content ── */
export interface TabContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabContent = forwardRef<HTMLDivElement, TabContentProps>(
  ({ value, className, ...props }, ref) => {
    const { activeTab } = useTabsContext();
    if (activeTab !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn("pt-4", className)}
        {...props}
      />
    );
  }
);
TabContent.displayName = "TabContent";
