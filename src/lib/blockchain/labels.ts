/**
 * Wallet Label Database
 *
 * Known exchange hot wallets, bridges, protocols, and funds.
 * Reference: docs/BLOCKCHAIN.md — 핫월렛 100개+ 지갑 라벨
 */

import type { Chain } from "@/types";

/* ── Types ── */
export type WalletType = "exchange" | "whale" | "fund" | "protocol" | "bridge";

export interface WalletLabel {
  address: string;
  chain: Chain;
  label: string;
  type: WalletType;
  source: "known" | "community" | "heuristic";
  confidence: number; // 0-100
}

/* ── Ethereum Exchange Hot Wallets ── */
const ETH_EXCHANGE_WALLETS: WalletLabel[] = [
  // Binance
  { address: "0x28C6c06298d514Db089934071355E5743bf21d60", chain: "ethereum", label: "Binance Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549", chain: "ethereum", label: "Binance Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d", chain: "ethereum", label: "Binance Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },
  { address: "0x56Eddb7aa87536c09CCc2793473599fD21A8b17F", chain: "ethereum", label: "Binance Hot Wallet 4", type: "exchange", source: "known", confidence: 100 },
  { address: "0x9696f59E4d72E237BE84fFD425DCaD154Bf96976", chain: "ethereum", label: "Binance Hot Wallet 5", type: "exchange", source: "known", confidence: 100 },
  { address: "0x4976a4A02f38326660D17bf34b431dC6e2eb2327", chain: "ethereum", label: "Binance Hot Wallet 6", type: "exchange", source: "known", confidence: 100 },
  { address: "0xf977814e90dA44bFA03b6295A0616a897441aceC", chain: "ethereum", label: "Binance Cold Wallet", type: "exchange", source: "known", confidence: 100 },
  { address: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8", chain: "ethereum", label: "Binance 7", type: "exchange", source: "known", confidence: 100 },
  { address: "0xF17aCb28B08C4A4bCAE5C53EE26d13959e1ecE36", chain: "ethereum", label: "Binance 8", type: "exchange", source: "known", confidence: 100 },
  { address: "0x8894E0a0c962CB723c1ef8580d0d3ae3F75741C5", chain: "ethereum", label: "Binance 9", type: "exchange", source: "known", confidence: 100 },
  { address: "0x5a52E96BAcdaBb82fd05763E25335261B270Efcb", chain: "ethereum", label: "Binance 10", type: "exchange", source: "known", confidence: 100 },
  { address: "0x3c783c21a0383057D128bae431894a5C19F9Cf06", chain: "ethereum", label: "Binance 11", type: "exchange", source: "known", confidence: 100 },
  { address: "0xBd612a3f30dcA419bDF9760CA6164bC2531c0683", chain: "ethereum", label: "Binance 12", type: "exchange", source: "known", confidence: 100 },

  // Coinbase
  { address: "0x71660c4005BA85c37ccec55d0C4493E66Fe775d3", chain: "ethereum", label: "Coinbase Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x503828976D22510aad0201ac7EC88293211D23Da", chain: "ethereum", label: "Coinbase Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0xddfAbCdc4D8FfC6d5beaf154f18B778f892A0740", chain: "ethereum", label: "Coinbase Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },
  { address: "0x3cD751E6b0078Be393132286c442345e68ff0aFf", chain: "ethereum", label: "Coinbase Hot Wallet 4", type: "exchange", source: "known", confidence: 100 },
  { address: "0xb5d85CBf7cB3EE0D56b3bB207D5Fc4B82f43F511", chain: "ethereum", label: "Coinbase Custody", type: "exchange", source: "known", confidence: 100 },
  { address: "0xEB2629a2734e272Bcc07BDA959863f316F4bD4Cf", chain: "ethereum", label: "Coinbase Commerce", type: "exchange", source: "known", confidence: 100 },
  { address: "0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43", chain: "ethereum", label: "Coinbase 6", type: "exchange", source: "known", confidence: 100 },
  { address: "0x77134cbC06cB00b66F4c7e623D5fdBF6777635EC", chain: "ethereum", label: "Coinbase 7", type: "exchange", source: "known", confidence: 100 },
  { address: "0x7c195D981AbFdC3DDecd2ca0bED0e42cA687F81C", chain: "ethereum", label: "Coinbase 8", type: "exchange", source: "known", confidence: 100 },

  // Kraken
  { address: "0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2", chain: "ethereum", label: "Kraken Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0xAe2D4617c862309A3d75A0fFB358c7a5009c673F", chain: "ethereum", label: "Kraken Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0x0A869d79a7052C7f1b55a8EbAbbEa3420F0D1E13", chain: "ethereum", label: "Kraken Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },
  { address: "0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf", chain: "ethereum", label: "Kraken Hot Wallet 4", type: "exchange", source: "known", confidence: 100 },
  { address: "0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0", chain: "ethereum", label: "Kraken 5", type: "exchange", source: "known", confidence: 100 },

  // OKX
  { address: "0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b", chain: "ethereum", label: "OKX Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x236F9F97e0E62388479bf9E5BA4889e46B0273C3", chain: "ethereum", label: "OKX Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0xA7efAE728D2936e78BDA97dc267687568dD593f3", chain: "ethereum", label: "OKX Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },
  { address: "0x98EC059Dc3aDFBdd63429454aEB0c990FBA4A128", chain: "ethereum", label: "OKX Hot Wallet 4", type: "exchange", source: "known", confidence: 100 },
  { address: "0x5041ed759Dd4aFc3a72b8192C143F72f4724081A", chain: "ethereum", label: "OKX Cold Wallet", type: "exchange", source: "known", confidence: 100 },

  // Bybit
  { address: "0xf89d7b9c864f589bbF53a82105107622B35EaA40", chain: "ethereum", label: "Bybit Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x1Db92e2EeBC8E0c075a02BeA49a2935BcD2dFCF4", chain: "ethereum", label: "Bybit Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0xA4e5961B58DBE487639929643dCB1Dc3848dAF5E", chain: "ethereum", label: "Bybit Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },

  // Bitfinex
  { address: "0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa", chain: "ethereum", label: "Bitfinex Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD1E", chain: "ethereum", label: "Bitfinex Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0xC61b9BB3A7a0767E3179713f3A5c7a9aeDCE193C", chain: "ethereum", label: "Bitfinex Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },
  { address: "0x1151314c646Ce4E0eFD76d1aF4760aE66a9Fe30F", chain: "ethereum", label: "Bitfinex Cold Wallet", type: "exchange", source: "known", confidence: 100 },

  // Upbit
  { address: "0x7758a7102960b23b0ecED15E3F9f3E14B65FA597", chain: "ethereum", label: "Upbit Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0xD739a569Ec254d5546BBc20c076C0d508eAa6b4f", chain: "ethereum", label: "Upbit Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0xA2F987A546D6eB2aEbb87188C7d5e0FBf20b7B0A", chain: "ethereum", label: "Upbit Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },
  { address: "0x5e3ef299fDDf15eAa0432E6e66473ace8c13D908", chain: "ethereum", label: "Upbit Cold Wallet", type: "exchange", source: "known", confidence: 100 },

  // Bithumb
  { address: "0x3052cD6BF951449A09C91Ec0E0A6d2845Ab3C4EA", chain: "ethereum", label: "Bithumb Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x2140EFd7Ba31169c69dfff6CDC66C542f0211825", chain: "ethereum", label: "Bithumb Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0xFBb1b73C4f0BDa4f67dcA266ce6Ef42f520fBB98", chain: "ethereum", label: "Bithumb Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },
  { address: "0x186549A4ae594Fc1f70ba4Cffdac714B405be3f9", chain: "ethereum", label: "Bithumb Hot Wallet 4", type: "exchange", source: "known", confidence: 100 },

  // HTX (Huobi)
  { address: "0xab5C66752a9e8167967685F7006728Dd2f2b9Af4", chain: "ethereum", label: "HTX Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x6748F50f686bfbcA6Fe8ad62b22228b87F31ff2b", chain: "ethereum", label: "HTX Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0x46340b20830761efd32832A74d7169B29FEB9758", chain: "ethereum", label: "HTX Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },
  { address: "0x5C985E89DDe482eFE97ea9f1950aD149Eb73829B", chain: "ethereum", label: "HTX Hot Wallet 4", type: "exchange", source: "known", confidence: 100 },

  // KuCoin
  { address: "0xD6216fC19DB775Df9774a6E33526131dA7D19a2c", chain: "ethereum", label: "KuCoin Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0xf16E9B0D03470827A95CDfd0Cb8a8A3b46969B91", chain: "ethereum", label: "KuCoin Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0x88bd4D3e2997371bceEfe8D9386c6b5B4dE60346", chain: "ethereum", label: "KuCoin Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },

  // Gate.io
  { address: "0x0D0707963952f2fBA59dD06f2b425ace40b492Fe", chain: "ethereum", label: "Gate.io Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x1AB4973a48dc892Cd9971ECE8e01DcC7688f8F23", chain: "ethereum", label: "Gate.io Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0xD793281182A0e3E023116004778F45c29fc14F19", chain: "ethereum", label: "Gate.io Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },

  // Gemini
  { address: "0xd24400ae8BfEBb18cA49Be86258a3C749cf46853", chain: "ethereum", label: "Gemini Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x6Fc82a5fe25A5cDb58BC74600A40A69C065263f8", chain: "ethereum", label: "Gemini Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "0x07Ee55aA48Bb72DcC6E9D78256648910De513eca", chain: "ethereum", label: "Gemini Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },

  // Crypto.com
  { address: "0x6262998Ced04146fA42253a5C0AF90CA02dfd2A3", chain: "ethereum", label: "Crypto.com Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x46340b20830761efd32832A74d7169B29FEB9758", chain: "ethereum", label: "Crypto.com Hot Wallet 2", type: "exchange", source: "known", confidence: 95 },

  // Bitstamp
  { address: "0x00bDb5699745f5b860228c8f939ABF1b9Ae374eD", chain: "ethereum", label: "Bitstamp Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "0x1522900B6dAFac587d499a862861C0869Be6E428", chain: "ethereum", label: "Bitstamp Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },

  // Mexc
  { address: "0x75e89d5979E4f6Fba9F97c104c2F0AFB3F1dcB88", chain: "ethereum", label: "MEXC Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },

  // Bitget
  { address: "0x1AB4973a48dc892Cd9971ECE8e01DcC7688f8F23", chain: "ethereum", label: "Bitget Hot Wallet 1", type: "exchange", source: "known", confidence: 95 },
];

/* ── Ethereum Protocol & Bridge Wallets ── */
const ETH_PROTOCOL_WALLETS: WalletLabel[] = [
  // Bridges
  { address: "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf", chain: "ethereum", label: "Polygon Bridge", type: "bridge", source: "known", confidence: 100 },
  { address: "0xa3A7B6F88361F48403514059F1F16C8E78d60EeC", chain: "ethereum", label: "Arbitrum Bridge", type: "bridge", source: "known", confidence: 100 },
  { address: "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1", chain: "ethereum", label: "Optimism Bridge", type: "bridge", source: "known", confidence: 100 },
  { address: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585", chain: "ethereum", label: "Wormhole Bridge", type: "bridge", source: "known", confidence: 100 },

  // Protocols
  { address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", chain: "ethereum", label: "Uniswap V2 Router", type: "protocol", source: "known", confidence: 100 },
  { address: "0xE592427A0AEce92De3Edee1F18E0157C05861564", chain: "ethereum", label: "Uniswap V3 Router", type: "protocol", source: "known", confidence: 100 },
  { address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", chain: "ethereum", label: "Uniswap V3 Router 2", type: "protocol", source: "known", confidence: 100 },
  { address: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", chain: "ethereum", label: "SushiSwap Router", type: "protocol", source: "known", confidence: 100 },
  { address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", chain: "ethereum", label: "Aave V3 Pool", type: "protocol", source: "known", confidence: 100 },
  { address: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9", chain: "ethereum", label: "Aave V2 Pool", type: "protocol", source: "known", confidence: 100 },
  { address: "0x1111111254EEB25477B68fb85Ed929f73A960582", chain: "ethereum", label: "1inch V5 Router", type: "protocol", source: "known", confidence: 100 },
  { address: "0xDef1C0ded9bec7F1a1670819833240f027b25EfF", chain: "ethereum", label: "0x Exchange Proxy", type: "protocol", source: "known", confidence: 100 },
  { address: "0x3dFd23A6c5E8BbcFc9581d2E864a68feb6a076d3", chain: "ethereum", label: "Aave V3 Treasury", type: "protocol", source: "known", confidence: 100 },
  { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", chain: "ethereum", label: "USDC Token", type: "protocol", source: "known", confidence: 100 },
  { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", chain: "ethereum", label: "USDT Token", type: "protocol", source: "known", confidence: 100 },
];

/* ── Solana Exchange Wallets ── */
const SOL_EXCHANGE_WALLETS: WalletLabel[] = [
  // Binance
  { address: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", chain: "solana", label: "Binance Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", chain: "solana", label: "Binance Hot Wallet 2", type: "exchange", source: "known", confidence: 100 },
  { address: "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S", chain: "solana", label: "Binance Hot Wallet 3", type: "exchange", source: "known", confidence: 100 },

  // Coinbase
  { address: "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", chain: "solana", label: "Coinbase Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS", chain: "solana", label: "Coinbase Prime", type: "exchange", source: "known", confidence: 95 },

  // Kraken
  { address: "FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5", chain: "solana", label: "Kraken Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },
  { address: "CQ2kGMwzE7MiVAMfHfAvjMtQLbJPYFgkP6VKTg4YTfHf", chain: "solana", label: "Kraken Hot Wallet 2", type: "exchange", source: "known", confidence: 95 },

  // OKX
  { address: "5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD", chain: "solana", label: "OKX Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },

  // Bybit
  { address: "AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2", chain: "solana", label: "Bybit Hot Wallet 1", type: "exchange", source: "known", confidence: 100 },

  // Upbit
  { address: "3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E", chain: "solana", label: "Upbit Hot Wallet 1", type: "exchange", source: "known", confidence: 95 },

  // Gate.io
  { address: "u6PJ8DtQuPFnfmwHbGFULQ4u4EgjDiyYKjVEsynXq2w", chain: "solana", label: "Gate.io Hot Wallet 1", type: "exchange", source: "known", confidence: 95 },

  // Bitget
  { address: "BaGfF51MQ3a61rZv2KXMDiEfz9JBrDVF74RXcp5QcRci", chain: "solana", label: "Bitget Hot Wallet 1", type: "exchange", source: "known", confidence: 95 },

  // MEXC
  { address: "ASTyfSima4LLAdDgoFGkgqoKowG1LZFDr9fAQrg7iaJZ", chain: "solana", label: "MEXC Hot Wallet 1", type: "exchange", source: "known", confidence: 95 },
];

/* ── Combined Label Map ── */
const ALL_LABELS: WalletLabel[] = [
  ...ETH_EXCHANGE_WALLETS,
  ...ETH_PROTOCOL_WALLETS,
  ...SOL_EXCHANGE_WALLETS,
];

/** Lowercase address → label lookup */
const labelMap = new Map<string, WalletLabel>(
  ALL_LABELS.map((l) => [l.address.toLowerCase(), l])
);

/* ── Public API ── */

/** Look up a wallet label by address */
export function getWalletLabel(address: string): WalletLabel | undefined {
  return labelMap.get(address.toLowerCase());
}

/** Check if an address belongs to a known exchange */
export function isExchange(address: string): boolean {
  const label = getWalletLabel(address);
  return label?.type === "exchange";
}

/** Determine flow direction for an exchange transfer */
export function getExchangeFlowDirection(
  from: string,
  to: string
): "inflow" | "outflow" | "internal" | "none" {
  const fromIsExchange = isExchange(from);
  const toIsExchange = isExchange(to);

  if (fromIsExchange && toIsExchange) return "internal";
  if (toIsExchange) return "inflow"; // Potential sell
  if (fromIsExchange) return "outflow"; // Potential buy
  return "none";
}

/** Get all labels for a specific chain */
export function getLabelsByChain(chain: Chain): WalletLabel[] {
  return ALL_LABELS.filter((l) => l.chain === chain);
}

/** Get all exchange addresses for quick set lookups */
export function getExchangeAddressSet(chain?: Chain): Set<string> {
  const filtered = chain
    ? ALL_LABELS.filter((l) => l.chain === chain && l.type === "exchange")
    : ALL_LABELS.filter((l) => l.type === "exchange");
  return new Set(filtered.map((l) => l.address.toLowerCase()));
}

/** Total known labels count */
export const TOTAL_LABELS = ALL_LABELS.length;
