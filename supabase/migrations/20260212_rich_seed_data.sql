-- ═══════════════════════════════════════════════════════════════════
-- BLOSAFE Rich Seed Data — Production-Ready Demo Content
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════

-- Clear existing thin data
DELETE FROM alert_events;
DELETE FROM whale_events;
DELETE FROM signals;

-- ═══════════════════════════════════════════════════════════════════
-- 1. WHALE EVENTS (30 events — diverse blockchains, entities, amounts)
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO whale_events (tx_hash, blockchain, from_address, from_label, to_address, to_label, symbol, amount, usd_value, event_type, detected_at) VALUES
-- BTC high-value
('0xbtc001abc', 'bitcoin', 'bc1qxy2kgdygjrsq', 'Binance', 'bc1qm34lsc65zpw79', 'Unknown Wallet', 'BTC', 1250, 121875000, 'exchange_withdrawal', NOW() - INTERVAL '15 minutes'),
('0xbtc002def', 'bitcoin', 'bc1qjasf9z3satoshi', 'Satoshi-era Wallet', 'bc1qxy2kgdbinance', 'Binance', 'BTC', 2000, 195000000, 'exchange_deposit', NOW() - INTERVAL '45 minutes'),
('0xbtc003ghi', 'bitcoin', '1CoinbaseHotWallet', 'Coinbase', 'bc1qcold0123456', 'Institutional Cold Storage', 'BTC', 4500, 438750000, 'transfer', NOW() - INTERVAL '2 hours'),
('0xbtc004jkl', 'bitcoin', 'bc1qgrayscale001', 'Grayscale GBTC', 'bc1qxy2kgdbinance', 'Binance', 'BTC', 800, 78000000, 'exchange_deposit', NOW() - INTERVAL '3 hours'),
('0xbtc005mno', 'bitcoin', 'bc1qkraken001hot', 'Kraken', 'bc1qunknown001cold', 'Unknown Wallet', 'BTC', 350, 34125000, 'exchange_withdrawal', NOW() - INTERVAL '4 hours'),
('0xbtc006pqr', 'bitcoin', 'bc1qmtgoxtrustee', 'Mt. Gox Trustee', 'bc1qkraken001hot', 'Kraken', 'BTC', 3200, 312000000, 'exchange_deposit', NOW() - INTERVAL '8 hours'),
('0xbtc007stu', 'bitcoin', 'bc1qmicrostr001', 'MicroStrategy', 'bc1qcoldMS001vault', 'MicroStrategy Cold Vault', 'BTC', 5000, 487500000, 'transfer', NOW() - INTERVAL '1 day'),
('0xbtc008vwx', 'bitcoin', 'bc1qblackrock001', 'BlackRock iShares ETF', 'bc1qcoinbaseCust01', 'Coinbase Custody', 'BTC', 6200, 604500000, 'transfer', NOW() - INTERVAL '14 hours'),
('0xbtc009yza', 'bitcoin', 'bc1qgemini001hot', 'Gemini', 'bc1qunknown002cold', 'Unknown Wallet', 'BTC', 900, 87750000, 'exchange_withdrawal', NOW() - INTERVAL '18 hours'),
('0xbtc010bcd', 'bitcoin', 'bc1qfidelity001', 'Fidelity Digital', 'bc1qcoldFid001', 'Fidelity Cold Storage', 'BTC', 7800, 760500000, 'transfer', NOW() - INTERVAL '20 hours'),
-- ETH high-value
('0xeth001abc', 'ethereum', '0x28c6c06298d514db', 'Binance Hot Wallet', '0xdead00000000eth01', 'Unknown EOA', 'ETH', 15000, 52500000, 'exchange_withdrawal', NOW() - INTERVAL '30 minutes'),
('0xeth002def', 'ethereum', '0x21a31ee1afc51d94', 'Jump Trading', '0x28c6c06298d514db', 'Binance', 'ETH', 28000, 98000000, 'exchange_deposit', NOW() - INTERVAL '1 hour'),
('0xeth003ghi', 'ethereum', '0xwintermute0trading', 'Wintermute', '0x1111111254fb6c44', '1inch Aggregator', 'ETH', 42000, 147000000, 'transfer', NOW() - INTERVAL '90 minutes'),
('0xeth004jkl', 'ethereum', '0xcoinbaseprime001', 'Coinbase Prime', '0xcold0001ethvault', 'Institutional Custody', 'ETH', 50000, 175000000, 'transfer', NOW() - INTERVAL '5 hours'),
('0xeth005mno', 'ethereum', '0xcelsiusliquidator', 'Celsius Liquidator', '0x28c6c06298d514db', 'Binance', 'ETH', 35000, 122500000, 'exchange_deposit', NOW() - INTERVAL '16 hours'),
('0xeth006pqr', 'ethereum', '0xparadigmcapital01', 'Paradigm', '0xUniswapV3Pool01', 'Uniswap V3 Pool', 'ETH', 20000, 70000000, 'transfer', NOW() - INTERVAL '9 hours'),
('0xeth007stu', 'ethereum', '0xvitaliketh001', 'vitalik.eth', '0xensDAO0treasury01', 'ENS DAO Treasury', 'ETH', 1000, 3500000, 'transfer', NOW() - INTERVAL '12 hours'),
-- USDT/USDC stablecoin flows
('0xusdt001abc', 'ethereum', '0x5754284f345afc66', 'Tether Treasury', '0x28c6c06298d514db', 'Binance', 'USDT', 500000000, 500000000, 'transfer', NOW() - INTERVAL '20 minutes'),
('0xusdt002def', 'tron', 'TTetherTreasury001', 'Tether Treasury', 'TKrakenHot001', 'Kraken', 'USDT', 200000000, 200000000, 'transfer', NOW() - INTERVAL '1 hour'),
('0xusdt003ghi', 'ethereum', '0xbitfinex001hot', 'Bitfinex', '0xcumberland001otc', 'Cumberland (OTC)', 'USDT', 75000000, 75000000, 'transfer', NOW() - INTERVAL '3 hours'),
('0xusdc001abc', 'ethereum', '0xcircletreasury01', 'Circle Treasury', '0xcoinbase001', 'Coinbase', 'USDC', 300000000, 300000000, 'transfer', NOW() - INTERVAL '4 hours'),
-- SOL movements
('0xsol001abc', 'solana', 'BinanceSOLhot001', 'Binance', 'UnknownSOLwallet01', 'Unknown Wallet', 'SOL', 450000, 63000000, 'exchange_withdrawal', NOW() - INTERVAL '40 minutes'),
('0xsol002def', 'solana', 'JumpTradingSOL001', 'Jump Trading', 'RaydiumPoolSOL001', 'Raydium AMM', 'SOL', 320000, 44800000, 'transfer', NOW() - INTERVAL '2 hours'),
('0xsol003ghi', 'solana', 'FTXestateLiqSOL01', 'FTX Estate', 'CoinbaseSOLhot001', 'Coinbase', 'SOL', 1500000, 210000000, 'exchange_deposit', NOW() - INTERVAL '6 hours'),
('0xsol004jkl', 'solana', 'PhantomWhaleSOL01', 'Unknown Whale', 'BinanceSOLhot001', 'Binance', 'SOL', 800000, 112000000, 'exchange_deposit', NOW() - INTERVAL '10 hours'),
-- XRP, LINK, AVAX, DOGE
('0xxrp001abc', 'ripple', 'rRippleLabsEscrow', 'Ripple Labs', 'rBitstampHot001', 'Bitstamp', 'XRP', 50000000, 32500000, 'transfer', NOW() - INTERVAL '1 hour'),
('0xxrp002def', 'ripple', 'rBinanceXRP001hot', 'Binance', 'rUnknownXRP001', 'Unknown Wallet', 'XRP', 80000000, 52000000, 'exchange_withdrawal', NOW() - INTERVAL '4 hours'),
('0xlink001abc', 'ethereum', '0xchainlinkVesting', 'Chainlink Vesting', '0x28c6c06298d514db', 'Binance', 'LINK', 2500000, 37500000, 'exchange_deposit', NOW() - INTERVAL '3 hours'),
('0xavax001abc', 'avalanche', 'AvaxFoundation001', 'Avalanche Foundation', 'AvaxUnknown001cold', 'Unknown Wallet', 'AVAX', 1200000, 42000000, 'transfer', NOW() - INTERVAL '5 hours'),
('0xdoge001abc', 'dogecoin', 'RobinhoodDOGEhot01', 'Robinhood', 'UnknownDOGE001cold', 'Unknown Wallet', 'DOGE', 500000000, 55000000, 'exchange_withdrawal', NOW() - INTERVAL '2 hours');

