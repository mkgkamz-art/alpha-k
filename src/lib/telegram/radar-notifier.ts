/**
 * Radar signal → Telegram notification dispatcher.
 *
 * Filters eligible users (Pro/Whale + telegram linked + settings match)
 * and sends MarkdownV2 formatted messages per signal type.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { RadarSignalPayload } from "@/lib/radar-scoring";
import type { RadarStrength } from "@/types";
import { sendTelegramMessage } from "./sender";

/* ── Types ── */

type RadarSignalTypeEnum = Database["public"]["Enums"]["radar_signal_type"];

interface EligibleUser {
  id: string;
  telegram_chat_id: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  notify_telegram: boolean;
  min_score_alert: number;
  signal_types: string[];
}

/* ── Constants ── */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.blosafe.io";
const BATCH_SIZE = 10;

const SPECIAL_CHARS = /([_*\[\]()~`>#+\-=|{}.!\\])/g;
function escMd(text: string): string {
  return text.replace(SPECIAL_CHARS, "\\$1");
}

/* ── Signal type → emoji + header ── */

const TYPE_META: Record<RadarSignalTypeEnum, { emoji: string; header: string }> = {
  volume: { emoji: "🚨", header: "체결량 폭증" },
  orderbook: { emoji: "⚡", header: "호가벽 감지" },
  kimchi: { emoji: "🇰🇷", header: "김프 이상치" },
  buzz: { emoji: "💬", header: "커뮤니티 버즈" },
  listing: { emoji: "📋", header: "신규 상장" },
  surge: { emoji: "📈", header: "급등/급락" },
  onchain: { emoji: "🔗", header: "온체인 이상" },
  signal: { emoji: "📊", header: "시그널" },
  context: { emoji: "⚠️", header: "컨텍스트 알림" },
};

/* ── Strength → Korean label ── */

const STRENGTH_LABEL: Record<RadarStrength, string> = {
  extreme: "극단적",
  strong: "강한 시그널",
  moderate: "관망",
  weak: "약한 시그널",
};

/* ── Quiet Hours Check ── */

function isInQuietHours(
  start: string | null,
  end: string | null,
  timezone: string,
): boolean {
  if (!start || !end) return false;

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return false;

  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  // Get current time in user's timezone
  let nowMin: number;
  try {
    const now = new Date();
    const formatted = now.toLocaleString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const [h, m] = formatted.split(":").map(Number);
    nowMin = h * 60 + m;
  } catch {
    // Invalid timezone → skip quiet hours check
    return false;
  }

  // Handle overnight quiet hours (e.g. 23:00 - 07:00)
  if (startMin > endMin) {
    return nowMin >= startMin || nowMin < endMin;
  }
  return nowMin >= startMin && nowMin < endMin;
}

/* ── Message Format ── */

function formatRadarMessage(
  signalId: string,
  payload: RadarSignalPayload,
): string {
  const meta = TYPE_META[payload.signal_type] ?? { emoji: "📡", header: "알림" };
  const strengthLabel = STRENGTH_LABEL[payload.strength as RadarStrength] ?? payload.strength;

  const lines: string[] = [
    `${meta.emoji} *${escMd(meta.header)}*`,
    `${escMd(payload.title)}`,
  ];

  if (payload.description) {
    lines.push(escMd(payload.description));
  }

  lines.push(`시그널 점수: ${payload.score}/100 \\(${escMd(strengthLabel)}\\)`);

  // Historical pattern hit rate
  const pattern = payload.historical_pattern;
  if (pattern && typeof pattern === "object" && "hitRate" in pattern) {
    const hitRate = pattern.hitRate as number;
    const sampleSize = (pattern.sampleSize as number) ?? 0;
    if (hitRate > 0 && sampleSize > 0) {
      lines.push(
        `적중 확률: ${Math.round(hitRate * 100)}% \\(과거 ${sampleSize}회\\)`,
      );
    }
  }

  lines.push(
    ``,
    `[상세 보기](${escMd(`${APP_URL}/radar/${signalId}`)})`,
  );

  return lines.join("\n");
}

/* ── Main Dispatcher ── */

export async function dispatchRadarNotification(
  admin: SupabaseClient<Database>,
  signalId: string,
  payload: RadarSignalPayload,
): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;

  // 1. Get Pro/Whale users with telegram linked
  const { data: users, error: usersError } = await admin
    .from("users")
    .select("id, telegram_chat_id, quiet_hours_start, quiet_hours_end, timezone")
    .not("telegram_chat_id", "is", null)
    .in("subscription_tier", ["pro", "whale"]);

  if (usersError || !users || users.length === 0) {
    return { sent: 0, skipped: 0 };
  }

  // 2. Get radar settings for these users
  const userIds = users.map((u) => u.id);
  const { data: settings } = await admin
    .from("user_radar_settings")
    .select("user_id, notify_telegram, min_score_alert, signal_types")
    .in("user_id", userIds);

  const settingsMap = new Map(
    (settings ?? []).map((s) => [s.user_id, s]),
  );

  // 3. Build eligible user list
  const eligible: EligibleUser[] = [];

  for (const user of users) {
    if (!user.telegram_chat_id) continue;

    const setting = settingsMap.get(user.id);

    // Default: notify_telegram=true, min_score_alert=50, all types
    const notifyTelegram = setting?.notify_telegram ?? true;
    const minScore = setting?.min_score_alert ?? 50;
    const signalTypes = (setting?.signal_types as string[] | null) ?? [];

    if (!notifyTelegram) {
      skipped++;
      continue;
    }

    if (payload.score < minScore) {
      skipped++;
      continue;
    }

    // If signal_types is set and non-empty, check inclusion
    if (signalTypes.length > 0 && !signalTypes.includes(payload.signal_type)) {
      skipped++;
      continue;
    }

    // Quiet hours check
    if (isInQuietHours(user.quiet_hours_start, user.quiet_hours_end, user.timezone)) {
      skipped++;
      continue;
    }

    eligible.push({
      id: user.id,
      telegram_chat_id: user.telegram_chat_id,
      quiet_hours_start: user.quiet_hours_start,
      quiet_hours_end: user.quiet_hours_end,
      timezone: user.timezone,
      notify_telegram: notifyTelegram,
      min_score_alert: minScore,
      signal_types: signalTypes,
    });
  }

  if (eligible.length === 0) return { sent, skipped };

  // 4. Format message
  const message = formatRadarMessage(signalId, payload);

  // 5. Send in batches
  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((user) =>
        sendTelegramMessage(user.telegram_chat_id, message, "MarkdownV2"),
      ),
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        sent++;
      } else {
        skipped++;
      }
    }
  }

  console.log(
    `[radar-notifier] signal=${signalId} type=${payload.signal_type} sent=${sent} skipped=${skipped}`,
  );

  return { sent, skipped };
}
