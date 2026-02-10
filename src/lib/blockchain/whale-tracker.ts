/**
 * Whale Tracker — Real-time large transfer detection
 *
 * Ethereum: Alchemy SDK WebSocket (alchemy_minedTransactions)
 * Solana: Helius Enhanced WebSocket (transactionSubscribe)
 *
 * Reference: docs/BLOCKCHAIN.md
 * Thresholds: ETH ≥100 ETH, ERC-20 ≥$500K, SOL ≥10K SOL
 * Rate limits: Alchemy 330 CU/s, Helius 50 RPS
 */

import { Alchemy, Network, AlchemySubscription, Utils } from "alchemy-sdk";
import WebSocket from "ws";
import {
  getWalletLabel,
  getExchangeFlowDirection,
  type WalletLabel,
} from "./labels";

/* ── Types ── */
export interface WhaleTransfer {
  chain: "ethereum" | "solana";
  txHash: string;
  from: string;
  to: string;
  fromLabel: WalletLabel | undefined;
  toLabel: WalletLabel | undefined;
  /** "inflow" = to exchange (sell signal), "outflow" = from exchange (buy signal) */
  flowDirection: "inflow" | "outflow" | "internal" | "none";
  /** Native token amount (ETH or SOL) */
  amount: number;
  /** Approximate USD value (0 if unknown) */
  valueUsd: number;
  /** Token symbol */
  symbol: string;
  blockNumber?: number;
  timestamp: number;
}

export type WhaleTransferHandler = (transfer: WhaleTransfer) => void;

/* ── Thresholds ── */
const ETH_THRESHOLD = 100; // 100 ETH
const SOL_THRESHOLD = 10_000; // 10K SOL
const ERC20_USD_THRESHOLD = 500_000; // $500K

/* ── Reconnection Config ── */
const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 60_000;

/* ─────────────────────────────────────────────
 *  Ethereum Whale Tracker (Alchemy SDK)
 * ───────────────────────────────────────────── */

export class EthWhaleTracker {
  private alchemy: Alchemy;
  private handler: WhaleTransferHandler;
  private running = false;

  constructor(handler: WhaleTransferHandler) {
    this.alchemy = new Alchemy({
      apiKey: process.env.ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    });
    this.handler = handler;
  }

  /** Start listening for large ETH transfers */
  start() {
    if (this.running) return;
    this.running = true;

    // Subscribe to all mined transactions
    this.alchemy.ws.on(
      {
        method: AlchemySubscription.MINED_TRANSACTIONS,
        hashesOnly: false,
      },
      (tx) => {
        try {
          this.processTx(tx);
        } catch {
          // Silently ignore malformed tx
        }
      }
    );
  }

  stop() {
    this.running = false;
    this.alchemy.ws.removeAllListeners();
  }

  private processTx(tx: Record<string, unknown>) {
    const transaction = tx as {
      transaction?: {
        hash?: string;
        from?: string;
        to?: string;
        value?: string;
      };
    };

    const inner = transaction.transaction;
    if (!inner?.from || !inner?.to || !inner?.value) return;

    const valueWei = BigInt(inner.value);
    const valueEth = Number(Utils.formatEther(valueWei));

    if (valueEth < ETH_THRESHOLD) return;

    const fromLabel = getWalletLabel(inner.from);
    const toLabel = getWalletLabel(inner.to);
    const flowDirection = getExchangeFlowDirection(inner.from, inner.to);

    this.handler({
      chain: "ethereum",
      txHash: inner.hash ?? "",
      from: inner.from,
      to: inner.to,
      fromLabel,
      toLabel,
      flowDirection,
      amount: valueEth,
      valueUsd: 0, // Enriched downstream via price feed
      symbol: "ETH",
      timestamp: Date.now(),
    });
  }
}

/* ─────────────────────────────────────────────
 *  Solana Whale Tracker (Helius Enhanced WebSocket)
 * ───────────────────────────────────────────── */

export class SolWhaleTracker {
  private ws: WebSocket | null = null;
  private handler: WhaleTransferHandler;
  private running = false;
  private backoff = INITIAL_BACKOFF_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(handler: WhaleTransferHandler) {
    this.handler = handler;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.connect();
  }

  stop() {
    this.running = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.ws?.close();
    this.ws = null;
  }

  private connect() {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) {
      console.error("[SolWhaleTracker] HELIUS_API_KEY not set");
      return;
    }

    const url = `wss://atlas-mainnet.helius-rpc.com/?api-key=${apiKey}`;
    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      this.backoff = INITIAL_BACKOFF_MS;

      // Subscribe to System Program transactions (SOL transfers)
      this.ws?.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "transactionSubscribe",
          params: [
            {
              accountInclude: ["11111111111111111111111111111111"], // System Program
              vote: false,
              failed: false,
            },
            {
              commitment: "confirmed",
              encoding: "jsonParsed",
              transactionDetails: "full",
              maxSupportedTransactionVersion: 0,
            },
          ],
        })
      );

      // Keep-alive ping every 30s
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.ping();
        }
      }, 30_000);
    });

    this.ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const result = msg.params?.result;
        if (!result?.transaction) return;
        this.processSolTx(result);
      } catch {
        // Ignore parse errors
      }
    });

    this.ws.on("close", () => {
      if (this.pingInterval) clearInterval(this.pingInterval);
      if (this.running) this.scheduleReconnect();
    });

    this.ws.on("error", () => {
      this.ws?.close();
    });
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.backoff);
    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
  }

  private processSolTx(result: {
    signature?: string;
    transaction?: {
      meta?: {
        preBalances?: number[];
        postBalances?: number[];
      };
      transaction?: {
        message?: {
          accountKeys?: Array<{ pubkey?: string }>;
        };
      };
    };
  }) {
    const meta = result.transaction?.meta;
    if (!meta?.preBalances || !meta?.postBalances) return;

    const accountKeys =
      result.transaction?.transaction?.message?.accountKeys ?? [];

    // Find the largest balance change
    let maxLamportChange = 0;
    let senderIdx = -1;
    let receiverIdx = -1;

    for (let i = 0; i < meta.preBalances.length; i++) {
      const change = meta.postBalances[i] - meta.preBalances[i];
      if (change < -maxLamportChange) {
        maxLamportChange = -change;
        senderIdx = i;
      }
      if (change > maxLamportChange) {
        receiverIdx = i;
      }
    }

    const solAmount = maxLamportChange / 1e9;
    if (solAmount < SOL_THRESHOLD) return;

    const from = accountKeys[senderIdx]?.pubkey ?? "unknown";
    const to = accountKeys[receiverIdx]?.pubkey ?? "unknown";
    const fromLabel = getWalletLabel(from);
    const toLabel = getWalletLabel(to);
    const flowDirection = getExchangeFlowDirection(from, to);

    this.handler({
      chain: "solana",
      txHash: result.signature ?? "",
      from,
      to,
      fromLabel,
      toLabel,
      flowDirection,
      amount: solAmount,
      valueUsd: 0, // Enriched downstream
      symbol: "SOL",
      timestamp: Date.now(),
    });
  }
}

/* ── Combined Tracker ── */
export class WhaleTracker {
  private ethTracker: EthWhaleTracker;
  private solTracker: SolWhaleTracker;

  constructor(handler: WhaleTransferHandler) {
    this.ethTracker = new EthWhaleTracker(handler);
    this.solTracker = new SolWhaleTracker(handler);
  }

  start() {
    this.ethTracker.start();
    this.solTracker.start();
  }

  stop() {
    this.ethTracker.stop();
    this.solTracker.stop();
  }
}