-- ═══════════════════════════════════════════════════════════════════
-- 2. SIGNALS (30 signals — varied tokens, types, timeframes)
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO signals (token_symbol, token_name, signal_type, signal_name, confidence, timeframe, description, indicators, price_at_signal, created_at) VALUES
-- BTC signals
('BTC', 'Bitcoin', 'buy', 'Oversold Bounce', 92, '1D', '7일 연속 하락 후 RSI 25 진입. 과매도 반등 가능성 높음. 200일 이동평균에서 강한 지지.', '{"rsi_14": 25, "macd_signal": "bullish_cross", "volume_spike": true, "support_level": 94500}', 95200, NOW() - INTERVAL '2 hours'),
('BTC', 'Bitcoin', 'sell', 'Distribution Pattern', 78, '1D', 'Whale 대량 거래소 입금 + 24h 상승률 8% — 단기 차익 실현 패턴.', '{"exchange_inflow": 1250, "price_change_24h": 8.2, "rsi_14": 72}', 103400, NOW() - INTERVAL '6 hours'),
('BTC', 'Bitcoin', 'buy', 'Accumulation Zone', 85, '1W', '주간 차트 기준 볼린저 밴드 하단 터치. 기관 매집 구간.', '{"bollinger_position": "lower", "institutional_flow": "positive", "weekly_rsi": 38}', 96800, NOW() - INTERVAL '1 day'),
-- ETH signals
('ETH', 'Ethereum', 'buy', 'Strong Support', 88, '1D', 'ETH $3,400 지지선 3번째 테스트 성공. 거래량 200% 증가.', '{"support_tests": 3, "volume_change": 200, "price_level": 3400}', 3420, NOW() - INTERVAL '1 hour'),
('ETH', 'Ethereum', 'alert', 'Volatility Spike', 74, '4H', '4시간 내 ATR 급등. 큰 가격 변동 임박 가능.', '{"atr_change": 180, "bollinger_width": "expanding", "volume_surge": true}', 3510, NOW() - INTERVAL '3 hours'),
('ETH', 'Ethereum', 'sell', 'Bearish Divergence', 81, '1D', 'RSI 다이버전스 감지 — 가격 신고가 but RSI 하락. 조정 가능.', '{"rsi_divergence": true, "price_trend": "up", "rsi_trend": "down"}', 3680, NOW() - INTERVAL '12 hours'),
-- SOL signals
('SOL', 'Solana', 'buy', 'Momentum Shift', 90, '1D', '24h -8.5% 급락 후 강한 반등 시작. 거래량 300% 급증 + MACD 골든크로스.', '{"price_change_24h": -8.5, "volume_spike": 300, "macd": "golden_cross"}', 138, NOW() - INTERVAL '30 minutes'),
('SOL', 'Solana', 'buy', 'Oversold Signal', 86, '4H', '4시간 RSI 18 — 극도의 과매도. 단기 반등 확률 높음.', '{"rsi_4h": 18, "stochastic": "oversold", "support": 130}', 132, NOW() - INTERVAL '4 hours'),
-- BNB signals
('BNB', 'BNB', 'alert', 'Volume Anomaly', 72, '1D', 'BNB 거래량 평소 대비 450% 급증. Binance 관련 뉴스 확인 필요.', '{"volume_ratio": 4.5, "avg_volume_7d": 850000000, "current_volume": 3825000000}', 620, NOW() - INTERVAL '5 hours'),
-- XRP signals
('XRP', 'XRP', 'buy', 'Breakout Signal', 83, '1D', 'XRP $0.65 저항선 돌파 시도. Ripple SEC 소송 진전 기대감.', '{"resistance_level": 0.65, "breakout_attempt": true, "volume_confirm": true}', 0.64, NOW() - INTERVAL '2 hours'),
('XRP', 'XRP', 'sell', 'Resistance Rejection', 76, '4H', '$0.72 저항에서 3번 반락. 단기 하방 압력.', '{"resistance_tests": 3, "rejection_pattern": true, "rsi": 65}', 0.71, NOW() - INTERVAL '8 hours'),
-- ADA signals
('ADA', 'Cardano', 'buy', 'Double Bottom', 79, '1D', '더블 바텀 패턴 완성. $0.38 네크라인 돌파 시 상승 모멘텀.', '{"pattern": "double_bottom", "neckline": 0.38, "volume": "increasing"}', 0.36, NOW() - INTERVAL '3 hours'),
-- AVAX signals
('AVAX', 'Avalanche', 'sell', 'Strong Downtrend', 84, '1D', '지속적 하락 — 24h -5.8%, 7d -12.3%. 추세 반전 신호 없음.', '{"price_change_24h": -5.8, "price_change_7d": -12.3, "trend": "bearish"}', 34.5, NOW() - INTERVAL '4 hours'),
-- DOGE signals
('DOGE', 'Dogecoin', 'alert', 'Social Surge', 68, '1D', 'DOGE 소셜 멘션 800% 급증. Elon Musk 관련 트윗 감지.', '{"social_mentions": 800, "sentiment": "bullish", "trigger": "social_media"}', 0.11, NOW() - INTERVAL '1 hour'),
-- LINK signals
('LINK', 'Chainlink', 'buy', 'CCIP Adoption', 82, '1W', 'Chainlink CCIP 도입 증가 + TVL locked 상승. 펀더멘털 강화.', '{"ccip_transactions": "growing", "tvl_locked_change": 15, "weekly_trend": "bullish"}', 15.2, NOW() - INTERVAL '6 hours'),
-- DOT signals
('DOT', 'Polkadot', 'sell', 'Parachain Unlock', 75, '1D', 'DOT 파라체인 경매 언락 물량 증가. 매도 압력 예상.', '{"unlock_amount": 5000000, "supply_percent": 0.4, "selling_pressure": "expected"}', 7.8, NOW() - INTERVAL '9 hours'),
-- MATIC signals
('MATIC', 'Polygon', 'buy', 'Polygon 2.0 Rally', 87, '1D', 'Polygon 2.0 로드맵 발표 이후 네트워크 활동 급증. ZK 채택 확대.', '{"network_activity": "surging", "zk_transactions": "growing", "dev_activity": "high"}', 0.92, NOW() - INTERVAL '5 hours'),
-- UNI signals
('UNI', 'Uniswap', 'alert', 'Governance Vote', 71, '1D', 'UNI 거버넌스 투표 진행 중 — Fee Switch 제안. 결과에 따라 큰 변동.', '{"governance": "fee_switch_vote", "participation": "high", "deadline": "48h"}', 12.4, NOW() - INTERVAL '2 hours'),
-- AAVE signals
('AAVE', 'Aave', 'buy', 'DeFi Recovery', 80, '1W', 'DeFi TVL 회복세 + Aave V4 기대감. 주간 차트 상승 추세 전환.', '{"defi_tvl_trend": "recovering", "protocol_update": "v4_announcement", "weekly_macd": "bullish"}', 285, NOW() - INTERVAL '1 day'),
-- APT signals
('APT', 'Aptos', 'sell', 'Strong Downtrend', 78, '1D', '지속적 하락 — 24h -3.2%, 7d -8.5%. Move 생태계 성장 둔화.', '{"price_change_24h": -3.2, "price_change_7d": -8.5, "ecosystem": "slowing"}', 8.9, NOW() - INTERVAL '7 hours'),
-- ARB signals
('ARB', 'Arbitrum', 'buy', 'L2 Dominance', 85, '1D', 'Arbitrum L2 TVL 점유율 45% 돌파. DEX 거래량 급증.', '{"l2_tvl_share": 45, "dex_volume_change": 120, "sequencer_revenue": "growing"}', 1.15, NOW() - INTERVAL '3 hours'),
-- NEAR signals
('NEAR', 'NEAR Protocol', 'buy', 'AI Narrative', 77, '1D', 'NEAR AI 에이전트 발표 이후 관심 급증. 거래량 250% 증가.', '{"narrative": "AI_agents", "volume_change": 250, "social_trend": "rising"}', 5.8, NOW() - INTERVAL '4 hours'),
-- OP signals
('OP', 'Optimism', 'alert', 'Token Unlock Impact', 73, '1D', 'OP 대량 언락 D-2. 31.3M OP ($65M) — 매도 압력 가능.', '{"unlock_amount": 31340000, "usd_value": 65200000, "days_until": 2}', 2.08, NOW() - INTERVAL '1 hour'),
-- SUI signals
('SUI', 'Sui', 'buy', 'TVL Growth', 81, '1W', 'Sui TVL 최근 30일 180% 급증. Move 생태계 내 가장 빠른 성장.', '{"tvl_growth_30d": 180, "unique_addresses": "growing", "dapp_launches": 12}', 1.42, NOW() - INTERVAL '8 hours'),
-- TIA signals
('TIA', 'Celestia', 'sell', 'Modular Fatigue', 69, '1D', 'Celestia 블롭 사용량 감소 + 토큰 언락 임박. 모듈러 내러티브 약화.', '{"blob_usage": "declining", "unlock_date": "2026-02-20", "narrative": "weakening"}', 9.2, NOW() - INTERVAL '10 hours'),
-- INJ signals
('INJ', 'Injective', 'buy', 'Burn Mechanism', 83, '1D', 'INJ 주간 소각 800만 달러 — 최대 기록. 디플레이션 효과 가속.', '{"weekly_burn_usd": 8000000, "total_burned": "record_high", "supply_decrease": 0.3}', 24.5, NOW() - INTERVAL '5 hours'),
-- PEPE signals
('PEPE', 'Pepe', 'alert', 'Meme Rally', 65, '4H', 'PEPE 4시간 내 15% 급등. 밈코인 랠리 시작 가능성 — 리스크 주의.', '{"price_change_4h": 15, "meme_index": "surging", "risk": "very_high"}', 0.0000012, NOW() - INTERVAL '30 minutes'),
-- FET signals
('FET', 'Fetch.ai', 'buy', 'AI Token Leader', 86, '1D', 'AI 토큰 섹터 리더. ASI 토큰 합병 기대감 + 실사용 증가.', '{"ai_sector_rank": 1, "merger_progress": "on_track", "usage_growth": 45}', 2.3, NOW() - INTERVAL '6 hours');

