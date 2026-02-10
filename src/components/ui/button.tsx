import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-accent-primary text-bg-primary hover:bg-[#D4A30A] active:bg-[#C09800]",
  secondary:
    "bg-accent-secondary text-white hover:bg-[#1976D2] active:bg-[#1565C0]",
  outline:
    "bg-transparent text-text-primary border border-border-default hover:bg-bg-secondary",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
  danger:
    "bg-signal-danger text-white hover:bg-[#D43B4F] active:bg-[#B8324A]",
} as const;

const sizes = {
  sm: "h-8 px-3 text-[13px] rounded-[4px]",
  md: "h-9 px-4 text-[14px] rounded-[6px]",
  lg: "h-10 px-5 text-[14px] rounded-[6px]",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          "min-w-[44px] min-h-[44px] md:min-h-0 md:min-w-0",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
