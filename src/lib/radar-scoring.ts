/**
 * Radar signal scoring engine.
 *
 * Each signal type has its own scoring logic.
 * Scores are 0-100, strength is derived from score.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { RadarStrength } from "@/types";

/* ── Score → Strength mapping ── */

export function strengthFromScore(score: number): RadarStrength {
  if (score >= 80) return "extreme";
  if (score >= 60) return "strong";
  if (score >= 40) return "moderate";
  return "weak";
}

/* ── Per-type scoring ── */

interface SurgeData {
  changePercent: number;
  volume?: number;
}

interface KimchiData {
  premiumPercent: number;
}

interface ListingData {
  exchange: string;
}

interface SignalData {
  confidence: number;
}

interface ContextData {
  severity: "critical" | "warning" | "info";
}

interface VolumeData {
  volumeChangeRatio: number;
  buyRatio: number;
  priceChangePercent: number;
  marketCapRank?: number;
}

interface OrderbookData {
  wallRatio: number;
  wallDuration?: number;
  priceProximityPercent: number;
}

interface BuzzData {
  mentionSpikeRatio: number;
  positiveRatio: number;
  channelCount: number;
}

interface OnchainData {
  transferRatio: number;
  direction: "inflow" | "outflow";
  historicalHitRate?: number;
}

type ScoreInput =
  | { type: "surge"; data: SurgeData }
  | { type: "kimchi"; data: KimchiData }
  | { type: "listing"; data: ListingData }
  | { type: "signal"; data: SignalData }
  | { type: "context"; data: ContextData }
  | { type: "volume"; data: VolumeData }
  | { type: "orderbook"; data: OrderbookData }
  | { type: "buzz"; data: BuzzData }
  | { type: "onchain"; data: OnchainData };

export function calculateRadarScore(input: ScoreInput): {
  score: number;
  strength: RadarStrength;
} {
  let score: number;

  switch (input.type) {
    case "surge": {
      const abs = Math.abs(input.data.changePercent);
      if (abs >= 30) score = 100;
      else if (abs >= 20) score = 75 + ((abs - 20) / 10) * 25;
      else if (abs >= 10) score = 50 + ((abs - 10) / 10) * 25;
      else score = Math.max(20, (abs / 10) * 50);
      break;
    }
    case "kimchi": {
      const abs = Math.abs(input.data.premiumPercent);
      if (abs >= 10) score = 90 + Math.min(10, (abs - 10) / 5) * 10;
      else if (abs >= 5) score = 60 + ((abs - 5) / 5) * 30;
      else if (abs >= 3) score = 40 + ((abs - 3) / 2) * 20;
      else score = Math.max(10, (abs / 3) * 40);
      break;
    }
    case "listing": {
      const ex = input.data.exchange.toLowerCase();
      if (ex === "upbit") score = 95;
      else if (ex === "binance") score = 90;
      else if (ex === "bithumb") score = 85;
      else score = 60;
      break;
    }
    case "signal": {
      score = Math.min(100, Math.max(0, input.data.confidence));
      break;
    }
    case "context": {
      const severityMap = { critical: 90, warning: 65, info: 40 };
      score = severityMap[input.data.severity] ?? 40;
      break;
    }
    case "volume": {
      const d = input.data;
      const volScore = Math.min(100, (d.volumeChangeRatio / 10) * 100);
      const buyScore = d.buyRatio * 100;
      const priceScore = Math.min(100, Math.abs(d.priceChangePercent) * 5);
      const mcapBonus = d.marketCapRank && d.marketCapRank > 50 ? 10 : 0;
      score = volScore * 0.4 + buyScore * 0.3 + priceScore * 0.2 + mcapBonus;
      break;
    }
    case "orderbook": {
      const d = input.data;
      const wallScore = Math.min(100, (d.wallRatio / 0.5) * 100);
      const durationScore = d.wallDuration
        ? Math.min(100, (d.wallDuration / 300) * 100)
        : 50;
      const proximityScore = Math.max(0, 100 - d.priceProximityPercent * 20);
      score = wallScore * 0.5 + durationScore * 0.3 + proximityScore * 0.2;
      break;
    }
    case "buzz": {
      const d = input.data;
      const spikeScore = Math.min(100, (d.mentionSpikeRatio / 5) * 100);
      const sentimentScore = d.positiveRatio * 100;
      const multiChannelBonus = d.channelCount >= 2 ? 30 : 0;
      score = spikeScore * 0.4 + sentimentScore * 0.3 + multiChannelBonus;
      break;
    }
    case "onchain": {
      const d = input.data;
      const transferScore = Math.min(100, (d.transferRatio / 0.2) * 100);
      const directionScore = d.direction === "outflow" ? 80 : 60;
      const histScore = d.historicalHitRate
        ? d.historicalHitRate * 100
        : 50;
      score = transferScore * 0.5 + directionScore * 0.3 + histScore * 0.2;
      break;
    }
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  return { score, strength: strengthFromScore(score) };
}

/* ── DB insert utility ── */

type RadarSignalInsertType = Database["public"]["Enums"]["radar_signal_type"];
type RadarStrengthType = Database["public"]["Enums"]["radar_strength"];

export interface RadarSignalPayload {
  signal_type: RadarSignalInsertType;
  token_symbol: string;
  token_name?: string | null;
  score: number;
  strength: RadarStrengthType;
  title: string;
  description?: string | null;
  data_snapshot?: Record<string, unknown>;
  historical_pattern?: Record<string, unknown>;
  source?: string;
  expires_at?: string;
  price_at_signal?: number | null;
  status?: string;
}

export async function insertRadarSignal(
  admin: SupabaseClient<Database>,
  payload: RadarSignalPayload,
): Promise<{ id: string | null; error: unknown }> {
  const { data, error } = await admin
    .from("radar_signals")
    .insert({
      signal_type: payload.signal_type,
      token_symbol: payload.token_symbol,
      token_name: payload.token_name ?? null,
      score: payload.score,
      strength: payload.strength,
      title: payload.title,
      description: payload.description ?? null,
      data_snapshot: (payload.data_snapshot ?? {}) as unknown as Json,
      historical_pattern: (payload.historical_pattern ?? {}) as unknown as Json,
      source: payload.source ?? null,
      expires_at: payload.expires_at,
      price_at_signal: payload.price_at_signal ?? null,
      status: payload.status ?? "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[radar-scoring] Insert failed:", error.message);
    return { id: null, error };
  }

  return { id: data?.id ?? null, error: null };
}
