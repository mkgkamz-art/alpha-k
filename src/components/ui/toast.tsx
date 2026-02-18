"use client";

import { forwardRef, useEffect, type HTMLAttributes } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
} as const;

const colors = {
  success: "border-signal-success/40 bg-signal-success/10 text-signal-success",
  error: "border-signal-danger/40 bg-signal-danger/10 text-signal-danger",
  warning: "border-signal-warning/40 bg-signal-warning/10 text-signal-warning",
  info: "border-signal-info/40 bg-signal-info/10 text-signal-info",
} as const;

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof icons;
  message: string;
  visible: boolean;
  duration?: number;
  onClose: () => void;
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    { variant = "info", message, visible, duration = 4000, onClose, className, ...props },
    ref
  ) => {
    const Icon = icons[variant];

    useEffect(() => {
      if (!visible) return;
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }, [visible, duration, onClose]);

    if (!visible) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "fixed top-4 right-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg",
          "animate-in slide-in-from-right fade-in-0 duration-200",
          "max-w-sm",
          colors[variant],
          className
        )}
        {...props}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-sm text-text-primary">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto p-0.5 rounded text-text-secondary hover:text-text-primary"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
);
Toast.displayName = "Toast";
