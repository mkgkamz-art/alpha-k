import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchStablecoinPrices,
  checkStablecoinAlerts,
} from "@/lib/blockchain/defi-monitor";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import type { Json } from "@/types/database.types";

/**
 * Cron: Check stablecoin peg stability (every 1 minute)
 *
 * Fetches stablecoin prices from CoinGecko,
 * upserts into stablecoin_status table, and creates alert_events for depegging.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const prices = await fetchStablecoinPrices();
    const alerts = checkStablecoinAlerts(prices);
    const supabase = createAdminClient();

    // Upsert stablecoin_status table
    if (prices.length > 0) {
      const { error: upsertError } = await supabase
        .from("stablecoin_status")
        .upsert(
          prices.map((p) => ({
            symbol: p.symbol,
            name: p.name,
            current_price: p.current_price,
            peg_deviation: p.peg_deviation,
            is_depegged: p.is_depegged,
            last_updated: p.last_updated,
          })),
          { onConflict: "symbol" }
        );

      if (upsertError) {
        console.error("[check-stablecoins] Upsert error:", upsertError);
        throw upsertError;
      }
    }

    // Create alert_events for depegging
    let alertCount = 0;
    if (alerts.length > 0) {
      const { data: riskRules } = await supabase
        .from("alert_rules")
        .select("id, user_id")
        .eq("type", "risk")
        .eq("is_active", true);

      if (riskRules && riskRules.length > 0) {
        const alertInserts = [];

        for (const alert of alerts) {
          for (const rule of riskRules) {
            alertInserts.push({
              rule_id: rule.id,
              user_id: rule.user_id,
              type: "risk" as const,
              severity: alert.severity,
              title: `${alert.symbol} peg deviation warning: ${alert.deviationPct > 0 ? "+" : ""}${alert.deviationPct.toFixed(3)}%`,
              description: `${alert.symbol} is trading at $${alert.currentPrice.toFixed(4)}, deviating ${Math.abs(alert.deviationPct).toFixed(3)}% from its $1.00 peg.`,
              metadata: {
                symbol: alert.symbol,
                price: alert.currentPrice,
                deviation_pct: alert.deviationPct,
              } as unknown as Json,
            });
          }
        }

        if (alertInserts.length > 0) {
          const { error: alertError } = await supabase
            .from("alert_events")
            .insert(alertInserts);

          if (alertError) {
            console.error("[check-stablecoins] Alert insert error:", alertError);
          } else {
            alertCount = alertInserts.length;
          }
        }
      }
    }

    console.log(
      `[check-stablecoins] ${prices.length} coins checked, ${alertCount} alerts in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      checked: prices.length,
      alerts: alertCount,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[check-stablecoins] Error:", err);
    return NextResponse.json(
      { error: "Failed to check stablecoins" },
      { status: 500 }
    );
  }
}
