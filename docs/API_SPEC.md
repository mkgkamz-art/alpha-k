# API_SPEC.md — 엔드포인트 명세

## Alerts
GET  /api/alerts?type=&severity=&cursor= (무한스크롤)
GET  /api/alerts/[id]
GET  /api/alerts/trending (24h)
GET  /api/alerts/whale-movements (24h inflow/outflow)

## Watchlist
GET    /api/watchlist
POST   /api/watchlist {token_symbol, chain}
DELETE /api/watchlist/[id]
PATCH  /api/watchlist/[id] (mute 토글)

## Rules
GET    /api/rules
POST   /api/rules (Free 3개 제한)
PATCH  /api/rules/[id]
DELETE /api/rules/[id]
POST   /api/rules/[id]/test

## Signals
GET /api/signals?chain=&timeframe=&type= (tier 필터링)
GET /api/signals/performance (30일)

## Unlocks
GET /api/unlocks?range=7d|30d|90d

## DeFi
GET /api/defi/stablecoins
GET /api/defi/protocols
GET /api/defi/risk-events

## Settings
GET   /api/settings
PATCH /api/settings
POST  /api/settings/telegram/connect
POST  /api/settings/telegram/test
POST  /api/settings/discord/test

## Payments (Lemon Squeezy)
POST /api/checkout (Lemon Squeezy Checkout URL 생성)
POST /api/webhooks/lemonsqueezy (subscription_created, subscription_updated, subscription_cancelled, subscription_payment_success)
POST /api/webhooks/telegram

## Cron
GET /api/cron/fetch-prices (매1분)
GET /api/cron/check-stablecoins (매1분)
GET /api/cron/update-defi-health (매5분)
GET /api/cron/fetch-token-unlocks (매일)
GET /api/cron/email-digest (매일)
GET /api/cron/signal-generator (매4시간)
