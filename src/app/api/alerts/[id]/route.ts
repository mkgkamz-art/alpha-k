/**
 * GET /api/alerts/[id]
 *
 * Single alert detail with related alerts.
 * Authenticated: own alert_events.
 * Non-authenticated: public feed item from whale_events / signals / token_unlocks / defi_protocols.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Authenticated: fetch from alert_events, then fall through to live tables ──
  if (user) {
    const { data: alert } = await supabase
      .from("alert_events")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (alert) {
      if (!alert.is_read) {
        await supabase
          .from("alert_events")
          .update({ is_read: true })
          .eq("id", id);
      }

      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: related } = await supabase
        .from("alert_events")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", alert.type)
        .neq("id", id)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(4);

      return NextResponse.json({ alert, related: related ?? [] });
    }

    // Not in alert_events — fall through to check live data tables
    // (token_unlocks IDs come from the table directly, not alert_events)
  }

  // ── Non-authenticated: look up in public tables ──
  return getPublicAlertDetail(supabase, id);
}

async function getPublicAlertDetail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
) {
  // Try alert_events first (richest metadata — seeded public alerts)
  try {
    const admin = createAdminClient();
    const { data: alertEvent } = await admin
      .from("alert_events")
      .select("*")
      .eq("id", id)
      .single();

    if (alertEvent) {
      const { data: relatedEvents } = await admin
        .from("alert_events")
        .select("*")
        .eq("type", alertEvent.type)
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(4);

      return NextResponse.json({
        alert: alertEvent,
        related: relatedEvents ?? [],
      });
    }
  } catch {
    // Admin client not available, fall through to public tables
  }

  // Try whale_events
  const { data: whale } = await supabase
    .from("whale_events")
    .select("*")
    .eq("id", id)
    .single();

  if (whale) {
    const usd = Number(whale.usd_value) || 0;
    const amt = Number(whale.amount) || 0;
    const sev = usd >= 100_000_000 ? "critical" : usd >= 25_000_000 ? "high" : "medium";
    const typeLabel =
      whale.event_type === "exchange_deposit"
        ? "deposited to"
        : whale.event_type === "exchange_withdrawal"
          ? "withdrawn from"
          : "transferred to";

    const alert = {
      id: whale.id,
      rule_id: null,
      user_id: "public",
      type: "whale" as const,
      severity: sev,
      title: `${amt.toLocaleString("en-US")} ${whale.symbol} ${typeLabel} ${whale.to_label || "Unknown"}`,
      description: `From ${whale.from_label || "Unknown"} on ${whale.blockchain}. Value: $${(usd / 1_000_000).toFixed(1)}M`,
      metadata: {
        symbol: whale.symbol,
        amount: amt,
        usd_value: usd,
        tx_hash: whale.tx_hash,
        from_address: whale.from_address,
        from_label: whale.from_label,
        to_address: whale.to_address,
        to_label: whale.to_label,
        blockchain: whale.blockchain,
        event_type: whale.event_type,
      },
      is_read: false,
      is_bookmarked: false,
      delivered_via: [],
      created_at: whale.detected_at,
    };

    // Related whales
    const { data: relatedWhales } = await supabase
      .from("whale_events")
      .select("*")
      .neq("id", id)
      .order("detected_at", { ascending: false })
      .limit(4);

    const related = (relatedWhales ?? []).map((w) => ({
      id: w.id,
      rule_id: null,
      user_id: "public",
      type: "whale" as const,
      severity: Number(w.usd_value) >= 100_000_000 ? "critical" : Number(w.usd_value) >= 25_000_000 ? "high" : "medium",
      title: `${Number(w.amount).toLocaleString("en-US")} ${w.symbol}`,
      description: `${w.from_label || "Unknown"} → ${w.to_label || "Unknown"}`,
      metadata: {},
      is_read: false,
      is_bookmarked: false,
      delivered_via: [],
      created_at: w.detected_at,
    }));

    return NextResponse.json({ alert, related });
  }

  // Try signals
  const { data: signal } = await supabase
    .from("signals")
    .select("*")
    .eq("id", id)
    .single();

  if (signal) {
    const conf = Number(signal.confidence) || 0;
    const sev = conf >= 80 ? "high" : conf >= 60 ? "medium" : "low";

    const alert = {
      id: signal.id,
      rule_id: null,
      user_id: "public",
      type: "price_signal" as const,
      severity: sev,
      title: `${signal.token_symbol} — ${signal.signal_name}`,
      description: signal.description || "",
      metadata: {
        signal_type: signal.signal_type,
        confidence: conf,
        timeframe: signal.timeframe,
        indicators: signal.indicators,
        price_at_signal: signal.price_at_signal,
        token_name: signal.token_name,
      },
      is_read: false,
      is_bookmarked: false,
      delivered_via: [],
      created_at: signal.created_at,
    };

    const { data: relatedSignals } = await supabase
      .from("signals")
      .select("*")
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(4);

    const related = (relatedSignals ?? []).map((s) => ({
      id: s.id,
      rule_id: null,
      user_id: "public",
      type: "price_signal" as const,
      severity: Number(s.confidence) >= 80 ? "high" : Number(s.confidence) >= 60 ? "medium" : "low",
      title: `${s.token_symbol} — ${s.signal_name}`,
      description: s.description || "",
      metadata: {},
      is_read: false,
      is_bookmarked: false,
      delivered_via: [],
      created_at: s.created_at,
    }));

    return NextResponse.json({ alert, related });
  }

  // Try token_unlocks
  const { data: unlock } = await supabase
    .from("token_unlocks")
    .select("*")
    .eq("id", id)
    .single();

  if (unlock) {
    const daysUntil = Math.ceil(
      (new Date(unlock.unlock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const usdVal = Number(unlock.usd_value_estimate) || 0;
    const sev = daysUntil <= 1 ? "high" : daysUntil <= 3 ? "medium" : "low";

    const alert = {
      id: unlock.id,
      rule_id: null,
      user_id: "public",
      type: "token_unlock" as const,
      severity: sev,
      title: `${unlock.token_symbol} unlock in ${daysUntil}d`,
      description: `${Number(unlock.amount).toLocaleString("en-US")} ${unlock.token_symbol} ($${(usdVal / 1_000_000).toFixed(1)}M) — ${unlock.percent_of_supply}% of supply`,
      metadata: {
        token_symbol: unlock.token_symbol,
        token_name: unlock.token_name,
        days_until: daysUntil,
        unlock_date: unlock.unlock_date,
        amount: unlock.amount,
        usd_value_estimate: usdVal,
        percent_of_supply: unlock.percent_of_supply,
        category: unlock.category,
        impact_score: unlock.impact_score,
      },
      is_read: false,
      is_bookmarked: false,
      delivered_via: [],
      created_at: unlock.created_at,
    };

    const { data: relatedUnlocks } = await supabase
      .from("token_unlocks")
      .select("*")
      .neq("id", id)
      .gte("unlock_date", new Date().toISOString())
      .order("unlock_date", { ascending: true })
      .limit(4);

    const related = (relatedUnlocks ?? []).map((u) => {
      const d = Math.ceil(
        (new Date(u.unlock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: u.id,
        rule_id: null,
        user_id: "public",
        type: "token_unlock" as const,
        severity: d <= 1 ? "high" : d <= 3 ? "medium" : "low",
        title: `${u.token_symbol} unlock in ${d}d`,
        description: `${Number(u.amount).toLocaleString("en-US")} ${u.token_symbol}`,
        metadata: {},
        is_read: false,
        is_bookmarked: false,
        delivered_via: [],
        created_at: u.created_at,
      };
    });

    return NextResponse.json({ alert, related });
  }

  // Try defi_protocols
  const { data: protocol } = await supabase
    .from("defi_protocols")
    .select("*")
    .eq("id", id)
    .single();

  if (protocol) {
    const change = Number(protocol.tvl_change_24h) || 0;
    const sev = change <= -15 ? "critical" : change <= -10 ? "high" : "medium";

    const alert = {
      id: protocol.id,
      rule_id: null,
      user_id: "public",
      type: "risk" as const,
      severity: sev,
      title: `${protocol.protocol_name} TVL dropped ${Math.abs(change).toFixed(1)}% in 24h`,
      description: `TVL: $${(Number(protocol.tvl) / 1_000_000_000).toFixed(2)}B. Category: ${protocol.category || "DeFi"}`,
      metadata: {
        protocol: protocol.protocol_name,
        slug: protocol.slug,
        tvl: protocol.tvl,
        change_pct: change,
        tvl_change_7d: protocol.tvl_change_7d,
        chains: protocol.chains,
        category: protocol.category,
      },
      is_read: false,
      is_bookmarked: false,
      delivered_via: [],
      created_at: protocol.last_updated,
    };

    return NextResponse.json({ alert, related: [] });
  }

  return NextResponse.json({ error: "Alert not found" }, { status: 404 });
}
