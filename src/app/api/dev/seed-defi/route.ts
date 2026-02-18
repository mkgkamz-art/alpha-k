import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchProtocolTvls,
  fetchStablecoinPrices,
} from "@/lib/blockchain/defi-monitor";

/**
 * Dev-only: Manually fetch and seed DeFi + stablecoin data.
 * GET /api/dev/seed-defi
 *
 * In production, this is handled by cron/update-defi-health + cron/check-stablecoins.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Dev-only endpoint" },
      { status: 403 }
    );
  }

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // Fetch protocol TVL data from DeFi Llama
    const protocols = await fetchProtocolTvls();

    if (protocols.length > 0) {
      const { error: protoError } = await supabase
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

      if (protoError) throw protoError;
    }

    // Fetch stablecoin prices from CoinGecko
    const stablecoins = await fetchStablecoinPrices();

    if (stablecoins.length > 0) {
      const { error: stableError } = await supabase
        .from("stablecoin_status")
        .upsert(
          stablecoins.map((s) => ({
            symbol: s.symbol,
            name: s.name,
            current_price: s.current_price,
            peg_deviation: s.peg_deviation,
            is_depegged: s.is_depegged,
            last_updated: s.last_updated,
          })),
          { onConflict: "symbol" }
        );

      if (stableError) throw stableError;
    }

    // Build summary
    const protoSummary = protocols
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 10)
      .map((p) => ({
        name: p.protocol_name,
        category: p.category,
        tvl: `$${(p.tvl / 1e9).toFixed(2)}B`,
        change24h: `${p.tvl_change_24h > 0 ? "+" : ""}${p.tvl_change_24h.toFixed(2)}%`,
        chains: p.chains.slice(0, 3).join(", "),
      }));

    const stableSummary = stablecoins.map((s) => ({
      symbol: s.symbol,
      price: `$${s.current_price.toFixed(4)}`,
      deviation: `${s.peg_deviation > 0 ? "+" : ""}${s.peg_deviation.toFixed(3)}%`,
      depegged: s.is_depegged,
    }));

    return NextResponse.json({
      success: true,
      protocols: { count: protocols.length, top10: protoSummary },
      stablecoins: { count: stablecoins.length, data: stableSummary },
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[dev/seed-defi] Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
