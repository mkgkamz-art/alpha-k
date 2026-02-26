/**
 * BscScan API client.
 * Docs: https://docs.bscscan.com/
 *
 * Rate limit: 5 req/sec (free tier)
 * Required env: BSCSCAN_API_KEY
 */

const BSCSCAN_API = "https://api.bscscan.com/api";
const REQUEST_TIMEOUT_MS = 15_000;

/* ── Types ── */

export interface BscTransfer {
  from: string;
  to: string;
  value: number; // in BNB
  hash: string;
  blockNumber: string;
  timeStamp: string;
  tokenSymbol?: string;
}

/* ── Known exchange hot wallets (BSC) ── */

const BSC_EXCHANGE_WALLETS: Record<string, string> = {
  // Binance Hot Wallets (BSC)
  "0xe2fc31f816a9b94326492132018c3aecc4a93ae1": "binance",
  "0x8894e0a0c962cb723c1ef8a1b3cd4032d5cecb93": "binance",
  // PancakeSwap Router
  "0x10ed43c718714eb63d5aa57b78b54704e256024e": "pancakeswap",
};

/** Check if BSC address is a known exchange wallet */
export function isBscExchangeWallet(address: string): string | null {
  return BSC_EXCHANGE_WALLETS[address.toLowerCase()] ?? null;
}

/* ── API Functions ── */

function getApiKey(): string {
  return process.env.BSCSCAN_API_KEY ?? process.env.ETHERSCAN_API_KEY ?? "";
}

/**
 * Get recent BNB transfers for a given address.
 */
export async function getRecentBnbTransfers(
  address: string,
  minValueBnb = 100,
  page = 1,
  offset = 50,
): Promise<BscTransfer[]> {
  const key = getApiKey();
  if (!key) {
    console.warn("[bscscan] BSCSCAN_API_KEY not set");
    return [];
  }

  const url = `${BSCSCAN_API}?module=account&action=txlist&address=${address}&page=${page}&offset=${offset}&sort=desc&apikey=${key}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (data.status !== "1" || !Array.isArray(data.result)) return [];

    return (data.result as Array<{
      from: string;
      to: string;
      value: string;
      hash: string;
      blockNumber: string;
      timeStamp: string;
    }>)
      .map((tx) => ({
        from: tx.from,
        to: tx.to,
        value: Number(tx.value) / 1e18,
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        timeStamp: tx.timeStamp,
      }))
      .filter((tx) => tx.value >= minValueBnb);
  } catch (err) {
    console.warn("[bscscan] Fetch error:", err);
    return [];
  }
}

/**
 * Get recent BEP-20 token transfers for a given address.
 */
export async function getRecentBep20Transfers(
  address: string,
  contractAddress?: string,
  page = 1,
  offset = 50,
): Promise<BscTransfer[]> {
  const key = getApiKey();
  if (!key) return [];

  let url = `${BSCSCAN_API}?module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}&sort=desc&apikey=${key}`;
  if (contractAddress) url += `&contractaddress=${contractAddress}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (data.status !== "1" || !Array.isArray(data.result)) return [];

    return (data.result as Array<{
      from: string;
      to: string;
      value: string;
      hash: string;
      blockNumber: string;
      timeStamp: string;
      tokenDecimal: string;
      tokenSymbol: string;
    }>).map((tx) => ({
      from: tx.from,
      to: tx.to,
      value: Number(tx.value) / Math.pow(10, Number(tx.tokenDecimal) || 18),
      hash: tx.hash,
      blockNumber: tx.blockNumber,
      timeStamp: tx.timeStamp,
      tokenSymbol: tx.tokenSymbol,
    }));
  } catch (err) {
    console.warn("[bscscan] Token transfer error:", err);
    return [];
  }
}
