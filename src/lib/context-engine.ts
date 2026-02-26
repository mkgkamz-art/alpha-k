/**
 * Context Alert Engine
 *
 * Generates WHAT / WHY / ACTION context for each alert type.
 * Called from cron jobs when events are detected.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import { calculateRadarScore, insertRadarSignal } from "@/lib/radar-scoring";

/* ── Types ── */

export type ContextAlertType =
  | "surge"
  | "dump"
  | "kimchi"
  | "listing"
  | "whale"
  | "signal"
  | "unlock"
  | "liquidity";

export type ContextSeverity = "info" | "warning" | "critical";

export interface ContextAlert {
  alert_type: ContextAlertType;
  symbol?: string;
  severity: ContextSeverity;
  what_title: string;
  what_description: string;
  why_analysis: string;
  action_suggestion: string;
  source_data: Record<string, Json | undefined>;
  related_page: string;
}

/* ── Helpers ── */

function formatKRW(value: number): string {
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}조`;
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`;
  return `${(value / 10_000).toFixed(0)}만`;
}

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

/* ── Save to DB ── */

export async function saveContextAlert(alert: ContextAlert): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("context_alerts").insert({
      alert_type: alert.alert_type,
      symbol: alert.symbol ?? null,
      severity: alert.severity,
      what_title: alert.what_title,
      what_description: alert.what_description,
      why_analysis: alert.why_analysis,
      action_suggestion: alert.action_suggestion,
      source_data: alert.source_data as Json,
      related_page: alert.related_page,
    });

    // Also insert into radar_signals
    const radarType = mapContextToRadarType(alert.alert_type);
    if (radarType) {
      const { score, strength } = calculateRadarScore({
        type: "context",
        data: { severity: alert.severity },
      });
      await insertRadarSignal(supabase, {
        signal_type: radarType,
        token_symbol: alert.symbol ?? "MARKET",
        score,
        strength,
        title: alert.what_title,
        description: alert.what_description,
        data_snapshot: alert.source_data as Record<string, unknown>,
        source: `context/${alert.alert_type}`,
      });
    }
  } catch (err) {
    console.error("[context-engine] Failed to save alert:", err);
  }
}

function mapContextToRadarType(
  alertType: ContextAlertType,
): "surge" | "kimchi" | "listing" | "signal" | "context" | null {
  switch (alertType) {
    case "surge":
    case "dump":
      return "surge";
    case "kimchi":
      return "kimchi";
    case "listing":
      return "listing";
    case "signal":
      return "signal";
    default:
      return "context";
  }
}

/* ═══════════════════════════════════════════════
   Surge / Dump Context
   ═══════════════════════════════════════════════ */

export function createSurgeContext(data: {
  symbol: string;
  change: number;
  volume: number;
  kimchi: number | null;
  exchange: string;
}): ContextAlert {
  const { symbol, change, volume, kimchi, exchange } = data;
  const direction = change > 0 ? "급등" : "급락";
  const severity: ContextSeverity =
    Math.abs(change) >= 20 ? "critical" : Math.abs(change) >= 10 ? "warning" : "info";

  const exName = exchange === "upbit" ? "업비트" : "빗썸";

  return {
    alert_type: change > 0 ? "surge" : "dump",
    symbol,
    severity,
    what_title: `${symbol} ${direction} ${Math.abs(change).toFixed(1)}% (${exName})`,
    what_description: `${symbol}이(가) ${exName}에서 2시간 기준 ${Math.abs(change).toFixed(1)}% ${direction}. 거래대금 ${formatKRW(volume)}.`,
    why_analysis: generateSurgeWhy(change, volume, kimchi),
    action_suggestion: generateSurgeAction(change, kimchi),
    source_data: data,
    related_page: "/surge",
  };
}

function generateSurgeWhy(change: number, volume: number, kimchi: number | null): string {
  const parts: string[] = [];
  if (Math.abs(change) >= 20)
    parts.push("단기간 극단적 변동폭으로 레버리지 청산 또는 대형 뉴스 가능성");
  if (volume > 100_000_000_000) parts.push("거래대금 1000억 이상으로 기관/고래 참여 추정");
  if (kimchi != null && kimchi > 5) parts.push(`김프 ${kimchi.toFixed(1)}%로 국내 수요 과열 신호`);
  if (kimchi != null && kimchi < 0)
    parts.push(`역프 ${Math.abs(kimchi).toFixed(1)}%로 국내 매도 압력`);
  return parts.join(". ") || "시장 전반의 유동성 변화에 따른 가격 움직임으로 추정됩니다.";
}

