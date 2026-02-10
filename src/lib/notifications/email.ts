/**
 * Email Notifications via Resend API
 *
 * Reference: docs/NOTIFICATIONS.md — Resend API, 실시간 개별 OR 일간 다이제스트
 * Retry: 3 attempts with exponential backoff
 */

import type { AlertType, Severity } from "@/types";

/* ── Types ── */
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface AlertEmailData {
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  alertUrl: string;
}

export interface DigestEmailData {
  recipientName: string;
  alerts: Array<{
    type: AlertType;
    severity: Severity;
    title: string;
    time: string;
  }>;
  date: string;
}

/* ── Config ── */
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? "BLOSAFE <alerts@blosafe.io>";
const RESEND_API_URL = "https://api.resend.com/emails";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/* ── Helpers ── */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const severityColor: Record<Severity, string> = {
  critical: "#F6465D",
  high: "#FF8C00",
  medium: "#F0B90B",
  low: "#848E9C",
};

const typeEmoji: Record<AlertType, string> = {
  whale: "\u{1F40B}",
  risk: "\u26A0\uFE0F",
  price_signal: "\u{1F4C8}",
  token_unlock: "\u{1F513}",
  liquidity: "\u{1F4A7}",
};

/* ── Email Templates ── */

/** Build real-time alert email HTML */
export function buildAlertEmailHtml(data: AlertEmailData): string {
  const color = severityColor[data.severity];
  const emoji = typeEmoji[data.type];

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0B0E11;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#1E2329;border:1px solid #2B3139;border-left:4px solid ${color};border-radius:8px;padding:24px;">
      <div style="font-size:12px;color:${color};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
        ${emoji} ${data.severity} &mdash; ${data.type.replace("_", " ")}
      </div>
      <h1 style="color:#EAECEF;font-size:18px;font-weight:600;margin:0 0 12px;">${data.title}</h1>
      <p style="color:#848E9C;font-size:14px;line-height:1.5;margin:0 0 20px;">${data.description}</p>
      <a href="${data.alertUrl}" style="display:inline-block;background:#F0B90B;color:#0B0E11;font-weight:600;font-size:14px;padding:10px 24px;border-radius:6px;text-decoration:none;">
        View Alert Details
      </a>
    </div>
    <div style="text-align:center;padding:24px 0 0;color:#474D57;font-size:11px;">
      <p>BLOSAFE &mdash; Smart Alert Platform</p>
      <a href="https://app.blosafe.io/settings" style="color:#848E9C;">Manage notification preferences</a>
    </div>
  </div>
</body>
</html>`.trim();
}

/** Build daily digest email HTML */
export function buildDigestEmailHtml(data: DigestEmailData): string {
  const rows = data.alerts
    .map(
      (a) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2B3139;color:${severityColor[a.severity]};font-size:12px;font-weight:600;">${a.severity.toUpperCase()}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2B3139;color:#EAECEF;font-size:13px;">${typeEmoji[a.type]} ${a.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2B3139;color:#848E9C;font-size:12px;font-family:monospace;">${a.time}</td>
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0B0E11;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <h1 style="color:#EAECEF;font-size:20px;margin:0 0 4px;">Daily Alert Digest</h1>
    <p style="color:#848E9C;font-size:13px;margin:0 0 24px;">${data.date} &mdash; ${data.alerts.length} alerts for ${data.recipientName}</p>
    <table style="width:100%;border-collapse:collapse;background:#1E2329;border:1px solid #2B3139;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#2B3139;">
          <th style="padding:8px 12px;text-align:left;color:#848E9C;font-size:11px;font-weight:600;">SEVERITY</th>
          <th style="padding:8px 12px;text-align:left;color:#848E9C;font-size:11px;font-weight:600;">ALERT</th>
          <th style="padding:8px 12px;text-align:left;color:#848E9C;font-size:11px;font-weight:600;">TIME</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="text-align:center;padding:24px 0 0;">
      <a href="https://app.blosafe.io/dashboard" style="display:inline-block;background:#F0B90B;color:#0B0E11;font-weight:600;font-size:14px;padding:10px 24px;border-radius:6px;text-decoration:none;">
        Open Dashboard
      </a>
    </div>
    <div style="text-align:center;padding:24px 0 0;color:#474D57;font-size:11px;">
      <a href="https://app.blosafe.io/settings" style="color:#848E9C;">Manage notification preferences</a>
    </div>
  </div>
</body>
</html>`.trim();
}

/* ── Send Email via Resend ── */

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  let lastError: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        const data = (await res.json()) as { id?: string };
        return { success: true, messageId: data.id };
      }

      lastError = `HTTP ${res.status}`;

      // Don't retry 4xx client errors (except 429 rate limit)
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

/** Send a real-time alert email */
export async function sendAlertEmail(
  to: string,
  data: AlertEmailData
): Promise<EmailResult> {
  const emoji = typeEmoji[data.type];
  return sendEmail({
    to,
    subject: `${emoji} [${data.severity.toUpperCase()}] ${data.title}`,
    html: buildAlertEmailHtml(data),
  });
}

/** Send a daily digest email */
export async function sendDigestEmail(
  to: string,
  data: DigestEmailData
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `BLOSAFE Daily Digest — ${data.date} (${data.alerts.length} alerts)`,
    html: buildDigestEmailHtml(data),
  });
}
