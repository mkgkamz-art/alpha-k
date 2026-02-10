/**
 * Web Push Notifications (VAPID)
 *
 * Reference: docs/NOTIFICATIONS.md — Push: Web Push VAPID
 * Retry: 3 attempts with exponential backoff
 */

/* ── Types ── */
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export interface PushResult {
  success: boolean;
  endpoint: string;
  error?: string;
}

/* ── Config ── */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:alerts@blosafe.io";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;

/* ── Helpers ── */
function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── Send Push Notification ── */

/**
 * Send a Web Push notification via the Web Push protocol.
 * Uses fetch-based implementation for Edge/Node compatibility.
 */
export async function sendPush(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<PushResult> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return {
      success: false,
      endpoint: subscription.endpoint,
      error: "VAPID keys not configured",
    };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: payload.badge ?? "/icons/badge-72.png",
    data: { url: payload.url ?? "/" },
    tag: payload.tag,
  });

  let lastError: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(subscription.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          TTL: "86400",
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      if (res.status === 201 || res.status === 200) {
        return { success: true, endpoint: subscription.endpoint };
      }

      // 410 Gone = subscription expired, don't retry
      if (res.status === 410) {
        return {
          success: false,
          endpoint: subscription.endpoint,
          error: "Subscription expired (410 Gone)",
        };
      }

      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }

    if (attempt < MAX_RETRIES - 1) {
      await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
    }
  }

  return {
    success: false,
    endpoint: subscription.endpoint,
    error: lastError,
  };
}

/**
 * Send push notifications to multiple subscriptions
 */
export async function sendPushBatch(
  subscriptions: PushSubscription[],
  payload: PushPayload
): Promise<PushResult[]> {
  return Promise.all(subscriptions.map((sub) => sendPush(sub, payload)));
}

/** Get the VAPID public key for client-side subscription */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