-- ═══════════════════════════════════════════════════════════════════
-- 3. ALERT EVENTS (40+ alerts with RICH metadata for detail pages)
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO alert_events (user_id, type, severity, title, description, metadata, created_at) VALUES
-- Whale alerts (with rich metadata for detail page panels)
('00000000-0000-0000-0000-000000000000', 'whale', 'critical', 'BTC 4,500 withdrawn from Coinbase to Cold Storage',
 '4,500 BTC ($438.7M) moved from Coinbase to institutional cold storage wallet. Largest single BTC withdrawal this week.',
 '{"symbol": "BTC", "amount": 4500, "usd_value": 438750000, "tx_hash": "0xbtc003ghi", "from_address": "1CoinbaseHotWallet", "from_label": "Coinbase", "from_tag": "Exchange", "from_tag_color": "warning", "to_address": "bc1qcold0123456", "to_label": "Institutional Cold Storage", "to_tag": "Cold Wallet", "to_tag_color": "success", "value_usd": 438750000, "block_number": 880245, "tx_explorer_url": "https://mempool.space/tx/0xbtc003ghi", "impact_score": 9.2, "impact_metrics": [{"label": "24h Exchange Reserve", "value": "-2.1%", "trend": "down"}, {"label": "BTC Exchange Balance", "value": "2.31M BTC", "trend": "down"}, {"label": "Avg Withdrawal Size", "value": "$12.4M", "trend": "up"}], "wallet_history": [{"type": "Withdrawal", "age": "2h ago", "value": "$438.7M BTC"}, {"type": "Withdrawal", "age": "1d ago", "value": "$89.2M BTC"}, {"type": "Deposit", "age": "3d ago", "value": "$245M USDT"}, {"type": "Withdrawal", "age": "5d ago", "value": "$156M ETH"}, {"type": "Deposit", "age": "7d ago", "value": "$312M BTC"}], "activity_30d": [{"label": "D1", "value": 12}, {"label": "D2", "value": 8}, {"label": "D3", "value": 15}, {"label": "D4", "value": 6}, {"label": "D5", "value": 22}, {"label": "D6", "value": 18}, {"label": "D7", "value": 9}, {"label": "D8", "value": 14}, {"label": "D9", "value": 7}, {"label": "D10", "value": 25}, {"label": "D11", "value": 11}, {"label": "D12", "value": 16}, {"label": "D13", "value": 8}, {"label": "D14", "value": 19}, {"label": "D15", "value": 13}, {"label": "D16", "value": 5}, {"label": "D17", "value": 21}, {"label": "D18", "value": 10}, {"label": "D19", "value": 17}, {"label": "D20", "value": 7}, {"label": "D21", "value": 23}, {"label": "D22", "value": 14}, {"label": "D23", "value": 9}, {"label": "D24", "value": 18}, {"label": "D25", "value": 6}, {"label": "D26", "value": 20}, {"label": "D27", "value": 12}, {"label": "D28", "value": 15}, {"label": "D29", "value": 8}, {"label": "D30", "value": 24}], "similar_wallets": [{"label": "Fidelity Custody", "address": "bc1qfidelity001000000000", "similarity": "94%"}, {"label": "BlackRock iShares", "address": "bc1qblackrock001000000", "similarity": "89%"}, {"label": "Grayscale GBTC", "address": "bc1qgrayscale00100000", "similarity": "82%"}]}'::jsonb,
 NOW() - INTERVAL '2 hours'),

