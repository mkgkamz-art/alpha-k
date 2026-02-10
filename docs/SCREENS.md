# SCREENS.md — 12개 화면 명세 (Stitch MCP 생성용)

## Screen 1: Dashboard — Alert Feed (메인)
레이아웃: 사이드바(240px) + 상단바(56px) + 메인 3단
A) 상태바(48px): BTC/ETH/Gas/ActiveAlerts 수평 스크롤 모노스페이스
B) Alert Feed(좌 65%): 알림 카드 스택 6-7개, 무한 스크롤
   카드: 좌 타입아이콘 | 중앙 제목+설명+태그 | 우 Severity+북마크+시간
   좌측 border 3px = severity 색
C) 사이드패널(우 35%): Trending(5토큰+스파크라인) + Whale Movements 바차트
모바일: 사이드패널 숨김, 탭 필터 수평 스크롤, 하단nav

## Screen 2: Alert Detail
Breadcrumb + 알림헤더(아이콘+제목+시간+Severity+공유)
Transaction Details(2열): From/To 주소+라벨, Amount, TxHash, Block
Context 패널: 지갑이력, 30일차트, 유사월렛 동향
Impact Analysis: Score 7.2/10 바 + 3박스(4h/24h/Recovery)
Related Alerts 수평 스크롤

## Screen 3: Watchlist
헤더: "My Watchlist (12)" + AddToken + 필터/정렬
테이블: #, Token, Price, 24h%, AlertCount, LastAlert, WhaleActivity, Rules, Actions
8-10행, 교대배경, 정렬 가능
하단 QuickStats 3개

## Screen 4: Alert Rule — Step 1 (Type 선택)
Progress Bar 3단계, Step1 active
5개 타입 카드 그리드: whale/risk/price_signal/unlock/liquidity
선택=gold border, 미선택=#2B3139 border
하단 Cancel + Next→

## Screen 5: Alert Rule — Step 2 (Conditions)
타입별 조건 폼. Whale: Token드롭다운, MinAmount, Direction 버튼그룹,
WalletLabel 멀티셀렉트, Cooldown 드롭다운

## Screen 6: Alert Rule — Step 3 (Delivery)
채널별 토글 카드: Push/Telegram/Discord/Email/SMS(Whale전용 잠금)
각 채널 연결상태 + Test 버튼
알림 미리보기 카드
하단 ←Back + "Create Alert Rule" 버튼

## Screen 7: Trading Signals
필터: Chain/Timeframe(4H/1D/1W)/Type(Buy/Sell)
Signal 카드 3열: Buy(green border)/Sell(red border)
Confidence%, Entry/Target/StopLoss, Basis 태그, WinRate
하단 Performance 30일 + 면책문구

## Screen 8: Token Unlocks
상단 4스탯: 이번주수/총가치/최고임팩트/내워치
List View(기본): 날짜별 타임라인, UnlockCard
Calendar View: 월간달력 토큰아이콘

## Screen 9: DeFi Risk Monitor
RiskStatus 배너(critical=빨강/normal=초록)
Stablecoin 테이블: Symbol/Peg/Range/Deviation/Reserve/Status
Protocol Health 카드(2열): TVL/Risk/Audit/Anomaly
Recent Risk Events 리스트 10건

## Screen 10: Pricing (퍼블릭, 사이드바 없음)
마케팅 TopNav + "Know Before the Market Moves"
3카드: Free($0)#2B3139 / Pro($19.99)gold"POPULAR" / Whale($99)blue
FAQ 아코디언 5개

## Screen 11: Settings — Notifications
탭: Profile/Notifications/Integrations/APIKeys/Billing
Global: QuietHours/MaxAlerts/Sound
Channel: Telegram/Discord/Email/SMS 연결상태
AlertType×Channel 매트릭스 토글 그리드

## Screen 12: Mobile Views (390px)
12-A Feed: 상단바+가격pills+탭필터+컴팩트카드+하단nav+FAB
12-B Detail: 뒤로+Severity배너+큰아이콘+TxInfo+Impact+액션버튼
