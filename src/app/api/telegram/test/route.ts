/**
 * POST /api/telegram/test — Send a test notification to connected Telegram
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/sender";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("telegram_chat_id")
    .eq("id", user.id)
    .single();

  if (!profile?.telegram_chat_id) {
    return NextResponse.json(
      { error: "Telegram not connected" },
      { status: 400 },
    );
  }

  const result = await sendTelegramMessage(
    profile.telegram_chat_id,
    [
      `\\u2705 *Alpha K 테스트 알림*`,
      ``,
      `이 메시지가 보이면 텔레그램 연동이 정상 작동합니다\\!`,
      `실시간 고래 알림, 시그널, 상장 알림을 받을 수 있습니다\\.`,
    ].join("\n"),
  );

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to send test message" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