('00000000-0000-0000-0000-000000000000', 'whale', 'high', 'ETH 28,000 deposited to Binance by Jump Trading',
 'Jump Trading deposited 28,000 ETH ($98M) to Binance. Potential selling pressure — institutional profit-taking.',
 '{"symbol": "ETH", "amount": 28000, "usd_value": 98000000, "tx_hash": "0xeth002def", "from_address": "0x21a31ee1afc51d94", "from_label": "Jump Trading", "from_tag": "Market Maker", "from_tag_color": "purple", "to_address": "0x28c6c06298d514db", "to_label": "Binance", "to_tag": "Exchange", "to_tag_color": "warning", "value_usd": 98000000, "block_number": 19445678, "tx_explorer_url": "https://etherscan.io/tx/0xeth002def", "impact_score": 7.8, "impact_metrics": [{"label": "Exchange Inflow 24h", "value": "+$342M", "trend": "up"}, {"label": "ETH Exchange Balance", "value": "16.2M ETH", "trend": "up"}, {"label": "Funding Rate", "value": "-0.02%", "trend": "down"}], "wallet_history": [{"type": "Exchange Deposit", "age": "1h ago", "value": "$98M ETH"}, {"type": "DEX Swap", "age": "4h ago", "value": "$45M USDC→ETH"}, {"type": "LP Removal", "age": "8h ago", "value": "$67M ETH-USDC"}, {"type": "Exchange Deposit", "age": "2d ago", "value": "$120M ETH"}], "activity_30d": [{"label": "D1", "value": 18}, {"label": "D2", "value": 22}, {"label": "D3", "value": 15}, {"label": "D4", "value": 28}, {"label": "D5", "value": 12}, {"label": "D6", "value": 35}, {"label": "D7", "value": 20}, {"label": "D8", "value": 16}, {"label": "D9", "value": 24}, {"label": "D10", "value": 10}, {"label": "D11", "value": 30}, {"label": "D12", "value": 18}, {"label": "D13", "value": 22}, {"label": "D14", "value": 14}, {"label": "D15", "value": 26}], "similar_wallets": [{"label": "Wintermute", "address": "0xwintermute0trading000", "similarity": "91%"}, {"label": "Alameda Remnant", "address": "0xa16v2aleo0000000000", "similarity": "78%"}]}'::jsonb,
 NOW() - INTERVAL '1 hour'),

('00000000-0000-0000-0000-000000000000', 'whale', 'critical', 'USDT 500M minted from Tether Treasury',
 'Tether Treasury minted and transferred 500M USDT to Binance. Historically correlates with upcoming BTC rally.',
 '{"symbol": "USDT", "amount": 500000000, "usd_value": 500000000, "tx_hash": "0xusdt001abc", "from_address": "0x5754284f345afc66", "from_label": "Tether Treasury", "from_tag": "Issuer", "from_tag_color": "info", "to_address": "0x28c6c06298d514db", "to_label": "Binance", "to_tag": "Exchange", "to_tag_color": "warning", "value_usd": 500000000, "impact_score": 9.5, "impact_metrics": [{"label": "USDT Market Cap", "value": "$112.8B", "trend": "up"}, {"label": "30d USDT Minted", "value": "$2.4B", "trend": "up"}, {"label": "Stablecoin Dominance", "value": "72.1%", "trend": "up"}]}'::jsonb,
 NOW() - INTERVAL '20 minutes'),

('00000000-0000-0000-0000-000000000000', 'whale', 'high', 'BTC 1,250 withdrawn from Binance',
 '1,250 BTC ($121.8M) withdrawn from Binance to unknown wallet. Accumulation signal — coins moving off exchange.',
 '{"symbol": "BTC", "amount": 1250, "usd_value": 121875000, "tx_hash": "0xbtc001abc", "from_address": "bc1qxy2kgdygjrsq", "from_label": "Binance", "from_tag": "Exchange", "from_tag_color": "warning", "to_address": "bc1qm34lsc65zpw79", "to_label": "Unknown Wallet", "to_tag": "Unknown", "to_tag_color": "neutral", "value_usd": 121875000, "impact_score": 7.2}'::jsonb,
 NOW() - INTERVAL '15 minutes'),

('00000000-0000-0000-0000-000000000000', 'whale', 'high', 'SOL 1.5M deposited to Coinbase by FTX Estate',
 'FTX Estate liquidator moved 1.5M SOL ($210M) to Coinbase. Potential selling pressure on Solana.',
 '{"symbol": "SOL", "amount": 1500000, "usd_value": 210000000, "tx_hash": "0xsol003ghi", "from_address": "FTXestateLiqSOL01", "from_label": "FTX Estate", "from_tag": "Liquidator", "from_tag_color": "purple", "to_address": "CoinbaseSOLhot001", "to_label": "Coinbase", "to_tag": "Exchange", "to_tag_color": "warning", "value_usd": 210000000, "impact_score": 8.5, "impact_metrics": [{"label": "FTX SOL Remaining", "value": "41.2M SOL", "trend": "down"}, {"label": "SOL Exchange Balance", "value": "+3.2%", "trend": "up"}]}'::jsonb,
 NOW() - INTERVAL '6 hours'),

