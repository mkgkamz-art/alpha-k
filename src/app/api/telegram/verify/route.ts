/**
 * POST /api/telegram/verify — Verify a 6-digit code from the Telegram bot
 *
 * Body: { code: string }
 * Returns: { ok: true, chatId: string }
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTelegramCode } from "@/lib/telegram/bot";
import { sendTelegramMessage } from "@/lib/telegram/sender";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { code?: string };
  const code = body.code?.trim();

  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "6자리 숫자 코드를 입력하세요." },
      { status: 400 },
    );
  }

  const chatId = await verifyTelegramCode(code);
  if (!chatId) {
    return NextResponse.json(
      { error: "코드가 만료되었거나 유효하지 않습니다." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({
      telegram_chat_id: chatId,
      telegram_connected_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "텔레그램 연결에 실패했습니다." },
      { status: 500 },
    );
  }

  // Auto-send confirmation to Telegram
  await sendTelegramMessage(
    chatId,
    [
      `\u2705 *Alpha K 텔레그램 연동 완료*`,
      ``,
      `텔레그램이 성공적으로 연결되었습니다\\!`,
      `이제 실시간 알림을 받을 수 있습니다\\.`,
    ].join("\n"),
  ).catch(() => {
    // Non-critical — don't fail the API response
  });

  return NextResponse.json({ ok: true, chatId });
}
