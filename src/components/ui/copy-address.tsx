"use client";

import { forwardRef, useState, type HTMLAttributes } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CopyAddressProps extends HTMLAttributes<HTMLButtonElement> {
  address: string;
  chars?: number;
}

export const CopyAddress = forwardRef<HTMLButtonElement, CopyAddressProps>(
  ({ address, chars = 4, className, ...props }, ref) => {
    const [copied, setCopied] = useState(false);

    const shortened = `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;

    const handleCopy = async () => {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleCopy}
        className={cn(
          "group inline-flex items-center gap-1.5 font-num text-[13px] text-text-secondary hover:text-accent-primary transition-colors",
          className
        )}
        title={address}
        aria-label={`Copy address ${shortened}`}
        {...props}
      >
        <span>{shortened}</span>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-signal-success" />
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    );
  }
);
CopyAddress.displayName = "CopyAddress";
