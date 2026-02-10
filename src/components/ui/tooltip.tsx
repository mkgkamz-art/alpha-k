"use client";

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/* ── Tooltip ── */
type Side = "top" | "bottom" | "left" | "right";

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  content: ReactNode;
  side?: Side;
  /** Delay in ms before showing */
  delayMs?: number;
  children: ReactNode;
}

const arrowSide: Record<Side, string> = {
  top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-bg-tertiary border-x-transparent border-b-transparent",
  bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-bg-tertiary border-x-transparent border-t-transparent",
  left: "right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-bg-tertiary border-y-transparent border-r-transparent",
  right: "left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-bg-tertiary border-y-transparent border-l-transparent",
};

const positionSide: Record<Side, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, side = "top", delayMs = 200, className, children, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(() => {
      timeoutRef.current = setTimeout(() => setOpen(true), delayMs);
    }, [delayMs]);

    const hide = useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setOpen(false);
    }, []);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        {...props}
      >
        {children}

        {open && (
          <div
            role="tooltip"
            className={cn(
              "absolute z-50 pointer-events-none",
              "px-2.5 py-1.5 rounded-md text-xs font-medium",
              "bg-bg-tertiary text-text-primary border border-border-default shadow-lg",
              "animate-in fade-in-0 zoom-in-95",
              positionSide[side]
            )}
          >
            {content}
            <span
              className={cn(
                "absolute w-0 h-0 border-4",
                arrowSide[side]
              )}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    );
  }
);
Tooltip.displayName = "Tooltip";
