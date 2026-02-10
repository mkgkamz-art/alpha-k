import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface PricingCardProps extends HTMLAttributes<HTMLDivElement> {
  tier: string;
  price: string;
  period?: string;
  description: string;
  features: PricingFeature[];
  highlighted?: boolean;
  highlightLabel?: string;
  ctaLabel?: string;
  ctaVariant?: "primary" | "secondary" | "outline";
  onCtaClick?: () => void;
}

export const PricingCard = forwardRef<HTMLDivElement, PricingCardProps>(
  (
    {
      tier,
      price,
      period = "/mo",
      description,
      features,
      highlighted = false,
      highlightLabel = "POPULAR",
      ctaLabel = "Get Started",
      ctaVariant = "outline",
      onCtaClick,
      className,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col h-full rounded-[12px] border p-8",
        highlighted
          ? "border-2 border-accent-primary md:-translate-y-2"
          : "border-border-default",
        "bg-bg-secondary",
        className
      )}
      {...props}
    >
      {/* Popular Badge */}
      {highlighted && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent-primary text-bg-primary text-[11px] font-bold uppercase px-3 py-1 rounded-full">
          {highlightLabel}
        </span>
      )}

      {/* Tier Name */}
      <h3 className="text-[16px] font-semibold text-text-primary">{tier}</h3>

      {/* Price */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[36px] font-bold font-num text-text-primary">
          {price}
        </span>
        {price !== "$0" && (
          <span className="text-[14px] text-text-secondary">{period}</span>
        )}
      </div>

      {/* Description */}
      <p className="text-[13px] text-text-secondary mt-2">{description}</p>

      {/* CTA */}
      <Button
        variant={ctaVariant}
        onClick={onCtaClick}
        className="w-full mt-6"
      >
        {ctaLabel}
      </Button>

      {/* Features */}
      <ul className="mt-6 space-y-3 flex-1" aria-label={`${tier} features`}>
        {features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2.5">
            {feature.included ? (
              <Check className="w-4 h-4 mt-0.5 text-signal-success shrink-0" />
            ) : (
              <X className="w-4 h-4 mt-0.5 text-text-disabled shrink-0" />
            )}
            <span
              className={cn(
                "text-[13px]",
                feature.included ? "text-text-secondary" : "text-text-disabled"
              )}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
);
PricingCard.displayName = "PricingCard";
