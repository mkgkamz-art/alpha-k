/**
 * POST /api/v1/whale/:id/follow — 팔로우 추가
 * DELETE /api/v1/whale/:id/follow — 팔로우 해제
 *
 * Free: 팔로우 불가
 * Pro: 10명까지
 * Whale: 무제한
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiKeyAuth } from "@/lib/middleware/api-key-auth";
import { getFollowLimit } from "@/lib/whale-api";

function extractWhaleId(url: string): string {
  // /api/v1/whale/{id}/follow → segments[-2]
  const segments = new URL(url).pathname.split("/");
  return segments[segments.length - 2];
}

export const POST = withApiKeyAuth("v1-whale-follow", async (req, ctx) => {
  const whaleId = extractWhaleId(req.url);

  if (!whaleId || whaleId.length < 10) {
    return NextResponse.json(
      { error: "Invalid whale ID" },
      { status: 400 },
    );
  }

  // Check tier limit
  const limit = getFollowLimit(ctx.tier);
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

  // Check current follow count
  if (limit !== Infinity) {
    const { count } = await admin
      .from("whale_follows")
      .select("*", { count: "exact", head: true })
      .eq("user_id", ctx.userId);

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

  // Upsert follow (idempotent)
  const { error } = await admin
    .from("whale_follows")
    .upsert(
      { user_id: ctx.userId, whale_id: whaleId },
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
});

export const DELETE = withApiKeyAuth(
  "v1-whale-unfollow",
  async (req, ctx) => {
    const whaleId = extractWhaleId(req.url);

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
      .eq("user_id", ctx.userId)
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
      .eq("user_id", ctx.userId)
      .eq("whale_id", whaleId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to unfollow whale" },
        { status: 500 },
      );
    }

    // Decrement follower_count (min 0)
    const { data: whale } = await admin
      .from("whales")
      .select("follower_count")
      .eq("id", whaleId)
      .single();

    if (whale) {
      await admin
        .from("whales")
        .update({
          follower_count: Math.max(0, whale.follower_count - 1),
        })
        .eq("id", whaleId);
    }

    return NextResponse.json({ success: true, followed: false });
  },
);
