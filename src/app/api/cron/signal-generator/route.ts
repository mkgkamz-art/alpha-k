/**
 * Cron: Generate trading signals (every 4 hours)
 *
 * 1. Read token_prices from DB (top 20 by market cap)
 * 2. Read price_history for each token (past 7 days)
 * 3. Run signal detection (oversold/overbought, momentum shift, volume spike, volatility)
 * 4. Insert generated signals into `signals` table
 * 5. For confidence >= 70%: create alert_events + dispatch notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateSignals,
  getSignalSeverity,
  type TokenData,
} from "@/lib/blockchain/signal-generator";
import {
  dispatchNotification,
  type UserNotificationConfig,
  type DeliveryChannels,
} from "@/lib/notifications/dispatcher";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import type { SubscriptionTier } from "@/types";
import type { Json } from "@/types/database.types";
import { calculateRadarScore, insertRadarSignal } from "@/lib/radar-scoring";

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // ── Step 1: Fetch top 20 token_prices ──
    const { data: prices, error: pricesErr } = await supabase
      .from("token_prices")
      .select("*")
      .order("market_cap", { ascending: false })
      .limit(20);

    if (pricesErr) throw pricesErr;
    if (!prices || prices.length === 0) {
      return NextResponse.json({ success: true, signals: 0, message: "No price data" });
    }

    // ── Step 2: Batch-fetch price_history for all tokens (past 7 days) ──
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const tokenIds = prices.map((p) => p.token_id);

    const { data: allHistory } = await supabase
      .from("price_history")
      .select("token_id, price, recorded_at")
      .in("token_id", tokenIds)
      .gte("recorded_at", sevenDaysAgo)
      .order("recorded_at", { ascending: false });

    // Group history by token_id
    const historyMap = new Map<string, { price: number; recorded_at: string }[]>();
    for (const h of allHistory ?? []) {
      const list = historyMap.get(h.token_id) ?? [];
      list.push({ price: h.price, recorded_at: h.recorded_at });
      historyMap.set(h.token_id, list);
    }

    const tokenDataList: TokenData[] = prices.map((p) => ({
      symbol: p.symbol.toUpperCase(),
      name: p.name,
      currentPrice: Number(p.current_price),
      priceChange1h: p.price_change_1h != null ? Number(p.price_change_1h) : null,
      priceChange24h: p.price_change_24h != null ? Number(p.price_change_24h) : null,
      priceChange7d: p.price_change_7d != null ? Number(p.price_change_7d) : null,
      totalVolume: Number(p.total_volume),
      priceHistory: (historyMap.get(p.token_id) ?? []).slice(0, 168),
    }));

    // ── Step 3: Generate signals for all timeframes ──
    const signals1d = generateSignals(tokenDataList, "1D");
    const signals4h = generateSignals(tokenDataList, "4H");
    const signals1w = generateSignals(tokenDataList, "1W");
    const allSignals = [...signals1d, ...signals4h, ...signals1w];

    // ── Step 4: Batch insert into signals table ──
    let insertCount = 0;
    if (allSignals.length > 0) {
      const rows = allSignals.map((sig) => ({
        token_symbol: sig.tokenSymbol,
        token_name: sig.tokenName,
        signal_type: sig.signalType,
        signal_name: sig.signalName,
        confidence: sig.confidence,
        timeframe: sig.timeframe,
        description: sig.description,
        indicators: sig.indicators as Json,
        price_at_signal: sig.priceAtSignal,
      }));
      const { data: inserted } = await supabase
        .from("signals")
        .insert(rows)
        .select("id");
      insertCount = inserted?.length ?? 0;

      // ── Step 4b: Insert into radar_signals ──
      const radarPromises = allSignals
        .filter((s) => s.confidence >= 50)
        .map((sig) => {
          const { score, strength } = calculateRadarScore({
            type: "signal",
            data: { confidence: sig.confidence },
          });
          return insertRadarSignal(supabase, {
            signal_type: "signal",
            token_symbol: sig.tokenSymbol,
            token_name: sig.tokenName,
            score,
            strength,
            title: `${sig.tokenSymbol} — ${sig.signalName}`,
            description: sig.description,
            data_snapshot: {
              signal_type: sig.signalType,
              confidence: sig.confidence,
              timeframe: sig.timeframe,
              price_at_signal: sig.priceAtSignal,
            },
            source: "cron/signal-generator",
          });
        });
      await Promise.allSettled(radarPromises);
    }

    // ── Step 5: Alert events for high confidence signals ──
    const highConfidence = allSignals.filter((s) => s.confidence >= 70);
    let alertCount = 0;

    if (highConfidence.length > 0) {
      const { data: rules } = await supabase
        .from("alert_rules")
        .select("user_id")
        .eq("type", "price_signal")
        .eq("is_active", true);

      const userIds = [...new Set(rules?.map((r) => r.user_id) ?? [])];

      // Pre-fetch all user profiles in one query
      const { data: userProfiles } = userIds.length > 0
        ? await supabase.from("users").select("*").in("id", userIds)
        : await supabase.from("users").select("*").eq("id", "__none__");

      const profileMap = new Map(
        (userProfiles ?? []).map((u) => [u.id, u])
      );

      // Batch build all alert inserts
      const alertInserts = highConfidence.flatMap((sig) => {
        const severity = getSignalSeverity(sig.confidence);
        return userIds.map((userId) => ({
          user_id: userId,
          type: "price_signal" as const,
          severity,
          title: `${sig.tokenSymbol} — ${sig.signalName}`,
          description: sig.description,
          metadata: {
            signal_type: sig.signalType,
            signal_name: sig.signalName,
            confidence: sig.confidence,
            timeframe: sig.timeframe,
            price_at_signal: sig.priceAtSignal,
            indicators: sig.indicators,
          } as Json,
        }));
      });

      if (alertInserts.length > 0) {
        const { data: insertedAlerts } = await supabase
          .from("alert_events")
          .insert(alertInserts)
          .select("id, user_id, type, severity, title, description");

        alertCount = insertedAlerts?.length ?? 0;

        // Dispatch notifications for users with telegram
        if (insertedAlerts) {
          const notifPromises = insertedAlerts
            .filter((a) => profileMap.get(a.user_id)?.telegram_chat_id)
            .map((a) => {
              const profile = profileMap.get(a.user_id)!;
              const config: UserNotificationConfig = {
                subscriptionTier: (profile.subscription_tier as SubscriptionTier) ?? "free",
                email: profile.email,
                telegramChatId: profile.telegram_chat_id,
                discordWebhookUrl: profile.discord_webhook_url,
                phoneNumber: profile.phone_number,
                pushSubscriptions: [],
                deliveryChannels: { telegram: true } as DeliveryChannels,
                quietHoursStart: profile.quiet_hours_start,
                quietHoursEnd: profile.quiet_hours_end,
                timezone: profile.timezone,
                maxAlertsPerHour: profile.max_alerts_per_hour,
              };
              return dispatchNotification(
                {
                  id: a.id,
                  userId: a.user_id,
                  type: a.type,
                  severity: a.severity,
                  title: a.title,
                  description: a.description ?? "",
                },
                config
              ).catch(() => {}); // Don't fail cron if notification dispatch fails
            });

          await Promise.allSettled(notifPromises);
        }
      }
    }

    console.log(
      `[cron/signal-generator] ${insertCount} signals, ${alertCount} alerts in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      signals: insertCount,
      highConfidence: highConfidence.length,
      alerts: alertCount,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/signal-generator] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate signals" },
      { status: 500 }
    );
  }
}
