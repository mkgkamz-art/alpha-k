/**
 * GET  /api/radar/settings — Fetch user radar settings
 * PUT  /api/radar/settings — Upsert user radar settings
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_SETTINGS = {
  signal_types: ["surge", "kimchi", "listing", "signal", "context"],
  min_score_alert: 70,
  notify_telegram: true,
  notify_in_app: true,
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_radar_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    settings: data ?? { ...DEFAULT_SETTINGS, user_id: user.id },
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    signal_types?: string[];
    min_score_alert?: number;
    notify_telegram?: boolean;
    notify_in_app?: boolean;
  };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("user_radar_settings")
    .upsert(
      {
        user_id: user.id,
        signal_types: body.signal_types ?? DEFAULT_SETTINGS.signal_types,
        min_score_alert: body.min_score_alert ?? DEFAULT_SETTINGS.min_score_alert,
        notify_telegram: body.notify_telegram ?? DEFAULT_SETTINGS.notify_telegram,
        notify_in_app: body.notify_in_app ?? DEFAULT_SETTINGS.notify_in_app,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
