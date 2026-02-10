"use client";

import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Accordion Item ── */
export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ title, defaultOpen = false, children, className, ...props }, ref) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
      <div
        ref={ref}
        className={cn(
          "bg-bg-secondary border border-border-default rounded-[8px] overflow-hidden",
          className
        )}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-bg-tertiary/30 transition-colors"
        >
          <span className="text-[14px] font-medium text-text-primary">
            {title}
          </span>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-text-secondary transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
        {open && (
          <div className="px-5 pb-4 text-[13px] text-text-secondary leading-relaxed">
            {children}
          </div>
        )}
      </div>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

/* ── Accordion Group ── */
export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("space-y-2", className)}
      {...props}
    >
      {children}
    </div>
  )
);
Accordion.displayName = "Accordion";
