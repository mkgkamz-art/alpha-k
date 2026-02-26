/**
 * GET  /api/notification-preferences — Fetch notification preferences
 * PATCH /api/notification-preferences — Update a single alert type's config
 *
 * Reads/writes the `notification_settings` table (normalized, 1 row per alert type per user).
 * Returns data in the frontend-friendly NotificationPreferences shape.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import type {
  NotificationAlertType,
  NotificationPreferences,
  NotificationAlertConfig,
} from "@/types";

type DbAlertType = "listing" | "surge" | "kimchi_premium" | "whale" | "defi_risk" | "trading_signal" | "liquidity";

const VALID_ALERT_TYPES = new Set<NotificationAlertType>([
  "listing",
  "surge",
  "kimchi_premium",
  "whale",
  "defi_risk",
  "trading_signal",
  "liquidity",
]);

const VALID_FREQUENCIES = new Set(["instant", "hourly", "daily"]);

const DEFAULT_PREFERENCES: NotificationPreferences = {
  listing: { telegram: true, in_app: true, frequency: "instant" },
  surge: { telegram: true, in_app: true, threshold: 10, frequency: "instant" },
  kimchi_premium: { telegram: true, in_app: true, threshold: 5, frequency: "instant" },
  whale: {
    telegram: true,
    in_app: true,
    threshold: 100_000,
    frequency: "instant",
  },
  defi_risk: { telegram: true, in_app: true, frequency: "instant" },
  trading_signal: { telegram: true, in_app: true, frequency: "instant" },
  liquidity: { telegram: true, in_app: true, frequency: "instant" },
};

interface SettingRow {
  alert_type: string;
  telegram_enabled: boolean;
  app_enabled: boolean;
  custom_config: { threshold?: number; frequency?: string; [k: string]: unknown } | null;
}

/** Transform DB rows → frontend NotificationPreferences */
function rowsToPreferences(rows: SettingRow[]): NotificationPreferences {
  const merged: NotificationPreferences = {} as NotificationPreferences;
  for (const key of Object.keys(DEFAULT_PREFERENCES) as NotificationAlertType[]) {
    merged[key] = { ...DEFAULT_PREFERENCES[key] };
  }
  for (const row of rows) {
    const key = row.alert_type as NotificationAlertType;
    if (!VALID_ALERT_TYPES.has(key)) continue;
    const cfg = row.custom_config ?? {};
    merged[key] = {
      telegram: row.telegram_enabled,
      in_app: row.app_enabled,
      threshold: cfg.threshold ?? DEFAULT_PREFERENCES[key]?.threshold,
      frequency: (cfg.frequency as NotificationAlertConfig["frequency"]) ?? "instant",
    };
  }
  return merged;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("notification_settings")
    .select("alert_type, telegram_enabled, app_enabled, custom_config")
    .eq("user_id", user.id);

  const preferences = rowsToPreferences((rows ?? []) as SettingRow[]);

  return NextResponse.json({ preferences });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    alertType?: string;
    updates?: Partial<NotificationAlertConfig>;
  };

  const { alertType, updates } = body;

  if (!alertType || !VALID_ALERT_TYPES.has(alertType as NotificationAlertType)) {
    return NextResponse.json({ error: "Invalid alert type" }, { status: 400 });
  }

  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ error: "Invalid updates" }, { status: 400 });
  }

  if (updates.frequency && !VALID_FREQUENCIES.has(updates.frequency)) {
    return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Read current row for this alert type
  const { data: existing } = await admin
    .from("notification_settings")
    .select("telegram_enabled, app_enabled, custom_config")
    .eq("user_id", user.id)
    .eq("alert_type", alertType as DbAlertType)
    .single();

  const defaultForType = DEFAULT_PREFERENCES[alertType as NotificationAlertType];
  const existingConfig = (existing?.custom_config ?? {}) as Record<string, unknown>;

  const upsertPayload = {
    user_id: user.id,
    alert_type: alertType as DbAlertType,
    telegram_enabled: updates.telegram ?? existing?.telegram_enabled ?? defaultForType.telegram,
    app_enabled: updates.in_app ?? existing?.app_enabled ?? defaultForType.in_app,
    custom_config: {
      ...existingConfig,
      ...(updates.threshold !== undefined ? { threshold: updates.threshold } : {}),
      ...(updates.frequency !== undefined ? { frequency: updates.frequency } : {}),
    } as unknown as Json,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("notification_settings")
    .upsert(upsertPayload, { onConflict: "user_id,alert_type" });

  if (error) {
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }

  // Return all preferences for this user
  const { data: allRows } = await admin
    .from("notification_settings")
    .select("alert_type, telegram_enabled, app_enabled, custom_config")
    .eq("user_id", user.id);

  const preferences = rowsToPreferences((allRows ?? []) as SettingRow[]);

  return NextResponse.json({ preferences });
}
