"use client";

import { type ReactNode } from "react";
import { Lock, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

interface ProGateProps {
  children: ReactNode;
  /** Feature label shown in the upgrade prompt */
  feature?: string;
  /** Require whale tier (default: pro is enough) */
  requireWhale?: boolean;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * Wraps content that requires Pro (or Whale) subscription.
 * Free users see a blurred overlay with an upgrade CTA.
 * Pro/Whale users see children normally.
 */
export function ProGate({
  children,
  feature = "이 기능",
  requireWhale = false,
  className,
}: ProGateProps) {
  const isPro = useAuthStore((s) => s.isPro);
  const isWhale = useAuthStore((s) => s.isWhale);

  const hasAccess = requireWhale ? isWhale : isPro;

  if (hasAccess) {
    return <>{children}</>;
  }

  const targetLabel = requireWhale ? "Whale" : "Pro";

  return (
    <div className={cn("relative", className)}>
      {/* Blurred content preview */}
      <div className="blur-sm select-none pointer-events-none" aria-hidden>
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60 backdrop-blur-[2px] rounded-lg">
        <div className="flex flex-col items-center gap-3 px-4 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-primary/10">
            <Lock className="w-5 h-5 text-accent-primary" />
          </div>
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{feature}</span>은{" "}
            {targetLabel} 전용입니다
          </p>
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
          >
            <Zap className="w-4 h-4" />
            {targetLabel} 업그레이드
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline variant — smaller CTA for use in tables/lists.
 * Shows a blurred row with a subtle upgrade hint.
 */
export function ProGateInline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const isPro = useAuthStore((s) => s.isPro);

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="blur-sm select-none pointer-events-none" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link
          href="/billing"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-accent-primary/10 text-accent-primary text-xs font-medium hover:bg-accent-primary/20 transition-colors"
        >
          <Lock className="w-3 h-3" />
          Pro 업그레이드
        </Link>
      </div>
    </div>
  );
}
