"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { PLANS, type Plan } from "@/lib/lemonsqueezy/plans";
import { PricingCard } from "@/components/ui/pricing-card";
import { Accordion, AccordionItem } from "@/components/ui/accordion";

type Interval = "monthly" | "yearly";

const FAQ_ITEMS = [
  {
    q: "Can I switch between plans?",
    a: "Yes. You can upgrade or downgrade at any time. When upgrading, you'll be charged a prorated amount for the remainder of your billing cycle. Downgrades take effect at the end of the current period.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit/debit cards (Visa, Mastercard, American Express) through our secure payment partner Lemon Squeezy. PayPal is also supported.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is available indefinitely with limited features. Pro and Whale plans include a 7-day free trial so you can evaluate before committing.",
  },
  {
    q: "How do real-time alerts work?",
    a: "Our system monitors on-chain activity across multiple blockchains. When a significant event matches your alert rules (whale movement, peg deviation, token unlock, etc.), you receive a notification within seconds via your configured channels.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No contracts, no commitments. Cancel anytime from your Settings page. You'll continue to have access until the end of your current billing period.",
  },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<Interval>("monthly");

  const handleCheckout = useCallback(
    async (plan: Plan) => {
      if (plan.tier === "free") {
        window.location.href = "/register";
        return;
      }

      const variant =
        interval === "monthly" ? plan.monthly : plan.yearly;

      if (!variant.variantId) {
        // No variant configured — redirect to register
        window.location.href = "/register";
        return;
      }

      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: variant.variantId }),
        });

        if (!res.ok) throw new Error("Checkout failed");

        const { url } = (await res.json()) as { url: string };

        // Open Lemon Squeezy overlay
        if (typeof window !== "undefined" && window.LemonSqueezy) {
          window.LemonSqueezy.Url.Open(url);
        } else {
          // Fallback: direct redirect
          window.location.href = url;
        }
      } catch (err) {
        console.error("Checkout error:", err);
      }
    },
    [interval]
  );

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-16 md:py-24 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary max-w-xl mx-auto leading-tight">
          Know Before the Market Moves
        </h1>
        <p className="mt-4 text-sm md:text-base text-text-secondary max-w-md mx-auto">
          Real-time whale alerts, DeFi risk monitoring, and trading signals
          — all in one platform.
        </p>

        {/* Interval Toggle */}
        <div className="mt-8 inline-flex items-center gap-1 p-1 bg-bg-secondary rounded-lg border border-border-default">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              interval === "monthly"
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              interval === "yearly"
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Yearly
            <span className="ml-1.5 text-[10px] text-signal-success font-bold">
              SAVE 17%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 md:px-6 pb-16">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const price =
              interval === "monthly" ? plan.monthly.price : plan.yearly.price;
            const period = interval === "monthly" ? "/mo" : "/yr";

            return (
              <PricingCard
                key={plan.tier}
                tier={plan.name}
                price={price === 0 ? "$0" : `$${price}`}
                period={period}
                description={plan.description}
                features={plan.features}
                highlighted={plan.highlighted}
                highlightLabel={plan.highlightLabel}
                ctaLabel={plan.ctaLabel}
                ctaVariant={
                  plan.highlighted
                    ? "primary"
                    : plan.tier === "whale"
                      ? "secondary"
                      : "outline"
                }
                onCtaClick={() => handleCheckout(plan)}
              />
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-6 pb-20">
        <div className="max-w-[700px] mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion>
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.q} title={item.q}>
                {item.a}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

    </div>
  );
}

/* ── Extend Window for Lemon Squeezy ── */
declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}
