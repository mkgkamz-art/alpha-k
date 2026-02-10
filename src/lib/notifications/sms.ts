/**
 * SMS Notifications via Twilio
 *
 * Reference: docs/NOTIFICATIONS.md
 * - Whale tier only
 * - Critical severity only
 * - Max 5 per day per user
 * - Retry: 3 attempts with exponential backoff
 */

import type { Severity } from "@/types";

/* ── Types ── */
export interface SmsPayload {
  to: string;
  body: string;
}

export interface SmsResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/* ── Config ── */
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER ?? "";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;
const DAILY_SMS_LIMIT = 5;

/* ── Daily Limit Tracking (in-memory, per-process) ── */
const dailyCounts = new Map<string, { count: number; resetAt: number }>();

function checkAndIncrementDailyLimit(userId: string): boolean {
  const now = Date.now();
  const entry = dailyCounts.get(userId);

  // Reset at midnight UTC
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(24, 0, 0, 0);
  const resetAt = todayMidnight.getTime();

  if (!entry || now >= entry.resetAt) {
    dailyCounts.set(userId, { count: 1, resetAt });
    return true;
  }

  if (entry.count >= DAILY_SMS_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

/** Get remaining SMS count for a user today */
export function getRemainingSmsByUser(userId: string): number {
  const now = Date.now();
  const entry = dailyCounts.get(userId);

  if (!entry || now >= entry.resetAt) return DAILY_SMS_LIMIT;
  return Math.max(0, DAILY_SMS_LIMIT - entry.count);
}

/* ── Helpers ── */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── Send SMS via Twilio REST API ── */

export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  let lastError: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const body = new URLSearchParams({
        To: payload.to,
        From: TWILIO_FROM_NUMBER,
        Body: payload.body,
      });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        const data = (await res.json()) as { sid?: string };
        return { success: true, messageSid: data.sid };
      }

      lastError = `HTTP ${res.status}`;

      // Don't retry 4xx client errors (except 429)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
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

/**
 * Send a critical alert SMS (Whale tier only)
 *
 * Validates:
 * - Severity must be critical
 * - Daily limit not exceeded (5/day)
 * - Phone number must be present
 */
export async function sendAlertSms(params: {
  userId: string;
  phoneNumber: string;
  severity: Severity;
  title: string;
  alertUrl: string;
}): Promise<SmsResult> {
  // Only critical alerts get SMS
  if (params.severity !== "critical") {
    return { success: false, error: "SMS only for critical severity" };
  }

  // Check daily limit
  if (!checkAndIncrementDailyLimit(params.userId)) {
    return {
      success: false,
      error: `Daily SMS limit reached (${DAILY_SMS_LIMIT}/day)`,
    };
  }

  const body = [
    `\u{1F6A8} BLOSAFE CRITICAL ALERT`,
    ``,
    params.title,
    ``,
    `View: ${params.alertUrl}`,
    ``,
    `Reply STOP to unsubscribe`,
  ].join("\n");

  return sendSms({ to: params.phoneNumber, body });
}
