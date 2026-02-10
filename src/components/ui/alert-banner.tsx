import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  danger: {
    border: "border-l-signal-danger",
    icon: AlertCircle,
    iconColor: "text-signal-danger",
  },
  warning: {
    border: "border-l-signal-warning",
    icon: AlertTriangle,
    iconColor: "text-signal-warning",
  },
  info: {
    border: "border-l-signal-info",
    icon: Info,
    iconColor: "text-signal-info",
  },
  success: {
    border: "border-l-signal-success",
    icon: CheckCircle,
    iconColor: "text-signal-success",
  },
} as const;

export interface AlertBannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants;
  title: string;
  description?: string;
  action?: ReactNode;
  pulse?: boolean;
}

export const AlertBanner = forwardRef<HTMLDivElement, AlertBannerProps>(
  (
    { variant = "info", title, description, action, pulse, className, ...props },
    ref
  ) => {
    const config = variants[variant];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex items-center justify-between gap-4 bg-bg-secondary border border-border-default border-l-4 rounded-[8px] p-4",
          config.border,
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            {pulse && (
              <span
                className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  variant === "danger" && "bg-signal-danger",
                  variant === "warning" && "bg-signal-warning",
                  variant === "info" && "bg-signal-info",
                  variant === "success" && "bg-signal-success"
                )}
              />
            )}
            <Icon className={cn("w-5 h-5", config.iconColor)} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-text-primary">{title}</p>
            {description && (
              <p className="text-[12px] text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
);
AlertBanner.displayName = "AlertBanner";
