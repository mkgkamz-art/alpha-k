/**
 * POST /api/whale/:id/follow — 팔로우 추가
 * DELETE /api/whale/:id/follow — 팔로우 해제
 *
 * Free: 팔로우 불가 (403)
 * Pro: 10명까지
 * Whale: 무제한
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFollowLimit } from "@/lib/whale-api";
import type { SubscriptionTier } from "@/types";

async function getSessionInfo(): Promise<{
  tier: SubscriptionTier;
  userId: string;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData } = await supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    return {
      tier: (userData?.subscription_tier as SubscriptionTier) ?? "free",
      userId: user.id,
    };
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionInfo();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { id: whaleId } = await params;
  if (!whaleId || whaleId.length < 10) {
    return NextResponse.json(
      { error: "Invalid whale ID" },
      { status: 400 },
    );
  }

  const limit = getFollowLimit(session.tier);
  if (limit === 0) {
    return NextResponse.json(
      {
        error: "Upgrade to Pro to follow whales",
        upgrade_url: "/billing",
      },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  // Check whale exists
  const { data: whale } = await admin
    .from("whales")
    .select("id, follower_count")
    .eq("id", whaleId)
    .single();

  if (!whale) {
    return NextResponse.json(
      { error: "Whale not found" },
      { status: 404 },
    );
  }

  // Check follow limit
  if (limit !== Infinity) {
    const { count } = await admin
      .from("whale_follows")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.userId);

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        {
          error: `Follow limit reached (${limit}). Upgrade to Whale for unlimited follows.`,
          limit,
          used: count ?? 0,
          upgrade_url: "/billing",
        },
        { status: 403 },
      );
    }
  }

  // Upsert follow
  const { error } = await admin
    .from("whale_follows")
    .upsert(
      { user_id: session.userId, whale_id: whaleId },
      { onConflict: "user_id,whale_id" },
    );

  if (error) {
    return NextResponse.json(
      { error: "Failed to follow whale" },
      { status: 500 },
    );
  }

  // Increment follower_count
  await admin
    .from("whales")
    .update({ follower_count: whale.follower_count + 1 })
    .eq("id", whaleId);

  return NextResponse.json({ success: true, followed: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionInfo();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { id: whaleId } = await params;
  if (!whaleId || whaleId.length < 10) {
    return NextResponse.json(
      { error: "Invalid whale ID" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("whale_follows")
    .select("id")
    .eq("user_id", session.userId)
    .eq("whale_id", whaleId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "Not following this whale" },
      { status: 404 },
    );
  }

  const { error } = await admin
    .from("whale_follows")
    .delete()
    .eq("user_id", session.userId)
    .eq("whale_id", whaleId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to unfollow whale" },
      { status: 500 },
    );
  }

  // Decrement follower_count
  const { data: whale } = await admin
    .from("whales")
    .select("follower_count")
    .eq("id", whaleId)
    .single();

  if (whale) {
    await admin
      .from("whales")
      .update({ follower_count: Math.max(0, whale.follower_count - 1) })
      .eq("id", whaleId);
  }

  return NextResponse.json({ success: true, followed: false });
}
