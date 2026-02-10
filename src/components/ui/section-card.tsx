import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  noPadding?: boolean;
}

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  ({ title, icon, action, noPadding = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-bg-secondary border border-border-default rounded-[8px] overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border-default flex items-center justify-between bg-bg-primary/30">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-text-primary flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {action && <div>{action}</div>}
      </div>
      {/* Content */}
      <div className={cn(!noPadding && "p-5")}>{children}</div>
    </div>
  )
);
SectionCard.displayName = "SectionCard";
