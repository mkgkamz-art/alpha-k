import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-[80px] rounded-[6px] border bg-bg-tertiary px-3 py-2 text-[14px] text-text-primary",
        "placeholder:text-text-disabled",
        "transition-colors resize-y",
        "focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-signal-danger focus:border-signal-danger focus:ring-signal-danger/25"
          : "border-text-disabled",
        className
      )}
      {...props}
    />
  )
);
TextArea.displayName = "TextArea";
