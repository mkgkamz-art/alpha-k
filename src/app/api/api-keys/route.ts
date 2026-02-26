/**
 * GET    /api/api-keys — Get active API key (masked) + usage stats
 * POST   /api/api-keys — Create / regenerate API key (returns raw secret ONCE)
 * DELETE /api/api-keys — Delete API key
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createApiKey,
  getActiveApiKey,
  deleteApiKey,
  getDailyUsage,
  getDailyLimit,
} from "@/lib/api-keys";
import type { SubscriptionTier } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = await getActiveApiKey(user.id);

  // Get tier for limit info
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const limit = getDailyLimit(tier);
  const used = key ? await getDailyUsage(user.id) : 0;

  return NextResponse.json({
    apiKey: key
      ? {
          id: key.id,
          maskedKey: key.maskedKey,
          status: key.status,
          createdAt: key.createdAt,
        }
      : null,
    usage: {
      today: used,
      limit,
      tier,
    },
  });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { apiKey, apiSecret } = await createApiKey(user.id);

    return NextResponse.json({
      apiKey,
      apiSecret,
      message:
        "API Secret은 이 화면에서만 확인 가능합니다. 반드시 안전한 곳에 저장하세요.",
    });
  } catch (err) {
    console.error("[api-keys] Create error:", err);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { keyId?: string };
  if (!body.keyId) {
    return NextResponse.json({ error: "keyId required" }, { status: 400 });
  }

  try {
    await deleteApiKey(user.id, body.keyId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api-keys] Delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 },
    );
  }
}
