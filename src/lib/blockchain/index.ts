/* ── Wallet Labels ── */
export {
  getWalletLabel,
  isExchange,
  getExchangeFlowDirection,
  getLabelsByChain,
  getExchangeAddressSet,
  TOTAL_LABELS,
  type WalletLabel,
  type WalletType,
} from "./labels";

/* ── Whale Tracker ── */
export {
  WhaleTracker,
  EthWhaleTracker,
  SolWhaleTracker,
  type WhaleTransfer,
  type WhaleTransferHandler,
} from "./whale-tracker";

/* ── DeFi Monitor ── */
export {
  DefiMonitor,
  fetchProtocolTvls,
  fetchStablecoinPrices,
  checkTvlAlerts,
  checkStablecoinAlerts,
  type TvlAlert,
  type StablecoinAlert,
  type DefiAlertHandler,
} from "./defi-monitor";

/* ── Token Unlock Fetcher ── */
export {
  fetchUpcomingUnlocks,
  loadUpcomingUnlocks,
  getUnlockSummary,
  filterHighImpactUnlocks,
  getUrgencyLevel,
  MONITORED_TOKENS,
  type TokenUnlockEvent,
  type TokenUnlockSummary,
} from "./token-unlock-fetcher";

/* ── Price Fetcher ── */
export {
  fetchMarketPrices,
  fetchSimplePrices,
  fetchFearGreed,
  fetchGasPrice,
  type TokenPrice,
  type FearGreedData,
  type GasData,
} from "./price-fetcher";

/* ── Whale Alert ── */
export {
  fetchWhaleTransactions,
  getWhaleSeverity,
  formatWhaleTitle,
  type WhaleEvent,
} from "./whale-alert";

/* ── Signal Generator ── */
export {
  generateSignals,
  getSignalSeverity,
  type GeneratedSignal,
  type TokenData,
  type SignalCategory,
} from "./signal-generator";
