import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-9 w-full rounded-[6px] border bg-bg-tertiary px-3 text-[14px] text-text-primary",
          "placeholder:text-text-disabled",
          "transition-colors",
          "focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-signal-danger focus:border-signal-danger focus:ring-signal-danger/25"
            : "border-text-disabled",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
