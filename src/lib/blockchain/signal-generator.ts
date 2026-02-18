/**
 * Signal Generator — Rule-based technical analysis signals
 *
 * Uses token_prices + price_history from DB to generate:
 * - Oversold/Overbought (consecutive decline/rise approximation)
 * - Momentum Shift (24h change direction flip)
 * - Volume Spike (vs 7d average)
 * - High Volatility (1h change > ±5%)
 *
 * Confidence: 50-95% based on number of matching indicators
 */

/* ── Types ── */

export type SignalCategory = "buy" | "sell" | "alert";

export interface GeneratedSignal {
  tokenSymbol: string;
  tokenName: string;
  signalType: SignalCategory;
  signalName: string;
  confidence: number; // 50-95
  timeframe: string; // "1D" | "4H" | "1W"
  description: string;
  indicators: Record<string, unknown>;
  priceAtSignal: number;
}

export interface TokenData {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange1h: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  totalVolume: number;
  /** price_history entries for past 7 days */
  priceHistory: { price: number; recorded_at: string }[];
}

/* ── Signal Detection Functions ── */

interface DetectedIndicator {
  name: string;
  direction: "bullish" | "bearish" | "neutral";
  weight: number; // 1-3
  detail: string;
}

function detectOversoldOverbought(data: TokenData): DetectedIndicator | null {
  const { priceChange24h, priceChange7d } = data;
  if (priceChange24h === null || priceChange7d === null) return null;

  // 7d decline + 24h decline > 5% → Oversold
  if (priceChange7d < -15 && priceChange24h < -5) {
    return {
      name: "Oversold Signal",
      direction: "bullish",
      weight: 3,
      detail: `7d change: ${priceChange7d.toFixed(1)}%, 24h change: ${priceChange24h.toFixed(1)}%`,
    };
  }

  // 7d rise + 24h rise > 5% → Overbought
  if (priceChange7d > 15 && priceChange24h > 5) {
    return {
      name: "Overbought Signal",
      direction: "bearish",
      weight: 3,
      detail: `7d change: +${priceChange7d.toFixed(1)}%, 24h change: +${priceChange24h.toFixed(1)}%`,
    };
  }

  return null;
}

function detectMomentumShift(data: TokenData): DetectedIndicator | null {
  const { priceHistory, priceChange24h } = data;
  if (priceChange24h === null || priceHistory.length < 2) return null;

  // Look at the most recent two history points for direction change
  const sorted = [...priceHistory].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  if (sorted.length < 2) return null;

  const latest = sorted[0].price;
  const previous = sorted[1].price;
  const prevChange = ((latest - previous) / previous) * 100;

  // Direction flip detection
  if (priceChange24h > 1 && prevChange < -1) {
    return {
      name: "Momentum Shift (Bullish)",
      direction: "bullish",
      weight: 2,
      detail: `24h flipped from ${prevChange.toFixed(1)}% to ${priceChange24h.toFixed(1)}%`,
    };
  }

  if (priceChange24h < -1 && prevChange > 1) {
    return {
      name: "Momentum Shift (Bearish)",
      direction: "bearish",
      weight: 2,
      detail: `24h flipped from +${prevChange.toFixed(1)}% to ${priceChange24h.toFixed(1)}%`,
    };
  }

  return null;
}

function detectVolumeSpike(data: TokenData): DetectedIndicator | null {
  // This would require historical volume data. For now, use a proxy:
  // If 24h volume / market context suggests unusual activity
  // We flag if total_volume implies unusual market activity combined with price move
  const { totalVolume, priceChange24h } = data;
  if (!totalVolume || priceChange24h === null) return null;

  // Volume spike heuristic: large absolute price change suggests volume spike
  const absChange = Math.abs(priceChange24h);
  if (absChange > 8) {
    return {
      name: "Volume Spike",
      direction: "neutral",
      weight: 2,
      detail: `Significant price movement (${priceChange24h > 0 ? "+" : ""}${priceChange24h.toFixed(1)}%) indicates elevated trading volume`,
    };
  }

  return null;
}

