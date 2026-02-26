/**
 * POST   /api/telegram/link — Generate a 6-digit Telegram link code
 * DELETE /api/telegram/link — Disconnect Telegram
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateLinkCode } from "@/lib/telegram/bot";

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? "blosafe_alert_bot";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = generateLinkCode(user.id);

  return NextResponse.json({
    code,
    expiresIn: 300,
    botUsername: BOT_USERNAME,
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 1. Clear all telegram fields on user
  const { error } = await admin
    .from("users")
    .update({
      telegram_chat_id: null,
      telegram_username: null,
      telegram_connected_at: null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 },
    );
  }

  // 2. Disable all telegram toggles in notification_settings table
  await admin
    .from("notification_settings")
    .update({
      telegram_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
