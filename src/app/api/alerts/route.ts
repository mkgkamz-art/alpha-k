/**
 * GET /api/alerts?type=&severity=&cursor=&limit=
 *
 * Infinite scroll alert feed with cursor-based pagination.
 * Authenticated: user's own alert_events.
 * Non-authenticated: public market feed from whale_events + signals.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AlertType, Severity } from "@/types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const VALID_TYPES = new Set<string>(["whale", "risk", "price_signal", "token_unlock", "liquidity"]);
const VALID_SEVERITIES = new Set<string>(["critical", "high", "medium", "low"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const severity = searchParams.get("severity");
  const cursor = searchParams.get("cursor"); // ISO date string
  const limit = Math.min(
    Number(searchParams.get("limit") ?? DEFAULT_LIMIT),
    MAX_LIMIT
  );

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Authenticated: user's alerts + live token_unlocks ──
  if (user) {
    const wantsUnlock = !type || type === "all" || type === "token_unlock";
    const wantsOnlyUnlock = type === "token_unlock";

    // 1. alert_events (exclude token_unlock — sourced live from token_unlocks)
    let alertItems: Record<string, unknown>[] = [];
    if (!wantsOnlyUnlock) {
      let query = supabase
        .from("alert_events")
        .select("*")
        .eq("user_id", user.id)
        .neq("type", "token_unlock")
        .order("created_at", { ascending: false })
        .limit(limit + 1);

      if (type && type !== "all" && VALID_TYPES.has(type)) {
        query = query.eq("type", type as AlertType);
      }
      if (severity && severity !== "all" && VALID_SEVERITIES.has(severity)) {
        query = query.eq("severity", severity as Severity);
      }
      if (cursor) {
        query = query.lt("created_at", cursor);
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      alertItems = data ?? [];
    }

    // 2. token_unlocks — always live from DB
    let unlockItems: Record<string, unknown>[] = [];
    if (wantsUnlock) {
      const { data: unlocks } = await supabase
        .from("token_unlocks")
        .select("*")
        .gte("unlock_date", new Date().toISOString())
        .order("unlock_date", { ascending: true })
        .limit(20);

      unlockItems = (unlocks ?? []).map((u) => {
        const daysUntil = Math.ceil(
          (new Date(u.unlock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const usdVal = Number(u.usd_value_estimate) || 0;
        const impactScore = Number(u.impact_score) || 0;
        const sev =
          impactScore >= 8 ? "critical" :
          impactScore >= 6 ? "high" :
          impactScore >= 3 ? "medium" : "low";
        const usdLabel = usdVal >= 1_000_000_000
          ? `$${(usdVal / 1_000_000_000).toFixed(2)}B`
          : `$${(usdVal / 1_000_000).toFixed(1)}M`;

        return {
          id: u.id,
          rule_id: null,
          user_id: user.id,
          type: "token_unlock",
          severity: sev,
          title: `${u.token_symbol} unlock in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} — ${Number(u.amount).toLocaleString("en-US")} tokens (${usdLabel})`,
          description: `${Number(u.amount).toLocaleString("en-US")} ${u.token_symbol} tokens (${usdLabel}) unlocking. ${Number(u.percent_of_supply).toFixed(1)}% of circulating supply. Category: ${(u.category ?? "ecosystem").charAt(0).toUpperCase() + (u.category ?? "ecosystem").slice(1)}.`,
          metadata: {
            token_symbol: u.token_symbol,
            token_name: u.token_name,
            unlock_date: u.unlock_date,
            amount: u.amount,
            usd_value: u.usd_value_estimate,
            percent_of_supply: u.percent_of_supply,
            category: u.category,
            impact_score: u.impact_score,
            days_until: daysUntil,
          },
          is_read: false,
          is_bookmarked: false,
          delivered_via: [],
          created_at: u.created_at,
        };
      });
    }

    // 3. Merge, sort, paginate
    const merged = [...alertItems, ...unlockItems];
    merged.sort((a, b) =>
      new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
    );

    const sliced = merged.slice(0, limit);
    return NextResponse.json({
      items: sliced,
      nextCursor: null,
      hasMore: merged.length > limit,
    });
  }

  // ── Non-authenticated: public market feed ──
  return getPublicFeed(supabase, { type, limit });
}

/** Build a combined feed from multiple data sources for anonymous users */
async function getPublicFeed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: { type: string | null; limit: number }
) {
  type FeedItem = {
    id: string;
    rule_id: null;
    user_id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    metadata: Record<string, unknown>;
    is_read: boolean;
    is_bookmarked: boolean;
    delivered_via: never[];
    created_at: string;
  };

  const wantType = opts.type;
  const wantsAll = !wantType || wantType === "all";

  const items: FeedItem[] = [];
  let hasAlertEvents = false;

  // ── Source 1: alert_events via admin (exclude token_unlock — sourced from token_unlocks) ──
  if (wantsAll || (wantType && wantType !== "token_unlock")) {
    try {
      const admin = createAdminClient();
      let aeQuery = admin
        .from("alert_events")
        .select("*")
        .neq("type", "token_unlock")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!wantsAll && wantType) {
        aeQuery = aeQuery.eq("type", wantType as AlertType);
      }

      const { data: aeData } = await aeQuery;
      if (aeData && aeData.length > 0) {
        hasAlertEvents = true;
        for (const ae of aeData) {
          items.push({
            id: ae.id,
            rule_id: null,
            user_id: ae.user_id ?? "public",
            type: ae.type,
            severity: ae.severity,
            title: ae.title,
            description: ae.description ?? "",
            metadata: (ae.metadata ?? {}) as Record<string, unknown>,
            is_read: ae.is_read ?? false,
            is_bookmarked: ae.is_bookmarked ?? false,
            delivered_via: [] as never[],
            created_at: ae.created_at,
          });
        }
      }
    } catch {
      // Admin client not available, will use per-table fallback below
    }
  }

  // ── Source 2: token_unlocks — ALWAYS from live table (CoinGecko-enriched) ──
  if (wantsAll || wantType === "token_unlock") {
    try {
      const admin = createAdminClient();
      const { data: unlocks } = await admin
        .from("token_unlocks")
        .select("*")
        .gte("unlock_date", new Date().toISOString())
        .order("unlock_date", { ascending: true })
        .limit(10);

      for (const u of unlocks ?? []) {
        const daysUntil = Math.ceil(
          (new Date(u.unlock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const usdVal = Number(u.usd_value_estimate) || 0;
        const impactScore = Number(u.impact_score) || 0;
        const sev =
          impactScore >= 8 ? "critical" :
          impactScore >= 6 ? "high" :
          impactScore >= 3 ? "medium" : "low";

        const usdLabel = usdVal >= 1_000_000_000
          ? `$${(usdVal / 1_000_000_000).toFixed(2)}B`
          : `$${(usdVal / 1_000_000).toFixed(1)}M`;

        items.push({
          id: u.id,
          rule_id: null,
          user_id: "public",
          type: "token_unlock",
          severity: sev,
          title: `${u.token_symbol} unlock in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} — ${Number(u.amount).toLocaleString("en-US")} tokens (${usdLabel})`,
          description: `${Number(u.amount).toLocaleString("en-US")} ${u.token_symbol} tokens (${usdLabel}) unlocking. ${Number(u.percent_of_supply).toFixed(1)}% of circulating supply. Category: ${(u.category ?? "ecosystem").charAt(0).toUpperCase() + (u.category ?? "ecosystem").slice(1)}.`,
          metadata: {
            token_symbol: u.token_symbol,
            token_name: u.token_name,
            unlock_date: u.unlock_date,
            amount: u.amount,
            usd_value: u.usd_value_estimate,
            percent_of_supply: u.percent_of_supply,
            category: u.category,
            impact_score: u.impact_score,
            days_until: daysUntil,
          },
          is_read: false,
          is_bookmarked: false,
          delivered_via: [],
          created_at: u.created_at,
        });
      }
    } catch {
      // Fallback: anon client
      const { data: unlocks } = await supabase
        .from("token_unlocks")
        .select("*")
        .gte("unlock_date", new Date().toISOString())
        .order("unlock_date", { ascending: true })
        .limit(10);

      for (const u of unlocks ?? []) {
        const daysUntil = Math.ceil(
          (new Date(u.unlock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const usdVal = Number(u.usd_value_estimate) || 0;
        const sev = daysUntil <= 1 ? "high" : daysUntil <= 3 ? "medium" : "low";

        items.push({
          id: u.id,
          rule_id: null,
          user_id: "public",
          type: "token_unlock",
          severity: sev,
          title: `${u.token_symbol} unlock in ${daysUntil}d`,
          description: `${Number(u.amount).toLocaleString("en-US")} ${u.token_symbol} ($${(usdVal / 1_000_000).toFixed(1)}M) — ${u.percent_of_supply}% of supply`,
          metadata: { token_symbol: u.token_symbol, days_until: daysUntil },
          is_read: false,
          is_bookmarked: false,
          delivered_via: [],
          created_at: u.created_at,
        });
      }
    }
  }

  // ── Fallback: per-table for non-unlock types if admin alert_events unavailable ──
  if (!hasAlertEvents && (wantsAll || (wantType && wantType !== "token_unlock"))) {
    const [whalesRes, signalsRes, protocolsRes] = await Promise.all([
      (wantsAll || wantType === "whale")
        ? supabase.from("whale_events").select("*").order("detected_at", { ascending: false }).limit(10)
        : { data: null },
      (wantsAll || wantType === "price_signal")
        ? supabase.from("signals").select("*").order("created_at", { ascending: false }).limit(10)
        : { data: null },
      (wantsAll || wantType === "risk")
        ? supabase.from("defi_protocols").select("*").lt("tvl_change_24h", -5).order("tvl_change_24h", { ascending: true }).limit(5)
        : { data: null },
    ]);

    // Whale events → alert format
    for (const w of whalesRes.data ?? []) {
      const usd = Number(w.usd_value) || 0;
      const amt = Number(w.amount) || 0;
      const sev = usd >= 100_000_000 ? "critical" : usd >= 25_000_000 ? "high" : "medium";
      const typeLabel =
        w.event_type === "exchange_deposit"
          ? "deposited to"
          : w.event_type === "exchange_withdrawal"
            ? "withdrawn from"
            : "transferred to";

      items.push({
        id: w.id,
        rule_id: null,
        user_id: "public",
        type: "whale",
        severity: sev,
        title: `${amt.toLocaleString("en-US")} ${w.symbol} ${typeLabel} ${w.to_label || "Unknown"}`,
        description: `From ${w.from_label || "Unknown"} on ${w.blockchain}. Value: $${(usd / 1_000_000).toFixed(1)}M`,
        metadata: { symbol: w.symbol, amount: amt, usd_value: usd, tx_hash: w.tx_hash },
        is_read: false,
        is_bookmarked: false,
        delivered_via: [],
        created_at: w.detected_at,
      });
    }

    // Signals → alert format
    for (const s of signalsRes.data ?? []) {
      const conf = Number(s.confidence) || 0;
      const sev = conf >= 80 ? "high" : conf >= 60 ? "medium" : "low";

      items.push({
        id: s.id,
        rule_id: null,
        user_id: "public",
        type: "price_signal",
        severity: sev,
        title: `${s.token_symbol} — ${s.signal_name}`,
        description: s.description || "",
        metadata: { signal_type: s.signal_type, confidence: conf, timeframe: s.timeframe },
        is_read: false,
        is_bookmarked: false,
        delivered_via: [],
        created_at: s.created_at,
      });
    }

    // DeFi risk (protocols with negative TVL change)
    for (const p of protocolsRes.data ?? []) {
      const change = Number(p.tvl_change_24h) || 0;
      const sev = change <= -15 ? "critical" : change <= -10 ? "high" : "medium";

      items.push({
        id: p.id,
        rule_id: null,
        user_id: "public",
        type: "risk",
        severity: sev,
        title: `${p.protocol_name} TVL dropped ${Math.abs(change).toFixed(1)}% in 24h`,
        description: `TVL: $${(Number(p.tvl) / 1_000_000_000).toFixed(2)}B. Category: ${p.category || "DeFi"}`,
        metadata: { protocol: p.protocol_name, change_pct: change },
        is_read: false,
        is_bookmarked: false,
        delivered_via: [],
        created_at: p.last_updated,
      });
    }
  }

  // Sort by created_at descending
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const sliced = items.slice(0, opts.limit);
  return NextResponse.json({
    items: sliced,
    nextCursor: null,
    hasMore: false,
  });
}
