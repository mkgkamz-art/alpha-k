/**
 * GET  /api/rules — list user's alert rules
 * POST /api/rules — create alert rule (Free: max 3)
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AlertType } from "@/types";
import type { Json } from "@/types/database.types";

const FREE_RULE_LIMIT = 3;
const VALID_TYPES = new Set<string>(["whale", "risk", "price_signal", "token_unlock", "liquidity"]);

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("alert_rules")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rules: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription tier for free limit
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if ((profile?.subscription_tier ?? "free") === "free") {
    const { count } = await supabase
      .from("alert_rules")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= FREE_RULE_LIMIT) {
      return NextResponse.json(
        { error: "Free plan limited to 3 alert rules. Upgrade to Pro for unlimited." },
        { status: 403 }
      );
    }
  }

  const body = (await request.json()) as {
    name: string;
    type: string;
    conditions: Record<string, unknown>;
    delivery_channels: Record<string, boolean>;
    cooldown_minutes?: number;
  };

  if (!body.name || !body.type || !VALID_TYPES.has(body.type)) {
    return NextResponse.json(
      { error: "name and valid type are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("alert_rules")
    .insert({
      user_id: user.id,
      name: body.name,
      type: body.type as AlertType,
      conditions: (body.conditions ?? {}) as Json,
      delivery_channels: (body.delivery_channels ?? { push: true }) as Json,
      cooldown_minutes: body.cooldown_minutes ?? 30,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rule: data }, { status: 201 });
}