-- Risk alerts
('00000000-0000-0000-0000-000000000000', 'risk', 'high', 'Jupiter TVL dropped 12.5% in 24h',
 'Jupiter DEX TVL fell from $2.4B to $2.1B (-12.5%). Possible liquidity migration or protocol concern.',
 '{"protocol": "Jupiter", "tvl_before": 2400000000, "tvl_after": 2100000000, "change_pct": -12.5, "category": "DEX", "chains": ["Solana"], "impact_score": 7.6, "impact_metrics": [{"label": "Jupiter TVL", "value": "$2.1B", "trend": "down"}, {"label": "Solana DeFi TVL", "value": "$8.9B", "trend": "down"}, {"label": "DEX Volume 24h", "value": "$892M", "trend": "down"}], "wallet_history": [{"type": "TVL Drop", "age": "6h ago", "value": "-$140M"}, {"type": "TVL Drop", "age": "12h ago", "value": "-$92M"}, {"type": "TVL Stable", "age": "1d ago", "value": "+$12M"}, {"type": "TVL Growth", "age": "3d ago", "value": "+$85M"}]}'::jsonb,
 NOW() - INTERVAL '3 hours'),

('00000000-0000-0000-0000-000000000000', 'risk', 'critical', 'USDD peg deviation detected: $0.9845 (-1.55%)',
 'USDD trading at $0.9845, deviating 1.55% from $1.00 peg. Monitor for further depeg risk.',
 '{"stablecoin": "USDD", "current_price": 0.9845, "peg_deviation": -1.55, "is_depegged": true, "impact_score": 8.8, "impact_metrics": [{"label": "USDD Price", "value": "$0.9845", "trend": "down"}, {"label": "Peg Deviation", "value": "-1.55%", "trend": "down"}, {"label": "USDD Market Cap", "value": "$725M", "trend": "down"}]}'::jsonb,
 NOW() - INTERVAL '4 hours'),

('00000000-0000-0000-0000-000000000000', 'risk', 'medium', 'Aave V3 TVL declined 5.8% in 24h',
 'Aave V3 experienced $890M TVL outflow across Ethereum and Arbitrum. Market-wide deleveraging observed.',
 '{"protocol": "Aave", "tvl_change": -5.8, "outflow_usd": 890000000, "chains": ["Ethereum", "Arbitrum"]}'::jsonb,
 NOW() - INTERVAL '5 hours'),

('00000000-0000-0000-0000-000000000000', 'risk', 'high', 'Curve Finance pool imbalance detected',
 'Curve 3pool USDT/USDC/DAI ratio shifted to 45/30/25. USDT overweight suggests potential selling pressure.',
 '{"protocol": "Curve Finance", "pool": "3pool", "ratio": {"USDT": 45, "USDC": 30, "DAI": 25}, "normal_ratio": {"USDT": 33, "USDC": 33, "DAI": 34}, "impact_score": 7.4}'::jsonb,
 NOW() - INTERVAL '7 hours'),

('00000000-0000-0000-0000-000000000000', 'risk', 'medium', 'Lido stETH/ETH ratio at 0.9982 (-0.18%)',
 'Lido staked ETH slight discount vs ETH. Within normal range but monitoring for trend.',
 '{"protocol": "Lido", "ratio": 0.9982, "deviation": -0.18}'::jsonb,
 NOW() - INTERVAL '8 hours'),

-- Signal alerts (high confidence)
('00000000-0000-0000-0000-000000000000', 'price_signal', 'high', 'BTC — Oversold Bounce (92% confidence)',
 '7일 연속 하락 후 RSI 25 진입. 과매도 반등 가능성 높음. 200일 이동평균 지지.',
 '{"signal_type": "buy", "signal_name": "Oversold Bounce", "confidence": 92, "timeframe": "1D", "price_at_signal": 95200, "indicators": {"rsi_14": 25, "macd": "bullish_cross"}, "impact_score": 8.5, "impact_metrics": [{"label": "RSI (14)", "value": "25", "trend": "down"}, {"label": "MACD Signal", "value": "Bullish Cross", "trend": "up"}, {"label": "200 SMA Distance", "value": "-2.1%", "trend": "neutral"}]}'::jsonb,
 NOW() - INTERVAL '2 hours'),

('00000000-0000-0000-0000-000000000000', 'price_signal', 'high', 'SOL — Momentum Shift (90% confidence)',
 '24h -8.5% 급락 후 강한 반등 시작. 거래량 300% 급증 + MACD 골든크로스.',
 '{"signal_type": "buy", "signal_name": "Momentum Shift", "confidence": 90, "timeframe": "1D", "price_at_signal": 138, "indicators": {"volume_spike": 300, "macd": "golden_cross"}, "impact_score": 8.2}'::jsonb,
 NOW() - INTERVAL '30 minutes'),

('00000000-0000-0000-0000-000000000000', 'price_signal', 'medium', 'ETH — Strong Support (88% confidence)',
 'ETH $3,400 지지선 3번째 테스트 성공. 거래량 200% 증가.',
 '{"signal_type": "buy", "signal_name": "Strong Support", "confidence": 88, "timeframe": "1D", "price_at_signal": 3420}'::jsonb,
 NOW() - INTERVAL '1 hour'),

('00000000-0000-0000-0000-000000000000', 'price_signal', 'medium', 'APT — Strong Downtrend (78% confidence)',
 'Sustained decline: 24h -3.2%, 7d -8.5%. Confidence: 78%',
 '{"signal_type": "sell", "signal_name": "Strong Downtrend", "confidence": 78, "timeframe": "1D", "price_at_signal": 8.9, "impact_score": 6.8, "impact_metrics": [{"label": "24h Change", "value": "-3.2%", "trend": "down"}, {"label": "7d Change", "value": "-8.5%", "trend": "down"}, {"label": "Volume", "value": "+45%", "trend": "up"}]}'::jsonb,
 NOW() - INTERVAL '7 hours'),

('00000000-0000-0000-0000-000000000000', 'price_signal', 'high', 'ARB — L2 Dominance (85% confidence)',
 'Arbitrum L2 TVL 점유율 45% 돌파. DEX 거래량 120% 급증.',
 '{"signal_type": "buy", "signal_name": "L2 Dominance", "confidence": 85, "timeframe": "1D", "price_at_signal": 1.15}'::jsonb,
 NOW() - INTERVAL '3 hours'),

('00000000-0000-0000-0000-000000000000', 'price_signal', 'medium', 'FET — AI Token Leader (86% confidence)',
 'AI 토큰 섹터 리더. ASI 토큰 합병 기대감 + 실사용 증가.',
 '{"signal_type": "buy", "signal_name": "AI Token Leader", "confidence": 86, "timeframe": "1D", "price_at_signal": 2.3}'::jsonb,
 NOW() - INTERVAL '6 hours'),

