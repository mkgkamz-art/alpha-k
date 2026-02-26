/**
 * API Key management utilities.
 *
 * Key format: ak_live_{32 hex chars}
 * Secret format: sk_live_{64 hex chars}
 * Secret is SHA-256 hashed before DB storage — never stored as plaintext.
 */

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "@/types";
import { getTierLimits } from "@/lib/middleware/subscription-guard";

/* ── Key Generation ── */

export function generateApiKey(): string {
  return `ak_live_${crypto.randomBytes(16).toString("hex")}`;
}

export function generateApiSecret(): string {
  return `sk_live_${crypto.randomBytes(32).toString("hex")}`;
}

/* ── Hashing ── */

export function hashSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function verifySecret(rawSecret: string, storedHash: string): boolean {
  const computed = hashSecret(rawSecret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, "hex"),
      Buffer.from(storedHash, "hex"),
    );
  } catch {
    return false;
  }
}

/* ── Display ── */

export function maskApiKey(key: string): string {
  const prefix = key.slice(0, 8); // "ak_live_"
  const suffix = key.slice(-4);
  return `${prefix}${"•".repeat(8)}${suffix}`;
}

/* ── CRUD Operations ── */

export async function createApiKey(userId: string) {
  const supabase = createAdminClient();

  // Revoke any existing active keys
  await supabase
    .from("api_keys")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active");

  const apiKey = generateApiKey();
  const apiSecret = generateApiSecret();
  const apiSecretHash = hashSecret(apiSecret);

  const { error } = await supabase.from("api_keys").insert({
    user_id: userId,
    api_key: apiKey,
    api_secret_hash: apiSecretHash,
    status: "active",
  });

  if (error) throw error;

  return { apiKey, apiSecret };
}

export async function getActiveApiKey(userId: string) {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("api_keys")
    .select("id, api_key, status, created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!data) return null;

  return {
    id: data.id,
    maskedKey: maskApiKey(data.api_key),
    rawKey: data.api_key,
    status: data.status,
    createdAt: data.created_at,
  };
}

export async function deleteApiKey(userId: string, keyId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", userId);

  if (error) throw error;
}

/* ── Usage Tracking ── */

export async function getDailyUsage(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("api_usage_logs")
    .select("request_count")
    .eq("user_id", userId)
    .eq("request_date", today);

  return (data ?? []).reduce((sum, r) => sum + r.request_count, 0);
}

export function getDailyLimit(tier: SubscriptionTier): number | null {
  const limits = getTierLimits(tier);
  return limits.apiCallsPerDay === Infinity ? null : limits.apiCallsPerDay;
}
