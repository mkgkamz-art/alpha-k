import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "@/types";

/**
 * Lemon Squeezy webhook handler.
 *
 * Validates X-Signature HMAC SHA256, then processes:
 *  - subscription_created
 *  - subscription_updated
 *  - subscription_cancelled
 *  - subscription_expired
 *  - subscription_payment_success
 */

/* ── Signature Verification ── */

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

/* ── Tier Resolution ── */

function tierFromVariantId(variantId: string): SubscriptionTier {
  const proMonthly = process.env.NEXT_PUBLIC_LS_PRO_MONTHLY_VARIANT_ID;
  const proYearly = process.env.NEXT_PUBLIC_LS_PRO_YEARLY_VARIANT_ID;
  const whaleMonthly = process.env.NEXT_PUBLIC_LS_WHALE_MONTHLY_VARIANT_ID;
  const whaleYearly = process.env.NEXT_PUBLIC_LS_WHALE_YEARLY_VARIANT_ID;

  if (variantId === proMonthly || variantId === proYearly) return "pro";
  if (variantId === whaleMonthly || variantId === whaleYearly) return "whale";
  return "free";
}

/* ── Event Payload Types ── */

interface LsWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    attributes: {
      store_id: number;
      customer_id: number;
      variant_id: number;
      status: string;
      cancelled: boolean;
      renews_at: string | null;
      ends_at: string | null;
      trial_ends_at: string | null;
      [key: string]: unknown;
    };
  };
}

/* ── POST Handler ── */

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    console.error("[ls-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: LsWebhookEvent;
  try {
    event = JSON.parse(rawBody) as LsWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.meta.event_name;
  const userId = event.meta.custom_data?.user_id;
  const attrs = event.data.attributes;
  const subscriptionId = event.data.id;
  const variantId = String(attrs.variant_id);
  const customerId = String(attrs.customer_id);

  console.log(`[ls-webhook] ${eventName} | user=${userId} sub=${subscriptionId}`);

  if (!userId) {
    console.warn("[ls-webhook] No user_id in custom_data, skipping");
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  try {
    switch (eventName) {
      case "subscription_created": {
        const tier = tierFromVariantId(variantId);
        const isOnTrial = attrs.status === "on_trial";

        await supabase
          .from("users")
          .update({
            subscription_tier: tier,
            subscription_status: isOnTrial ? "trialing" : "active",
            trial_ends_at: isOnTrial ? (attrs.trial_ends_at ?? null) : null,
            ls_customer_id: customerId,
            ls_subscription_id: subscriptionId,
            ls_variant_id: variantId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        console.log(
          `[ls-webhook] User ${userId} ${isOnTrial ? "started trial" : "subscribed"} for ${tier}`,
        );
        break;
      }

      case "subscription_updated": {
        const tier = tierFromVariantId(variantId);
        const status = attrs.status;

        // Map LS status to our subscription_status
        let subscriptionStatus: string;
        if (status === "on_trial") subscriptionStatus = "trialing";
        else if (status === "active") subscriptionStatus = "active";
        else if (status === "cancelled" || status === "expired")
          subscriptionStatus = "cancelled";
        else subscriptionStatus = "active"; // past_due, paused → still give access

        const updateData: Record<string, unknown> = {
          subscription_tier: tier,
          subscription_status: subscriptionStatus,
          ls_variant_id: variantId,
          updated_at: new Date().toISOString(),
        };

        // Clear trial_ends_at when transitioning from trial to active
        if (status === "active") {
          updateData.trial_ends_at = null;
        }

        await supabase.from("users").update(updateData).eq("id", userId);

        console.log(
          `[ls-webhook] User ${userId} subscription updated: ${tier} / ${subscriptionStatus}`,
        );
        break;
      }

      case "subscription_cancelled": {
        // User requested cancellation. Keep tier until ends_at.
        await supabase
          .from("users")
          .update({
            subscription_status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        console.log(
          `[ls-webhook] User ${userId} cancelled (access until ends_at)`,
        );
        break;
      }

      case "subscription_expired": {
        // Subscription fully expired — downgrade to free
        await supabase
          .from("users")
          .update({
            subscription_tier: "free" as SubscriptionTier,
            subscription_status: "expired",
            ls_subscription_id: null,
            ls_variant_id: null,
            trial_ends_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        console.log(
          `[ls-webhook] User ${userId} subscription expired, downgraded to free`,
        );
        break;
      }

      case "subscription_payment_success": {
        // First real payment after trial → confirm active status
        await supabase
          .from("users")
          .update({
            subscription_status: "active",
            trial_ends_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        console.log(
          `[ls-webhook] Payment success for user ${userId}, sub ${subscriptionId}`,
        );
        break;
      }

      default:
        console.log(`[ls-webhook] Unhandled event: ${eventName}`);
    }
  } catch (err) {
    console.error(`[ls-webhook] DB error:`, err);
    // Still return 200 to prevent LS retries
  }

  return NextResponse.json({ received: true });
}
