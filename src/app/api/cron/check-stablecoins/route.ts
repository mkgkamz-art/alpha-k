import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchStablecoinPrices,
  checkStablecoinAlerts,
} from "@/lib/blockchain/defi-monitor";

/**
 * Cron: Check stablecoin peg stability (every 1 minute)
 *
 * Fetches stablecoin prices from CoinGecko via defi-monitor module,
 * upserts into stablecoin_pegs table, and creates alert_events for deviations.
 */

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();

  try {
    const prices = await fetchStablecoinPrices();
    const alerts = checkStablecoinAlerts(prices);
    const supabase = createAdminClient();

    // Upsert stablecoin_pegs table
    for (const p of prices) {
      const absDeviation = Math.abs(p.deviationPct);
      const status =
        absDeviation >= 2 ? "depeg" : absDeviation >= 0.5 ? "warning" : "normal";

      await supabase
        .from("stablecoin_pegs")
        .upsert(
          {
            symbol: p.symbol,
            current_price: p.price,
            peg_deviation_pct: p.deviationPct,
            price_24h_high: p.price, // Will be enriched with actual 24h range
            price_24h_low: p.price,
            status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "symbol" }
        );
    }

    // Create alert_events for significant deviations
    if (alerts.length > 0) {
      const alertEvents = alerts.map((a) => ({
        type: "risk" as const,
        severity: a.severity === "critical" ? ("critical" as const) : ("high" as const),
        title: `${a.symbol} Peg Deviation: ${a.deviationPct > 0 ? "+" : ""}${a.deviationPct.toFixed(3)}%`,
        description: `${a.symbol} is trading at $${a.currentPrice.toFixed(4)}, deviating ${Math.abs(a.deviationPct).toFixed(3)}% from its $1.00 peg.`,
        metadata: {
          symbol: a.symbol,
          price: a.currentPrice,
          deviation_pct: a.deviationPct,
        },
      }));

      console.log(`[cron/check-stablecoins] ${alerts.length} alerts generated`);

      // Insert alert_events for each subscribed user with risk rules
      // For now, log the alerts — full dispatch will use dispatcher module
      for (const ae of alertEvents) {
        console.log(`[cron/check-stablecoins] ALERT: ${ae.title}`);
      }
    }

    console.log(
      `[cron/check-stablecoins] ${prices.length} coins checked, ${alerts.length} alerts in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      checked: prices.length,
      alerts: alerts.length,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/check-stablecoins] Error:", err);
    return NextResponse.json(
      { error: "Failed to check stablecoins" },
      { status: 500 }
    );
  }
}

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
