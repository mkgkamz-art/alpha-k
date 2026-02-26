/**
 * Notification Dispatcher — Central routing for all alert channels
 *
 * Reference: docs/NOTIFICATIONS.md
 *
 * Flow:
 * 1. alert_events INSERT → dispatcher called
 * 2. delivery_channels checked
 * 3. Quiet Hours check
 * 4. Rate Limit check (max_alerts_per_hour)
 * 5. Cooldown check (alert_rules.cooldown_minutes)
 * 6. Channel-specific dispatch (push, telegram, discord, email, sms)
 * 7. delivered_via updated
 */

import type { AlertType, Severity, SubscriptionTier, NotificationPreferences, NotificationAlertType } from "@/types";
import { sendPush, type PushSubscription, type PushPayload } from "./push";
import { sendAlertEmail, type AlertEmailData } from "./email";
import { sendAlertSms } from "./sms";
import { sendTelegramAlert, type TelegramAlertData } from "@/lib/telegram/sender";
import { sendDiscordAlert, type DiscordAlertData } from "@/lib/discord/sender";

/* ── Types ── */

export interface DeliveryChannels {
  push?: boolean;
  email?: boolean;
  telegram?: boolean;
  discord?: boolean;
  sms?: boolean;
}

export interface AlertEventPayload {
  id: string;
  userId: string;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  /** For whale alerts */
  from?: string;
  fromLabel?: string;
  to?: string;
  toLabel?: string;
  amount?: string;
}

export interface UserNotificationConfig {
  subscriptionTier: SubscriptionTier;
  email: string;
  telegramChatId: string | null;
  discordWebhookUrl: string | null;
  phoneNumber: string | null;
  pushSubscriptions: PushSubscription[];
  deliveryChannels: DeliveryChannels;
  quietHoursStart: string | null; // "HH:MM"
  quietHoursEnd: string | null; // "HH:MM"
  timezone: string;
  maxAlertsPerHour: number;
  notificationPreferences?: NotificationPreferences | null;
}

export interface DispatchResult {
  alertId: string;
  deliveredVia: Record<string, boolean>;
  skippedReasons: string[];
}

/* ── Rate Limit Tracking (in-memory) ── */
const hourlyCountMap = new Map<string, { count: number; resetAt: number }>();

function checkHourlyRateLimit(userId: string, maxPerHour: number): boolean {
  const now = Date.now();
  const entry = hourlyCountMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    hourlyCountMap.set(userId, {
      count: 1,
      resetAt: now + 60 * 60 * 1_000,
    });
    return true;
  }

  if (entry.count >= maxPerHour) return false;
  entry.count++;
  return true;
}

/* ── Quiet Hours Check ── */

function isInQuietHours(
  start: string | null,
  end: string | null,
  timezone: string
): boolean {
  if (!start || !end) return false;

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const currentTime = formatter.format(now);
    const [currentH, currentM] = currentTime.split(":").map(Number);
    const currentMinutes = currentH * 60 + currentM;

    const [startH, startM] = start.split(":").map(Number);
    const startMinutes = startH * 60 + startM;

    const [endH, endM] = end.split(":").map(Number);
    const endMinutes = endH * 60 + endM;

    // Handle overnight ranges (e.g., 22:00 → 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } catch {
    return false;
  }
}

/* ── Channel Availability by Tier ── */

function getAvailableChannels(
  tier: SubscriptionTier,
  channels: DeliveryChannels
): DeliveryChannels {
  const available: DeliveryChannels = { push: channels.push };

  // Pro + Whale: email, telegram, discord
  if (tier === "pro" || tier === "whale") {
    available.email = channels.email;
    available.telegram = channels.telegram;
    available.discord = channels.discord;
  }

  // Whale only: SMS
  if (tier === "whale") {
    available.sms = channels.sms;
  }

  return available;
}

/* ── Alert Type → Notification Preference Key ── */

const ALERT_TO_NOTIF_KEY: Partial<Record<AlertType, NotificationAlertType>> = {
  whale: "whale",
  risk: "defi_risk",
  price_signal: "trading_signal",
  token_unlock: "trading_signal",
  liquidity: "liquidity",
};

