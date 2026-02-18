import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchDexVolumes,
  fetchTopPools,
  detectLiquidityAlerts,
} from "@/lib/blockchain/liquidity-monitor";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import type { Json } from "@/types/database.types";

/**
 * Cron: Update liquidity data (every 5 minutes)
 *
 * Fetches DEX volumes + pool data from DeFi Llama,
 * upserts into dex_volumes & liquidity_pools, creates alerts for anomalies.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const [dexVolumes, pools] = await Promise.all([
      fetchDexVolumes(),
      fetchTopPools(),
    ]);

    const supabase = createAdminClient();

    // Upsert DEX volumes
    if (dexVolumes.length > 0) {
      const { error } = await supabase.from("dex_volumes").upsert(
        dexVolumes.map((d) => ({
          protocol_name: d.protocol_name,
          daily_volume: d.daily_volume,
          volume_change_24h: d.volume_change_24h,
          total_tvl: d.total_tvl,
          chains: d.chains,
          last_updated: d.last_updated,
        })),
        { onConflict: "protocol_name" }
      );
      if (error) console.error("[update-liquidity] DEX upsert error:", error);
    }

    // Upsert liquidity pools
    if (pools.length > 0) {
      const { error } = await supabase.from("liquidity_pools").upsert(
        pools.map((p) => ({
          pool_name: p.pool_name,
          protocol: p.protocol,
          chain: p.chain,
          tvl: p.tvl,
          apy: p.apy,
          apy_base: p.apy_base,
          apy_reward: p.apy_reward,
          tvl_change_24h: p.tvl_change_24h,
          is_stablecoin: p.is_stablecoin,
          risk_level: p.risk_level,
          last_updated: p.last_updated,
        })),
        { onConflict: "pool_name,protocol,chain" }
      );
      if (error) console.error("[update-liquidity] Pool upsert error:", error);
    }

    // Detect and create alerts
    const liquidityAlerts = detectLiquidityAlerts(pools, dexVolumes);
    let alertCount = 0;

    if (liquidityAlerts.length > 0) {
      const { data: rules } = await supabase
        .from("alert_rules")
        .select("id, user_id")
        .eq("type", "liquidity")
        .eq("is_active", true);

      if (rules && rules.length > 0) {
        const inserts = [];
        for (const alert of liquidityAlerts) {
          for (const rule of rules) {
            inserts.push({
              rule_id: rule.id,
              user_id: rule.user_id,
              type: "liquidity" as const,
              severity: alert.severity,
              title: alert.title,
              description: alert.description,
              metadata: alert.metadata as unknown as Json,
            });
          }
        }

        if (inserts.length > 0) {
          const { error } = await supabase
            .from("alert_events")
            .insert(inserts);
          if (!error) alertCount = inserts.length;
        }
      }
    }

    console.log(
      `[update-liquidity] ${dexVolumes.length} DEXes, ${pools.length} pools, ${alertCount} alerts in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      dexes: dexVolumes.length,
      pools: pools.length,
      alerts: alertCount,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[update-liquidity] Error:", err);
    return NextResponse.json(
      { error: "Failed to update liquidity data" },
      { status: 500 }
    );
  }
}
