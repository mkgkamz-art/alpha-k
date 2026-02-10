# DESIGN_TOKENS.md - Stitch Tailwind Tokens

> Extracted from 12 Stitch screens (src/design-references/01-12)

## Colors

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| primary | #F0B90B | CTA, active, accent |
| background-dark | #0B0E11 | Page background |
| background-light | #F8F8F5 | Marketing pages |
| card-dark | #1E2329 | Cards, sidebar, inputs |
| surface-alt | #161A1E | Table stripe rows |
| border-dark | #2B3139 | Borders, dividers |

### Text

| Token | Hex | Usage |
|---|---|---|
| text-primary | #EAECEF | Headings, body |
| text-secondary | #848E9C | Labels, hints |
| text-muted | #474D57 | Disabled, disclaimers |

### Signal

| Token | Hex | Usage |
|---|---|---|
| danger | #F6465D | Loss, risk, critical |
| success | #0ECB81 | Gain, active, connected |
| warning | #F0B90B | Caution (= primary) |
| whale-blue | #1E88E5 | Info, whale tracking |

## Typography

fontFamily:
  display: [Inter, sans-serif]
  mono: [JetBrains Mono, monospace]

## Border Radius

  DEFAULT: 0.25rem (4px)
  lg: 0.5rem (8px)
  xl: 0.75rem (12px)
  full: 9999px

## Layout

- Sidebar: 240px, border-r border-dark
- Top Bar: h-16, sticky top-0 z-50
- Content: max-w-[1440px] p-8
- Wizard: max-w-[720px]

## Scrollbar

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0B0E11; }
  ::-webkit-scrollbar-thumb { background: #2B3139; }

## Component Patterns

### Progress Stepper (3 steps)
- Active: bg-primary text-background-dark ring-4 ring-primary/20
- Done: bg-success text-white + check icon
- Pending: bg-card-dark border-2 border-border-dark

### Toggle Switch
- w-10 h-5 bg-gray-700 rounded-full
- Checked: bg-primary, dot translate-x-full

### Signal Card (Trading Signals)
- Left border: border-l-[3px] border-l-trading-green (Buy) / trading-red (Sell)
- Confidence ring: SVG circle with stroke-dashoffset

### Pricing Card
- Normal: border border-border-dark
- Popular: border-2 border-primary + -translate-y-2 + badge
- Whale: border border-whale-blue

## Tailwind Config (Consolidated)

  darkMode: class
  colors:
    primary: #F0B90B
    background-light: #F8F8F5
    background-dark: #0B0E11
    card-dark: #1E2329
    surface-alt: #161A1E
    border-dark: #2B3139
    text-primary: #EAECEF
    text-secondary: #848E9C
    text-muted: #474D57
    success: #0ECB81
    danger: #F6465D
    warning: #F0B90B
    whale-blue: #1E88E5
  fontFamily:
    display: [Inter, sans-serif]
    mono: [JetBrains Mono, monospace]
  borderRadius:
    DEFAULT: 0.25rem
    lg: 0.5rem
    xl: 0.75rem
    full: 9999px

## Screen primary Variants (Reference)

| Screens | Value | Note |
|---|---|---|
| 01, 02, 03, 12 | #F0B90B | Standard |
| 04, 07-11 | #efba0b | Stitch variation |
| 05 | #f4bc06 | Stitch variation |
| 06 | #f0b90b | Lowercase same |

Project standard: #F0B90B
