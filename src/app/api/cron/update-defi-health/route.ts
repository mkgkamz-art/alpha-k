import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchProtocolTvls,
  checkTvlAlerts,
} from "@/lib/blockchain/defi-monitor";
import type { Chain, RiskLevel } from "@/types";

/**
 * Cron: Update DeFi protocol health (every 5 minutes)
 *
 * Fetches TVL data from DeFiLlama for monitored protocols,
 * upserts into defi_protocol_health table, and creates alerts for significant drops.
 */

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();

  try {
    const protocols = await fetchProtocolTvls();
    const tvlAlerts = checkTvlAlerts(protocols);
    const supabase = createAdminClient();

    // Upsert defi_protocol_health table
    for (const p of protocols) {
      const changePct = p.change_1d ?? 0;
      const riskLevel =
        changePct <= -30
          ? "critical"
          : changePct <= -10
            ? "high"
            : changePct <= -5
              ? "medium"
              : "low";

      await supabase
        .from("defi_protocol_health")
        .upsert(
          {
            protocol_name: p.name,
            chain: (p.chain.toLowerCase() === "multi" ? "ethereum" : p.chain.toLowerCase()) as Chain,
            tvl_usd: p.tvl,
            tvl_change_24h: changePct,
            risk_level: riskLevel as RiskLevel,
            anomaly_detected: Math.abs(changePct) >= 10,
            anomaly_description:
              Math.abs(changePct) >= 10
                ? `TVL changed ${changePct > 0 ? "+" : ""}${changePct.toFixed(1)}% in 24h`
                : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "protocol_name" }
        );
    }

    // Log alerts for significant TVL drops
    if (tvlAlerts.length > 0) {
      for (const a of tvlAlerts) {
        console.log(
          `[cron/update-defi-health] ALERT: ${a.protocolName} TVL dropped ${a.changePct.toFixed(1)}% (${a.severity})`
        );
      }
    }

    console.log(
      `[cron/update-defi-health] ${protocols.length} protocols updated, ${tvlAlerts.length} alerts in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      protocols: protocols.length,
      alerts: tvlAlerts.length,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/update-defi-health] Error:", err);
    return NextResponse.json(
      { error: "Failed to update DeFi health" },
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
