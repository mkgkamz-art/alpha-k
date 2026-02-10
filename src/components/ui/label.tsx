import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 block",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-signal-danger ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
);
Label.displayName = "Label";