function generateSurgeAction(change: number, kimchi: number | null): string {
  if (change >= 20)
    return "극단적 급등 — 추격 매수 위험. FOMO 주의. 볼린저밴드 상단 이탈 확인 후 진입 고려.";
  if (change >= 10) return "강한 상승 모멘텀. 거래량 동반 확인 필수. 분할 매수 전략 고려.";
  if (change <= -20)
    return "패닉 셀 가능성. 반등 매수 고려하되 추가 하락 리스크 인지. 손절 라인 설정 필수.";
  if (change <= -10) return "큰 하락. 원인 파악 후 판단. 거래소 이슈/규제 뉴스 확인.";
  return "가격 변동 모니터링 지속. 추가 시그널 발생 시 업데이트됩니다.";
}

/* ═══════════════════════════════════════════════
   Kimchi Premium Context
   ═══════════════════════════════════════════════ */

export function createKimchiContext(data: {
  avgPremium: number;
  topSymbol: string;
  topPremium: number;
}): ContextAlert {
  const { avgPremium, topSymbol, topPremium } = data;
  const severity: ContextSeverity =
    avgPremium >= 10 ? "critical" : avgPremium >= 5 ? "warning" : "info";

  return {
    alert_type: "kimchi",
    severity,
    what_title: `평균 김프 ${avgPremium.toFixed(1)}% — ${topSymbol} 최고 ${topPremium.toFixed(1)}%`,
    what_description: `한국 거래소 평균 프리미엄 ${avgPremium.toFixed(1)}%. 최고 프리미엄 ${topSymbol} ${topPremium.toFixed(1)}%.`,
    why_analysis:
      avgPremium >= 5
        ? "국내 수요 급증 또는 해외 송금 제한으로 인한 가격 괴리. 과거 높은 김프는 시장 과열의 선행 지표로 작용한 사례 다수."
        : "글로벌 대비 정상 범위의 프리미엄. 한국 시장의 구조적 특성(송금 제한, 원화 마켓 특성) 반영.",
    action_suggestion:
      avgPremium >= 5
        ? "김프 5% 이상 — 해외 거래소 대비 고평가 구간. 차익거래 기회 탐색 또는 신규 매수 보류 권장."
        : "정상 범위. 특별한 조치 불필요.",
    source_data: data,
    related_page: "/kimchi",
  };
}

/* ═══════════════════════════════════════════════
   Listing Context
   ═══════════════════════════════════════════════ */

export function createListingContext(data: {
  symbol: string;
  exchange: string;
  coinName: string | null;
}): ContextAlert {
  const exName = data.exchange === "upbit" ? "업비트" : "빗썸";
  const name = data.coinName || data.symbol;

  return {
    alert_type: "listing",
    symbol: data.symbol,
    severity: "critical",
    what_title: `${name} — ${exName} 신규 상장`,
    what_description: `${name}(${data.symbol})이(가) ${exName}에 KRW 마켓으로 상장되었습니다.`,
    why_analysis:
      data.exchange === "upbit"
        ? "업비트 원화 마켓 상장은 한국 시장 최대 유동성 유입을 의미. 상장 직후 높은 변동성 예상."
        : "빗썸 원화 마켓 상장. 업비트 대비 유동성은 낮으나 상장 효과는 유의미.",
    action_suggestion:
      "상장 직후 1-2시간은 극심한 변동성. 상장 펌핑 후 급락 패턴이 일반적. 매수 시 분할 진입 + 짧은 손절 설정 권장.",
    source_data: data,
    related_page: "/listing",
  };
}

/* ═══════════════════════════════════════════════
   Whale Context
   ═══════════════════════════════════════════════ */

export function createWhaleContext(data: {
  symbol: string;
  amount: number;
  amountUsd: number;
  from: string;
  to: string;
}): ContextAlert {
  const isToExchange =
    /exchange|upbit|bithumb|binance|coinbase/i.test(data.to);
  const isFromExchange =
    /exchange|upbit|bithumb|binance|coinbase/i.test(data.from);

  let direction = "이동";
  if (isToExchange && !isFromExchange) direction = "거래소 입금 (매도 가능성)";
  if (!isToExchange && isFromExchange) direction = "거래소 출금 (보유 의지)";

  return {
    alert_type: "whale",
    symbol: data.symbol,
    severity: data.amountUsd >= 10_000_000 ? "critical" : "warning",
    what_title: `${data.symbol} ${formatUSD(data.amountUsd)} 대량 ${direction}`,
    what_description: `${data.symbol} ${data.amount.toLocaleString()}개 (${formatUSD(data.amountUsd)}) ${direction} 감지.`,
    why_analysis: isToExchange
      ? "거래소 입금은 매도 의도일 가능성. 대량 입금 후 가격 하락 패턴이 빈번."
      : isFromExchange
        ? "거래소 출금은 장기 보유 의지. 시장 공급 감소로 가격 상승 요인."
        : "지갑 간 이동. 기관 재배치 또는 OTC 거래 가능성.",
    action_suggestion: isToExchange
      ? "매도 압력 주의. 해당 코인의 오더북 매도벽 확인 권장."
      : "보유 신호. 중장기 긍정적.",
    source_data: data,
    related_page: "/whale",
  };
}
