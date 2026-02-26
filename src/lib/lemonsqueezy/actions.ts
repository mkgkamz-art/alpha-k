"use server";

/**
 * Lemon Squeezy server actions.
 *
 * - createCheckoutUrl: generate overlay-ready checkout URL
 * - cancelSubscription / resumeSubscription: manage active subs
 * - getSubscriptionUrls: customer portal & update payment method links
 */

import {
  createCheckout,
  cancelSubscription as lsCancelSubscription,
  updateSubscription,
  getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";

import { configureLemonSqueezy, getStoreId } from "./config";

/* ── Create Checkout URL ── */

export async function createCheckoutUrl(options: {
  variantId: string;
  userEmail?: string;
  userId?: string;
  trialDays?: number;
}): Promise<{ url: string }> {
  configureLemonSqueezy();

  // Calculate trial end date when trialDays is provided
  const trialEndsAt = options.trialDays
    ? new Date(Date.now() + options.trialDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  // LS REST API supports checkout_data.trial_ends_at but SDK types omit it
  const checkoutData: Record<string, unknown> = {
    email: options.userEmail ?? undefined,
    custom: {
      user_id: options.userId ?? "",
    },
  };
  if (trialEndsAt) {
    checkoutData.trialEndsAt = trialEndsAt;
  }

  const res = await createCheckout(getStoreId(), options.variantId, {
    checkoutOptions: {
      embed: true,
      media: false,
      dark: true,
    },
    checkoutData: checkoutData as Parameters<typeof createCheckout>[2] extends
      { checkoutData?: infer D } ? D : never,
    productOptions: {
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing?success=true`,
    },
  });

  if (res.error) throw new Error(`LS checkout: ${res.error.message}`);

  const url = res.data?.data.attributes.url;
  if (!url) throw new Error("LS checkout returned no URL");

  return { url };
}

/* ── Cancel Subscription ── */

export async function cancelSub(subscriptionId: string) {
  configureLemonSqueezy();

  const res = await lsCancelSubscription(subscriptionId);
  if (res.error) throw new Error(`LS cancel: ${res.error.message}`);

  return { success: true };
}

/* ── Resume Subscription ── */

export async function resumeSub(subscriptionId: string) {
  configureLemonSqueezy();

  const res = await updateSubscription(subscriptionId, { cancelled: false });
  if (res.error) throw new Error(`LS resume: ${res.error.message}`);

  return { success: true };
}

/* ── Get Subscription URLs (customer portal, update payment) ── */

export async function getSubscriptionUrls(subscriptionId: string) {
  configureLemonSqueezy();

  const res = await getSubscription(subscriptionId);
  if (res.error) throw new Error(`LS getSubscription: ${res.error.message}`);

  const attrs = res.data?.data.attributes;

  return {
    updatePaymentMethod: (attrs?.urls as Record<string, string>)?.update_payment_method ?? null,
    customerPortal: (attrs?.urls as Record<string, string>)?.customer_portal ?? null,
  };
}
