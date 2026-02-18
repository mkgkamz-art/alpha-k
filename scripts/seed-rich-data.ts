/**
 * Rich Seed Data Script
 *
 * Usage:
 *   npx tsx scripts/seed-rich-data.ts
 *
 * Uses the Supabase secret key (sb_secret_...) to bypass RLS for INSERT operations.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ogegbrjaxnumkqfoqpvx.supabase.co";
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY || "sb_secret_s5t9qdIzmVtgTUhjJ9yB-A_xPWanyAf";

const supabase = createClient(SUPABASE_URL, SECRET_KEY);

function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}
function future(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

async function deleteAll(table: string) {
  const { error } = await supabase.from(table).delete().not("id", "is", null);
  if (error) console.warn(`  ⚠ delete ${table}: ${error.message}`);
}

async function seed() {
  console.log("=== BLOSAFE Rich Seed Data ===\n");

  // ── 0. CLEAN ALL TABLES ──
  console.log("0/8 Cleaning existing data...");
  await deleteAll("alert_events");
  await deleteAll("whale_events");
  await deleteAll("signals");
  await deleteAll("token_unlocks");
  await deleteAll("defi_protocols");
  await deleteAll("stablecoin_status");
  await deleteAll("dex_volumes");
  await deleteAll("liquidity_pools");
  console.log("  Cleanup done.\n");

  // ── 1. WHALE EVENTS (30) ──
  console.log("1/8 Inserting whale_events...");
  const { data: w, error: we } = await supabase.from("whale_events").insert([
    { tx_hash: "7a8b1c2d3e4f5061728394a5b6c7d8e9f0a1b2c3d4e5f6071829304a5b6c7d8e", blockchain: "bitcoin", from_address: "bc1qxy2kgdygjrsq", from_label: "Binance", to_address: "bc1qm34lsc65zpw79", to_label: "Unknown Wallet", symbol: "BTC", amount: 1250, usd_value: 121875000, event_type: "exchange_withdrawal", detected_at: ago(15) },
    { tx_hash: "0xbtc002def", blockchain: "bitcoin", from_address: "bc1qjasf9z3satoshi", from_label: "Satoshi-era Wallet", to_address: "bc1qxy2kgdbinance", to_label: "Binance", symbol: "BTC", amount: 2000, usd_value: 195000000, event_type: "exchange_deposit", detected_at: ago(45) },
    { tx_hash: "9c6a0d4e5f3b8712a6c5d9e0f4a3b7c2b6a5d8e9f4a3b6c7a5d9e2f1a4b3c6a4", blockchain: "bitcoin", from_address: "1CoinbaseHotWallet", from_label: "Coinbase", to_address: "bc1qcold0123456", to_label: "Institutional Cold Storage", symbol: "BTC", amount: 4500, usd_value: 438750000, event_type: "transfer", detected_at: ago(120) },
    { tx_hash: "0xbtc004jkl", blockchain: "bitcoin", from_address: "bc1qgrayscale001", from_label: "Grayscale GBTC", to_address: "bc1qxy2kgdbinance", to_label: "Binance", symbol: "BTC", amount: 800, usd_value: 78000000, event_type: "exchange_deposit", detected_at: ago(180) },
    { tx_hash: "0xbtc005mno", blockchain: "bitcoin", from_address: "bc1qkraken001hot", from_label: "Kraken", to_address: "bc1qunknown001cold", to_label: "Unknown Wallet", symbol: "BTC", amount: 350, usd_value: 34125000, event_type: "exchange_withdrawal", detected_at: ago(240) },
    { tx_hash: "0xbtc006pqr", blockchain: "bitcoin", from_address: "bc1qmtgoxtrustee", from_label: "Mt. Gox Trustee", to_address: "bc1qkraken001hot", to_label: "Kraken", symbol: "BTC", amount: 3200, usd_value: 312000000, event_type: "exchange_deposit", detected_at: ago(480) },
    { tx_hash: "0xbtc007stu", blockchain: "bitcoin", from_address: "bc1qmicrostr001", from_label: "MicroStrategy", to_address: "bc1qcoldMS001vault", to_label: "MicroStrategy Cold Vault", symbol: "BTC", amount: 5000, usd_value: 487500000, event_type: "transfer", detected_at: ago(1440) },
    { tx_hash: "0xbtc008vwx", blockchain: "bitcoin", from_address: "bc1qblackrock001", from_label: "BlackRock iShares ETF", to_address: "bc1qcoinbaseCust01", to_label: "Coinbase Custody", symbol: "BTC", amount: 6200, usd_value: 604500000, event_type: "transfer", detected_at: ago(840) },
    { tx_hash: "0xbtc009yza", blockchain: "bitcoin", from_address: "bc1qgemini001hot", from_label: "Gemini", to_address: "bc1qunknown002cold", to_label: "Unknown Wallet", symbol: "BTC", amount: 900, usd_value: 87750000, event_type: "exchange_withdrawal", detected_at: ago(1080) },
    { tx_hash: "0xbtc010bcd", blockchain: "bitcoin", from_address: "bc1qfidelity001", from_label: "Fidelity Digital", to_address: "bc1qcoldFid001", to_label: "Fidelity Cold Storage", symbol: "BTC", amount: 7800, usd_value: 760500000, event_type: "transfer", detected_at: ago(1200) },
    { tx_hash: "0xeth001abc", blockchain: "ethereum", from_address: "0x28c6c06298d514db", from_label: "Binance Hot Wallet", to_address: "0xdead00000000eth01", to_label: "Unknown EOA", symbol: "ETH", amount: 15000, usd_value: 52500000, event_type: "exchange_withdrawal", detected_at: ago(30) },
    { tx_hash: "0x5b9f3d2a8c4e7601f1a5b4c8d9e3f2a6b1a594c7d8e3f2a5b694c8d1e0f3a2b5", blockchain: "ethereum", from_address: "0x21a31ee1afc51d94", from_label: "Jump Trading", to_address: "0x28c6c06298d514db", to_label: "Binance", symbol: "ETH", amount: 28000, usd_value: 98000000, event_type: "exchange_deposit", detected_at: ago(60) },
    { tx_hash: "0xeth003ghi", blockchain: "ethereum", from_address: "0xwintermute0trading", from_label: "Wintermute", to_address: "0x1111111254fb6c44", to_label: "1inch Aggregator", symbol: "ETH", amount: 42000, usd_value: 147000000, event_type: "transfer", detected_at: ago(90) },
    { tx_hash: "0xeth004jkl", blockchain: "ethereum", from_address: "0xcoinbaseprime001", from_label: "Coinbase Prime", to_address: "0xcold0001ethvault", to_label: "Institutional Custody", symbol: "ETH", amount: 50000, usd_value: 175000000, event_type: "transfer", detected_at: ago(300) },
    { tx_hash: "0xeth005mno", blockchain: "ethereum", from_address: "0xcelsiusliquidator", from_label: "Celsius Liquidator", to_address: "0x28c6c06298d514db", to_label: "Binance", symbol: "ETH", amount: 35000, usd_value: 122500000, event_type: "exchange_deposit", detected_at: ago(960) },
    { tx_hash: "0xeth006pqr", blockchain: "ethereum", from_address: "0xparadigmcapital01", from_label: "Paradigm", to_address: "0xUniswapV3Pool01", to_label: "Uniswap V3 Pool", symbol: "ETH", amount: 20000, usd_value: 70000000, event_type: "transfer", detected_at: ago(540) },
    { tx_hash: "0xeth007stu", blockchain: "ethereum", from_address: "0xvitaliketh001", from_label: "vitalik.eth", to_address: "0xensDAO0treasury01", to_label: "ENS DAO Treasury", symbol: "ETH", amount: 1000, usd_value: 3500000, event_type: "transfer", detected_at: ago(720) },
    { tx_hash: "0x1b5f9d8a4c0e3267f7a1b0c4d5e9f8a2b7a1f0c3d4e9f8a1b2f0c4d7e6f9a8b1", blockchain: "ethereum", from_address: "0x5754284f345afc66", from_label: "Tether Treasury", to_address: "0x28c6c06298d514db", to_label: "Binance", symbol: "USDT", amount: 500000000, usd_value: 500000000, event_type: "transfer", detected_at: ago(20) },
    { tx_hash: "0xusdt002def", blockchain: "tron", from_address: "TTetherTreasury001", from_label: "Tether Treasury", to_address: "TKrakenHot001", to_label: "Kraken", symbol: "USDT", amount: 200000000, usd_value: 200000000, event_type: "transfer", detected_at: ago(60) },
    { tx_hash: "0xusdt003ghi", blockchain: "ethereum", from_address: "0xbitfinex001hot", from_label: "Bitfinex", to_address: "0xcumberland001otc", to_label: "Cumberland (OTC)", symbol: "USDT", amount: 75000000, usd_value: 75000000, event_type: "transfer", detected_at: ago(180) },
    { tx_hash: "0xusdc001abc", blockchain: "ethereum", from_address: "0xcircletreasury01", from_label: "Circle Treasury", to_address: "0xcoinbase001", to_label: "Coinbase", symbol: "USDC", amount: 300000000, usd_value: 300000000, event_type: "transfer", detected_at: ago(240) },
    { tx_hash: "0xsol001abc", blockchain: "solana", from_address: "BinanceSOLhot001", from_label: "Binance", to_address: "UnknownSOLwallet01", to_label: "Unknown Wallet", symbol: "SOL", amount: 450000, usd_value: 63000000, event_type: "exchange_withdrawal", detected_at: ago(40) },
    { tx_hash: "0xsol002def", blockchain: "solana", from_address: "JumpTradingSOL001", from_label: "Jump Trading", to_address: "RaydiumPoolSOL001", to_label: "Raydium AMM", symbol: "SOL", amount: 320000, usd_value: 44800000, event_type: "transfer", detected_at: ago(120) },
    { tx_hash: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW", blockchain: "solana", from_address: "FTXestateLiqSOL01", from_label: "FTX Estate", to_address: "CoinbaseSOLhot001", to_label: "Coinbase", symbol: "SOL", amount: 1500000, usd_value: 210000000, event_type: "exchange_deposit", detected_at: ago(360) },
    { tx_hash: "0xsol004jkl", blockchain: "solana", from_address: "PhantomWhaleSOL01", from_label: "Unknown Whale", to_address: "BinanceSOLhot001", to_label: "Binance", symbol: "SOL", amount: 800000, usd_value: 112000000, event_type: "exchange_deposit", detected_at: ago(600) },
    { tx_hash: "0xxrp001abc", blockchain: "ripple", from_address: "rRippleLabsEscrow", from_label: "Ripple Labs", to_address: "rBitstampHot001", to_label: "Bitstamp", symbol: "XRP", amount: 50000000, usd_value: 32500000, event_type: "transfer", detected_at: ago(60) },
    { tx_hash: "0xxrp002def", blockchain: "ripple", from_address: "rBinanceXRP001hot", from_label: "Binance", to_address: "rUnknownXRP001", to_label: "Unknown Wallet", symbol: "XRP", amount: 80000000, usd_value: 52000000, event_type: "exchange_withdrawal", detected_at: ago(240) },
    { tx_hash: "0xlink001abc", blockchain: "ethereum", from_address: "0xchainlinkVesting", from_label: "Chainlink Vesting", to_address: "0x28c6c06298d514db", to_label: "Binance", symbol: "LINK", amount: 2500000, usd_value: 37500000, event_type: "exchange_deposit", detected_at: ago(180) },
    { tx_hash: "0xavax001abc", blockchain: "avalanche", from_address: "AvaxFoundation001", from_label: "Avalanche Foundation", to_address: "AvaxUnknown001cold", to_label: "Unknown Wallet", symbol: "AVAX", amount: 1200000, usd_value: 42000000, event_type: "transfer", detected_at: ago(300) },
    { tx_hash: "0xdoge001abc", blockchain: "dogecoin", from_address: "RobinhoodDOGEhot01", from_label: "Robinhood", to_address: "UnknownDOGE001cold", to_label: "Unknown Wallet", symbol: "DOGE", amount: 500000000, usd_value: 55000000, event_type: "exchange_withdrawal", detected_at: ago(120) },
  ]).select("id");
  console.log(`  whale_events: ${w?.length ?? 0} rows (${we ? "ERROR: " + we.message : "OK"})`);

  // ── 2. SIGNALS (30) ──
  console.log("2/8 Inserting signals...");
  const { data: s, error: se } = await supabase.from("signals").insert([
    { token_symbol: "BTC", token_name: "Bitcoin", signal_type: "buy", signal_name: "Oversold Bounce", confidence: 92, timeframe: "1D", description: "7일 연속 하락 후 RSI 25 진입. 과매도 반등 가능성 높음. 200일 이동평균에서 강한 지지.", indicators: { rsi_14: 25, macd_signal: "bullish_cross", volume_spike: true, support_level: 94500 }, price_at_signal: 95200, created_at: ago(120) },
    { token_symbol: "BTC", token_name: "Bitcoin", signal_type: "sell", signal_name: "Distribution Pattern", confidence: 78, timeframe: "1D", description: "Whale 대량 거래소 입금 + 24h 상승률 8% — 단기 차익 실현 패턴.", indicators: { exchange_inflow: 1250, price_change_24h: 8.2, rsi_14: 72 }, price_at_signal: 103400, created_at: ago(360) },
    { token_symbol: "BTC", token_name: "Bitcoin", signal_type: "buy", signal_name: "Accumulation Zone", confidence: 85, timeframe: "1W", description: "주간 차트 기준 볼린저 밴드 하단 터치. 기관 매집 구간.", indicators: { bollinger_position: "lower", institutional_flow: "positive", weekly_rsi: 38 }, price_at_signal: 96800, created_at: ago(1440) },
    { token_symbol: "ETH", token_name: "Ethereum", signal_type: "buy", signal_name: "Strong Support", confidence: 88, timeframe: "1D", description: "ETH $3,400 지지선 3번째 테스트 성공. 거래량 200% 증가.", indicators: { support_tests: 3, volume_change: 200, price_level: 3400 }, price_at_signal: 3420, created_at: ago(60) },
    { token_symbol: "ETH", token_name: "Ethereum", signal_type: "alert", signal_name: "Volatility Spike", confidence: 74, timeframe: "4H", description: "4시간 내 ATR 급등. 큰 가격 변동 임박 가능.", indicators: { atr_change: 180, bollinger_width: "expanding", volume_surge: true }, price_at_signal: 3510, created_at: ago(180) },
    { token_symbol: "ETH", token_name: "Ethereum", signal_type: "sell", signal_name: "Bearish Divergence", confidence: 81, timeframe: "1D", description: "RSI 다이버전스 감지 — 가격 신고가 but RSI 하락. 조정 가능.", indicators: { rsi_divergence: true, price_trend: "up", rsi_trend: "down" }, price_at_signal: 3680, created_at: ago(720) },
    { token_symbol: "SOL", token_name: "Solana", signal_type: "buy", signal_name: "Momentum Shift", confidence: 90, timeframe: "1D", description: "24h -8.5% 급락 후 강한 반등 시작. 거래량 300% 급증 + MACD 골든크로스.", indicators: { price_change_24h: -8.5, volume_spike: 300, macd: "golden_cross" }, price_at_signal: 138, created_at: ago(30) },
    { token_symbol: "SOL", token_name: "Solana", signal_type: "buy", signal_name: "Oversold Signal", confidence: 86, timeframe: "4H", description: "4시간 RSI 18 — 극도의 과매도. 단기 반등 확률 높음.", indicators: { rsi_4h: 18, stochastic: "oversold", support: 130 }, price_at_signal: 132, created_at: ago(240) },
    { token_symbol: "BNB", token_name: "BNB", signal_type: "alert", signal_name: "Volume Anomaly", confidence: 72, timeframe: "1D", description: "BNB 거래량 평소 대비 450% 급증. Binance 관련 뉴스 확인 필요.", indicators: { volume_ratio: 4.5, avg_volume_7d: 850000000, current_volume: 3825000000 }, price_at_signal: 620, created_at: ago(300) },
    { token_symbol: "XRP", token_name: "XRP", signal_type: "buy", signal_name: "Breakout Signal", confidence: 83, timeframe: "1D", description: "XRP $0.65 저항선 돌파 시도. Ripple SEC 소송 진전 기대감.", indicators: { resistance_level: 0.65, breakout_attempt: true, volume_confirm: true }, price_at_signal: 0.64, created_at: ago(120) },
    { token_symbol: "XRP", token_name: "XRP", signal_type: "sell", signal_name: "Resistance Rejection", confidence: 76, timeframe: "4H", description: "$0.72 저항에서 3번 반락. 단기 하방 압력.", indicators: { resistance_tests: 3, rejection_pattern: true, rsi: 65 }, price_at_signal: 0.71, created_at: ago(480) },
    { token_symbol: "ADA", token_name: "Cardano", signal_type: "buy", signal_name: "Double Bottom", confidence: 79, timeframe: "1D", description: "더블 바텀 패턴 완성. $0.38 네크라인 돌파 시 상승 모멘텀.", indicators: { pattern: "double_bottom", neckline: 0.38, volume: "increasing" }, price_at_signal: 0.36, created_at: ago(180) },
    { token_symbol: "AVAX", token_name: "Avalanche", signal_type: "sell", signal_name: "Strong Downtrend", confidence: 84, timeframe: "1D", description: "지속적 하락 — 24h -5.8%, 7d -12.3%. 추세 반전 신호 없음.", indicators: { price_change_24h: -5.8, price_change_7d: -12.3, trend: "bearish" }, price_at_signal: 34.5, created_at: ago(240) },
    { token_symbol: "DOGE", token_name: "Dogecoin", signal_type: "alert", signal_name: "Social Surge", confidence: 68, timeframe: "1D", description: "DOGE 소셜 멘션 800% 급증. Elon Musk 관련 트윗 감지.", indicators: { social_mentions: 800, sentiment: "bullish", trigger: "social_media" }, price_at_signal: 0.11, created_at: ago(60) },
    { token_symbol: "LINK", token_name: "Chainlink", signal_type: "buy", signal_name: "CCIP Adoption", confidence: 82, timeframe: "1W", description: "Chainlink CCIP 도입 증가 + TVL locked 상승. 펀더멘털 강화.", indicators: { ccip_transactions: "growing", tvl_locked_change: 15, weekly_trend: "bullish" }, price_at_signal: 15.2, created_at: ago(360) },
    { token_symbol: "DOT", token_name: "Polkadot", signal_type: "sell", signal_name: "Parachain Unlock", confidence: 75, timeframe: "1D", description: "DOT 파라체인 경매 언락 물량 증가. 매도 압력 예상.", indicators: { unlock_amount: 5000000, supply_percent: 0.4, selling_pressure: "expected" }, price_at_signal: 7.8, created_at: ago(540) },
    { token_symbol: "MATIC", token_name: "Polygon", signal_type: "buy", signal_name: "Polygon 2.0 Rally", confidence: 87, timeframe: "1D", description: "Polygon 2.0 로드맵 발표 이후 네트워크 활동 급증. ZK 채택 확대.", indicators: { network_activity: "surging", zk_transactions: "growing", dev_activity: "high" }, price_at_signal: 0.92, created_at: ago(300) },
    { token_symbol: "UNI", token_name: "Uniswap", signal_type: "alert", signal_name: "Governance Vote", confidence: 71, timeframe: "1D", description: "UNI 거버넌스 투표 진행 중 — Fee Switch 제안. 결과에 따라 큰 변동.", indicators: { governance: "fee_switch_vote", participation: "high", deadline: "48h" }, price_at_signal: 12.4, created_at: ago(120) },
    { token_symbol: "AAVE", token_name: "Aave", signal_type: "buy", signal_name: "DeFi Recovery", confidence: 80, timeframe: "1W", description: "DeFi TVL 회복세 + Aave V4 기대감. 주간 차트 상승 추세 전환.", indicators: { defi_tvl_trend: "recovering", protocol_update: "v4_announcement", weekly_macd: "bullish" }, price_at_signal: 285, created_at: ago(1440) },
    { token_symbol: "APT", token_name: "Aptos", signal_type: "sell", signal_name: "Strong Downtrend", confidence: 78, timeframe: "1D", description: "지속적 하락 — 24h -3.2%, 7d -8.5%. Move 생태계 성장 둔화.", indicators: { price_change_24h: -3.2, price_change_7d: -8.5, ecosystem: "slowing" }, price_at_signal: 8.9, created_at: ago(420) },
    { token_symbol: "ARB", token_name: "Arbitrum", signal_type: "buy", signal_name: "L2 Dominance", confidence: 85, timeframe: "1D", description: "Arbitrum L2 TVL 점유율 45% 돌파. DEX 거래량 급증.", indicators: { l2_tvl_share: 45, dex_volume_change: 120, sequencer_revenue: "growing" }, price_at_signal: 1.15, created_at: ago(180) },
    { token_symbol: "NEAR", token_name: "NEAR Protocol", signal_type: "buy", signal_name: "AI Narrative", confidence: 77, timeframe: "1D", description: "NEAR AI 에이전트 발표 이후 관심 급증. 거래량 250% 증가.", indicators: { narrative: "AI_agents", volume_change: 250, social_trend: "rising" }, price_at_signal: 5.8, created_at: ago(240) },
    { token_symbol: "OP", token_name: "Optimism", signal_type: "alert", signal_name: "Token Unlock Impact", confidence: 73, timeframe: "1D", description: "OP 대량 언락 D-2. 31.3M OP ($65M) — 매도 압력 가능.", indicators: { unlock_amount: 31340000, usd_value: 65200000, days_until: 2 }, price_at_signal: 2.08, created_at: ago(60) },
    { token_symbol: "SUI", token_name: "Sui", signal_type: "buy", signal_name: "TVL Growth", confidence: 81, timeframe: "1W", description: "Sui TVL 최근 30일 180% 급증. Move 생태계 내 가장 빠른 성장.", indicators: { tvl_growth_30d: 180, unique_addresses: "growing", dapp_launches: 12 }, price_at_signal: 1.42, created_at: ago(480) },
    { token_symbol: "TIA", token_name: "Celestia", signal_type: "sell", signal_name: "Modular Fatigue", confidence: 69, timeframe: "1D", description: "Celestia 블롭 사용량 감소 + 토큰 언락 임박. 모듈러 내러티브 약화.", indicators: { blob_usage: "declining", unlock_date: "2026-02-20", narrative: "weakening" }, price_at_signal: 9.2, created_at: ago(600) },
    { token_symbol: "INJ", token_name: "Injective", signal_type: "buy", signal_name: "Burn Mechanism", confidence: 83, timeframe: "1D", description: "INJ 주간 소각 800만 달러 — 최대 기록. 디플레이션 효과 가속.", indicators: { weekly_burn_usd: 8000000, total_burned: "record_high", supply_decrease: 0.3 }, price_at_signal: 24.5, created_at: ago(300) },
    { token_symbol: "PEPE", token_name: "Pepe", signal_type: "alert", signal_name: "Meme Rally", confidence: 65, timeframe: "4H", description: "PEPE 4시간 내 15% 급등. 밈코인 랠리 시작 가능성 — 리스크 주의.", indicators: { price_change_4h: 15, meme_index: "surging", risk: "very_high" }, price_at_signal: 0.0000012, created_at: ago(30) },
    { token_symbol: "FET", token_name: "Fetch.ai", signal_type: "buy", signal_name: "AI Token Leader", confidence: 86, timeframe: "1D", description: "AI 토큰 섹터 리더. ASI 토큰 합병 기대감 + 실사용 증가.", indicators: { ai_sector_rank: 1, merger_progress: "on_track", usage_growth: 45 }, price_at_signal: 2.3, created_at: ago(360) },
    { token_symbol: "DYDX", token_name: "dYdX", signal_type: "buy", signal_name: "V4 Chain Launch", confidence: 79, timeframe: "1D", description: "dYdX V4 독립 체인 출시 이후 거래량 200% 증가. 탈중앙화 파생상품 선두.", indicators: { v4_volume_growth: 200, chain_tps: "growing", open_interest: "record" }, price_at_signal: 2.5, created_at: ago(420) },
    { token_symbol: "GMX", token_name: "GMX", signal_type: "alert", signal_name: "Fee Revenue Spike", confidence: 74, timeframe: "1D", description: "GMX 일일 수수료 수입 $2.8M — 30일 최고치. 파생상품 수요 급증.", indicators: { daily_fees: 2800000, fee_trend: "surging", open_interest_change: 45 }, price_at_signal: 42.5, created_at: ago(180) },
  ]).select("id");
  console.log(`  signals: ${s?.length ?? 0} rows (${se ? "ERROR: " + se.message : "OK"})`);

  // ── 3. ALERT EVENTS (25+ with rich metadata) ──
  console.log("3/8 Inserting alert_events...");
  const PUBLIC_USER = "0bbf7659-370e-4d89-a503-8c5f6b7c65bf";
  const alertEvents = [
    // Whale alerts with rich metadata
    {
      user_id: PUBLIC_USER, type: "whale", severity: "critical",
      title: "BTC 4,500 withdrawn from Coinbase to Cold Storage",
      description: "4,500 BTC ($438.7M) moved from Coinbase to institutional cold storage wallet. Largest single BTC withdrawal this week.",
      metadata: {
        symbol: "BTC", amount: 4500, usd_value: 438750000, tx_hash: "9c6a0d4e5f3b8712a6c5d9e0f4a3b7c2b6a5d8e9f4a3b6c7a5d9e2f1a4b3c6a4",
        from_address: "1CoinbaseHotWallet", from_label: "Coinbase", from_tag: "Exchange", from_tag_color: "warning",
        to_address: "bc1qcold0123456", to_label: "Institutional Cold Storage", to_tag: "Cold Wallet", to_tag_color: "success",
        value_usd: 438750000, block_number: 880245, tx_explorer_url: "https://mempool.space/tx/9c6a0d4e5f3b8712a6c5d9e0f4a3b7c2b6a5d8e9f4a3b6c7a5d9e2f1a4b3c6a4",
        impact_score: 9.2,
        impact_metrics: [
          { label: "24h Exchange Reserve", value: "-2.1%", trend: "down" },
          { label: "BTC Exchange Balance", value: "2.31M BTC", trend: "down" },
          { label: "Avg Withdrawal Size", value: "$12.4M", trend: "up" },
        ],
        wallet_history: [
          { type: "Withdrawal", age: "2h ago", value: "$438.7M BTC" },
          { type: "Withdrawal", age: "1d ago", value: "$89.2M BTC" },
          { type: "Deposit", age: "3d ago", value: "$245M USDT" },
          { type: "Withdrawal", age: "5d ago", value: "$156M ETH" },
          { type: "Deposit", age: "7d ago", value: "$312M BTC" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 25) + 3,
        })),
        similar_wallets: [
          { label: "Fidelity Custody", address: "bc1qfidelity001000000000", similarity: "94%" },
          { label: "BlackRock iShares", address: "bc1qblackrock001000000", similarity: "89%" },
          { label: "Grayscale GBTC", address: "bc1qgrayscale00100000", similarity: "82%" },
        ],
      },
      created_at: ago(120),
    },
    {
      user_id: PUBLIC_USER, type: "whale", severity: "high",
      title: "ETH 28,000 deposited to Binance by Jump Trading",
      description: "Jump Trading deposited 28,000 ETH ($98M) to Binance. Potential selling pressure — institutional profit-taking.",
      metadata: {
        symbol: "ETH", amount: 28000, usd_value: 98000000, tx_hash: "0x5b9f3d2a8c4e7601f1a5b4c8d9e3f2a6b1a594c7d8e3f2a5b694c8d1e0f3a2b5",
        from_address: "0x21a31ee1afc51d94", from_label: "Jump Trading", from_tag: "Market Maker", from_tag_color: "purple",
        to_address: "0x28c6c06298d514db", to_label: "Binance", to_tag: "Exchange", to_tag_color: "warning",
        value_usd: 98000000, block_number: 19445678, tx_explorer_url: "https://etherscan.io/tx/0x5b9f3d2a8c4e7601f1a5b4c8d9e3f2a6b1a594c7d8e3f2a5b694c8d1e0f3a2b5",
        impact_score: 7.8,
        impact_metrics: [
          { label: "Exchange Inflow 24h", value: "+$342M", trend: "up" },
          { label: "ETH Exchange Balance", value: "16.2M ETH", trend: "up" },
          { label: "Funding Rate", value: "-0.02%", trend: "down" },
        ],
        wallet_history: [
          { type: "Exchange Deposit", age: "1h ago", value: "$98M ETH" },
          { type: "DEX Swap", age: "4h ago", value: "$45M USDC→ETH" },
          { type: "LP Removal", age: "8h ago", value: "$67M ETH-USDC" },
          { type: "Exchange Deposit", age: "2d ago", value: "$120M ETH" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 30) + 5,
        })),
        similar_wallets: [
          { label: "Wintermute", address: "0xwintermute0trading000", similarity: "91%" },
          { label: "Alameda Remnant", address: "0xa16v2aleo0000000000", similarity: "78%" },
        ],
      },
      created_at: ago(60),
    },
    {
      user_id: PUBLIC_USER, type: "whale", severity: "critical",
      title: "USDT 500M minted from Tether Treasury",
      description: "Tether Treasury minted and transferred 500M USDT to Binance. Historically correlates with upcoming BTC rally.",
      metadata: {
        symbol: "USDT", amount: 500000000, usd_value: 500000000, tx_hash: "0x1b5f9d8a4c0e3267f7a1b0c4d5e9f8a2b7a1f0c3d4e9f8a1b2f0c4d7e6f9a8b1",
        from_address: "0x5754284f345afc66", from_label: "Tether Treasury", from_tag: "Issuer", from_tag_color: "info",
        to_address: "0x28c6c06298d514db", to_label: "Binance", to_tag: "Exchange", to_tag_color: "warning",
        value_usd: 500000000,
        impact_score: 9.5,
        impact_metrics: [
          { label: "USDT Market Cap", value: "$112.8B", trend: "up" },
          { label: "30d USDT Minted", value: "$2.4B", trend: "up" },
          { label: "Stablecoin Dominance", value: "72.1%", trend: "up" },
        ],
        wallet_history: [
          { type: "Mint", age: "20m ago", value: "$500M USDT" },
          { type: "Mint", age: "3d ago", value: "$1B USDT" },
          { type: "Burn", age: "5d ago", value: "$200M USDT" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 20) + 1,
        })),
        similar_wallets: [
          { label: "Circle Treasury", address: "0xcircletreasury01000", similarity: "85%" },
        ],
      },
      created_at: ago(20),
    },
    {
      user_id: PUBLIC_USER, type: "whale", severity: "high",
      title: "BTC 1,250 withdrawn from Binance",
      description: "1,250 BTC ($121.8M) withdrawn from Binance to unknown wallet. Accumulation signal — coins moving off exchange.",
      metadata: {
        symbol: "BTC", amount: 1250, usd_value: 121875000, tx_hash: "7a8b1c2d3e4f5061728394a5b6c7d8e9f0a1b2c3d4e5f6071829304a5b6c7d8e",
        from_address: "bc1qxy2kgdygjrsq", from_label: "Binance", from_tag: "Exchange", from_tag_color: "warning",
        to_address: "bc1qm34lsc65zpw79", to_label: "Unknown Wallet", to_tag: "Unknown", to_tag_color: "neutral",
        value_usd: 121875000, impact_score: 7.2,
        wallet_history: [
          { type: "Withdrawal", age: "15m ago", value: "$121.8M BTC" },
          { type: "Withdrawal", age: "2d ago", value: "$45M BTC" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 15) + 2,
        })),
      },
      created_at: ago(15),
    },
    {
      user_id: PUBLIC_USER, type: "whale", severity: "high",
      title: "SOL 1.5M deposited to Coinbase by FTX Estate",
      description: "FTX Estate liquidator moved 1.5M SOL ($210M) to Coinbase. Potential selling pressure on Solana.",
      metadata: {
        symbol: "SOL", amount: 1500000, usd_value: 210000000, tx_hash: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW",
        from_address: "FTXestateLiqSOL01", from_label: "FTX Estate", from_tag: "Liquidator", from_tag_color: "purple",
        to_address: "CoinbaseSOLhot001", to_label: "Coinbase", to_tag: "Exchange", to_tag_color: "warning",
        value_usd: 210000000, impact_score: 8.5,
        impact_metrics: [
          { label: "FTX SOL Remaining", value: "41.2M SOL", trend: "down" },
          { label: "SOL Exchange Balance", value: "+3.2%", trend: "up" },
        ],
        wallet_history: [
          { type: "Exchange Deposit", age: "6h ago", value: "$210M SOL" },
          { type: "Unstake", age: "7d ago", value: "$180M SOL" },
          { type: "Exchange Deposit", age: "14d ago", value: "$95M SOL" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 12) + 1,
        })),
        similar_wallets: [
          { label: "Galaxy Digital", address: "GalaxyDigitalSOL0001", similarity: "76%" },
        ],
      },
      created_at: ago(360),
    },
    // Risk alerts
    {
      user_id: PUBLIC_USER, type: "risk", severity: "high",
      title: "Jupiter TVL dropped 12.5% in 24h",
      description: "Jupiter DEX TVL fell from $2.4B to $2.1B (-12.5%). Possible liquidity migration or protocol concern.",
      metadata: {
        protocol: "Jupiter", tvl_before: 2400000000, tvl_after: 2100000000, change_pct: -12.5, category: "DEX", chains: ["Solana"],
        impact_score: 7.6,
        impact_metrics: [
          { label: "Jupiter TVL", value: "$2.1B", trend: "down" },
          { label: "Solana DeFi TVL", value: "$8.9B", trend: "down" },
          { label: "DEX Volume 24h", value: "$892M", trend: "down" },
        ],
        protocol_stats: [
          { label: "TVL", value: "$2.1B" },
          { label: "TVL Change 24h", value: "-12.5%" },
          { label: "Users 24h", value: "184,230" },
          { label: "Revenue 24h", value: "$1.42M" },
          { label: "Chains", value: "Solana" },
          { label: "Audit Score", value: "8.5/10" },
        ],
        risk_factors: [
          { name: "TVL Volatility", score: 7, max_score: 10, description: "TVL dropped 12.5% in 24h indicating significant capital outflow" },
          { name: "Concentration Risk", score: 6, max_score: 10, description: "Single-chain deployment on Solana increases ecosystem risk" },
          { name: "Smart Contract Risk", score: 3, max_score: 10, description: "Multiple audits completed, no critical findings" },
          { name: "Liquidity Depth", score: 5, max_score: 10, description: "Large LP withdrawals reducing available liquidity" },
        ],
        affected_pools: [
          { name: "SOL-USDC", tvl: "$245M", change_24h: "-18.2%" },
          { name: "JUP-SOL", tvl: "$89M", change_24h: "-22.4%" },
          { name: "JUP-USDC", tvl: "$67M", change_24h: "-15.8%" },
          { name: "mSOL-SOL", tvl: "$156M", change_24h: "-8.3%" },
        ],
        similar_incidents: [
          { protocol: "Raydium", date: "2025-11-15", change: "-15.2%", recovery_days: 8 },
          { protocol: "Orca", date: "2025-09-22", change: "-10.8%", recovery_days: 5 },
          { protocol: "Jupiter", date: "2025-07-03", change: "-9.1%", recovery_days: 4 },
        ],
        wallet_history: [
          { type: "TVL Drop", age: "6h ago", value: "-$140M" },
          { type: "TVL Drop", age: "12h ago", value: "-$92M" },
          { type: "TVL Stable", age: "1d ago", value: "+$12M" },
          { type: "TVL Growth", age: "3d ago", value: "+$85M" },
          { type: "TVL Growth", age: "5d ago", value: "+$42M" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 18) + 2,
        })),
        similar_wallets: [
          { label: "Raydium", address: "RAY1111111111111111111111", similarity: "91%" },
          { label: "Orca", address: "ORCA111111111111111111111", similarity: "86%" },
          { label: "Marinade Finance", address: "MNDE111111111111111111111", similarity: "79%" },
        ],
      },
      created_at: ago(180),
    },
    {
      user_id: PUBLIC_USER, type: "risk", severity: "critical",
      title: "USDD peg deviation detected: $0.9845 (-1.55%)",
      description: "USDD trading at $0.9845, deviating 1.55% from $1.00 peg. Monitor for further depeg risk.",
      metadata: {
        stablecoin: "USDD", current_price: 0.9845, peg_deviation: -1.55, is_depegged: true,
        impact_score: 8.8,
        impact_metrics: [
          { label: "USDD Price", value: "$0.9845", trend: "down" },
          { label: "Peg Deviation", value: "-1.55%", trend: "down" },
          { label: "USDD Market Cap", value: "$725M", trend: "down" },
        ],
        protocol_stats: [
          { label: "USDD Price", value: "$0.9845" },
          { label: "Market Cap", value: "$725M" },
          { label: "Collateral Ratio", value: "198.5%" },
          { label: "TRX Backing", value: "$1.44B" },
          { label: "Chains", value: "Tron, Ethereum, BSC" },
          { label: "24h Volume", value: "$42.8M" },
        ],
        risk_factors: [
          { name: "Peg Stability", score: 8, max_score: 10, description: "1.55% deviation from $1.00 peg exceeds normal 0.5% threshold" },
          { name: "Collateral Transparency", score: 7, max_score: 10, description: "Collateral composition not fully verifiable on-chain" },
          { name: "Algorithmic Risk", score: 9, max_score: 10, description: "Partially algorithmic mechanism increases depeg vulnerability" },
          { name: "Liquidity Depth", score: 6, max_score: 10, description: "DEX liquidity thinning as LPs exit during depeg" },
        ],
        affected_pools: [
          { name: "USDD-USDT (Curve)", tvl: "$42M", change_24h: "-32.5%" },
          { name: "USDD-3CRV (Curve)", tvl: "$18M", change_24h: "-28.1%" },
          { name: "USDD-BUSD (PancakeSwap)", tvl: "$8.5M", change_24h: "-19.4%" },
        ],
        wallet_history: [
          { type: "Depeg Alert", age: "4h ago", value: "$0.9845 (-1.55%)" },
          { type: "Peg Deviation", age: "8h ago", value: "$0.9912 (-0.88%)" },
          { type: "Large Sell", age: "12h ago", value: "$8.2M USDD sold" },
          { type: "LP Withdrawal", age: "1d ago", value: "$15M from Curve" },
          { type: "Stable", age: "3d ago", value: "$0.9998 (normal)" },
        ],
        similar_incidents: [
          { protocol: "UST (Terra)", date: "2022-05-09", change: "-99.0%", recovery_days: 0 },
          { protocol: "USDD", date: "2025-06-18", change: "-2.8%", recovery_days: 3 },
          { protocol: "FRAX", date: "2025-03-12", change: "-1.2%", recovery_days: 1 },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 10) + 1,
        })),
      },
      created_at: ago(240),
    },
    {
      user_id: PUBLIC_USER, type: "risk", severity: "medium",
      title: "Aave V3 TVL declined 5.8% in 24h",
      description: "Aave V3 experienced $890M TVL outflow across Ethereum and Arbitrum. Market-wide deleveraging observed.",
      metadata: {
        protocol: "Aave", tvl_change: -5.8, outflow_usd: 890000000, chains: ["Ethereum", "Arbitrum"],
        impact_score: 6.5,
        impact_metrics: [
          { label: "Aave V3 TVL", value: "$14.5B", trend: "down" },
          { label: "24h Outflow", value: "$890M", trend: "down" },
          { label: "Utilization Rate", value: "68.2%", trend: "down" },
        ],
        protocol_stats: [
          { label: "TVL", value: "$14.5B" },
          { label: "TVL Change 24h", value: "-5.8%" },
          { label: "Users 24h", value: "12,840" },
          { label: "Revenue 24h", value: "$2.18M" },
          { label: "Chains", value: "Ethereum, Arbitrum, Polygon, Optimism, Avalanche, Base" },
          { label: "Audit Score", value: "9.2/10" },
        ],
        risk_factors: [
          { name: "TVL Outflow", score: 6, max_score: 10, description: "$890M outflow in 24h indicating deleveraging trend" },
          { name: "Utilization Risk", score: 5, max_score: 10, description: "Borrowing utilization declining as users deleverage" },
          { name: "Smart Contract Risk", score: 2, max_score: 10, description: "Extensively audited protocol with strong security track record" },
          { name: "Market Correlation", score: 7, max_score: 10, description: "TVL decline correlated with broader market downturn" },
        ],
        affected_pools: [
          { name: "WETH Supply (Ethereum)", tvl: "$5.8B", change_24h: "-6.2%" },
          { name: "USDC Supply (Ethereum)", tvl: "$3.2B", change_24h: "-4.8%" },
          { name: "WBTC Supply (Ethereum)", tvl: "$1.9B", change_24h: "-7.1%" },
          { name: "WETH Supply (Arbitrum)", tvl: "$890M", change_24h: "-5.4%" },
          { name: "DAI Supply (Ethereum)", tvl: "$1.1B", change_24h: "-3.9%" },
        ],
        similar_incidents: [
          { protocol: "Aave V3", date: "2025-10-12", change: "-8.2%", recovery_days: 6 },
          { protocol: "Compound", date: "2025-08-05", change: "-6.5%", recovery_days: 4 },
          { protocol: "Morpho", date: "2025-11-28", change: "-4.1%", recovery_days: 3 },
        ],
        wallet_history: [
          { type: "Large Withdrawal", age: "3h ago", value: "$142M WETH" },
          { type: "Large Withdrawal", age: "6h ago", value: "$98M USDC" },
          { type: "Repayment", age: "8h ago", value: "$210M DAI" },
          { type: "Liquidation", age: "12h ago", value: "$18.5M" },
          { type: "Deposit", age: "1d ago", value: "$55M WBTC" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 15) + 3,
        })),
      },
      created_at: ago(300),
    },
    {
      user_id: PUBLIC_USER, type: "risk", severity: "high",
      title: "Curve Finance pool imbalance detected",
      description: "Curve 3pool USDT/USDC/DAI ratio shifted to 45/30/25. USDT overweight suggests potential selling pressure.",
      metadata: {
        protocol: "Curve Finance", pool: "3pool",
        ratio: { USDT: 45, USDC: 30, DAI: 25 }, normal_ratio: { USDT: 33, USDC: 33, DAI: 34 },
        impact_score: 7.4,
        impact_metrics: [
          { label: "USDT Weight", value: "45%", trend: "up" },
          { label: "Pool TVL", value: "$890M", trend: "down" },
          { label: "Imbalance Score", value: "7.4/10", trend: "up" },
        ],
        protocol_stats: [
          { label: "TVL", value: "$2.8B" },
          { label: "TVL Change 24h", value: "-3.5%" },
          { label: "Users 24h", value: "8,420" },
          { label: "Revenue 24h", value: "$380K" },
          { label: "Chains", value: "Ethereum, Arbitrum, Polygon, Avalanche" },
          { label: "Audit Score", value: "8.8/10" },
        ],
        risk_factors: [
          { name: "Pool Imbalance", score: 7, max_score: 10, description: "USDT overweight at 45% vs 33% target — USDT selling pressure" },
          { name: "Peg Risk", score: 6, max_score: 10, description: "Imbalance may indicate market concerns about one of the stablecoins" },
          { name: "Slippage Impact", score: 5, max_score: 10, description: "Large trades experience increased slippage due to imbalance" },
        ],
        affected_pools: [
          { name: "3pool (USDT/USDC/DAI)", tvl: "$890M", change_24h: "-3.8%" },
          { name: "FRAX-3CRV", tvl: "$156M", change_24h: "-2.1%" },
          { name: "USDD-3CRV", tvl: "$42M", change_24h: "-32.5%" },
          { name: "crvUSD-USDC", tvl: "$178M", change_24h: "-0.8%" },
        ],
        similar_incidents: [
          { protocol: "Curve 3pool", date: "2025-08-14", change: "USDT 48%", recovery_days: 2 },
          { protocol: "Curve 3pool", date: "2023-03-11", change: "USDC 60%", recovery_days: 4 },
        ],
        wallet_history: [
          { type: "Large USDT Deposit", age: "2h ago", value: "$45M USDT added" },
          { type: "USDC Withdrawal", age: "4h ago", value: "$32M USDC removed" },
          { type: "Arbitrage", age: "6h ago", value: "$8.5M swap" },
          { type: "DAI Withdrawal", age: "10h ago", value: "$18M DAI removed" },
          { type: "Pool Rebalance", age: "2d ago", value: "Ratio normalized" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 12) + 2,
        })),
      },
      created_at: ago(420),
    },
    {
      user_id: PUBLIC_USER, type: "risk", severity: "medium",
      title: "Lido stETH/ETH ratio at 0.9982 (-0.18%)",
      description: "Lido staked ETH slight discount vs ETH. Within normal range but monitoring for trend.",
      metadata: {
        protocol: "Lido", ratio: 0.9982, deviation: -0.18,
        impact_score: 4.2,
        impact_metrics: [
          { label: "stETH/ETH Ratio", value: "0.9982", trend: "down" },
          { label: "Deviation", value: "-0.18%", trend: "down" },
          { label: "Lido TVL", value: "$32.8B", trend: "neutral" },
        ],
        protocol_stats: [
          { label: "TVL", value: "$32.8B" },
          { label: "TVL Change 24h", value: "+1.2%" },
          { label: "Staked ETH", value: "9.4M ETH" },
          { label: "Staking APR", value: "3.8%" },
          { label: "Validators", value: "283,000" },
          { label: "Audit Score", value: "9.5/10" },
        ],
        risk_factors: [
          { name: "Peg Deviation", score: 3, max_score: 10, description: "-0.18% deviation within normal range but worth monitoring" },
          { name: "Liquidity Depth", score: 2, max_score: 10, description: "Deep liquidity in Curve stETH-ETH pool supports peg" },
          { name: "Withdrawal Queue", score: 4, max_score: 10, description: "Withdrawal queue length slightly above average" },
          { name: "Concentration Risk", score: 5, max_score: 10, description: "Lido holds 28.5% of all staked ETH — dominance concern" },
        ],
        affected_pools: [
          { name: "stETH-ETH (Curve)", tvl: "$1.2B", change_24h: "+1.2%" },
          { name: "wstETH-WETH (Uniswap)", tvl: "$234M", change_24h: "-0.5%" },
          { name: "wstETH-WETH (Balancer)", tvl: "$312M", change_24h: "+0.2%" },
        ],
        similar_incidents: [
          { protocol: "Lido", date: "2025-09-04", change: "-0.45%", recovery_days: 1 },
          { protocol: "Lido", date: "2024-06-15", change: "-1.2%", recovery_days: 3 },
          { protocol: "Rocket Pool (rETH)", date: "2025-07-22", change: "-0.32%", recovery_days: 1 },
        ],
        wallet_history: [
          { type: "Ratio Dip", age: "8h ago", value: "0.9982 (-0.18%)" },
          { type: "Large Unstake", age: "12h ago", value: "5,200 stETH" },
          { type: "Ratio Stable", age: "1d ago", value: "0.9998 (normal)" },
          { type: "Large Stake", age: "2d ago", value: "12,000 ETH" },
          { type: "Ratio Recovery", age: "5d ago", value: "0.9995 from 0.9988" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 8) + 1,
        })),
      },
      created_at: ago(480),
    },
    // Signal alerts
    {
      user_id: PUBLIC_USER, type: "price_signal", severity: "high",
      title: "BTC — Oversold Bounce (92% confidence)",
      description: "7일 연속 하락 후 RSI 25 진입. 과매도 반등 가능성 높음. 200일 이동평균 지지.",
      metadata: {
        signal_type: "buy", signal_name: "Oversold Bounce", confidence: 92, timeframe: "1D", price_at_signal: 95200,
        token_symbol: "BTC", token_name: "Bitcoin",
        current_price: 95800, price_change_24h: -2.4, price_change_7d: -12.8,
        market_cap: 1890000000000, volume_24h: 42500000000,
        indicators: { rsi_14: 25, macd: "bullish_cross" },
        impact_score: 8.5,
        impact_metrics: [
          { label: "RSI (14)", value: "25", trend: "down" },
          { label: "MACD Signal", value: "Bullish Cross", trend: "up" },
          { label: "200 SMA Distance", value: "-2.1%", trend: "neutral" },
        ],
        technical_indicators: [
          { name: "RSI (14)", value: "25.3", signal: "Oversold", description: "Deeply oversold territory, historically strong bounce zone" },
          { name: "MACD (12,26,9)", value: "Bullish Cross", signal: "Buy", description: "MACD line crossing above signal line after extended decline" },
          { name: "Bollinger Bands", value: "Lower Band Touch", signal: "Buy", description: "Price touching lower Bollinger Band at $94,800" },
          { name: "Volume Profile", value: "+180%", signal: "Confirming", description: "Volume surge on bounce confirms buying interest" },
          { name: "OBV", value: "Divergence", signal: "Buy", description: "On-balance volume rising while price makes new low" },
          { name: "Support Level", value: "$94,500", signal: "Strong", description: "200-day SMA providing strong dynamic support" },
        ],
        key_levels: [
          { type: "support", price: 94500, label: "200 SMA" },
          { type: "support", price: 92000, label: "Previous swing low" },
          { type: "resistance", price: 98500, label: "20 SMA" },
          { type: "resistance", price: 103400, label: "Recent high" },
        ],
        confidence_factors: [
          { factor: "RSI Oversold", weight: 30, contribution: "positive" },
          { factor: "MACD Bullish Cross", weight: 25, contribution: "positive" },
          { factor: "200 SMA Support", weight: 20, contribution: "positive" },
          { factor: "Volume Confirmation", weight: 15, contribution: "positive" },
          { factor: "Macro Uncertainty", weight: 10, contribution: "negative" },
        ],
        wallet_history: [
          { type: "Buy Signal", age: "2h ago", value: "RSI 25 — Oversold" },
          { type: "Sell Signal", age: "6d ago", value: "RSI 72 — Distribution" },
          { type: "Buy Signal", age: "24d ago", value: "RSI 32 — Accumulation" },
          { type: "Neutral", age: "30d ago", value: "RSI 48 — Range" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 20) + 5,
        })),
        similar_wallets: [
          { label: "ETH (Correlated)", address: "ethereum", similarity: "94%" },
          { label: "SOL (Correlated)", address: "solana", similarity: "87%" },
          { label: "BNB (Correlated)", address: "binancecoin", similarity: "81%" },
        ],
      },
      created_at: ago(120),
    },
    {
      user_id: PUBLIC_USER, type: "price_signal", severity: "high",
      title: "SOL — Momentum Shift (90% confidence)",
      description: "24h -8.5% 급락 후 강한 반등 시작. 거래량 300% 급증 + MACD 골든크로스.",
      metadata: {
        signal_type: "buy", signal_name: "Momentum Shift", confidence: 90, timeframe: "1D", price_at_signal: 138,
        token_symbol: "SOL", token_name: "Solana",
        current_price: 140.5, price_change_24h: -8.5, price_change_7d: -5.2,
        market_cap: 64200000000, volume_24h: 8900000000,
        indicators: { volume_spike: 300, macd: "golden_cross" },
        impact_score: 8.2,
        impact_metrics: [
          { label: "Volume Spike", value: "+300%", trend: "up" },
          { label: "MACD", value: "Golden Cross", trend: "up" },
          { label: "24h Change", value: "-8.5%", trend: "down" },
        ],
        technical_indicators: [
          { name: "RSI (14)", value: "32.1", signal: "Oversold", description: "Approaching oversold zone after sharp decline" },
          { name: "MACD (12,26,9)", value: "Golden Cross", signal: "Buy", description: "MACD line crossing signal line upward with momentum" },
          { name: "Volume", value: "+300%", signal: "Strong Buy", description: "Massive volume spike indicating institutional interest" },
          { name: "Stochastic RSI", value: "12.4", signal: "Oversold", description: "Stochastic RSI deeply oversold, reversal likely" },
          { name: "EMA 50/200", value: "Convergence", signal: "Neutral", description: "50 EMA approaching 200 EMA — watch for crossover" },
        ],
        key_levels: [
          { type: "support", price: 130, label: "Key horizontal support" },
          { type: "support", price: 125, label: "200-day SMA" },
          { type: "resistance", price: 148, label: "Previous breakdown level" },
          { type: "resistance", price: 155, label: "Recent swing high" },
        ],
        confidence_factors: [
          { factor: "Volume Spike +300%", weight: 35, contribution: "positive" },
          { factor: "MACD Golden Cross", weight: 25, contribution: "positive" },
          { factor: "Solana DeFi TVL Growth", weight: 15, contribution: "positive" },
          { factor: "Broader Market Weakness", weight: 15, contribution: "negative" },
          { factor: "FTX Estate Selling", weight: 10, contribution: "negative" },
        ],
        wallet_history: [
          { type: "Buy Signal", age: "30m ago", value: "Momentum Shift detected" },
          { type: "Volume Alert", age: "2h ago", value: "+300% volume spike" },
          { type: "Sell Signal", age: "4d ago", value: "Breakdown below $148" },
          { type: "Buy Signal", age: "12d ago", value: "RSI oversold bounce" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 22) + 3,
        })),
      },
      created_at: ago(30),
    },
    {
      user_id: PUBLIC_USER, type: "price_signal", severity: "medium",
      title: "ETH — Strong Support (88% confidence)",
      description: "ETH $3,400 지지선 3번째 테스트 성공. 거래량 200% 증가.",
      metadata: {
        signal_type: "buy", signal_name: "Strong Support", confidence: 88, timeframe: "1D", price_at_signal: 3420,
        token_symbol: "ETH", token_name: "Ethereum",
        current_price: 3450, price_change_24h: 1.2, price_change_7d: -3.8,
        market_cap: 415000000000, volume_24h: 18500000000,
        impact_score: 7.5,
        impact_metrics: [
          { label: "Support Tests", value: "3x held", trend: "up" },
          { label: "Volume Change", value: "+200%", trend: "up" },
          { label: "ETH Staking Rate", value: "27.2%", trend: "up" },
        ],
        technical_indicators: [
          { name: "RSI (14)", value: "38.5", signal: "Neutral-Low", description: "RSI recovering from oversold, upside potential" },
          { name: "Support Level", value: "$3,400", signal: "Strong", description: "Triple-tested support holding with increasing volume" },
          { name: "MACD (12,26,9)", value: "Flattening", signal: "Neutral", description: "MACD histogram flattening, potential bullish divergence" },
          { name: "Bollinger Bands", value: "Lower Band", signal: "Buy", description: "Price bouncing off lower Bollinger Band" },
          { name: "Volume Profile", value: "+200%", signal: "Confirming", description: "Volume doubling on each support test confirms demand" },
          { name: "OBV", value: "Rising", signal: "Buy", description: "On-balance volume trending up despite price consolidation" },
        ],
        key_levels: [
          { type: "support", price: 3400, label: "Triple-tested support" },
          { type: "support", price: 3200, label: "200-day SMA" },
          { type: "resistance", price: 3600, label: "50-day SMA" },
          { type: "resistance", price: 3850, label: "Previous local high" },
        ],
        confidence_factors: [
          { factor: "Triple Support Test", weight: 30, contribution: "positive" },
          { factor: "Volume Confirmation", weight: 25, contribution: "positive" },
          { factor: "ETH Staking Demand", weight: 20, contribution: "positive" },
          { factor: "DeFi TVL Recovery", weight: 15, contribution: "positive" },
          { factor: "Macro Risk", weight: 10, contribution: "negative" },
        ],
        wallet_history: [
          { type: "Buy Signal", age: "1h ago", value: "$3,400 support held (3rd test)" },
          { type: "Volume Alert", age: "3h ago", value: "+200% volume on bounce" },
          { type: "Support Test", age: "2d ago", value: "$3,402 (2nd test, held)" },
          { type: "Support Test", age: "5d ago", value: "$3,398 (1st test, held)" },
          { type: "Sell Signal", age: "8d ago", value: "Breakdown from $3,680" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 18) + 4,
        })),
      },
      created_at: ago(60),
    },
    {
      user_id: PUBLIC_USER, type: "price_signal", severity: "medium",
      title: "APT — Strong Downtrend (78% confidence)",
      description: "Sustained decline: 24h -3.2%, 7d -8.5%.",
      metadata: {
        signal_type: "sell", signal_name: "Strong Downtrend", confidence: 78, timeframe: "1D", price_at_signal: 8.9,
        token_symbol: "APT", token_name: "Aptos",
        current_price: 8.62, price_change_24h: -3.2, price_change_7d: -8.5,
        market_cap: 3850000000, volume_24h: 245000000,
        impact_score: 6.8,
        impact_metrics: [
          { label: "24h Change", value: "-3.2%", trend: "down" },
          { label: "7d Change", value: "-8.5%", trend: "down" },
          { label: "Volume", value: "+45%", trend: "up" },
        ],
        technical_indicators: [
          { name: "RSI (14)", value: "34.2", signal: "Bearish", description: "RSI declining without oversold bounce, weak momentum" },
          { name: "MACD (12,26,9)", value: "Bearish", signal: "Sell", description: "MACD deep in negative territory, no reversal sign" },
          { name: "EMA 20/50", value: "Death Cross", signal: "Sell", description: "20 EMA crossed below 50 EMA confirming downtrend" },
          { name: "Volume", value: "+45%", signal: "Confirming", description: "Increasing volume on down moves confirms selling pressure" },
          { name: "ADX", value: "38.5", signal: "Strong Trend", description: "ADX above 25 confirms strong directional trend" },
        ],
        key_levels: [
          { type: "support", price: 8.20, label: "Recent low" },
          { type: "support", price: 7.50, label: "Major horizontal support" },
          { type: "resistance", price: 9.50, label: "50-day SMA" },
          { type: "resistance", price: 10.80, label: "Previous breakdown" },
        ],
        confidence_factors: [
          { factor: "EMA Death Cross", weight: 25, contribution: "negative" },
          { factor: "Declining Volume Profile", weight: 20, contribution: "negative" },
          { factor: "Move Ecosystem Slowdown", weight: 20, contribution: "negative" },
          { factor: "Token Unlock in 8 Days", weight: 20, contribution: "negative" },
          { factor: "Oversold RSI", weight: 15, contribution: "positive" },
        ],
        wallet_history: [
          { type: "Sell Signal", age: "7h ago", value: "Breakdown below $9.00" },
          { type: "Sell Signal", age: "3d ago", value: "Death Cross confirmed" },
          { type: "Neutral", age: "8d ago", value: "Range-bound $9.50-$10.20" },
          { type: "Buy Signal", age: "18d ago", value: "RSI bounce at $9.80" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 14) + 2,
        })),
      },
      created_at: ago(420),
    },
    {
      user_id: PUBLIC_USER, type: "price_signal", severity: "high",
      title: "ARB — L2 Dominance (85% confidence)",
      description: "Arbitrum L2 TVL 점유율 45% 돌파. DEX 거래량 120% 급증.",
      metadata: {
        signal_type: "buy", signal_name: "L2 Dominance", confidence: 85, timeframe: "1D", price_at_signal: 1.15,
        token_symbol: "ARB", token_name: "Arbitrum",
        current_price: 1.18, price_change_24h: 2.8, price_change_7d: 5.4,
        market_cap: 4520000000, volume_24h: 890000000,
        impact_score: 7.8,
        impact_metrics: [
          { label: "L2 TVL Share", value: "45%", trend: "up" },
          { label: "DEX Volume Change", value: "+120%", trend: "up" },
          { label: "Sequencer Revenue", value: "$1.2M/day", trend: "up" },
        ],
        technical_indicators: [
          { name: "RSI (14)", value: "58.4", signal: "Bullish", description: "RSI in healthy uptrend range, room to run" },
          { name: "MACD (12,26,9)", value: "Bullish", signal: "Buy", description: "MACD crossing above signal line with expanding histogram" },
          { name: "Volume", value: "+120%", signal: "Strong Buy", description: "DEX volume doubling confirms L2 adoption momentum" },
          { name: "Bollinger Bands", value: "Mid-Upper", signal: "Bullish", description: "Price trending between mid and upper Bollinger Band" },
          { name: "OBV", value: "Rising", signal: "Buy", description: "On-balance volume confirming price uptrend" },
          { name: "Support/Resistance", value: "$1.10/$1.35", signal: "Bullish", description: "Clean range with price breaking mid-level" },
        ],
        key_levels: [
          { type: "support", price: 1.10, label: "Recent breakout level" },
          { type: "support", price: 0.98, label: "200-day SMA" },
          { type: "resistance", price: 1.35, label: "Previous high" },
          { type: "resistance", price: 1.50, label: "Key psychological level" },
        ],
        confidence_factors: [
          { factor: "L2 TVL Dominance 45%", weight: 30, contribution: "positive" },
          { factor: "DEX Volume +120%", weight: 25, contribution: "positive" },
          { factor: "Sequencer Revenue Growth", weight: 15, contribution: "positive" },
          { factor: "ARB Token Unlock in 5 Days", weight: 20, contribution: "negative" },
          { factor: "Overall L2 Sector Momentum", weight: 10, contribution: "positive" },
        ],
        wallet_history: [
          { type: "Buy Signal", age: "3h ago", value: "L2 dominance breakout" },
          { type: "Volume Alert", age: "8h ago", value: "DEX volume +120%" },
          { type: "Neutral", age: "3d ago", value: "Consolidation at $1.10" },
          { type: "Sell Signal", age: "12d ago", value: "Unlock concern dip" },
          { type: "Buy Signal", age: "20d ago", value: "TVL milestone hit" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 16) + 4,
        })),
      },
      created_at: ago(180),
    },
    {
      user_id: PUBLIC_USER, type: "price_signal", severity: "medium",
      title: "FET — AI Token Leader (86% confidence)",
      description: "AI 토큰 섹터 리더. ASI 토큰 합병 기대감 + 실사용 증가.",
      metadata: {
        signal_type: "buy", signal_name: "AI Token Leader", confidence: 86, timeframe: "1D", price_at_signal: 2.3,
        token_symbol: "FET", token_name: "Fetch.ai",
        current_price: 2.38, price_change_24h: 4.2, price_change_7d: 12.5,
        market_cap: 6120000000, volume_24h: 1250000000,
        impact_score: 7.2,
        impact_metrics: [
          { label: "AI Sector Rank", value: "#1", trend: "up" },
          { label: "ASI Merger Progress", value: "On Track", trend: "up" },
          { label: "Usage Growth", value: "+45%", trend: "up" },
        ],
        technical_indicators: [
          { name: "RSI (14)", value: "62.8", signal: "Bullish", description: "Healthy momentum without being overbought" },
          { name: "MACD (12,26,9)", value: "Bullish Expansion", signal: "Buy", description: "MACD histogram expanding, strong upward momentum" },
          { name: "Volume", value: "+85%", signal: "Confirming", description: "Above-average volume confirming price trend" },
          { name: "EMA 20/50", value: "Golden Cross", signal: "Buy", description: "20 EMA above 50 EMA with widening spread" },
          { name: "Bollinger Bands", value: "Upper Half", signal: "Bullish", description: "Price riding upper Bollinger Band in trend mode" },
          { name: "Support/Resistance", value: "$2.10/$2.80", signal: "Bullish", description: "Price above key support with clear path to $2.80" },
        ],
        key_levels: [
          { type: "support", price: 2.10, label: "20-day EMA" },
          { type: "support", price: 1.85, label: "50-day SMA" },
          { type: "resistance", price: 2.80, label: "Previous high" },
          { type: "resistance", price: 3.20, label: "All-time resistance zone" },
        ],
        confidence_factors: [
          { factor: "AI Sector Leader (#1)", weight: 30, contribution: "positive" },
          { factor: "ASI Token Merger Catalyst", weight: 25, contribution: "positive" },
          { factor: "Real-World Usage Growth +45%", weight: 20, contribution: "positive" },
          { factor: "Sector Rotation Risk", weight: 15, contribution: "negative" },
          { factor: "Overall Crypto Sentiment", weight: 10, contribution: "positive" },
        ],
        wallet_history: [
          { type: "Buy Signal", age: "6h ago", value: "AI sector breakout" },
          { type: "Volume Alert", age: "1d ago", value: "+85% volume surge" },
          { type: "Neutral", age: "5d ago", value: "Consolidation at $2.10" },
          { type: "Buy Signal", age: "14d ago", value: "ASI merger news" },
          { type: "Sell Signal", age: "22d ago", value: "Sector rotation dip" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 20) + 5,
        })),
      },
      created_at: ago(360),
    },
    // Token unlock alerts
    {
      user_id: PUBLIC_USER, type: "token_unlock", severity: "high",
      title: "OP unlock TOMORROW — 31.3M tokens ($65.2M)",
      description: "31,340,000 OP tokens ($65.2M) unlocking tomorrow. 2.9% of circulating supply. Category: Investor.",
      metadata: {
        token_symbol: "OP", amount: 31340000, usd_value: 65200000, percent_of_supply: 2.9, category: "investor", days_until: 1,
        unlock_date: future(1),
        vesting_type: "Investor Vesting",
        impact_score: 8.1,
        impact_metrics: [
          { label: "Unlock Value", value: "$65.2M", trend: "neutral" },
          { label: "Supply Impact", value: "2.9%", trend: "up" },
          { label: "30d Avg Volume", value: "$142M", trend: "neutral" },
        ],
        token_stats: [
          { label: "Price", value: "$2.08" },
          { label: "Market Cap", value: "$2.25B" },
          { label: "Circulating Supply", value: "1.08B OP" },
          { label: "FDV", value: "$8.94B" },
          { label: "Daily Volume", value: "$142M" },
          { label: "Exchange Reserve", value: "124M OP" },
        ],
        historical_unlocks: [
          { date: "2026-01-12", amount_usd: "$45M", price_impact: "-3.2%", recovery_days: 5 },
          { date: "2025-12-12", amount_usd: "$38M", price_impact: "-1.8%", recovery_days: 3 },
          { date: "2025-11-12", amount_usd: "$52M", price_impact: "-4.1%", recovery_days: 7 },
        ],
        upcoming_unlocks: [
          { token: "ARB", date_label: "in 5 days", amount: "1.1B tokens", usd_value: "$1.27B" },
          { token: "SUI", date_label: "in 3 days", amount: "65M tokens", usd_value: "$92.3M" },
          { token: "WLD", date_label: "in 2 days", amount: "53M tokens", usd_value: "$106M" },
        ],
        wallet_history: [
          { type: "Previous Unlock", age: "30d ago", value: "$45M (3.2% drop)" },
          { type: "Previous Unlock", age: "60d ago", value: "$38M (1.8% drop)" },
          { type: "Previous Unlock", age: "90d ago", value: "$52M (4.1% drop)" },
          { type: "Investor Sale", age: "35d ago", value: "$18M sold on Binance" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 12) + 2,
        })),
        similar_wallets: [
          { label: "ARB Unlock (5d)", address: "arbitrum", similarity: "96%" },
          { label: "SUI Unlock (3d)", address: "sui", similarity: "88%" },
          { label: "WLD Unlock (2d)", address: "worldcoin", similarity: "82%" },
        ],
      },
      created_at: ago(240),
    },
    {
      user_id: PUBLIC_USER, type: "token_unlock", severity: "critical",
      title: "ARB massive unlock in 5 days — 1.1B tokens ($1.27B)",
      description: "1,100,000,000 ARB tokens ($1.27B) unlocking in 5 days. 10.7% of circulating supply — highest impact unlock this month.",
      metadata: {
        token_symbol: "ARB", amount: 1100000000, usd_value: 1270000000, percent_of_supply: 10.7, category: "investor", days_until: 5,
        unlock_date: future(5),
        vesting_type: "Investor Vesting",
        impact_score: 9.6,
        impact_metrics: [
          { label: "Unlock Value", value: "$1.27B", trend: "neutral" },
          { label: "Supply Impact", value: "10.7%", trend: "up" },
          { label: "Prior Unlock Impact", value: "-6.2% avg", trend: "down" },
        ],
        token_stats: [
          { label: "Price", value: "$1.15" },
          { label: "Market Cap", value: "$4.52B" },
          { label: "Circulating Supply", value: "3.93B ARB" },
          { label: "FDV", value: "$11.5B" },
          { label: "Daily Volume", value: "$890M" },
          { label: "Exchange Reserve", value: "412M ARB" },
        ],
        historical_unlocks: [
          { date: "2025-12-16", amount_usd: "$920M", price_impact: "-8.4%", recovery_days: 14 },
          { date: "2025-09-16", amount_usd: "$780M", price_impact: "-6.2%", recovery_days: 10 },
          { date: "2025-06-16", amount_usd: "$650M", price_impact: "-4.8%", recovery_days: 8 },
          { date: "2025-03-16", amount_usd: "$1.1B", price_impact: "-11.5%", recovery_days: 21 },
        ],
        upcoming_unlocks: [
          { token: "OP", date_label: "TOMORROW", amount: "31.3M tokens", usd_value: "$65.2M" },
          { token: "TIA", date_label: "in 10 days", amount: "18.5M tokens", usd_value: "$170.2M" },
          { token: "SUI", date_label: "in 3 days", amount: "65M tokens", usd_value: "$92.3M" },
          { token: "STRK", date_label: "in 12 days", amount: "64M tokens", usd_value: "$38.4M" },
        ],
        wallet_history: [
          { type: "Unlock Alert", age: "2h ago", value: "$1.27B in 5 days" },
          { type: "Pre-Unlock Sell", age: "1d ago", value: "$42M ARB sold OTC" },
          { type: "Previous Unlock", age: "90d ago", value: "$920M (-8.4% impact)" },
          { type: "Previous Unlock", age: "180d ago", value: "$780M (-6.2% impact)" },
          { type: "Investor Transfer", age: "2d ago", value: "85M ARB to Binance" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 25) + 5,
        })),
      },
      created_at: ago(120),
    },
    {
      user_id: PUBLIC_USER, type: "token_unlock", severity: "medium",
      title: "STRK unlock in 12 days — 64M tokens ($38.4M)",
      description: "64,000,000 STRK tokens ($38.4M) unlocking. Starknet team allocation.",
      metadata: {
        token_symbol: "STRK", amount: 64000000, usd_value: 38400000, percent_of_supply: 3.5, category: "team", days_until: 12,
        unlock_date: future(12),
        vesting_type: "Team Allocation",
        impact_score: 6.8,
        impact_metrics: [
          { label: "Unlock Value", value: "$38.4M", trend: "neutral" },
          { label: "Supply Impact", value: "3.5%", trend: "up" },
          { label: "30d Avg Volume", value: "$85M", trend: "neutral" },
        ],
        token_stats: [
          { label: "Price", value: "$0.60" },
          { label: "Market Cap", value: "$1.1B" },
          { label: "Circulating Supply", value: "1.83B STRK" },
          { label: "FDV", value: "$6.0B" },
          { label: "Daily Volume", value: "$85M" },
          { label: "Exchange Reserve", value: "98M STRK" },
        ],
        historical_unlocks: [
          { date: "2025-12-15", amount_usd: "$42M", price_impact: "-5.1%", recovery_days: 6 },
          { date: "2025-09-15", amount_usd: "$35M", price_impact: "-3.8%", recovery_days: 4 },
          { date: "2025-06-15", amount_usd: "$28M", price_impact: "-2.5%", recovery_days: 3 },
        ],
        upcoming_unlocks: [
          { token: "OP", date_label: "TOMORROW", amount: "31.3M tokens", usd_value: "$65.2M" },
          { token: "ARB", date_label: "in 5 days", amount: "1.1B tokens", usd_value: "$1.27B" },
          { token: "APT", date_label: "in 8 days", amount: "11.3M tokens", usd_value: "$100.6M" },
          { token: "SEI", date_label: "in 15 days", amount: "150M tokens", usd_value: "$67.5M" },
        ],
        wallet_history: [
          { type: "Unlock Alert", age: "6h ago", value: "$38.4M in 12 days" },
          { type: "Team Transfer", age: "2d ago", value: "5M STRK to market maker" },
          { type: "Previous Unlock", age: "60d ago", value: "$42M (-5.1% impact)" },
          { type: "Previous Unlock", age: "150d ago", value: "$35M (-3.8% impact)" },
          { type: "Staking", age: "7d ago", value: "12M STRK staked" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 10) + 2,
        })),
      },
      created_at: ago(360),
    },
    {
      user_id: PUBLIC_USER, type: "token_unlock", severity: "medium",
      title: "APT unlock in 8 days — 11.3M tokens ($100.6M)",
      description: "11,310,000 APT tokens ($100.6M) unlocking. Core contributor vesting.",
      metadata: {
        token_symbol: "APT", amount: 11310000, usd_value: 100600000, percent_of_supply: 2.8, category: "team", days_until: 8,
        unlock_date: future(8),
        vesting_type: "Core Contributor Vesting",
        impact_score: 7.0,
        impact_metrics: [
          { label: "Unlock Value", value: "$100.6M", trend: "neutral" },
          { label: "Supply Impact", value: "2.8%", trend: "up" },
          { label: "30d Avg Volume", value: "$245M", trend: "down" },
        ],
        token_stats: [
          { label: "Price", value: "$8.90" },
          { label: "Market Cap", value: "$3.85B" },
          { label: "Circulating Supply", value: "432M APT" },
          { label: "FDV", value: "$9.12B" },
          { label: "Daily Volume", value: "$245M" },
          { label: "Exchange Reserve", value: "52M APT" },
        ],
        historical_unlocks: [
          { date: "2025-12-12", amount_usd: "$115M", price_impact: "-6.8%", recovery_days: 9 },
          { date: "2025-09-12", amount_usd: "$98M", price_impact: "-4.5%", recovery_days: 6 },
          { date: "2025-06-12", amount_usd: "$142M", price_impact: "-8.2%", recovery_days: 12 },
          { date: "2025-03-12", amount_usd: "$88M", price_impact: "-3.9%", recovery_days: 5 },
        ],
        upcoming_unlocks: [
          { token: "OP", date_label: "TOMORROW", amount: "31.3M tokens", usd_value: "$65.2M" },
          { token: "ARB", date_label: "in 5 days", amount: "1.1B tokens", usd_value: "$1.27B" },
          { token: "TIA", date_label: "in 10 days", amount: "18.5M tokens", usd_value: "$170.2M" },
          { token: "STRK", date_label: "in 12 days", amount: "64M tokens", usd_value: "$38.4M" },
        ],
        wallet_history: [
          { type: "Unlock Alert", age: "10h ago", value: "$100.6M in 8 days" },
          { type: "Contributor Sale", age: "3d ago", value: "$12M APT on Binance" },
          { type: "Previous Unlock", age: "60d ago", value: "$115M (-6.8% impact)" },
          { type: "Previous Unlock", age: "150d ago", value: "$98M (-4.5% impact)" },
          { type: "Ecosystem Grant", age: "5d ago", value: "2M APT to DeFi protocols" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 14) + 3,
        })),
      },
      created_at: ago(600),
    },
    // Liquidity alerts
    {
      user_id: PUBLIC_USER, type: "liquidity", severity: "high",
      title: "USDC-ETH pool TVL dropped 24% on Uniswap V3",
      description: "Uniswap V3 USDC-ETH pool TVL fell from $890M to $676M. Major LP withdrawal detected.",
      metadata: {
        pool: "USDC-ETH", protocol: "Uniswap V3", chain: "Ethereum",
        tvl_before: 890000000, tvl_after: 676400000, change_pct: -24,
        impact_score: 7.8,
        impact_metrics: [
          { label: "Pool TVL", value: "$676M", trend: "down" },
          { label: "LP Count", value: "-12 LPs", trend: "down" },
          { label: "Fee Revenue", value: "-18%", trend: "down" },
        ],
        pool_stats: [
          { label: "TVL", value: "$676.4M" },
          { label: "Volume 24h", value: "$245M" },
          { label: "Fee Tier", value: "0.3%" },
          { label: "APY", value: "18.5%" },
          { label: "Utilization", value: "36.2%" },
          { label: "LP Count", value: "1,842" },
        ],
        lp_activity: [
          { type: "LP Withdrawal", age: "1h ago", value: "$42M", address_label: "Jump Trading" },
          { type: "LP Withdrawal", age: "3h ago", value: "$28M", address_label: "Wintermute" },
          { type: "LP Withdrawal", age: "5h ago", value: "$65M", address_label: "Unknown Whale" },
          { type: "LP Addition", age: "8h ago", value: "$12M", address_label: "Small LP" },
          { type: "LP Withdrawal", age: "12h ago", value: "$78M", address_label: "Paradigm" },
        ],
        related_pools: [
          { name: "WETH-USDC 0.05%", dex: "Uniswap V3", tvl: "$312M", apy: "12.8%", chain: "Ethereum" },
          { name: "WETH-USDC", dex: "Aerodrome", tvl: "$156M", apy: "32.5%", chain: "Base" },
          { name: "ETH-USDC", dex: "Curve", tvl: "$89M", apy: "8.2%", chain: "Ethereum" },
          { name: "WETH-USDC", dex: "Maverick", tvl: "$89M", apy: "22.5%", chain: "Ethereum" },
        ],
        wallet_history: [
          { type: "Major LP Exit", age: "1h ago", value: "$42M removed" },
          { type: "Major LP Exit", age: "3h ago", value: "$28M removed" },
          { type: "Pool Rebalance", age: "12h ago", value: "Range adjusted" },
          { type: "TVL Stable", age: "2d ago", value: "$890M (normal)" },
          { type: "LP Addition", age: "5d ago", value: "$35M added" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 20) + 3,
        })),
        similar_wallets: [
          { label: "WETH-USDC 0.05%", address: "uniswap-v3-005", similarity: "95%" },
          { label: "WETH-USDC Aerodrome", address: "aerodrome-eth-usdc", similarity: "88%" },
          { label: "ETH-USDC Curve", address: "curve-eth-usdc", similarity: "83%" },
        ],
      },
      created_at: ago(180),
    },
    {
      user_id: PUBLIC_USER, type: "liquidity", severity: "medium",
      title: "Suspicious APY spike on Curve stETH pool (142% APY)",
      description: "Curve stETH-ETH pool APY spiked to 142% from normal 4.2%. Potential exploit or abnormal activity.",
      metadata: {
        pool: "stETH-ETH", protocol: "Curve", chain: "Ethereum", apy_current: 142, apy_normal: 4.2, tvl: 1200000000,
        impact_score: 6.5,
        impact_metrics: [
          { label: "Current APY", value: "142%", trend: "up" },
          { label: "Normal APY", value: "4.2%", trend: "neutral" },
          { label: "APY Multiplier", value: "33.8x", trend: "up" },
        ],
        pool_stats: [
          { label: "TVL", value: "$1.2B" },
          { label: "Volume 24h", value: "$380M" },
          { label: "Fee Tier", value: "0.04%" },
          { label: "APY", value: "142%" },
          { label: "Utilization", value: "89.5%" },
          { label: "LP Count", value: "3,240" },
        ],
        lp_activity: [
          { type: "Large Swap", age: "30m ago", value: "$85M stETH->ETH", address_label: "Unknown" },
          { type: "LP Addition", age: "2h ago", value: "$22M", address_label: "Yield Farmer" },
          { type: "Large Swap", age: "4h ago", value: "$120M stETH->ETH", address_label: "Institutional" },
          { type: "LP Withdrawal", age: "6h ago", value: "$45M", address_label: "Lido Insider" },
          { type: "Large Swap", age: "8h ago", value: "$62M ETH->stETH", address_label: "MEV Bot" },
        ],
        related_pools: [
          { name: "wstETH-WETH", dex: "Uniswap V3", tvl: "$234M", apy: "4.5%", chain: "Ethereum" },
          { name: "rETH-WETH", dex: "Balancer", tvl: "$312M", apy: "3.8%", chain: "Ethereum" },
          { name: "cbETH-WETH", dex: "Uniswap V3", tvl: "$234M", apy: "4.5%", chain: "Ethereum" },
        ],
        wallet_history: [
          { type: "APY Spike", age: "30m ago", value: "142% (from 4.2%)" },
          { type: "Large Swap", age: "2h ago", value: "$85M stETH->ETH" },
          { type: "Pool Imbalance", age: "4h ago", value: "stETH 62% / ETH 38%" },
          { type: "Normal APY", age: "1d ago", value: "4.2% (baseline)" },
          { type: "Stable", age: "3d ago", value: "Pool balanced 50/50" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 15) + 2,
        })),
      },
      created_at: ago(300),
    },
    {
      user_id: PUBLIC_USER, type: "liquidity", severity: "medium",
      title: "Raydium DEX volume surged 245% in 24h",
      description: "Raydium daily volume jumped from $312M to $1.07B. Solana memecoin activity driving surge.",
      metadata: {
        protocol: "Raydium", volume_before: 312000000, volume_after: 1076000000, change_pct: 245, trigger: "memecoin_activity",
        impact_score: 5.8,
        impact_metrics: [
          { label: "Volume Change", value: "+245%", trend: "up" },
          { label: "New Pools 24h", value: "+142", trend: "up" },
          { label: "Active Traders", value: "+180%", trend: "up" },
        ],
        pool_stats: [
          { label: "Total TVL", value: "$1.9B" },
          { label: "Volume 24h", value: "$1.07B" },
          { label: "Fee Tier", value: "0.25%" },
          { label: "APY (Top Pool)", value: "120.5%" },
          { label: "Utilization", value: "78.4%" },
          { label: "Active Pools", value: "2,845" },
        ],
        lp_activity: [
          { type: "New Pool", age: "15m ago", value: "NEWMEME-SOL ($2.4M)", address_label: "Token Creator" },
          { type: "LP Addition", age: "30m ago", value: "$8.5M", address_label: "Memecoin Whale" },
          { type: "LP Addition", age: "1h ago", value: "$12M", address_label: "Yield Farmer" },
          { type: "Swap", age: "2h ago", value: "$4.2M SOL->BONK", address_label: "Degen Trader" },
          { type: "LP Addition", age: "4h ago", value: "$18M", address_label: "Market Maker" },
        ],
        related_pools: [
          { name: "BONK-SOL", dex: "Raydium", tvl: "$34M", apy: "85.2%", chain: "Solana" },
          { name: "WIF-SOL", dex: "Raydium", tvl: "$28M", apy: "120.5%", chain: "Solana" },
          { name: "SOL-USDC", dex: "Raydium", tvl: "$245M", apy: "45.2%", chain: "Solana" },
          { name: "SOL-USDC", dex: "Orca", tvl: "$189M", apy: "22.8%", chain: "Solana" },
        ],
        wallet_history: [
          { type: "Volume Surge", age: "1h ago", value: "+245% daily volume" },
          { type: "New Pools", age: "4h ago", value: "142 pools created" },
          { type: "Volume Normal", age: "1d ago", value: "$312M (baseline)" },
          { type: "TVL Growth", age: "3d ago", value: "+$85M inflow" },
          { type: "Volume Spike", age: "7d ago", value: "+120% (previous surge)" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 25) + 5,
        })),
      },
      created_at: ago(60),
    },
    {
      user_id: PUBLIC_USER, type: "whale", severity: "medium",
      title: "DOGE 500M withdrawn from Robinhood",
      description: "500,000,000 DOGE ($55M) moved from Robinhood to unknown wallet. Retail accumulation pattern.",
      metadata: {
        symbol: "DOGE", amount: 500000000, usd_value: 55000000,
        from_label: "Robinhood", to_label: "Unknown Wallet",
        impact_score: 5.5,
        wallet_history: [
          { type: "Withdrawal", age: "2h ago", value: "$55M DOGE" },
          { type: "Withdrawal", age: "5d ago", value: "$22M DOGE" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 8) + 1,
        })),
      },
      created_at: ago(120),
    },
    {
      user_id: PUBLIC_USER, type: "whale", severity: "high",
      title: "BTC 6,200 moved by BlackRock iShares ETF",
      description: "BlackRock iShares Bitcoin ETF moved 6,200 BTC ($604.5M) to Coinbase Custody. Routine rebalancing.",
      metadata: {
        symbol: "BTC", amount: 6200, usd_value: 604500000,
        from_address: "bc1qblackrock001", from_label: "BlackRock iShares ETF", from_tag: "ETF", from_tag_color: "info",
        to_address: "bc1qcoinbaseCust01", to_label: "Coinbase Custody", to_tag: "Custody", to_tag_color: "success",
        value_usd: 604500000, impact_score: 8.8,
        impact_metrics: [
          { label: "ETF AUM", value: "$42.1B", trend: "up" },
          { label: "Daily Inflow", value: "+$380M", trend: "up" },
          { label: "BTC Holdings", value: "312K BTC", trend: "up" },
        ],
        wallet_history: [
          { type: "Rebalance", age: "14h ago", value: "$604.5M BTC" },
          { type: "Purchase", age: "2d ago", value: "$285M BTC" },
          { type: "Rebalance", age: "7d ago", value: "$420M BTC" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 22) + 3,
        })),
        similar_wallets: [
          { label: "Fidelity FBTC", address: "bc1qfidelity001000000000", similarity: "92%" },
          { label: "ARK 21Shares", address: "bc1qark21shares000000", similarity: "87%" },
          { label: "Bitwise BITB", address: "bc1qbitwise00100000000", similarity: "84%" },
        ],
      },
      created_at: ago(840),
    },
    {
      user_id: PUBLIC_USER, type: "risk", severity: "medium",
      title: "Maker DAI supply decreased 8.2% in 7 days",
      description: "MakerDAO DAI supply shrinking as users repay vaults. DSR rate adjustment expected.",
      metadata: {
        protocol: "MakerDAO", dai_supply_change: -8.2, current_supply: 4200000000,
        impact_score: 5.2,
        impact_metrics: [
          { label: "DAI Supply", value: "$4.2B", trend: "down" },
          { label: "DSR Rate", value: "5.0%", trend: "neutral" },
          { label: "Vault Repayments", value: "+38%", trend: "up" },
        ],
        protocol_stats: [
          { label: "DAI Supply", value: "$4.2B" },
          { label: "Supply Change 7d", value: "-8.2%" },
          { label: "Active Vaults", value: "12,450" },
          { label: "Revenue 7d", value: "$4.8M" },
          { label: "DSR Rate", value: "5.0%" },
          { label: "Audit Score", value: "9.5/10" },
        ],
        risk_factors: [
          { name: "Supply Contraction", score: 5, max_score: 10, description: "Consistent supply shrinkage as vaults are repaid" },
          { name: "Peg Stability", score: 2, max_score: 10, description: "DAI maintaining tight peg despite supply changes" },
          { name: "Governance Risk", score: 4, max_score: 10, description: "DSR rate adjustments pending governance vote" },
        ],
        affected_pools: [
          { name: "DAI-USDC (Curve)", tvl: "$312M", change_24h: "-2.1%" },
          { name: "DAI-USDT (Uniswap)", tvl: "$85M", change_24h: "-1.5%" },
        ],
        similar_incidents: [
          { protocol: "MakerDAO", date: "2025-08-20", change: "-6.5%", recovery_days: 12 },
          { protocol: "Frax", date: "2025-10-05", change: "-4.2%", recovery_days: 7 },
        ],
        wallet_history: [
          { type: "Vault Repayment", age: "2h ago", value: "$45M DAI burned" },
          { type: "DSR Withdrawal", age: "8h ago", value: "$28M DAI" },
          { type: "Vault Open", age: "1d ago", value: "$12M DAI minted" },
          { type: "Vault Repayment", age: "3d ago", value: "$65M DAI burned" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 15) + 1,
        })),
        similar_wallets: [
          { label: "Aave (Lending)", address: "aave-protocol", similarity: "88%" },
          { label: "Compound", address: "compound-protocol", similarity: "82%" },
          { label: "Spark Protocol", address: "spark-protocol", similarity: "90%" },
        ],
      },
      created_at: ago(540),
    },
    {
      user_id: PUBLIC_USER, type: "price_signal", severity: "medium",
      title: "MATIC — Polygon 2.0 Rally (87% confidence)",
      description: "Polygon 2.0 로드맵 발표 이후 네트워크 활동 급증. ZK 채택 확대.",
      metadata: {
        signal_type: "buy", signal_name: "Polygon 2.0 Rally", confidence: 87, timeframe: "1D", price_at_signal: 0.92,
        token_symbol: "MATIC", token_name: "Polygon",
        current_price: 0.96, price_change_24h: 4.3, price_change_7d: 12.1,
        market_cap: "$9.2B", volume_24h: "$580M",
        impact_score: 7.0,
        impact_metrics: [
          { label: "MATIC Price", value: "$0.96", trend: "up" },
          { label: "Network Activity", value: "+42%", trend: "up" },
          { label: "TVL Change", value: "+8.5%", trend: "up" },
        ],
        technical_indicators: [
          { name: "RSI (14)", value: "58.4", signal: "bullish", description: "Moderate bullish momentum with room to run" },
          { name: "MACD (12,26,9)", value: "Bullish", signal: "bullish", description: "MACD histogram expanding above zero line" },
          { name: "Volume Trend", value: "+180%", signal: "bullish", description: "Significant volume increase on breakout" },
          { name: "Network TPS", value: "142 tx/s", signal: "bullish", description: "Transaction throughput at 6-month high" },
        ],
        key_levels: [
          { type: "support", price: 0.88, label: "20 SMA" },
          { type: "support", price: 0.82, label: "Previous consolidation" },
          { type: "resistance", price: 1.05, label: "200 SMA" },
          { type: "resistance", price: 1.22, label: "Previous swing high" },
        ],
        confidence_factors: [
          { factor: "Catalyst (Polygon 2.0)", weight: 35, contribution: "positive" },
          { factor: "Volume Confirmation", weight: 25, contribution: "positive" },
          { factor: "Network Growth", weight: 20, contribution: "positive" },
          { factor: "Macro Headwinds", weight: 20, contribution: "negative" },
        ],
        wallet_history: [
          { type: "Buy Signal", age: "5h ago", value: "Polygon 2.0 catalyst" },
          { type: "Neutral", age: "3d ago", value: "Range-bound $0.88-$0.92" },
          { type: "Sell Signal", age: "12d ago", value: "RSI 71 — overbought" },
          { type: "Buy Signal", age: "25d ago", value: "ZK adoption news" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 18) + 3,
        })),
        similar_wallets: [
          { label: "ARB (L2 peer)", address: "arbitrum", similarity: "91%" },
          { label: "OP (L2 peer)", address: "optimism", similarity: "88%" },
          { label: "AVAX (Alt L1)", address: "avalanche", similarity: "76%" },
        ],
      },
      created_at: ago(300),
    },
    {
      user_id: PUBLIC_USER, type: "liquidity", severity: "high",
      title: "PancakeSwap BSC TVL dropped 18% after exploit rumor",
      description: "PancakeSwap V3 BSC pools experienced $240M outflow. Community reporting unverified exploit claims.",
      metadata: {
        protocol: "PancakeSwap", chain: "BSC", tvl_change: -18, outflow: 240000000,
        impact_score: 7.5,
        impact_metrics: [
          { label: "TVL Change", value: "-18%", trend: "down" },
          { label: "Outflow", value: "$240M", trend: "down" },
          { label: "Active LPs", value: "-22%", trend: "down" },
        ],
        pool_stats: [
          { label: "TVL", value: "$1.09B" },
          { label: "Volume 24h", value: "$520M" },
          { label: "Fee Tier", value: "0.25%" },
          { label: "APY Range", value: "8-45%" },
          { label: "Active LPs", value: "8,420" },
          { label: "Chain", value: "BSC" },
        ],
        lp_activity: [
          { type: "Withdrawal", age: "30m ago", value: "$85M", address_label: "Venus Protocol" },
          { type: "Withdrawal", age: "1h ago", value: "$42M", address_label: "Whale 0x8f3a" },
          { type: "Withdrawal", age: "2h ago", value: "$58M", address_label: "Alpaca Finance" },
          { type: "Addition", age: "4h ago", value: "$8M", address_label: "Small LP" },
          { type: "Withdrawal", age: "6h ago", value: "$63M", address_label: "Binance Labs" },
        ],
        related_pools: [
          { name: "CAKE-BNB", dex: "PancakeSwap V3", tvl: "$245M", apy: "32.5%", chain: "BSC" },
          { name: "USDT-BNB", dex: "PancakeSwap V3", tvl: "$189M", apy: "18.2%", chain: "BSC" },
          { name: "BNB-BUSD", dex: "Biswap", tvl: "$56M", apy: "14.8%", chain: "BSC" },
        ],
        wallet_history: [
          { type: "Mass LP Exit", age: "30m ago", value: "$85M removed" },
          { type: "Exploit Rumor", age: "1h ago", value: "Twitter reports" },
          { type: "LP Withdrawal", age: "2h ago", value: "$58M removed" },
          { type: "Normal Activity", age: "1d ago", value: "$12M added" },
          { type: "TVL Stable", age: "3d ago", value: "$1.33B (normal)" },
        ],
        activity_30d: Array.from({ length: 30 }, (_, i) => ({
          label: `D${i + 1}`,
          value: Math.floor(Math.random() * 22) + 2,
        })),
        similar_wallets: [
          { label: "Uniswap V3 BSC", address: "uniswap-bsc", similarity: "89%" },
          { label: "Biswap", address: "biswap-bsc", similarity: "85%" },
          { label: "MDEX", address: "mdex-bsc", similarity: "78%" },
        ],
      },
      created_at: ago(240),
    },
  ];

  const { data: a, error: ae } = await supabase.from("alert_events").insert(alertEvents).select("id");
  console.log(`  alert_events: ${a?.length ?? 0} rows (${ae ? "ERROR: " + ae.message : "OK"})`);

  // ── 4. TOKEN UNLOCKS (15) ──
  console.log("4/8 Inserting token_unlocks...");
  const { data: tu, error: tue } = await supabase.from("token_unlocks").insert([
    { token_symbol: "OP", token_name: "Optimism", unlock_date: future(1), amount: 31340000, usd_value_estimate: 65200000, percent_of_supply: 2.9, category: "investor", impact_score: 8 },
    { token_symbol: "ARB", token_name: "Arbitrum", unlock_date: future(5), amount: 1100000000, usd_value_estimate: 1270000000, percent_of_supply: 10.7, category: "investor", impact_score: 10 },
    { token_symbol: "APT", token_name: "Aptos", unlock_date: future(8), amount: 11310000, usd_value_estimate: 100600000, percent_of_supply: 2.8, category: "team", impact_score: 8 },
    { token_symbol: "STRK", token_name: "Starknet", unlock_date: future(12), amount: 64000000, usd_value_estimate: 38400000, percent_of_supply: 3.5, category: "team", impact_score: 6 },
    { token_symbol: "SUI", token_name: "Sui", unlock_date: future(3), amount: 65000000, usd_value_estimate: 92300000, percent_of_supply: 2.1, category: "investor", impact_score: 8 },
    { token_symbol: "TIA", token_name: "Celestia", unlock_date: future(10), amount: 18500000, usd_value_estimate: 170200000, percent_of_supply: 5.4, category: "investor", impact_score: 9 },
    { token_symbol: "SEI", token_name: "Sei", unlock_date: future(15), amount: 150000000, usd_value_estimate: 67500000, percent_of_supply: 4.2, category: "ecosystem", impact_score: 7 },
    { token_symbol: "PYTH", token_name: "Pyth Network", unlock_date: future(7), amount: 250000000, usd_value_estimate: 87500000, percent_of_supply: 3.8, category: "ecosystem", impact_score: 7 },
    { token_symbol: "JTO", token_name: "Jito", unlock_date: future(20), amount: 25000000, usd_value_estimate: 62500000, percent_of_supply: 6.1, category: "investor", impact_score: 8 },
    { token_symbol: "WLD", token_name: "Worldcoin", unlock_date: future(2), amount: 53000000, usd_value_estimate: 106000000, percent_of_supply: 4.5, category: "team", impact_score: 8 },
    { token_symbol: "DYDX", token_name: "dYdX", unlock_date: future(18), amount: 33000000, usd_value_estimate: 82500000, percent_of_supply: 3.9, category: "investor", impact_score: 7 },
    { token_symbol: "IMX", token_name: "Immutable X", unlock_date: future(14), amount: 45000000, usd_value_estimate: 58500000, percent_of_supply: 2.7, category: "ecosystem", impact_score: 6 },
    { token_symbol: "MANTA", token_name: "Manta Network", unlock_date: future(25), amount: 120000000, usd_value_estimate: 96000000, percent_of_supply: 8.2, category: "investor", impact_score: 9 },
    { token_symbol: "PIXEL", token_name: "Pixels", unlock_date: future(6), amount: 80000000, usd_value_estimate: 16000000, percent_of_supply: 5.0, category: "team", impact_score: 6 },
    { token_symbol: "ALT", token_name: "AltLayer", unlock_date: future(22), amount: 200000000, usd_value_estimate: 52000000, percent_of_supply: 7.5, category: "investor", impact_score: 8 },
  ]).select("id");
  console.log(`  token_unlocks: ${tu?.length ?? 0} rows (${tue ? "ERROR: " + tue.message : "OK"})`);

  // ── 5. DEFI PROTOCOLS (20) ──
  console.log("5/8 Inserting defi_protocols...");
  const { data: dp, error: dpe } = await supabase.from("defi_protocols").insert([
    { protocol_name: "Lido", slug: "lido", tvl: 32800000000, tvl_change_24h: 1.2, tvl_change_7d: 3.4, category: "Liquid Staking", chains: ["Ethereum", "Polygon", "Solana"], last_updated: new Date().toISOString() },
    { protocol_name: "Aave", slug: "aave", tvl: 18200000000, tvl_change_24h: -5.8, tvl_change_7d: -2.1, category: "Lending", chains: ["Ethereum", "Arbitrum", "Polygon", "Optimism", "Avalanche", "Base"], last_updated: new Date().toISOString() },
    { protocol_name: "MakerDAO", slug: "makerdao", tvl: 8900000000, tvl_change_24h: -1.4, tvl_change_7d: -8.2, category: "CDP", chains: ["Ethereum"], last_updated: new Date().toISOString() },
    { protocol_name: "EigenLayer", slug: "eigenlayer", tvl: 14500000000, tvl_change_24h: 2.8, tvl_change_7d: 5.6, category: "Restaking", chains: ["Ethereum"], last_updated: new Date().toISOString() },
    { protocol_name: "Uniswap", slug: "uniswap", tvl: 6200000000, tvl_change_24h: 0.8, tvl_change_7d: 1.5, category: "DEX", chains: ["Ethereum", "Arbitrum", "Polygon", "Optimism", "Base", "BSC"], last_updated: new Date().toISOString() },
    { protocol_name: "Rocket Pool", slug: "rocket-pool", tvl: 4800000000, tvl_change_24h: -0.3, tvl_change_7d: 0.9, category: "Liquid Staking", chains: ["Ethereum"], last_updated: new Date().toISOString() },
    { protocol_name: "Compound", slug: "compound", tvl: 3200000000, tvl_change_24h: -2.1, tvl_change_7d: -3.8, category: "Lending", chains: ["Ethereum", "Arbitrum", "Base"], last_updated: new Date().toISOString() },
    { protocol_name: "Curve Finance", slug: "curve-finance", tvl: 2800000000, tvl_change_24h: -3.5, tvl_change_7d: -6.2, category: "DEX", chains: ["Ethereum", "Arbitrum", "Polygon", "Avalanche"], last_updated: new Date().toISOString() },
    { protocol_name: "Jupiter", slug: "jupiter", tvl: 2100000000, tvl_change_24h: -12.5, tvl_change_7d: -8.9, category: "DEX", chains: ["Solana"], last_updated: new Date().toISOString() },
    { protocol_name: "Raydium", slug: "raydium", tvl: 1900000000, tvl_change_24h: 4.2, tvl_change_7d: 12.8, category: "DEX", chains: ["Solana"], last_updated: new Date().toISOString() },
    { protocol_name: "PancakeSwap", slug: "pancakeswap", tvl: 2600000000, tvl_change_24h: -18.0, tvl_change_7d: -14.5, category: "DEX", chains: ["BSC", "Ethereum", "Arbitrum"], last_updated: new Date().toISOString() },
    { protocol_name: "Jito", slug: "jito", tvl: 3500000000, tvl_change_24h: 1.8, tvl_change_7d: 4.2, category: "Liquid Staking", chains: ["Solana"], last_updated: new Date().toISOString() },
    { protocol_name: "Morpho", slug: "morpho", tvl: 2200000000, tvl_change_24h: 3.1, tvl_change_7d: 7.5, category: "Lending", chains: ["Ethereum", "Base"], last_updated: new Date().toISOString() },
    { protocol_name: "Pendle", slug: "pendle", tvl: 1800000000, tvl_change_24h: -1.2, tvl_change_7d: 2.8, category: "Yield", chains: ["Ethereum", "Arbitrum"], last_updated: new Date().toISOString() },
    { protocol_name: "GMX", slug: "gmx", tvl: 820000000, tvl_change_24h: -0.8, tvl_change_7d: -1.5, category: "Derivatives", chains: ["Arbitrum", "Avalanche"], last_updated: new Date().toISOString() },
    { protocol_name: "dYdX", slug: "dydx", tvl: 560000000, tvl_change_24h: 1.5, tvl_change_7d: 3.2, category: "Derivatives", chains: ["dYdX Chain"], last_updated: new Date().toISOString() },
    { protocol_name: "Convex Finance", slug: "convex-finance", tvl: 1200000000, tvl_change_24h: -0.5, tvl_change_7d: -2.1, category: "Yield", chains: ["Ethereum"], last_updated: new Date().toISOString() },
    { protocol_name: "Instadapp", slug: "instadapp", tvl: 3100000000, tvl_change_24h: 0.3, tvl_change_7d: 1.8, category: "Lending", chains: ["Ethereum", "Arbitrum", "Polygon"], last_updated: new Date().toISOString() },
    { protocol_name: "Spark", slug: "spark", tvl: 4200000000, tvl_change_24h: 1.1, tvl_change_7d: 2.5, category: "Lending", chains: ["Ethereum", "Gnosis"], last_updated: new Date().toISOString() },
    { protocol_name: "Blast", slug: "blast", tvl: 1400000000, tvl_change_24h: -2.8, tvl_change_7d: -5.1, category: "L2/Yield", chains: ["Blast"], last_updated: new Date().toISOString() },
  ]).select("id");
  console.log(`  defi_protocols: ${dp?.length ?? 0} rows (${dpe ? "ERROR: " + dpe.message : "OK"})`);

  // ── 6. STABLECOIN STATUS (10) ──
  console.log("6/8 Inserting stablecoin_status...");
  const { data: ss, error: sse } = await supabase.from("stablecoin_status").insert([
    { symbol: "USDT", name: "Tether", current_price: 0.9998, peg_deviation: -0.02, is_depegged: false, last_updated: new Date().toISOString() },
    { symbol: "USDC", name: "USD Coin", current_price: 1.0001, peg_deviation: 0.01, is_depegged: false, last_updated: new Date().toISOString() },
    { symbol: "DAI", name: "Dai", current_price: 0.9995, peg_deviation: -0.05, is_depegged: false, last_updated: new Date().toISOString() },
    { symbol: "FRAX", name: "Frax", current_price: 0.9990, peg_deviation: -0.10, is_depegged: false, last_updated: new Date().toISOString() },
    { symbol: "TUSD", name: "TrueUSD", current_price: 0.9978, peg_deviation: -0.22, is_depegged: false, last_updated: new Date().toISOString() },
    { symbol: "FDUSD", name: "First Digital USD", current_price: 1.0003, peg_deviation: 0.03, is_depegged: false, last_updated: new Date().toISOString() },
    { symbol: "USDD", name: "USDD", current_price: 0.9845, peg_deviation: -1.55, is_depegged: true, last_updated: new Date().toISOString() },
    { symbol: "PYUSD", name: "PayPal USD", current_price: 0.9997, peg_deviation: -0.03, is_depegged: false, last_updated: new Date().toISOString() },
    { symbol: "GHO", name: "GHO", current_price: 0.9988, peg_deviation: -0.12, is_depegged: false, last_updated: new Date().toISOString() },
    { symbol: "crvUSD", name: "Curve USD", current_price: 0.9993, peg_deviation: -0.07, is_depegged: false, last_updated: new Date().toISOString() },
  ]).select("id");
  console.log(`  stablecoin_status: ${ss?.length ?? 0} rows (${sse ? "ERROR: " + sse.message : "OK"})`);

  // ── 7. DEX VOLUMES (15) ──
  console.log("7/8 Inserting dex_volumes...");
  const { data: dv, error: dve } = await supabase.from("dex_volumes").insert([
    { protocol_name: "Uniswap", daily_volume: 2450000000, volume_change_24h: 12.5, total_tvl: 6200000000, chains: ["Ethereum", "Arbitrum", "Polygon", "Optimism", "Base", "BSC"], last_updated: new Date().toISOString() },
    { protocol_name: "Raydium", daily_volume: 1076000000, volume_change_24h: 245.0, total_tvl: 1900000000, chains: ["Solana"], last_updated: new Date().toISOString() },
    { protocol_name: "PancakeSwap", daily_volume: 812000000, volume_change_24h: -8.3, total_tvl: 2600000000, chains: ["BSC", "Ethereum", "Arbitrum"], last_updated: new Date().toISOString() },
    { protocol_name: "Jupiter", daily_volume: 965000000, volume_change_24h: -15.2, total_tvl: 2100000000, chains: ["Solana"], last_updated: new Date().toISOString() },
    { protocol_name: "Orca", daily_volume: 420000000, volume_change_24h: 32.1, total_tvl: 580000000, chains: ["Solana"], last_updated: new Date().toISOString() },
    { protocol_name: "Curve", daily_volume: 380000000, volume_change_24h: -5.8, total_tvl: 2800000000, chains: ["Ethereum", "Arbitrum", "Polygon", "Avalanche"], last_updated: new Date().toISOString() },
    { protocol_name: "Trader Joe", daily_volume: 195000000, volume_change_24h: 18.4, total_tvl: 320000000, chains: ["Avalanche", "Arbitrum", "BSC"], last_updated: new Date().toISOString() },
    { protocol_name: "SushiSwap", daily_volume: 142000000, volume_change_24h: -12.1, total_tvl: 450000000, chains: ["Ethereum", "Arbitrum", "Polygon"], last_updated: new Date().toISOString() },
    { protocol_name: "Aerodrome", daily_volume: 285000000, volume_change_24h: 45.6, total_tvl: 1200000000, chains: ["Base"], last_updated: new Date().toISOString() },
    { protocol_name: "Velodrome", daily_volume: 98000000, volume_change_24h: 8.2, total_tvl: 380000000, chains: ["Optimism"], last_updated: new Date().toISOString() },
    { protocol_name: "Camelot", daily_volume: 76000000, volume_change_24h: -3.5, total_tvl: 210000000, chains: ["Arbitrum"], last_updated: new Date().toISOString() },
    { protocol_name: "Maverick", daily_volume: 65000000, volume_change_24h: 22.8, total_tvl: 180000000, chains: ["Ethereum", "Base"], last_updated: new Date().toISOString() },
    { protocol_name: "DODO", daily_volume: 112000000, volume_change_24h: 15.3, total_tvl: 260000000, chains: ["Ethereum", "BSC", "Arbitrum", "Polygon"], last_updated: new Date().toISOString() },
    { protocol_name: "Balancer", daily_volume: 156000000, volume_change_24h: -2.1, total_tvl: 890000000, chains: ["Ethereum", "Arbitrum", "Polygon", "Avalanche"], last_updated: new Date().toISOString() },
    { protocol_name: "Ambient", daily_volume: 48000000, volume_change_24h: 78.5, total_tvl: 145000000, chains: ["Ethereum", "Scroll"], last_updated: new Date().toISOString() },
  ]).select("id");
  console.log(`  dex_volumes: ${dv?.length ?? 0} rows (${dve ? "ERROR: " + dve.message : "OK"})`);

  // ── 8. LIQUIDITY POOLS (25) ──
  console.log("8/8 Inserting liquidity_pools...");
  const { data: lp, error: lpe } = await supabase.from("liquidity_pools").insert([
    { pool_name: "WETH-USDC", protocol: "Uniswap V3", chain: "Ethereum", tvl: 676400000, apy: 18.5, apy_base: 12.3, apy_reward: 6.2, tvl_change_24h: -24.0, is_stablecoin: false, risk_level: "medium", last_updated: new Date().toISOString() },
    { pool_name: "WBTC-WETH", protocol: "Uniswap V3", chain: "Ethereum", tvl: 445000000, apy: 8.2, apy_base: 8.2, apy_reward: 0, tvl_change_24h: -2.1, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "USDC-USDT", protocol: "Uniswap V3", chain: "Ethereum", tvl: 320000000, apy: 4.8, apy_base: 4.8, apy_reward: 0, tvl_change_24h: -0.5, is_stablecoin: true, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "stETH-ETH", protocol: "Curve", chain: "Ethereum", tvl: 1200000000, apy: 142.0, apy_base: 3.8, apy_reward: 138.2, tvl_change_24h: 1.2, is_stablecoin: false, risk_level: "high", last_updated: new Date().toISOString() },
    { pool_name: "3pool (USDT/USDC/DAI)", protocol: "Curve", chain: "Ethereum", tvl: 890000000, apy: 3.2, apy_base: 2.1, apy_reward: 1.1, tvl_change_24h: -3.8, is_stablecoin: true, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "SOL-USDC", protocol: "Raydium", chain: "Solana", tvl: 245000000, apy: 45.2, apy_base: 28.5, apy_reward: 16.7, tvl_change_24h: 18.5, is_stablecoin: false, risk_level: "medium", last_updated: new Date().toISOString() },
    { pool_name: "JitoSOL-SOL", protocol: "Orca", chain: "Solana", tvl: 189000000, apy: 7.8, apy_base: 7.8, apy_reward: 0, tvl_change_24h: 2.3, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "WETH-USDC", protocol: "Aerodrome", chain: "Base", tvl: 156000000, apy: 32.5, apy_base: 8.2, apy_reward: 24.3, tvl_change_24h: 12.8, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "CAKE-BNB", protocol: "PancakeSwap", chain: "BSC", tvl: 312000000, apy: 22.1, apy_base: 12.5, apy_reward: 9.6, tvl_change_24h: -18.0, is_stablecoin: false, risk_level: "high", last_updated: new Date().toISOString() },
    { pool_name: "USDT-BNB", protocol: "PancakeSwap", chain: "BSC", tvl: 198000000, apy: 15.8, apy_base: 8.4, apy_reward: 7.4, tvl_change_24h: -15.2, is_stablecoin: false, risk_level: "medium", last_updated: new Date().toISOString() },
    { pool_name: "WETH-ARB", protocol: "Camelot", chain: "Arbitrum", tvl: 78000000, apy: 28.4, apy_base: 15.2, apy_reward: 13.2, tvl_change_24h: 5.6, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "USDC-DAI", protocol: "Curve", chain: "Ethereum", tvl: 245000000, apy: 2.8, apy_base: 2.8, apy_reward: 0, tvl_change_24h: -1.2, is_stablecoin: true, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "FRAX-USDC", protocol: "Curve", chain: "Ethereum", tvl: 156000000, apy: 5.5, apy_base: 3.2, apy_reward: 2.3, tvl_change_24h: -2.8, is_stablecoin: true, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "GHO-USDC", protocol: "Uniswap V3", chain: "Ethereum", tvl: 89000000, apy: 8.2, apy_base: 4.5, apy_reward: 3.7, tvl_change_24h: 3.5, is_stablecoin: true, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "WETH-OP", protocol: "Velodrome", chain: "Optimism", tvl: 65000000, apy: 35.2, apy_base: 12.8, apy_reward: 22.4, tvl_change_24h: 4.2, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "WMATIC-USDC", protocol: "Uniswap V3", chain: "Polygon", tvl: 112000000, apy: 12.4, apy_base: 8.1, apy_reward: 4.3, tvl_change_24h: -1.5, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "AVAX-USDC", protocol: "Trader Joe", chain: "Avalanche", tvl: 67000000, apy: 19.8, apy_base: 11.2, apy_reward: 8.6, tvl_change_24h: 6.8, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "BONK-SOL", protocol: "Raydium", chain: "Solana", tvl: 34000000, apy: 85.2, apy_base: 65.4, apy_reward: 19.8, tvl_change_24h: 45.2, is_stablecoin: false, risk_level: "high", last_updated: new Date().toISOString() },
    { pool_name: "WIF-SOL", protocol: "Raydium", chain: "Solana", tvl: 28000000, apy: 120.5, apy_base: 95.2, apy_reward: 25.3, tvl_change_24h: 68.5, is_stablecoin: false, risk_level: "high", last_updated: new Date().toISOString() },
    { pool_name: "USDD-USDT", protocol: "Curve", chain: "Ethereum", tvl: 42000000, apy: 52.8, apy_base: 2.1, apy_reward: 50.7, tvl_change_24h: -32.5, is_stablecoin: true, risk_level: "high", last_updated: new Date().toISOString() },
    { pool_name: "PEPE-WETH", protocol: "Uniswap V3", chain: "Ethereum", tvl: 56000000, apy: 95.2, apy_base: 85.4, apy_reward: 9.8, tvl_change_24h: 35.2, is_stablecoin: false, risk_level: "high", last_updated: new Date().toISOString() },
    { pool_name: "cbETH-WETH", protocol: "Uniswap V3", chain: "Ethereum", tvl: 234000000, apy: 4.5, apy_base: 4.5, apy_reward: 0, tvl_change_24h: 0.8, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "rETH-WETH", protocol: "Balancer", chain: "Ethereum", tvl: 312000000, apy: 3.8, apy_base: 3.8, apy_reward: 0, tvl_change_24h: 0.2, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "WETH-USDC", protocol: "Maverick", chain: "Ethereum", tvl: 89000000, apy: 22.5, apy_base: 14.8, apy_reward: 7.7, tvl_change_24h: 8.5, is_stablecoin: false, risk_level: "low", last_updated: new Date().toISOString() },
    { pool_name: "crvUSD-USDC", protocol: "Curve", chain: "Ethereum", tvl: 178000000, apy: 6.2, apy_base: 4.1, apy_reward: 2.1, tvl_change_24h: -0.8, is_stablecoin: true, risk_level: "low", last_updated: new Date().toISOString() },
  ]).select("id");
  console.log(`  liquidity_pools: ${lp?.length ?? 0} rows (${lpe ? "ERROR: " + lpe.message : "OK"})`);

  console.log("\n=== Seed complete! ===");
}

seed().catch(console.error);
