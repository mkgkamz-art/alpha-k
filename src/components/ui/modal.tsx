"use client";

import {
  forwardRef,
  useEffect,
  useCallback,
  type HTMLAttributes,
  type ReactNode,
  type MouseEvent,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Modal Overlay ── */
export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ open, onClose, className, children, ...props }, ref) => {
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      },
      [onClose]
    );

    useEffect(() => {
      if (!open) return;
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }, [open, handleKeyDown]);

    if (!open) return null;

    const handleBackdrop = (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    };

    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4",
          "bg-black/60 backdrop-blur-sm",
          "animate-in fade-in-0",
          className
        )}
        onClick={handleBackdrop}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Modal.displayName = "Modal";

/* ── Modal Content ── */
export interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-full max-w-lg rounded-lg border border-border-default bg-bg-secondary shadow-xl",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
ModalContent.displayName = "ModalContent";

/* ── Modal Header ── */
export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ onClose, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between px-6 py-4 border-b border-border-default",
        className
      )}
      {...props}
    >
      <h2 className="text-lg font-semibold text-text-primary">{children}</h2>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
);
ModalHeader.displayName = "ModalHeader";

/* ── Modal Body ── */
export const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 py-4", className)}
      {...props}
    />
  )
);
ModalBody.displayName = "ModalBody";

/* ── Modal Footer ── */
export const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default",
        className
      )}
      {...props}
    />
  )
);
ModalFooter.displayName = "ModalFooter";
