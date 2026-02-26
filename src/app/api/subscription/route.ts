/**
 * GET  /api/subscription — current subscription details from Lemon Squeezy
 * POST /api/subscription — actions: cancel, resume
 *
 * Requires authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSubscription,
  cancelSubscription,
  updateSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy/config";
import { getPlanByVariantId } from "@/lib/lemonsqueezy/plans";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(
      "subscription_tier, subscription_status, trial_ends_at, ls_subscription_id, ls_variant_id, ls_customer_id",
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // No active LS subscription → return local DB state
  if (!profile.ls_subscription_id) {
    return NextResponse.json({
      subscription: {
        tier: profile.subscription_tier ?? "free",
        status: profile.subscription_status ?? "free",
        plan: null,
        renewsAt: null,
        endsAt: null,
        amount: null,
        interval: null,
        customerPortalUrl: null,
        updatePaymentUrl: null,
        isOnTrial: false,
        trialEndsAt: null,
        daysLeftInTrial: 0,
      },
    });
  }

  // Fetch subscription details from Lemon Squeezy
  try {
    configureLemonSqueezy();

    const res = await getSubscription(profile.ls_subscription_id);
    if (res.error) {
      console.error("[subscription] LS error:", res.error.message);
      return NextResponse.json({
        subscription: {
          tier: profile.subscription_tier ?? "free",
          status: profile.subscription_status ?? "active",
          plan: null,
          renewsAt: null,
          endsAt: null,
          amount: null,
          interval: null,
          customerPortalUrl: null,
          updatePaymentUrl: null,
          isOnTrial: false,
          trialEndsAt: null,
          daysLeftInTrial: 0,
        },
      });
    }

    const attrs = res.data?.data.attributes;
    const urls = (attrs?.urls ?? {}) as Record<string, string>;
    const plan = profile.ls_variant_id
      ? getPlanByVariantId(profile.ls_variant_id)
      : null;

    const isYearly = plan
      ? profile.ls_variant_id === plan.yearly.variantId
      : false;

    // Trial info
    const isOnTrial = attrs?.status === "on_trial";
    const trialEndsAt =
      profile.trial_ends_at ??
      ((attrs?.trial_ends_at as string | null) ?? null);
    const daysLeftInTrial =
      isOnTrial && trialEndsAt
        ? Math.max(
            0,
            Math.ceil(
              (new Date(trialEndsAt).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 0;

    return NextResponse.json({
      subscription: {
        tier: profile.subscription_tier ?? "free",
        status: attrs?.status ?? profile.subscription_status ?? "active",
        cancelled: attrs?.cancelled ?? false,
        plan: plan?.name ?? null,
        renewsAt: attrs?.renews_at ?? null,
        endsAt: attrs?.ends_at ?? null,
        amount: isYearly
          ? (plan?.yearly.price ?? null)
          : (plan?.monthly.price ?? null),
        interval: isYearly ? "yearly" : "monthly",
        customerPortalUrl: urls.customer_portal ?? null,
        updatePaymentUrl: urls.update_payment_method ?? null,
        isOnTrial,
        trialEndsAt,
        daysLeftInTrial,
      },
    });
  } catch (err) {
    console.error("[subscription] Error:", err);
    return NextResponse.json({
      subscription: {
        tier: profile.subscription_tier ?? "free",
        status: profile.subscription_status ?? "active",
        plan: null,
        renewsAt: null,
        endsAt: null,
        amount: null,
        interval: null,
        customerPortalUrl: null,
        updatePaymentUrl: null,
        isOnTrial: false,
        trialEndsAt: null,
        daysLeftInTrial: 0,
      },
    });
  }
}

/* ── POST: cancel / resume subscription ── */

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { action?: string };
  const action = body.action;

  if (!action || !["cancel", "resume"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("ls_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.ls_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 },
    );
  }

  try {
    configureLemonSqueezy();

    if (action === "cancel") {
      const res = await cancelSubscription(profile.ls_subscription_id);
      if (res.error) throw new Error(res.error.message);
      return NextResponse.json({ success: true, action: "cancelled" });
    }

    // resume
    const res = await updateSubscription(profile.ls_subscription_id, {
      cancelled: false,
    });
    if (res.error) throw new Error(res.error.message);
    return NextResponse.json({ success: true, action: "resumed" });
  } catch (err) {
    console.error(`[subscription] ${action} error:`, err);
    return NextResponse.json(
      { error: `Failed to ${action} subscription` },
      { status: 500 },
    );
  }
}
