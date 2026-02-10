# BLOCKCHAIN.md — 온체인 데이터 수집 명세

## 데이터 소스
| 체인 | Provider | 방식 | 용도 |
| Ethereum | Alchemy SDK | WebSocket | 대규모 전송, LP이벤트 |
| Solana | Helius | WebSocket | 대규모 전송 |
| Multi | DeFiLlama API | REST 5분 | 프로토콜 TVL |
| Stable | Chainlink+CoinGecko | REST 15초 | 가격 피드 |
| Unlock | TokenUnlocks API | REST 1일 | 언락 스케줄 |

## Whale 감지 기준
ETH: ≥100 ETH, ERC-20: ≥$500K, SOL: ≥10K SOL

## 거래소 분류
핫월렛 100개+: Binance/Coinbase/Upbit/Bithumb/OKX/Bybit/Kraken/Bitfinex
Inflow(→거래소)=잠재 매도, Outflow(거래소→)=잠재 매수

## Whale Tracker 프로세스
1. WebSocket 대규모 전송 감지
2. From/To 라벨 DB 조회
3. watchlist 유저 필터링
4. alert_rules 조건 매칭
5. alert_events INSERT + 알림 발송

## DeFi Monitor
스테이블: 0.5%이탈=warning, 2%이탈=critical
TVL: 10%급감=warning, 30%급감=critical
LP: Uniswap v3 Burn ≥$500K = 알림

## 지갑 라벨: {address, chain, label, type, source, confidence}
type: exchange/whale/fund/protocol/bridge

## 에러: WebSocket 재연결 exp backoff(1s→60s max)
Rate limit: Alchemy 330CU/s, Helius 50RPS
에러 → Sentry