-- Token unlock alerts
('00000000-0000-0000-0000-000000000000', 'token_unlock', 'high', 'OP unlock TOMORROW — 31.3M tokens ($65.2M)',
 '31,340,000 OP tokens ($65.2M) unlocking tomorrow. 2.9% of circulating supply. Category: Investor.',
 '{"token_symbol": "OP", "amount": 31340000, "usd_value": 65200000, "percent_of_supply": 2.9, "category": "investor", "days_until": 1, "impact_score": 8.1, "impact_metrics": [{"label": "Unlock Value", "value": "$65.2M", "trend": "neutral"}, {"label": "Supply Impact", "value": "2.9%", "trend": "up"}, {"label": "30d Avg Volume", "value": "$142M", "trend": "neutral"}], "wallet_history": [{"type": "Previous Unlock", "age": "30d ago", "value": "$45M (3.2% drop)"}, {"type": "Previous Unlock", "age": "60d ago", "value": "$38M (1.8% drop)"}, {"type": "Previous Unlock", "age": "90d ago", "value": "$52M (4.1% drop)"}]}'::jsonb,
 NOW() - INTERVAL '4 hours'),

('00000000-0000-0000-0000-000000000000', 'token_unlock', 'critical', 'ARB massive unlock in 5 days — 1.1B tokens ($1.27B)',
 '1,100,000,000 ARB tokens ($1.27B) unlocking in 5 days. 10.7% of circulating supply — highest impact unlock this month.',
 '{"token_symbol": "ARB", "amount": 1100000000, "usd_value": 1270000000, "percent_of_supply": 10.7, "category": "investor", "days_until": 5, "impact_score": 9.6, "impact_metrics": [{"label": "Unlock Value", "value": "$1.27B", "trend": "neutral"}, {"label": "Supply Impact", "value": "10.7%", "trend": "up"}, {"label": "Prior Unlock Impact", "value": "-6.2% avg", "trend": "down"}]}'::jsonb,
 NOW() - INTERVAL '2 hours'),

('00000000-0000-0000-0000-000000000000', 'token_unlock', 'medium', 'STRK unlock in 12 days — 64M tokens ($38.4M)',
 '64,000,000 STRK tokens ($38.4M) unlocking. Starknet team allocation.',
 '{"token_symbol": "STRK", "amount": 64000000, "usd_value": 38400000, "percent_of_supply": 3.5, "category": "team", "days_until": 12}'::jsonb,
 NOW() - INTERVAL '6 hours'),

('00000000-0000-0000-0000-000000000000', 'token_unlock', 'medium', 'APT unlock in 8 days — 11.3M tokens ($100.6M)',
 '11,310,000 APT tokens ($100.6M) unlocking. Core contributor vesting.',
 '{"token_symbol": "APT", "amount": 11310000, "usd_value": 100600000, "percent_of_supply": 2.8, "category": "team", "days_until": 8}'::jsonb,
 NOW() - INTERVAL '10 hours'),

-- Liquidity alerts
('00000000-0000-0000-0000-000000000000', 'liquidity', 'high', 'USDC-ETH pool TVL dropped 24% on Uniswap V3',
 'Uniswap V3 USDC-ETH pool TVL fell from $890M to $676M. Major LP withdrawal detected.',
 '{"pool": "USDC-ETH", "protocol": "Uniswap V3", "chain": "Ethereum", "tvl_before": 890000000, "tvl_after": 676400000, "change_pct": -24, "impact_score": 7.8, "impact_metrics": [{"label": "Pool TVL", "value": "$676M", "trend": "down"}, {"label": "LP Count", "value": "-12 LPs", "trend": "down"}, {"label": "Fee Revenue", "value": "-18%", "trend": "down"}]}'::jsonb,
 NOW() - INTERVAL '3 hours'),

('00000000-0000-0000-0000-000000000000', 'liquidity', 'medium', 'Suspicious APY spike on Curve stETH pool (142% APY)',
 'Curve stETH-ETH pool APY spiked to 142% from normal 4.2%. Potential exploit or abnormal activity.',
 '{"pool": "stETH-ETH", "protocol": "Curve", "chain": "Ethereum", "apy_current": 142, "apy_normal": 4.2, "tvl": 1200000000}'::jsonb,
 NOW() - INTERVAL '5 hours'),

('00000000-0000-0000-0000-000000000000', 'liquidity', 'medium', 'Raydium DEX volume surged 245% in 24h',
 'Raydium daily volume jumped from $312M to $1.07B. Solana memecoin activity driving surge.',
 '{"protocol": "Raydium", "volume_before": 312000000, "volume_after": 1076000000, "change_pct": 245, "trigger": "memecoin_activity"}'::jsonb,
 NOW() - INTERVAL '1 hour'),

-- Additional diverse alerts
('00000000-0000-0000-0000-000000000000', 'whale', 'medium', 'DOGE 500M withdrawn from Robinhood',
 '500,000,000 DOGE ($55M) moved from Robinhood to unknown wallet. Retail accumulation pattern.',
 '{"symbol": "DOGE", "amount": 500000000, "usd_value": 55000000}'::jsonb,
 NOW() - INTERVAL '2 hours'),

('00000000-0000-0000-0000-000000000000', 'whale', 'high', 'BTC 6,200 moved by BlackRock iShares ETF',
 'BlackRock iShares Bitcoin ETF moved 6,200 BTC ($604.5M) to Coinbase Custody. Routine rebalancing.',
 '{"symbol": "BTC", "amount": 6200, "usd_value": 604500000, "from_label": "BlackRock iShares ETF", "to_label": "Coinbase Custody"}'::jsonb,
 NOW() - INTERVAL '14 hours'),

('00000000-0000-0000-0000-000000000000', 'risk', 'medium', 'Maker DAI supply decreased 8.2% in 7 days',
 'MakerDAO DAI supply shrinking as users repay vaults. DSR rate adjustment expected.',
 '{"protocol": "MakerDAO", "dai_supply_change": -8.2, "current_supply": 4200000000}'::jsonb,
 NOW() - INTERVAL '9 hours'),

('00000000-0000-0000-0000-000000000000', 'price_signal', 'medium', 'MATIC — Polygon 2.0 Rally (87% confidence)',
 'Polygon 2.0 로드맵 발표 이후 네트워크 활동 급증. ZK 채택 확대.',
 '{"signal_type": "buy", "signal_name": "Polygon 2.0 Rally", "confidence": 87, "timeframe": "1D", "price_at_signal": 0.92}'::jsonb,
 NOW() - INTERVAL '5 hours'),

('00000000-0000-0000-0000-000000000000', 'liquidity', 'high', 'PancakeSwap BSC TVL dropped 18% after exploit rumor',
 'PancakeSwap V3 BSC pools experienced $240M outflow. Community reporting unverified exploit claims.',
 '{"protocol": "PancakeSwap", "chain": "BSC", "tvl_change": -18, "outflow": 240000000}'::jsonb,
 NOW() - INTERVAL '4 hours');

