/**
 * Cron: Fetch token unlock events (every 4 hours)
 *
 * 1. CoinGecko-enriched unlock data → UPSERT into token_unlocks
 * 2. 3-day-before notification: is_notified_3d=false → alert_events (medium)
 * 3. 1-day-before notification: is_notified_1d=false → alert_events (high)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchUpcomingUnlocks } from "@/lib/blockchain/token-unlock-fetcher";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import type { Json } from "@/types/database.types";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // ── Step 1: Fetch CoinGecko-enriched data → UPSERT ──
    const events = await fetchUpcomingUnlocks(90);

    const upsertRows = events.map((e) => ({
      token_symbol: e.tokenSymbol,
      token_name: e.tokenName,
      unlock_date: e.unlockDate,
      amount: e.unlockAmount,
      usd_value_estimate: e.unlockValueUsd,
      percent_of_supply: e.pctOfSupply,
      category: e.category,
      impact_score: e.impactScore,
    }));

    let upsertCount = 0;
    if (upsertRows.length > 0) {
      const { data, error: upsertError } = await supabase
        .from("token_unlocks")
        .upsert(upsertRows, { onConflict: "token_symbol,unlock_date" })
        .select("id");

      if (upsertError) {
        console.error("[cron/fetch-token-unlocks] Upsert error:", upsertError.message);
      }
      upsertCount = data?.length ?? 0;
    }

    // ── Step 1b: Clean up stale rows (from old seeds with mismatched timestamps) ──
    const monitoredSymbols = [...new Set(events.map((e) => e.tokenSymbol))];
    let deletedStale = 0;
    if (monitoredSymbols.length > 0) {
      // Get all existing rows for monitored tokens
      const { data: existing } = await supabase
        .from("token_unlocks")
        .select("id, token_symbol, unlock_date")
        .in("token_symbol", monitoredSymbols);

      // Build set of valid (symbol, exact timestamp) pairs from JSON
      const validSet = new Set(
        events.map((e) => `${e.tokenSymbol}|${new Date(e.unlockDate).getTime()}`)
      );

      // Delete rows that don't match exact JSON timestamps
      const staleIds = (existing ?? [])
        .filter((row) =>
          !validSet.has(`${row.token_symbol}|${new Date(row.unlock_date).getTime()}`)
        )
        .map((row) => row.id);

      if (staleIds.length > 0) {
        await supabase.from("token_unlocks").delete().in("id", staleIds);
        deletedStale = staleIds.length;
      }

      // Also remove rows for tokens not in the managed list (old seed artifacts)
      const monitoredSet = new Set(monitoredSymbols);
      const { data: allRows } = await supabase
        .from("token_unlocks")
        .select("id, token_symbol");
      const orphanIds = (allRows ?? [])
        .filter((row) => !monitoredSet.has(row.token_symbol))
        .map((row) => row.id);
      if (orphanIds.length > 0) {
        await supabase.from("token_unlocks").delete().in("id", orphanIds);
        deletedStale += orphanIds.length;
      }
    }

    // ── Step 2: 3-day-before alerts ──
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 86_400_000);

    const { data: pending3d } = await supabase
      .from("token_unlocks")
      .select("*")
      .eq("is_notified_3d", false)
      .gte("unlock_date", now.toISOString())
      .lte("unlock_date", threeDaysFromNow.toISOString());

    let alerts3d = 0;
    if (pending3d && pending3d.length > 0) {
      // Get all users with active token_unlock rules
      const { data: rules } = await supabase
        .from("alert_rules")
        .select("user_id")
        .eq("type", "token_unlock")
        .eq("is_active", true);

      const userIds = [...new Set(rules?.map((r) => r.user_id) ?? [])];

      for (const unlock of pending3d) {
        const daysUntil = Math.ceil(
          (new Date(unlock.unlock_date).getTime() - now.getTime()) / 86_400_000
        );

        // Create alert_events for each user
        for (const userId of userIds) {
          await supabase.from("alert_events").insert({
            user_id: userId,
            type: "token_unlock" as const,
            severity: "medium" as const,
            title: `${unlock.token_symbol} unlock in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
            description: `${Number(unlock.amount).toLocaleString()} ${unlock.token_symbol} tokens ($${(Number(unlock.usd_value_estimate) / 1e6).toFixed(1)}M) — ${Number(unlock.percent_of_supply).toFixed(1)}% of supply. Category: ${unlock.category}`,
            metadata: {
              token_symbol: unlock.token_symbol,
              unlock_date: unlock.unlock_date,
              amount: unlock.amount,
              usd_value: unlock.usd_value_estimate,
              percent_of_supply: unlock.percent_of_supply,
              category: unlock.category,
              days_until: daysUntil,
              notification_type: "3d",
            } as unknown as Json,
          });
        }

        // Mark as notified
        await supabase
          .from("token_unlocks")
          .update({ is_notified_3d: true })
          .eq("id", unlock.id);

        alerts3d++;
      }
    }

    // ── Step 3: 1-day-before alerts ──
    const oneDayFromNow = new Date(now.getTime() + 86_400_000);

    const { data: pending1d } = await supabase
      .from("token_unlocks")
      .select("*")
      .eq("is_notified_1d", false)
      .gte("unlock_date", now.toISOString())
      .lte("unlock_date", oneDayFromNow.toISOString());

    let alerts1d = 0;
    if (pending1d && pending1d.length > 0) {
      const { data: rules } = await supabase
        .from("alert_rules")
        .select("user_id")
        .eq("type", "token_unlock")
        .eq("is_active", true);

      const userIds = [...new Set(rules?.map((r) => r.user_id) ?? [])];

      for (const unlock of pending1d) {
        for (const userId of userIds) {
          await supabase.from("alert_events").insert({
            user_id: userId,
            type: "token_unlock" as const,
            severity: "high" as const,
            title: `${unlock.token_symbol} unlock TOMORROW`,
            description: `${Number(unlock.amount).toLocaleString()} ${unlock.token_symbol} tokens ($${(Number(unlock.usd_value_estimate) / 1e6).toFixed(1)}M) unlocking tomorrow — ${Number(unlock.percent_of_supply).toFixed(1)}% of supply. Impact: ${Number(unlock.impact_score).toFixed(1)}/10`,
            metadata: {
              token_symbol: unlock.token_symbol,
              unlock_date: unlock.unlock_date,
              amount: unlock.amount,
              usd_value: unlock.usd_value_estimate,
              percent_of_supply: unlock.percent_of_supply,
              category: unlock.category,
              impact_score: unlock.impact_score,
              notification_type: "1d",
            } as unknown as Json,
          });
        }

        await supabase
          .from("token_unlocks")
          .update({ is_notified_1d: true })
          .eq("id", unlock.id);

        alerts1d++;
      }
    }

    console.log(
      `[cron/fetch-token-unlocks] upserted: ${upsertCount}, stale deleted: ${deletedStale}, 3d alerts: ${alerts3d}, 1d alerts: ${alerts1d} in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      upserted: upsertCount,
      staleDeleted: deletedStale,
      alerts3d,
      alerts1d,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/fetch-token-unlocks] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch token unlocks" },
      { status: 500 }
    );
  }
}
