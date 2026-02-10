# CLAUDE.md — BLOSAFE Smart Alert Platform

## 프로젝트 개요
온체인 고래 움직임 + DeFi 이상 징후 + 가격 시그널을 실시간 알림하는
리테일 크립토 인텔리전스 플랫폼.
Nansen 벤치마크. 리테일 가격($19~$99/월)과 직관적 UX가 차별점.

## 기술 스택 (절대 변경 금지)
- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS 4 (다크 테마 전용)
- State: Zustand
- Data Fetching: TanStack Query v5
- DB: Supabase (PostgreSQL + Realtime + Auth)
- Payments: Lemon Squeezy (MoR) + Webhooks
- Deploy: Vercel
- Package Manager: pnpm

## 디자인 절대 원칙 — "AI스러운 디자인" 전면 금지

절대 쓰지 않을 것:
- 보라-파랑 그라디언트 배경
- 네온 글로우/발광 효과
- 로봇/뇌/신경망 일러스트
- "AI-Powered", "Smart", "Intelligent" 배지
- 둥글둥글한 3D 아이콘
- 과도한 블러/글래스모피즘
- 무의미한 파티클/애니메이션 배경
- 선형 그라디언트 카드 배경

지향하는 디자인:
- Bloomberg Terminal의 데이터 밀도
- Nansen의 깔끔한 카드 레이아웃
- TradingView의 실용적 차트 UI
- 다크 테마 기본 (트레이더 눈 피로도 감소)
- 컬러는 데이터 상태 표현에만 사용
- 여백으로 정보 계층 구분

## 컬러 토큰

bg-primary: #0B0E11        bg-secondary: #1E2329
bg-tertiary: #2B3139       text-primary: #EAECEF
text-secondary: #848E9C    text-disabled: #474D57
signal-danger: #F6465D     signal-success: #0ECB81
signal-warning: #F0B90B    signal-info: #1E88E5
accent-primary: #F0B90B    accent-secondary: #1E88E5
border-default: #2B3139    border-active: #F0B90B

## 타이포그래피
- UI: Inter (영문), Pretendard (한국어)
- 숫자: JetBrains Mono
- Scale: xs=11 sm=13 base=14 lg=16 xl=20 2xl=28 3xl=36

## 코딩 규칙
- TypeScript strict + proper interface
- React Server Components 우선, 클라이언트는 "use client"
- forwardRef 패턴
- Tailwind 클래스만 (인라인 스타일 금지)
- tailwind-merge + clsx
- 접근성 aria 속성 필수
- 모바일 터치 최소 44px
- 파일당 컴포넌트 1개 + barrel export

## MCP 사용 규칙
- 디자인 생성: @stitch
- 디자인 → 코드: @figma (Figma 링크 참조)
- DB 작업: @supabase
- 최신 문서: @context7
- Git: @github
- 결제: @lemonsqueezy

## 폴더 구조
src/
├── app/(auth)/ (dashboard)/ (marketing)/ api/
├── components/ui/ alerts/ signals/ layout/ charts/
├── lib/supabase/ lemonsqueezy/ blockchain/ notifications/ telegram/ discord/
├── hooks/ stores/ types/ utils/

## 구독 티어
| 기능 | Free | Pro $19/mo | Whale $99/mo |
| Alert Rules | 3 | ∞ | ∞ |
| 딜레이 | 5분 | 실시간 | <10초 |
| Signal TF | — | 1D | 4H/1D/1W |
| Telegram | ✗ | ✓ | ✓ |
| Discord | ✗ | ✓ | ✓ |
| SMS | ✗ | ✗ | ✓ |
| API | ✗ | 1K/일 | ∞ |