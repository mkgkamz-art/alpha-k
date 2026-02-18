import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import type { Json } from "@/types/database.types";

/**
 * Cron: Check price-based alert rules (every 1 minute)
 *
 * Reads token_prices + active price_signal rules,
 * evaluates conditions, and inserts alert_events when triggered.
 */

interface PriceConditions {
  token_id?: string;
  token_symbol?: string;
  price_above?: number;
  price_below?: number;
  price_change_24h_above?: number;
  price_change_24h_below?: number;
}

interface TokenPriceRow {
  token_id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number | null;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // 1. Get all active price_signal rules
    const { data: rules, error: rulesError } = await supabase
      .from("alert_rules")
      .select("*")
      .eq("type", "price_signal")
      .eq("is_active", true);

    if (rulesError) throw rulesError;
    if (!rules?.length) {
      return NextResponse.json({
        message: "No active price_signal rules",
        duration: Date.now() - started,
      });
    }

    // 2. Get latest token prices
    const { data: prices, error: pricesError } = await supabase
      .from("token_prices")
      .select("token_id, symbol, name, current_price, price_change_24h");

    if (pricesError) throw pricesError;
    if (!prices?.length) {
      return NextResponse.json({
        message: "No token prices available",
        duration: Date.now() - started,
      });
    }

    // Build lookup maps
    const priceByTokenId = new Map<string, TokenPriceRow>();
    const priceBySymbol = new Map<string, TokenPriceRow>();
    for (const p of prices) {
      priceByTokenId.set(p.token_id, p as TokenPriceRow);
      priceBySymbol.set(p.symbol.toUpperCase(), p as TokenPriceRow);
    }

    // 3. Evaluate each rule
    let triggeredCount = 0;
    const now = new Date();

    for (const rule of rules) {
      const conditions = rule.conditions as unknown as PriceConditions;
      if (!conditions) continue;

      // Find matching token
      const token =
        (conditions.token_id && priceByTokenId.get(conditions.token_id)) ||
        (conditions.token_symbol &&
          priceBySymbol.get(conditions.token_symbol.toUpperCase())) ||
        null;

      if (!token) continue;

      // Check cooldown
      if (rule.last_triggered_at) {
        const lastTriggered = new Date(rule.last_triggered_at);
        const cooldownMs = (rule.cooldown_minutes ?? 60) * 60 * 1000;
        if (now.getTime() - lastTriggered.getTime() < cooldownMs) continue;
      }

      // Evaluate conditions
      const triggers: string[] = [];

      if (
        conditions.price_above !== undefined &&
        token.current_price >= conditions.price_above
      ) {
        triggers.push(
          `Price $${token.current_price.toLocaleString()} ≥ $${conditions.price_above.toLocaleString()}`
        );
      }

      if (
        conditions.price_below !== undefined &&
        token.current_price <= conditions.price_below
      ) {
        triggers.push(
          `Price $${token.current_price.toLocaleString()} ≤ $${conditions.price_below.toLocaleString()}`
        );
      }

      if (
        conditions.price_change_24h_above !== undefined &&
        token.price_change_24h !== null &&
        token.price_change_24h >= conditions.price_change_24h_above
      ) {
        triggers.push(
          `24h change ${token.price_change_24h.toFixed(2)}% ≥ ${conditions.price_change_24h_above}%`
        );
      }

      if (
        conditions.price_change_24h_below !== undefined &&
        token.price_change_24h !== null &&
        token.price_change_24h <= conditions.price_change_24h_below
      ) {
        triggers.push(
          `24h change ${token.price_change_24h.toFixed(2)}% ≤ ${conditions.price_change_24h_below}%`
        );
      }

      if (triggers.length === 0) continue;

      // Calculate severity based on price deviation
      const severity = calculateSeverity(token, conditions);

      // Insert alert event
      const { error: insertError } = await supabase
        .from("alert_events")
        .insert({
          rule_id: rule.id,
          user_id: rule.user_id,
          type: "price_signal" as const,
          severity,
          title: `${token.symbol} Price Alert: ${rule.name}`,
          description: triggers.join("; "),
          metadata: {
            token_id: token.token_id,
            symbol: token.symbol,
            price: token.current_price,
            price_change_24h: token.price_change_24h,
            conditions,
            triggers,
          } as unknown as Json,
        });

      if (insertError) {
        console.error(
          `[check-price-alerts] Failed to insert alert for rule ${rule.id}:`,
          insertError
        );
        continue;
      }

      // Update rule's last_triggered_at
      await supabase
        .from("alert_rules")
        .update({ last_triggered_at: now.toISOString() })
        .eq("id", rule.id);

      triggeredCount++;
    }

    console.log(
      `[check-price-alerts] Checked ${rules.length} rules, triggered ${triggeredCount} in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      rulesChecked: rules.length,
      triggered: triggeredCount,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[check-price-alerts] Error:", err);
    return NextResponse.json(
      { error: "Failed to check price alerts" },
      { status: 500 }
    );
  }
}

function calculateSeverity(
  token: TokenPriceRow,
  conditions: PriceConditions
): "critical" | "high" | "medium" | "low" {
  const change = Math.abs(token.price_change_24h ?? 0);
  if (change >= 20) return "critical";
  if (change >= 10) return "high";
  if (change >= 5) return "medium";

  // Check how far the price deviated from threshold
  if (conditions.price_above && token.current_price > conditions.price_above) {
    const pct =
      ((token.current_price - conditions.price_above) /
        conditions.price_above) *
      100;
    if (pct >= 10) return "high";
  }
  if (conditions.price_below && token.current_price < conditions.price_below) {
    const pct =
      ((conditions.price_below - token.current_price) /
        conditions.price_below) *
      100;
    if (pct >= 10) return "high";
  }

  return "medium";
}