/* ── Main Dispatcher ── */

export async function dispatchNotification(
  event: AlertEventPayload,
  config: UserNotificationConfig
): Promise<DispatchResult> {
  const result: DispatchResult = {
    alertId: event.id,
    deliveredVia: {},
    skippedReasons: [],
  };

  // 1. Quiet Hours check (skip for critical)
  if (event.severity !== "critical") {
    if (
      isInQuietHours(
        config.quietHoursStart,
        config.quietHoursEnd,
        config.timezone
      )
    ) {
      result.skippedReasons.push("Quiet hours active");
      return result;
    }
  }

  // 2. Rate Limit check
  if (!checkHourlyRateLimit(event.userId, config.maxAlertsPerHour)) {
    result.skippedReasons.push(
      `Hourly rate limit exceeded (${config.maxAlertsPerHour}/hr)`
    );
    return result;
  }

  // 3. Determine available channels by tier
  const channels = getAvailableChannels(
    config.subscriptionTier,
    config.deliveryChannels
  );

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.blosafe.io";
  const alertUrl = `${APP_URL}/alerts/${event.id}`;

  // 4. Dispatch to each enabled channel in parallel
  const promises: Promise<void>[] = [];

  // Push
  if (channels.push && config.pushSubscriptions.length > 0) {
    const pushPayload: PushPayload = {
      title: `[${event.severity.toUpperCase()}] ${event.title}`,
      body: event.description.slice(0, 200),
      url: alertUrl,
      tag: `alert-${event.id}`,
    };

    promises.push(
      (async () => {
        const results = await Promise.all(
          config.pushSubscriptions.map((sub) => sendPush(sub, pushPayload))
        );
        result.deliveredVia.push = results.some((r) => r.success);
      })()
    );
  }

  // Telegram — check per-alert-type notification preferences
  const notifKey = ALERT_TO_NOTIF_KEY[event.type];
  if (notifKey && config.notificationPreferences) {
    const pref = config.notificationPreferences[notifKey];
    if (pref && !pref.telegram) {
      channels.telegram = false;
    }
  }

  if (channels.telegram && config.telegramChatId) {
    const telegramData: TelegramAlertData = {
      type: event.type,
      severity: event.severity,
      title: event.title,
      description: event.description,
      from: event.from,
      fromLabel: event.fromLabel,
      to: event.to,
      toLabel: event.toLabel,
      amount: event.amount,
      alertId: event.id,
    };

    promises.push(
      (async () => {
        const res = await sendTelegramAlert(
          config.telegramChatId!,
          telegramData
        );
        result.deliveredVia.telegram = res.success;
      })()
    );
  }

  // Discord
  if (channels.discord && config.discordWebhookUrl) {
    const discordData: DiscordAlertData = {
      type: event.type,
      severity: event.severity,
      title: event.title,
      description: event.description,
      from: event.from,
      fromLabel: event.fromLabel,
      to: event.to,
      toLabel: event.toLabel,
      amount: event.amount,
      alertId: event.id,
    };

    promises.push(
      (async () => {
        const res = await sendDiscordAlert(
          config.discordWebhookUrl!,
          discordData
        );
        result.deliveredVia.discord = res.success;
      })()
    );
  }

  // Email
  if (channels.email && config.email) {
    const emailData: AlertEmailData = {
      type: event.type,
      severity: event.severity,
      title: event.title,
      description: event.description,
      alertUrl,
    };

    promises.push(
      (async () => {
        const res = await sendAlertEmail(config.email, emailData);
        result.deliveredVia.email = res.success;
      })()
    );
  }

  // SMS (Whale tier, critical only)
  if (channels.sms && config.phoneNumber) {
    promises.push(
      (async () => {
        const res = await sendAlertSms({
          userId: event.userId,
          phoneNumber: config.phoneNumber!,
          severity: event.severity,
          title: event.title,
          alertUrl,
        });
        result.deliveredVia.sms = res.success;
        if (!res.success && res.error) {
          result.skippedReasons.push(`SMS: ${res.error}`);
        }
      })()
    );
  }

  await Promise.allSettled(promises);

  return result;
}
