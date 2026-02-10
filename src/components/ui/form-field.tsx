import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, htmlFor, required, error, hint, className, children, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1.5", className)} {...props}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block"
        >
          {label}
          {required && (
            <span className="text-signal-danger ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p className="text-[11px] text-signal-danger" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[11px] text-text-disabled">{hint}</p>
      )}
    </div>
  )
);
FormField.displayName = "FormField";