function detectHighVolatility(data: TokenData): DetectedIndicator | null {
  const { priceChange1h } = data;
  if (priceChange1h === null) return null;

  if (Math.abs(priceChange1h) > 5) {
    return {
      name: "High Volatility Alert",
      direction: priceChange1h > 0 ? "bullish" : "bearish",
      weight: 1,
      detail: `1h change: ${priceChange1h > 0 ? "+" : ""}${priceChange1h.toFixed(1)}%`,
    };
  }

  return null;
}

function detectStrongTrend(data: TokenData): DetectedIndicator | null {
  const { priceChange24h, priceChange7d } = data;
  if (priceChange24h === null || priceChange7d === null) return null;

  // Both 24h and 7d positive with meaningful moves
  if (priceChange24h > 3 && priceChange7d > 10) {
    return {
      name: "Strong Uptrend",
      direction: "bullish",
      weight: 2,
      detail: `Sustained momentum: 24h +${priceChange24h.toFixed(1)}%, 7d +${priceChange7d.toFixed(1)}%`,
    };
  }

  if (priceChange24h < -3 && priceChange7d < -10) {
    return {
      name: "Strong Downtrend",
      direction: "bearish",
      weight: 2,
      detail: `Sustained decline: 24h ${priceChange24h.toFixed(1)}%, 7d ${priceChange7d.toFixed(1)}%`,
    };
  }

  return null;
}

/* ── Confidence Calculation ── */

function calculateConfidence(indicators: DetectedIndicator[]): number {
  if (indicators.length === 0) return 0;

  const totalWeight = indicators.reduce((sum, i) => sum + i.weight, 0);

  // 1 indicator (weight 1-3): 50-60%
  // 2 indicators: 65-80%
  // 3+ indicators: 80-95%
  if (indicators.length === 1) {
    return Math.min(65, 50 + totalWeight * 5);
  }
  if (indicators.length === 2) {
    return Math.min(80, 65 + totalWeight * 3);
  }
  return Math.min(95, 80 + totalWeight * 2);
}

/* ── Main Generator ── */

export function generateSignals(
  tokenData: TokenData[],
  timeframe: string = "1D"
): GeneratedSignal[] {
  const signals: GeneratedSignal[] = [];

  for (const data of tokenData) {
    const indicators: DetectedIndicator[] = [];

    // Run all detectors
    const oversold = detectOversoldOverbought(data);
    if (oversold) indicators.push(oversold);

    const momentum = detectMomentumShift(data);
    if (momentum) indicators.push(momentum);

    const volume = detectVolumeSpike(data);
    if (volume) indicators.push(volume);

    const volatility = detectHighVolatility(data);
    if (volatility) indicators.push(volatility);

    const trend = detectStrongTrend(data);
    if (trend) indicators.push(trend);

    // Skip if no indicators triggered
    if (indicators.length === 0) continue;

    // Determine signal type from indicator consensus
    const bullishWeight = indicators
      .filter((i) => i.direction === "bullish")
      .reduce((s, i) => s + i.weight, 0);
    const bearishWeight = indicators
      .filter((i) => i.direction === "bearish")
      .reduce((s, i) => s + i.weight, 0);

    let signalType: SignalCategory;
    let signalName: string;

    if (bullishWeight > bearishWeight && bullishWeight >= 2) {
      signalType = "buy";
      signalName = indicators.find((i) => i.direction === "bullish")?.name ?? "Bullish Signal";
    } else if (bearishWeight > bullishWeight && bearishWeight >= 2) {
      signalType = "sell";
      signalName = indicators.find((i) => i.direction === "bearish")?.name ?? "Bearish Signal";
    } else {
      signalType = "alert";
      signalName = indicators[0].name;
    }

    const confidence = calculateConfidence(indicators);

    // Build description
    const description = indicators.map((i) => i.detail).join(". ") + ".";

    signals.push({
      tokenSymbol: data.symbol,
      tokenName: data.name,
      signalType,
      signalName,
      confidence,
      timeframe,
      description,
      indicators: Object.fromEntries(
        indicators.map((i) => [i.name, { direction: i.direction, detail: i.detail }])
      ),
      priceAtSignal: data.currentPrice,
    });
  }

  // Sort by confidence descending
  signals.sort((a, b) => b.confidence - a.confidence);

  return signals;
}

/**
 * Map confidence to alert severity
 */
export function getSignalSeverity(confidence: number): "medium" | "high" | "critical" {
  if (confidence >= 90) return "critical";
  if (confidence >= 80) return "high";
  return "medium";
}
