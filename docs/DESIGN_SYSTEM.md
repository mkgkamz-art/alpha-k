# DESIGN_SYSTEM.md — 디자인 시스템 명세

## Stitch MCP 생성 시 반드시 포함할 컨텍스트

모든 generate_screen_from_text 호출에 아래를 포함:

"Dark theme only. Background #0B0E11, cards #1E2329.
No gradients, no glow, no 3D, no glassmorphism.
Colors only for data states: red=#F6465D, green=#0ECB81,
yellow=#F0B90B, blue=#1E88E5.
Gold #F0B90B for CTA buttons and active states only.
Font: Inter for text, monospace for numbers.
Data-dense layout like Bloomberg/Nansen. No decorative illustrations.
Cards: #1E2329 bg, #2B3139 border, 8px radius, 16px padding."

## Button 토큰
| Variant | BG | Text | Hover |
| primary | #F0B90B | #0B0E11 | #D4A30A |
| secondary | #1E88E5 | #FFF | #1976D2 |
| outline | transparent | #EAECEF | bg #1E2329 |
| ghost | transparent | #848E9C | bg #1E2329 |
| danger | #F6465D | #FFF | #D43B4F |

## Badge (Severity) 토큰
| Variant | BG | Text |
| critical | #F6465D20 | #F6465D |
| high | #FF8C0020 | #FF8C00 |
| medium | #F0B90B20 | #F0B90B |
| low | #474D5720 | #848E9C |

## Alert Type 아이콘
| Type | lucide Icon | Color | Emoji |
| whale | Waves | #1E88E5 | 🐋 |
| risk | AlertTriangle | #F6465D | ⚠️ |
| price_signal | TrendingUp | #0ECB81 | 📈 |
| token_unlock | Unlock | #F0B90B | 🔓 |
| liquidity | Droplets | #8B5CF6 | 💧 |

## Card
bg: #1E2329, border: 1px #2B3139, radius: 8px, padding: 16px
hover: border #3B4149

## Input
bg: #2B3139, border: 1px #474D57, radius: 6px
focus: border #F0B90B, ring 1px #F0B90B40
placeholder: #474D57

## Layout Breakpoints
| mobile <768 | tablet 768-1023 | desktop 1024-1439 | wide ≥1440 |
| 하단nav, 1열 | 축소사이드바 64px | 사이드바 240px | 240px+사이드패널 |

## Sidebar
너비: 240px/64px, bg: #0B0E11
Active: left 3px #F0B90B + bg #1E2329
아이콘: lucide-react 20px, #848E9C(기본)/#EAECEF(활성)

## Mobile Bottom Nav
높이: 56px, bg: #0B0E11, top border 1px #2B3139
5탭: Home/Alerts/Watchlist/Signals/More
Active: #F0B90B
