/**
 * Telegram Webhook Route
 *
 * POST /api/webhooks/telegram
 *
 * Receives updates from the Telegram Bot API and delegates
 * to the bot command handler.
 *
 * Setup (one-time):
 *   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     -H "Content-Type: application/json" \
 *     -d '{"url":"https://app.blosafe.io/api/webhooks/telegram","secret_token":"<SECRET>"}'
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN         — Bot API token
 *   TELEGRAM_WEBHOOK_SECRET    — Optional secret for X-Telegram-Bot-Api-Secret-Token
 */

import { NextResponse } from "next/server";

import {
  handleTelegramUpdate,
  verifyWebhookSecret,
  type TelegramUpdate,
} from "@/lib/telegram/bot";

export async function POST(request: Request) {
  // 1. Verify webhook secret
  const secretHeader = request.headers.get(
    "X-Telegram-Bot-Api-Secret-Token"
  );

  if (!verifyWebhookSecret(secretHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse update body
  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  // 3. Process update (non-blocking to avoid Telegram timeout)
  // Telegram expects a 200 response within a few seconds.
  // We fire-and-forget the handler so slow DB queries don't cause retries.
  handleTelegramUpdate(update).catch((err) => {
    console.error("[Telegram Webhook] Handler error:", err);
  });

  // 4. Acknowledge immediately
  return NextResponse.json({ ok: true });
}

/** Block other methods */
export async function GET() {
  return NextResponse.json(
    { error: "Use POST for Telegram webhooks" },
    { status: 405 }
  );
}
