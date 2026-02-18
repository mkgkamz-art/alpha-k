/**
 * Whale Alert REST API client for large transaction detection.
 *
 * Free tier: 10 req/min, recent 1-hour transactions.
 * Docs: https://docs.whale-alert.io/
 */

const WHALE_ALERT_BASE = "https://api.whale-alert.io/v1";
const MIN_VALUE_USD = 500_000;
const REQUEST_TIMEOUT_MS = 10_000;

/* ── Types ── */

export interface WhaleEvent {
  tx_hash: string;
  blockchain: string;
  from_address: string;
  from_label: string;
  to_address: string;
  to_label: string;
  symbol: string;
  amount: number;
  usd_value: number;
  event_type: "transfer" | "exchange_withdrawal" | "exchange_deposit";
  detected_at: string;
}

interface WhaleAlertTransaction {
  id: string;
  blockchain: string;
  symbol: string;
  transaction_type: string;
  hash: string;
  from: {
    address: string;
    owner: string;
    owner_type: string;
  };
  to: {
    address: string;
    owner: string;
    owner_type: string;
  };
  amount: number;
  amount_usd: number;
  timestamp: number;
}

interface WhaleAlertResponse {
  result: string;
  count: number;
  transactions?: WhaleAlertTransaction[];
}

/* ── Helpers ── */

function classifyEventType(
  fromOwnerType: string,
  toOwnerType: string
): WhaleEvent["event_type"] {
  if (fromOwnerType === "exchange" && toOwnerType !== "exchange") {
    return "exchange_withdrawal";
  }
  if (fromOwnerType !== "exchange" && toOwnerType === "exchange") {
    return "exchange_deposit";
  }
  return "transfer";
}

function formatLabel(owner: string, ownerType: string): string {
  if (owner && owner !== "unknown") return owner;
  if (ownerType === "exchange") return "Unknown Exchange";
  return "Unknown Wallet";
}

/* ── Main Fetcher ── */

/**
 * Fetches recent whale transactions from the Whale Alert API.
 * Returns transactions with USD value >= $500K from the past hour.
 */
export async function fetchWhaleTransactions(
  minValueUsd = MIN_VALUE_USD
): Promise<WhaleEvent[]> {
  const apiKey = process.env.WHALE_ALERT_API_KEY;
  if (!apiKey) {
    console.error("[whale-alert] WHALE_ALERT_API_KEY not set");
    return [];
  }

  // Look back 1 hour (free tier limit)
  const startTimestamp = Math.floor((Date.now() - 3_600_000) / 1000);

  const url =
    `${WHALE_ALERT_BASE}/transactions` +
    `?api_key=${apiKey}` +
    `&min_value=${minValueUsd}` +
    `&start=${startTimestamp}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (res.status === 429) {
      console.warn("[whale-alert] Rate limited");
      return [];
    }

    if (!res.ok) {
      throw new Error(`Whale Alert HTTP ${res.status}`);
    }

    const data: WhaleAlertResponse = await res.json();

    if (data.result !== "success" || !data.transactions) {
      return [];
    }

    return data.transactions.map((tx) => ({
      tx_hash: tx.hash,
      blockchain: tx.blockchain,
      from_address: tx.from.address || "unknown",
      from_label: formatLabel(tx.from.owner, tx.from.owner_type),
      to_address: tx.to.address || "unknown",
      to_label: formatLabel(tx.to.owner, tx.to.owner_type),
      symbol: tx.symbol.toUpperCase(),
      amount: tx.amount,
      usd_value: tx.amount_usd,
      event_type: classifyEventType(tx.from.owner_type, tx.to.owner_type),
      detected_at: new Date(tx.timestamp * 1000).toISOString(),
    }));
  } catch (err) {
    console.error("[whale-alert] Error:", err);
    return [];
  }
}

/**
 * Determines alert severity based on USD value.
 */
export function getWhaleSeverity(
  usdValue: number
): "critical" | "high" | "medium" | "low" {
  if (usdValue >= 100_000_000) return "critical"; // $100M+
  if (usdValue >= 10_000_000) return "high"; // $10M+
  if (usdValue >= 1_000_000) return "medium"; // $1M+
  return "low";
}

/**
 * Formats a whale event into a human-readable alert title.
 */
export function formatWhaleTitle(event: WhaleEvent): string {
  const amount = formatAmount(event.amount, event.symbol);
  const from = event.from_label;
  const to = event.to_label;
  return `${amount} moved from ${from} to ${to}`;
}

function formatAmount(amount: number, symbol: string): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M ${symbol}`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount).toLocaleString()} ${symbol}`;
  }
  return `${amount.toFixed(2)} ${symbol}`;
}
