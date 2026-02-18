import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchWhaleTransactions } from "@/lib/blockchain/whale-alert";

/**
 * Dev-only: Manually fetch and seed whale events.
 * GET /api/dev/seed-whales
 *
 * In production, this is handled by the cron/fetch-whale-events job.
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

    // Fetch whale transactions ($500K+)
    const events = await fetchWhaleTransactions(500_000);

    if (events.length === 0) {
      return NextResponse.json({
        message: "No whale events from API (possible rate limit or no recent large txs)",
        duration: Date.now() - started,
      });
    }

    // Upsert into whale_events
    const { error: insertError } = await supabase
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
      );

    if (insertError) throw insertError;

    // Summary for response
    const topEvents = events
      .sort((a, b) => b.usd_value - a.usd_value)
      .slice(0, 10)
      .map((e) => ({
        symbol: e.symbol,
        from: e.from_label,
        to: e.to_label,
        amount: e.amount,
        usd: `$${Math.round(e.usd_value).toLocaleString()}`,
        type: e.event_type,
        blockchain: e.blockchain,
      }));

    return NextResponse.json({
      success: true,
      seeded: events.length,
      topEvents,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[dev/seed-whales] Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
