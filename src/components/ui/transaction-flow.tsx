import { forwardRef, type HTMLAttributes } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyAddress } from "./copy-address";

export interface FlowEntity {
  label: string;
  address: string;
  sublabel?: string;
  type?: "wallet" | "exchange" | "contract";
}

export interface TransactionFlowProps extends HTMLAttributes<HTMLDivElement> {
  from: FlowEntity;
  to: FlowEntity;
  amount?: string;
  token?: string;
}

export const TransactionFlow = forwardRef<HTMLDivElement, TransactionFlowProps>(
  ({ from, to, amount, token, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center",
        className
      )}
      {...props}
    >
      {/* From */}
      <div className="bg-bg-primary/50 p-4 rounded-[8px] border border-border-default/50">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-disabled mb-2">
          From
        </p>
        <p className="text-[14px] font-medium text-text-primary">{from.label}</p>
        <CopyAddress address={from.address} className="mt-1" />
        {from.sublabel && (
          <p className="text-[11px] text-text-disabled mt-1">{from.sublabel}</p>
        )}
      </div>

      {/* Arrow + Amount */}
      <div className="flex flex-col items-center gap-1 py-2">
        <div className="w-10 h-10 rounded-full bg-bg-tertiary border border-border-default flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-text-secondary" />
        </div>
        {amount && (
          <span className="text-[12px] font-num font-bold text-accent-primary">
            {amount} {token}
          </span>
        )}
      </div>

      {/* To */}
      <div className="bg-bg-primary/50 p-4 rounded-[8px] border border-border-default/50">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-disabled mb-2">
          To
        </p>
        <p className="text-[14px] font-medium text-text-primary">{to.label}</p>
        <CopyAddress address={to.address} className="mt-1" />
        {to.sublabel && (
          <p className="text-[11px] text-text-disabled mt-1">{to.sublabel}</p>
        )}
      </div>
    </div>
  )
);
TransactionFlow.displayName = "TransactionFlow";
