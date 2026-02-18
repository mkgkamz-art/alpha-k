import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchProtocolTvls,
  checkTvlAlerts,
} from "@/lib/blockchain/defi-monitor";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import type { Json } from "@/types/database.types";

/**
 * Cron: Update DeFi protocol health (every 5 minutes)
 *
 * Fetches TVL data from DeFi Llama for monitored protocols,
 * upserts into defi_protocols table, and creates alert_events for significant drops.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const protocols = await fetchProtocolTvls();
    const tvlAlerts = checkTvlAlerts(protocols);
    const supabase = createAdminClient();

    // Upsert defi_protocols table
    if (protocols.length > 0) {
      const { error: upsertError } = await supabase
        .from("defi_protocols")
        .upsert(
          protocols.map((p) => ({
            protocol_name: p.protocol_name,
            slug: p.slug,
            tvl: p.tvl,
            tvl_change_24h: p.tvl_change_24h,
            tvl_change_7d: p.tvl_change_7d,
            category: p.category,
            chains: p.chains,
            last_updated: p.last_updated,
          })),
          { onConflict: "slug" }
        );

      if (upsertError) {
        console.error("[update-defi-health] Upsert error:", upsertError);
        throw upsertError;
      }
    }

    // Create alert_events for TVL drops > 10%
    let alertCount = 0;
    if (tvlAlerts.length > 0) {
      // Get users with active risk alert rules
      const { data: riskRules } = await supabase
        .from("alert_rules")
        .select("id, user_id")
        .eq("type", "risk")
        .eq("is_active", true);

      if (riskRules && riskRules.length > 0) {
        const alertInserts = [];

        for (const alert of tvlAlerts) {
          for (const rule of riskRules) {
            alertInserts.push({
              rule_id: rule.id,
              user_id: rule.user_id,
              type: "risk" as const,
              severity: alert.severity,
              title: `${alert.protocolName} TVL dropped ${Math.abs(alert.changePct).toFixed(1)}% in 24 hours`,
              description: `${alert.protocolName} TVL fell from $${Math.round(alert.previousTvl).toLocaleString()} to $${Math.round(alert.currentTvl).toLocaleString()} (${alert.changePct.toFixed(1)}%)`,
              metadata: {
                protocol: alert.protocolName,
                slug: alert.protocolSlug,
                chain: alert.chain,
                current_tvl: alert.currentTvl,
                previous_tvl: alert.previousTvl,
                change_pct: alert.changePct,
              } as unknown as Json,
            });
          }
        }

        if (alertInserts.length > 0) {
          const { error: alertError } = await supabase
            .from("alert_events")
            .insert(alertInserts);

          if (alertError) {
            console.error("[update-defi-health] Alert insert error:", alertError);
          } else {
            alertCount = alertInserts.length;
          }
        }
      }
    }

    console.log(
      `[update-defi-health] ${protocols.length} protocols updated, ${alertCount} alerts in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      protocols: protocols.length,
      alerts: alertCount,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[update-defi-health] Error:", err);
    return NextResponse.json(
      { error: "Failed to update DeFi health" },
      { status: 500 }
    );
  }
}
