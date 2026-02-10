/**
 * Discord Webhook Sender
 *
 * Reference: docs/NOTIFICATIONS.md
 * - Embed format: color = severity, fields (From/To/Severity), footer, timestamp
 * - Rate: 30 msg/min per webhook
 * - Retry: 3 attempts with exponential backoff
 */

import type { AlertType, Severity } from "@/types";

/* ── Types ── */
export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
  url?: string;
  thumbnail?: { url: string };
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordResult {
  success: boolean;
  error?: string;
}

export interface DiscordAlertData {
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  from?: string;
  fromLabel?: string;
  to?: string;
  toLabel?: string;
  amount?: string;
  alertId: string;
}

/* ── Config ── */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.blosafe.io";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/* ── Color Mapping (decimal) ── */
const severityColor: Record<Severity, number> = {
  critical: 0xf6465d, // Red
  high: 0xff8c00, // Orange
  medium: 0xf0b90b, // Yellow/Gold
  low: 0x848e9c, // Gray
};

const typeEmoji: Record<AlertType, string> = {
  whale: "\u{1F40B}",
  risk: "\u26A0\uFE0F",
  price_signal: "\u{1F4C8}",
  token_unlock: "\u{1F513}",
  liquidity: "\u{1F4A7}",
};

const typeLabel: Record<AlertType, string> = {
  whale: "Whale Alert",
  risk: "Risk Alert",
  price_signal: "Price Signal",
  token_unlock: "Token Unlock",
  liquidity: "Liquidity Alert",
};

/* ── Embed Builder ── */

export function buildAlertEmbed(data: DiscordAlertData): DiscordEmbed {
  const fields: DiscordEmbed["fields"] = [];

  // From / To for whale alerts
  if (data.from) {
    fields.push({
      name: "From",
      value: data.fromLabel
        ? `\`${data.from}\` (${data.fromLabel})`
        : `\`${data.from}\``,
      inline: true,
    });
  }
  if (data.to) {
    fields.push({
      name: "To",
      value: data.toLabel
        ? `\`${data.to}\` (${data.toLabel})`
        : `\`${data.to}\``,
      inline: true,
    });
  }
  if (data.amount) {
    fields.push({ name: "Amount", value: data.amount, inline: true });
  }

  fields.push({
    name: "Severity",
    value: `${data.severity.toUpperCase()}`,
    inline: true,
  });

  fields.push({
    name: "Type",
    value: `${typeEmoji[data.type]} ${typeLabel[data.type]}`,
    inline: true,
  });

  return {
    title: `${typeEmoji[data.type]} ${data.title}`,
    description: data.description,
    color: severityColor[data.severity],
    fields,
    footer: { text: "BLOSAFE Smart Alert" },
    timestamp: new Date().toISOString(),
    url: `${APP_URL}/alerts/${data.alertId}`,
  };
}

/* ── Send to Discord Webhook ── */

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<DiscordResult> {
  if (!webhookUrl) {
    return { success: false, error: "No webhook URL provided" };
  }

  let lastError: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      // Discord returns 204 No Content on success
      if (res.status === 204 || res.ok) {
        return { success: true };
      }

      lastError = `HTTP ${res.status}`;

      // Handle 429 rate limit
      if (res.status === 429) {
        const body = (await res.json()) as { retry_after?: number };
        const retryMs = (body.retry_after ?? 2) * 1_000;
        await sleep(retryMs);
        continue;
      }

      // Don't retry other 4xx
      if (res.status >= 400 && res.status < 500) {
        return { success: false, error: lastError };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }

    if (attempt < MAX_RETRIES - 1) {
      await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
    }
  }

  return { success: false, error: lastError };
}

/** Send a formatted alert to Discord via webhook */
export async function sendDiscordAlert(
  webhookUrl: string,
  data: DiscordAlertData
): Promise<DiscordResult> {
  const embed = buildAlertEmbed(data);

  return sendDiscordWebhook(webhookUrl, {
    username: "BLOSAFE Alerts",
    embeds: [embed],
  });
}
