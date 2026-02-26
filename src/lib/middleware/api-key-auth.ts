/**
 * API Key authentication middleware for /api/v1/* endpoints.
 *
 * Usage:
 *   export const GET = withApiKeyAuth("v1-alerts", async (req, ctx) => {
 *     // ctx.userId, ctx.tier, ctx.apiKeyId
 *   });
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySecret } from "@/lib/api-keys";
import { getTierLimits } from "@/lib/middleware/subscription-guard";
import type { SubscriptionTier } from "@/types";

interface ApiKeyContext {
  userId: string;
  tier: SubscriptionTier;
  apiKeyId: string;
}

type ApiHandler = (
  req: NextRequest,
  ctx: ApiKeyContext,
) => Promise<NextResponse>;

export function withApiKeyAuth(label: string, handler: ApiHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const apiKey = req.headers.get("X-API-Key");
    const apiSecret = req.headers.get("X-API-Secret");

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Missing X-API-Key or X-API-Secret header" },
        { status: 401 },
      );
    }

    const supabase = createAdminClient();

    // 1. Look up the API key
    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("id, user_id, api_secret_hash, status")
      .eq("api_key", apiKey)
      .single();

    if (!keyRow || keyRow.status !== "active") {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // 2. Verify secret hash
    if (!verifySecret(apiSecret, keyRow.api_secret_hash)) {
      return NextResponse.json(
        { error: "Invalid API secret" },
        { status: 401 },
      );
    }

    // 3. Get user tier
    const { data: user } = await supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", keyRow.user_id)
      .single();

    const tier = (user?.subscription_tier ?? "free") as SubscriptionTier;

    // 4. Check daily rate limit
    const limits = getTierLimits(tier);
    if (limits.apiCallsPerDay !== Infinity) {
      const today = new Date().toISOString().slice(0, 10);

      const { data: usageRows } = await supabase
        .from("api_usage_logs")
        .select("request_count")
        .eq("user_id", keyRow.user_id)
        .eq("request_date", today);

      const totalToday = (usageRows ?? []).reduce(
        (sum, r) => sum + r.request_count,
        0,
      );

      if (totalToday >= limits.apiCallsPerDay) {
        // Next KST midnight
        const now = new Date();
        const kstOffset = 9 * 60 * 60 * 1000;
        const kstNow = new Date(now.getTime() + kstOffset);
        const kstMidnight = new Date(kstNow);
        kstMidnight.setUTCHours(24, 0, 0, 0);
        const resetUtc = new Date(kstMidnight.getTime() - kstOffset);

        return NextResponse.json(
          {
            error: "Daily API limit exceeded",
            limit: limits.apiCallsPerDay,
            used: totalToday,
            reset: resetUtc.toISOString(),
          },
          { status: 429 },
        );
      }
    }

    // 5. Log usage via atomic RPC
    const endpoint = new URL(req.url).pathname;
    const today = new Date().toISOString().slice(0, 10);

    try {
      await supabase.rpc("increment_api_usage", {
        p_user_id: keyRow.user_id,
        p_api_key_id: keyRow.id,
        p_endpoint: endpoint,
        p_request_date: today,
      });
    } catch (err) {
      console.warn(`[${label}] Usage log failed:`, err);
    }

    // 6. Delegate to handler
    return handler(req, {
      userId: keyRow.user_id,
      tier,
      apiKeyId: keyRow.id,
    });
  };
}
