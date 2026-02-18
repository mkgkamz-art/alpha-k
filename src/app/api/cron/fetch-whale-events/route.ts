import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchWhaleTransactions,
  getWhaleSeverity,
  formatWhaleTitle,
} from "@/lib/blockchain/whale-alert";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import type { Json } from "@/types/database.types";

/**
 * Cron: Fetch whale events (every 2 minutes)
 *
 * Calls Whale Alert API → inserts into whale_events (tx_hash UNIQUE).
 * For $1M+ transactions, also creates alert_events for all users
 * with active whale alert rules.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // Fetch whale transactions from Whale Alert API
    const events = await fetchWhaleTransactions(500_000);

    if (events.length === 0) {
      return NextResponse.json({
        message: "No whale events found",
        duration: Date.now() - started,
      });
    }

    // Insert into whale_events (ignore duplicates via tx_hash UNIQUE)
    const { data: inserted, error: insertError } = await supabase
      .from("whale_events")
      .upsert(
        events.map((e) => ({
          tx_hash: e.tx_hash,
          blockchain: e.blockchain,
          from_address: e.from_address,
          from_label: e.from_label,
          to_address: e.to_address,
          to_label: e.to_label,
          symbol: e.symbol,
          amount: e.amount,
          usd_value: e.usd_value,
          event_type: e.event_type,
          detected_at: e.detected_at,
        })),
        { onConflict: "tx_hash", ignoreDuplicates: true }
      )
      .select("id, tx_hash, usd_value");

    if (insertError) {
      console.error("[fetch-whale-events] Insert error:", insertError);
      throw insertError;
    }

    const newEvents = inserted ?? [];

    // For $1M+ transactions, create alert_events for users with active whale rules
    let alertCount = 0;

    if (newEvents.length > 0) {
      const bigEvents = events.filter((e) => e.usd_value >= 1_000_000);

      if (bigEvents.length > 0) {
        // Get all users with active whale alert rules
        const { data: whaleRules } = await supabase
          .from("alert_rules")
          .select("id, user_id")
          .eq("type", "whale")
          .eq("is_active", true);

        if (whaleRules && whaleRules.length > 0) {
          const alertInserts = [];

          for (const event of bigEvents) {
            // Check if this tx was actually newly inserted
            const isNew = newEvents.some((n) => n.tx_hash === event.tx_hash);
            if (!isNew) continue;

            const severity = getWhaleSeverity(event.usd_value);
            const title = formatWhaleTitle(event);

            for (const rule of whaleRules) {
              alertInserts.push({
                rule_id: rule.id,
                user_id: rule.user_id,
                type: "whale" as const,
                severity,
                title,
                description: `${event.symbol} ${event.event_type.replace("_", " ")} on ${event.blockchain} — $${Math.round(event.usd_value).toLocaleString()}`,
                metadata: {
                  tx_hash: event.tx_hash,
                  blockchain: event.blockchain,
                  from: event.from_label,
                  to: event.to_label,
                  amount: event.amount,
                  symbol: event.symbol,
                  usd_value: event.usd_value,
                  event_type: event.event_type,
                } as unknown as Json,
              });
            }
          }

          if (alertInserts.length > 0) {
            const { error: alertError } = await supabase
              .from("alert_events")
              .insert(alertInserts);

            if (alertError) {
              console.error("[fetch-whale-events] Alert insert error:", alertError);
            } else {
              alertCount = alertInserts.length;
            }
          }
        }
      }
    }

    console.log(
      `[fetch-whale-events] Fetched ${events.length}, inserted ${newEvents.length} new, ` +
        `created ${alertCount} alerts in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      fetched: events.length,
      newEvents: newEvents.length,
      alertsCreated: alertCount,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[fetch-whale-events] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch whale events" },
      { status: 500 }
    );
  }
}
