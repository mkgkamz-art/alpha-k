/**
 * Etherscan API client.
 * Docs: https://docs.etherscan.io/
 *
 * Rate limit: 5 req/sec (free tier)
 * Required env: ETHERSCAN_API_KEY
 */

const ETHERSCAN_API = "https://api.etherscan.io/api";
const REQUEST_TIMEOUT_MS = 15_000;

/* ── Types ── */

export interface EthTransfer {
  from: string;
  to: string;
  value: number; // in ETH (or token units)
  hash: string;
  blockNumber: string;
  timeStamp: string;
  tokenSymbol?: string;
}

/* ── Known exchange hot wallets (ETH) ── */

const EXCHANGE_WALLETS: Record<string, string> = {
  // Binance
  "0x28c6c06298d514db089934071355e5743bf21d60": "binance",
  "0x21a31ee1afc51d94c2efccaa2092ad1028285549": "binance",
  // Coinbase
  "0x71660c4005ba85c37ccec55d0c4493e66fe775d3": "coinbase",
  "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43": "coinbase",
  // Kraken
  "0x2910543af39aba0cd09dbb2d50200b3e800a63d2": "kraken",
  // OKX
  "0x6cc5f688a315f3dc28a7781717a9a798a59fda7b": "okx",
  // Upbit
  "0x5e032243d507c743b061ef021e2ec7fcc6d3ab89": "upbit",
};

/** Check if address is a known exchange wallet */
export function isExchangeWallet(address: string): string | null {
  return EXCHANGE_WALLETS[address.toLowerCase()] ?? null;
}

/* ── API Functions ── */

function getApiKey(): string {
  return process.env.ETHERSCAN_API_KEY ?? "";
}

/**
 * Get recent ETH transfers for a given address.
 * Filters for transfers above minValueEth.
 */
export async function getRecentEthTransfers(
  address: string,
  minValueEth = 100,
  page = 1,
  offset = 50,
): Promise<EthTransfer[]> {
  const key = getApiKey();
  if (!key) {
    console.warn("[etherscan] ETHERSCAN_API_KEY not set");
    return [];
  }

  const url = `${ETHERSCAN_API}?module=account&action=txlist&address=${address}&page=${page}&offset=${offset}&sort=desc&apikey=${key}`;

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
      .filter((tx) => tx.value >= minValueEth);
  } catch (err) {
    console.warn("[etherscan] Fetch error:", err);
    return [];
  }
}

/**
 * Get recent ERC-20 token transfers for a given address.
 */
export async function getRecentTokenTransfers(
  address: string,
  contractAddress?: string,
  page = 1,
  offset = 50,
): Promise<EthTransfer[]> {
  const key = getApiKey();
  if (!key) return [];

  let url = `${ETHERSCAN_API}?module=account&action=tokentx&address=${address}&page=${page}&offset=${offset}&sort=desc&apikey=${key}`;
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
    console.warn("[etherscan] Token transfer error:", err);
    return [];
  }
}

/**
 * Scan known exchange wallets for large recent transfers.
 * Returns inflows (deposit to exchange) and outflows (withdrawal from exchange).
 */
export async function scanExchangeWallets(
  minValueEth = 500,
): Promise<{
  inflows: (EthTransfer & { exchange: string })[];
  outflows: (EthTransfer & { exchange: string })[];
}> {
  const inflows: (EthTransfer & { exchange: string })[] = [];
  const outflows: (EthTransfer & { exchange: string })[] = [];

  const addresses = Object.keys(EXCHANGE_WALLETS);

  // Process in batches of 3 to respect rate limits
  for (let i = 0; i < addresses.length; i += 3) {
    const batch = addresses.slice(i, i + 3);

    const results = await Promise.all(
      batch.map((addr) => getRecentEthTransfers(addr, minValueEth, 1, 20)),
    );

    for (let j = 0; j < batch.length; j++) {
      const addr = batch[j].toLowerCase();
      const exchange = EXCHANGE_WALLETS[addr];

      for (const tx of results[j]) {
        if (tx.to.toLowerCase() === addr) {
          inflows.push({ ...tx, exchange });
        } else if (tx.from.toLowerCase() === addr) {
          outflows.push({ ...tx, exchange });
        }
      }
    }

    // Rate limit: 5 req/sec
    if (i + 3 < addresses.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return { inflows, outflows };
}