-- ═══════════════════════════════════════════════════════════════════
-- 4. UPDATE token_unlocks with more upcoming events
-- ═══════════════════════════════════════════════════════════════════
DELETE FROM token_unlocks;
INSERT INTO token_unlocks (token_symbol, token_name, unlock_date, amount, usd_value_estimate, percent_of_supply, category, impact_score, created_at) VALUES
('OP', 'Optimism', NOW() + INTERVAL '1 day', 31340000, 65200000, 2.9, 'investor', 8.1, NOW()),
('ARB', 'Arbitrum', NOW() + INTERVAL '5 days', 1100000000, 1270000000, 10.7, 'investor', 9.6, NOW()),
('APT', 'Aptos', NOW() + INTERVAL '8 days', 11310000, 100600000, 2.8, 'team', 7.8, NOW()),
('STRK', 'Starknet', NOW() + INTERVAL '12 days', 64000000, 38400000, 3.5, 'team', 6.2, NOW()),
('SUI', 'Sui', NOW() + INTERVAL '3 days', 65000000, 92300000, 2.1, 'investor', 7.5, NOW()),
('TIA', 'Celestia', NOW() + INTERVAL '10 days', 18500000, 170200000, 5.4, 'investor', 8.8, NOW()),
('SEI', 'Sei', NOW() + INTERVAL '15 days', 150000000, 67500000, 4.2, 'ecosystem', 6.9, NOW()),
('PYTH', 'Pyth Network', NOW() + INTERVAL '7 days', 250000000, 87500000, 3.8, 'ecosystem', 7.2, NOW()),
('JTO', 'Jito', NOW() + INTERVAL '20 days', 25000000, 62500000, 6.1, 'investor', 8.0, NOW()),
('WLD', 'Worldcoin', NOW() + INTERVAL '2 days', 53000000, 106000000, 4.5, 'team', 8.3, NOW()),
('DYDX', 'dYdX', NOW() + INTERVAL '18 days', 33000000, 82500000, 3.9, 'investor', 7.1, NOW()),
('IMX', 'Immutable X', NOW() + INTERVAL '14 days', 45000000, 58500000, 2.7, 'ecosystem', 5.8, NOW()),
('MANTA', 'Manta Network', NOW() + INTERVAL '25 days', 120000000, 96000000, 8.2, 'investor', 8.9, NOW()),
('PIXEL', 'Pixels', NOW() + INTERVAL '6 days', 80000000, 16000000, 5.0, 'team', 5.5, NOW()),
('ALT', 'AltLayer', NOW() + INTERVAL '22 days', 200000000, 52000000, 7.5, 'investor', 7.8, NOW());

-- ═══════════════════════════════════════════════════════════════════
-- 5. UPDATE defi_protocols with richer data
-- ═══════════════════════════════════════════════════════════════════
DELETE FROM defi_protocols;
INSERT INTO defi_protocols (protocol_name, slug, tvl, tvl_change_24h, tvl_change_7d, category, chains, last_updated) VALUES
('Lido', 'lido', 32800000000, 1.2, 3.4, 'Liquid Staking', ARRAY['Ethereum', 'Polygon', 'Solana'], NOW()),
('Aave', 'aave', 18200000000, -5.8, -2.1, 'Lending', ARRAY['Ethereum', 'Arbitrum', 'Polygon', 'Optimism', 'Avalanche', 'Base'], NOW()),
('MakerDAO', 'makerdao', 8900000000, -1.4, -8.2, 'CDP', ARRAY['Ethereum'], NOW()),
('EigenLayer', 'eigenlayer', 14500000000, 2.8, 5.6, 'Restaking', ARRAY['Ethereum'], NOW()),
('Uniswap', 'uniswap', 6200000000, 0.8, 1.5, 'DEX', ARRAY['Ethereum', 'Arbitrum', 'Polygon', 'Optimism', 'Base', 'BSC'], NOW()),
('Rocket Pool', 'rocket-pool', 4800000000, -0.3, 0.9, 'Liquid Staking', ARRAY['Ethereum'], NOW()),
('Compound', 'compound', 3200000000, -2.1, -3.8, 'Lending', ARRAY['Ethereum', 'Arbitrum', 'Base'], NOW()),
('Curve Finance', 'curve-finance', 2800000000, -3.5, -6.2, 'DEX', ARRAY['Ethereum', 'Arbitrum', 'Polygon', 'Avalanche'], NOW()),
('Jupiter', 'jupiter', 2100000000, -12.5, -8.9, 'DEX', ARRAY['Solana'], NOW()),
('Raydium', 'raydium', 1900000000, 4.2, 12.8, 'DEX', ARRAY['Solana'], NOW()),
('PancakeSwap', 'pancakeswap', 2600000000, -18.0, -14.5, 'DEX', ARRAY['BSC', 'Ethereum', 'Arbitrum'], NOW()),
('Jito', 'jito', 3500000000, 1.8, 4.2, 'Liquid Staking', ARRAY['Solana'], NOW()),
('Morpho', 'morpho', 2200000000, 3.1, 7.5, 'Lending', ARRAY['Ethereum', 'Base'], NOW()),
('Pendle', 'pendle', 1800000000, -1.2, 2.8, 'Yield', ARRAY['Ethereum', 'Arbitrum'], NOW()),
('GMX', 'gmx', 820000000, -0.8, -1.5, 'Derivatives', ARRAY['Arbitrum', 'Avalanche'], NOW()),
('dYdX', 'dydx', 560000000, 1.5, 3.2, 'Derivatives', ARRAY['dYdX Chain'], NOW()),
('Convex Finance', 'convex-finance', 1200000000, -0.5, -2.1, 'Yield', ARRAY['Ethereum'], NOW()),
('Instadapp', 'instadapp', 3100000000, 0.3, 1.8, 'Lending', ARRAY['Ethereum', 'Arbitrum', 'Polygon'], NOW()),
('Spark', 'spark', 4200000000, 1.1, 2.5, 'Lending', ARRAY['Ethereum', 'Gnosis'], NOW()),
('Blast', 'blast', 1400000000, -2.8, -5.1, 'L2/Yield', ARRAY['Blast'], NOW());

-- ═══════════════════════════════════════════════════════════════════
-- 6. UPDATE stablecoin_status
-- ═══════════════════════════════════════════════════════════════════
DELETE FROM stablecoin_status;
INSERT INTO stablecoin_status (symbol, name, current_price, peg_deviation, is_depegged, last_updated) VALUES
('USDT', 'Tether', 0.9998, -0.02, false, NOW()),
('USDC', 'USD Coin', 1.0001, 0.01, false, NOW()),
('DAI', 'Dai', 0.9995, -0.05, false, NOW()),
('FRAX', 'Frax', 0.9990, -0.10, false, NOW()),
('TUSD', 'TrueUSD', 0.9978, -0.22, false, NOW()),
('FDUSD', 'First Digital USD', 1.0003, 0.03, false, NOW()),
('USDD', 'USDD', 0.9845, -1.55, true, NOW()),
('PYUSD', 'PayPal USD', 0.9997, -0.03, false, NOW()),
('GHO', 'GHO', 0.9988, -0.12, false, NOW()),
('crvUSD', 'Curve USD', 0.9993, -0.07, false, NOW());

