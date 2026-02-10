# NOTIFICATIONS.md — 알림 시스템 명세

## 발송 흐름
온체인 이벤트 감지 → alert_events INSERT → dispatcher 호출
→ delivery_channels 확인 → Quiet Hours 체크 → Rate Limit 체크
→ Cooldown 체크 → 채널별 발송 → delivered_via 업데이트

## Telegram Bot
커맨드: /start [코드], /status, /mute [1h|4h|24h], /unmute, /watchlist, /help
연결: 웹에서 6자리 코드 발급(5분) → /start 코드 → 검증 → chat_id 저장

메시지 (MarkdownV2):
🐋 *Whale Alert*
*15,000 ETH ($52.8M) → Binance*
From: `0x7a25...3f2d` (Whale #2847)
Severity: 🔴 CRITICAL
[View Details](https://alert.blosafe.io/alerts/xxx)

## Discord Webhook
Embed: color=severity, title, fields(From/To/Severity), footer, timestamp
Rate: 30 msg/min per webhook

## Push: Web Push VAPID
## Email: Resend API, 실시간 개별 OR 일간 다이제스트
## SMS: Twilio, Whale전용, Critical만, 일5건

## 공통: 실패시 3회 재시도(지수백오프), 결과 delivered_via 기록
