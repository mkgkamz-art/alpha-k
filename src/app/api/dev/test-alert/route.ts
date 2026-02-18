/**
 * GET /api/dev/test-alert
 *
 * Dev-only: Create a test alert_event and attempt Telegram dispatch.
 * Useful for testing the notification pipeline.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  dispatchNotification,
  type UserNotificationConfig,
  type DeliveryChannels,
} from "@/lib/notifications/dispatcher";
import type { Json } from "@/types/database.types";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Dev only" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    // Find first user with telegram_chat_id
    const { data: users } = await supabase
      .from("users")
      .select("*")
      .not("telegram_chat_id", "is", null)
      .limit(1);

    const testUser = users?.[0];
    if (!testUser) {
      return NextResponse.json({
        error: "No user with telegram_chat_id found. Connect Telegram first.",
      }, { status: 400 });
    }

    // Create test alert_event
    const { data: alert, error: alertErr } = await supabase
      .from("alert_events")
      .insert({
        user_id: testUser.id,
        type: "price_signal" as const,
        severity: "high" as const,
        title: "BTC — Test Signal (Dev)",
        description: "This is a test alert to verify Telegram notification delivery.",
        metadata: {
          signal_type: "buy",
          confidence: 85,
          price_at_signal: 97500,
          test: true,
        } as unknown as Json,
      })
      .select("id")
      .single();

    if (alertErr) throw alertErr;

    // Dispatch notification
    const config: UserNotificationConfig = {
      subscriptionTier: testUser.subscription_tier as "free" | "pro" | "whale",
      email: testUser.email,
      telegramChatId: testUser.telegram_chat_id,
      discordWebhookUrl: testUser.discord_webhook_url,
      phoneNumber: testUser.phone_number,
      pushSubscriptions: [],
      deliveryChannels: { telegram: true } as DeliveryChannels,
      quietHoursStart: testUser.quiet_hours_start,
      quietHoursEnd: testUser.quiet_hours_end,
      timezone: testUser.timezone,
      maxAlertsPerHour: testUser.max_alerts_per_hour,
    };

    const result = await dispatchNotification(
      {
        id: alert!.id,
        userId: testUser.id,
        type: "price_signal",
        severity: "high",
        title: "BTC — Test Signal (Dev)",
        description: "This is a test alert to verify Telegram notification delivery.",
      },
      config
    );

    return NextResponse.json({
      success: true,
      alert_id: alert!.id,
      user: {
        id: testUser.id,
        email: testUser.email,
        telegram_chat_id: testUser.telegram_chat_id,
      },
      dispatch: result,
    });
  } catch (err) {
    console.error("[dev/test-alert] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