-- ═══════════════════════════════════════════════════════════════════
-- 7. UPDATE dex_volumes with top 15 DEXes
-- ═══════════════════════════════════════════════════════════════════
DELETE FROM dex_volumes;
INSERT INTO dex_volumes (protocol_name, daily_volume, volume_change_24h, total_tvl, chains, last_updated) VALUES
('Uniswap', 2450000000, 12.5, 6200000000, ARRAY['Ethereum', 'Arbitrum', 'Polygon', 'Optimism', 'Base', 'BSC'], NOW()),
('Raydium', 1076000000, 245.0, 1900000000, ARRAY['Solana'], NOW()),
('PancakeSwap', 812000000, -8.3, 2600000000, ARRAY['BSC', 'Ethereum', 'Arbitrum'], NOW()),
('Jupiter', 965000000, -15.2, 2100000000, ARRAY['Solana'], NOW()),
('Orca', 420000000, 32.1, 580000000, ARRAY['Solana'], NOW()),
('Curve', 380000000, -5.8, 2800000000, ARRAY['Ethereum', 'Arbitrum', 'Polygon', 'Avalanche'], NOW()),
('Trader Joe', 195000000, 18.4, 320000000, ARRAY['Avalanche', 'Arbitrum', 'BSC'], NOW()),
('SushiSwap', 142000000, -12.1, 450000000, ARRAY['Ethereum', 'Arbitrum', 'Polygon'], NOW()),
('Aerodrome', 285000000, 45.6, 1200000000, ARRAY['Base'], NOW()),
('Velodrome', 98000000, 8.2, 380000000, ARRAY['Optimism'], NOW()),
('Camelot', 76000000, -3.5, 210000000, ARRAY['Arbitrum'], NOW()),
('Maverick', 65000000, 22.8, 180000000, ARRAY['Ethereum', 'Base'], NOW()),
('DODO', 112000000, 15.3, 260000000, ARRAY['Ethereum', 'BSC', 'Arbitrum', 'Polygon'], NOW()),
('Balancer', 156000000, -2.1, 890000000, ARRAY['Ethereum', 'Arbitrum', 'Polygon', 'Avalanche'], NOW()),
('Ambient', 48000000, 78.5, 145000000, ARRAY['Ethereum', 'Scroll'], NOW());

-- ═══════════════════════════════════════════════════════════════════
-- 8. UPDATE liquidity_pools with 25 diverse pools
-- ═══════════════════════════════════════════════════════════════════
DELETE FROM liquidity_pools;
INSERT INTO liquidity_pools (pool_name, protocol, chain, tvl, apy, apy_base, apy_reward, tvl_change_24h, is_stablecoin, risk_level, last_updated) VALUES
('WETH-USDC', 'Uniswap V3', 'Ethereum', 676400000, 18.5, 12.3, 6.2, -24.0, false, 'medium', NOW()),
('WBTC-WETH', 'Uniswap V3', 'Ethereum', 445000000, 8.2, 8.2, 0, -2.1, false, 'low', NOW()),
('USDC-USDT', 'Uniswap V3', 'Ethereum', 320000000, 4.8, 4.8, 0, -0.5, true, 'low', NOW()),
('stETH-ETH', 'Curve', 'Ethereum', 1200000000, 142.0, 3.8, 138.2, 1.2, false, 'high', NOW()),
('3pool (USDT/USDC/DAI)', 'Curve', 'Ethereum', 890000000, 3.2, 2.1, 1.1, -3.8, true, 'low', NOW()),
('SOL-USDC', 'Raydium', 'Solana', 245000000, 45.2, 28.5, 16.7, 18.5, false, 'medium', NOW()),
('JitoSOL-SOL', 'Orca', 'Solana', 189000000, 7.8, 7.8, 0, 2.3, false, 'low', NOW()),
('WETH-USDC', 'Aerodrome', 'Base', 156000000, 32.5, 8.2, 24.3, 12.8, false, 'low', NOW()),
('CAKE-BNB', 'PancakeSwap', 'BSC', 312000000, 22.1, 12.5, 9.6, -18.0, false, 'high', NOW()),
('USDT-BNB', 'PancakeSwap', 'BSC', 198000000, 15.8, 8.4, 7.4, -15.2, false, 'medium', NOW()),
('WETH-ARB', 'Camelot', 'Arbitrum', 78000000, 28.4, 15.2, 13.2, 5.6, false, 'low', NOW()),
('USDC-DAI', 'Curve', 'Ethereum', 245000000, 2.8, 2.8, 0, -1.2, true, 'low', NOW()),
('FRAX-USDC', 'Curve', 'Ethereum', 156000000, 5.5, 3.2, 2.3, -2.8, true, 'low', NOW()),
('GHO-USDC', 'Uniswap V3', 'Ethereum', 89000000, 8.2, 4.5, 3.7, 3.5, true, 'low', NOW()),
('WETH-OP', 'Velodrome', 'Optimism', 65000000, 35.2, 12.8, 22.4, 4.2, false, 'low', NOW()),
('WMATIC-USDC', 'Uniswap V3', 'Polygon', 112000000, 12.4, 8.1, 4.3, -1.5, false, 'low', NOW()),
('AVAX-USDC', 'Trader Joe', 'Avalanche', 67000000, 19.8, 11.2, 8.6, 6.8, false, 'low', NOW()),
('BONK-SOL', 'Raydium', 'Solana', 34000000, 85.2, 65.4, 19.8, 45.2, false, 'high', NOW()),
('WIF-SOL', 'Raydium', 'Solana', 28000000, 120.5, 95.2, 25.3, 68.5, false, 'high', NOW()),
('USDD-USDT', 'Curve', 'Ethereum', 42000000, 52.8, 2.1, 50.7, -32.5, true, 'high', NOW()),
('PEPE-WETH', 'Uniswap V3', 'Ethereum', 56000000, 95.2, 85.4, 9.8, 35.2, false, 'high', NOW()),
('cbETH-WETH', 'Uniswap V3', 'Ethereum', 234000000, 4.5, 4.5, 0, 0.8, false, 'low', NOW()),
('rETH-WETH', 'Balancer', 'Ethereum', 312000000, 3.8, 3.8, 0, 0.2, false, 'low', NOW()),
('WETH-USDC', 'Maverick', 'Ethereum', 89000000, 22.5, 14.8, 7.7, 8.5, false, 'low', NOW()),
('crvUSD-USDC', 'Curve', 'Ethereum', 178000000, 6.2, 4.1, 2.1, -0.8, true, 'low', NOW());
