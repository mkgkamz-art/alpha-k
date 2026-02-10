/**
 * Telegram Bot Message Sender
 *
 * Reference: docs/NOTIFICATIONS.md
 * - MarkdownV2 formatting
 * - 4 message formats: whale, risk, price_signal, token_unlock/liquidity
 * - Commands: /start, /status, /mute, /unmute, /watchlist, /help
 * - Retry: 3 attempts with exponential backoff
 * - Rate: Telegram Bot API 30 msg/s (global)
 */

import type { AlertType, Severity } from "@/types";

/* ── Types ── */
export interface TelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export interface TelegramAlertData {
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
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.blosafe.io";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/* ── MarkdownV2 Escape ── */
const SPECIAL_CHARS = /([_*\[\]()~`>#+\-=|{}.!\\])/g;

function escMd(text: string): string {
  return text.replace(SPECIAL_CHARS, "\\$1");
}

/* ── Severity Indicators ── */
const severityIndicator: Record<Severity, string> = {
  critical: "\u{1F534} CRITICAL",
  high: "\u{1F7E0} HIGH",
  medium: "\u{1F7E1} MEDIUM",
  low: "\u26AA LOW",
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

/* ── Message Formats ── */

/** Format 1: Whale Alert (with From/To addresses) */
function formatWhaleAlert(data: TelegramAlertData): string {
  const lines = [
    `${typeEmoji.whale} *${escMd(typeLabel.whale)}*`,
    `*${escMd(data.title)}*`,
    ``,
  ];

  if (data.from) {
    const fromInfo = data.fromLabel
      ? `\`${escMd(data.from)}\` \\(${escMd(data.fromLabel)}\\)`
      : `\`${escMd(data.from)}\``;
    lines.push(`From: ${fromInfo}`);
  }
  if (data.to) {
    const toInfo = data.toLabel
      ? `\`${escMd(data.to)}\` \\(${escMd(data.toLabel)}\\)`
      : `\`${escMd(data.to)}\``;
    lines.push(`To: ${toInfo}`);
  }
  if (data.amount) {
    lines.push(`Amount: *${escMd(data.amount)}*`);
  }

  lines.push(
    `Severity: ${severityIndicator[data.severity]}`,
    ``,
    `[View Details](${escMd(`${APP_URL}/alerts/${data.alertId}`)})`
  );

  return lines.join("\n");
}

/** Format 2: Risk Alert (DeFi risk, stablecoin depeg) */
function formatRiskAlert(data: TelegramAlertData): string {
  return [
    `${typeEmoji.risk} *${escMd(typeLabel.risk)}*`,
    `*${escMd(data.title)}*`,
    ``,
    escMd(data.description),
    ``,
    `Severity: ${severityIndicator[data.severity]}`,
    ``,
    `[View Details](${escMd(`${APP_URL}/alerts/${data.alertId}`)})`,
  ].join("\n");
}

/** Format 3: Price Signal (trading signal) */
function formatPriceSignal(data: TelegramAlertData): string {
  return [
    `${typeEmoji.price_signal} *${escMd(typeLabel.price_signal)}*`,
    `*${escMd(data.title)}*`,
    ``,
    escMd(data.description),
    ``,
    `Severity: ${severityIndicator[data.severity]}`,
    ``,
    `[View Details](${escMd(`${APP_URL}/alerts/${data.alertId}`)})`,
  ].join("\n");
}

/** Format 4: Token Unlock / Liquidity */
function formatGenericAlert(data: TelegramAlertData): string {
  return [
    `${typeEmoji[data.type]} *${escMd(typeLabel[data.type])}*`,
    `*${escMd(data.title)}*`,
    ``,
    escMd(data.description),
    ``,
    `Severity: ${severityIndicator[data.severity]}`,
    ``,
    `[View Details](${escMd(`${APP_URL}/alerts/${data.alertId}`)})`,
  ].join("\n");
}

/** Pick the right format based on alert type */
export function formatAlertMessage(data: TelegramAlertData): string {
  switch (data.type) {
    case "whale":
      return formatWhaleAlert(data);
    case "risk":
      return formatRiskAlert(data);
    case "price_signal":
      return formatPriceSignal(data);
    case "token_unlock":
    case "liquidity":
      return formatGenericAlert(data);
  }
}

/* ── Telegram API Calls ── */

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Send a message to a Telegram chat */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: "MarkdownV2" | "HTML" = "MarkdownV2"
): Promise<TelegramResult> {
  if (!BOT_TOKEN) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN not configured" };
  }

  let lastError: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      const data = (await res.json()) as {
        ok: boolean;
        result?: { message_id: number };
        description?: string;
      };

      if (data.ok && data.result) {
        return { success: true, messageId: data.result.message_id };
      }

      lastError = data.description ?? `HTTP ${res.status}`;

      // Don't retry 4xx except 429 (rate limit)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return { success: false, error: lastError };
      }

      // Handle 429 rate limit with Retry-After
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After") ?? "5");
        await sleep(retryAfter * 1_000);
        continue;
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

/** Send a formatted alert notification to Telegram */
export async function sendTelegramAlert(
  chatId: string,
  data: TelegramAlertData
): Promise<TelegramResult> {
  const message = formatAlertMessage(data);
  return sendTelegramMessage(chatId, message);
}
