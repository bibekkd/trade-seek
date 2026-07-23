# TradeSeek Design System
> Reverse-engineered from premium fintech/trading dashboard references (Linear × Coinbase × Apple × Vercel aesthetic)

---

# Overview

This document defines the complete visual language of TradeSeek.

The goal is **not to copy another product**, but to recreate the same premium feeling:

- Minimal
- Spacious
- Professional
- Investor-ready
- Modern Fintech
- Card-first
- Data-focused
- Dark UI

The entire application should feel calm instead of flashy.

---

# Design Philosophy

Keywords:

- Premium
- Confident
- Clean
- Calm
- Analytical
- Spacious
- Professional
- Fast
- Modern
- Data-first

The UI should never feel crowded.

Every section must breathe.

The user should immediately understand where to look.

---

# Design Pattern

This UI is a combination of:

- Bento Dashboard
- Card UI
- Soft Minimalism
- Dark Fintech
- Layered Components
- Widget-first Layout
- Spacious Design

---

# Grid System

Desktop

```
12 Column Grid

Gap:
24px

Container Width:
1440px

Content Width:
1320px
```

Large cards

```
8 Columns
```

Right Sidebar

```
4 Columns
```

Mobile

Single column

Tablet

2 column layout

---

# Spacing System

Everything follows **8pt Grid**

Never invent random spacing.

Spacing Scale

```
4
8
12
16
20
24
32
40
48
64
80
96
```

Component Padding

Cards

```
24px
```

Large Cards

```
32px
```

Inputs

```
16px
```

Buttons

```
14px vertical
24px horizontal
```

Navbar

```
32px
```

Gap Between Cards

```
24px
```

Gap Between Sections

```
40px
```

---

# Border Radius

Small

```
12px
```

Inputs

```
16px
```

Cards

```
24px
```

Large Widget

```
28px
```

Floating Panels

```
32px
```

Avatar

```
999px
```

Buttons

```
999px
```

Never use sharp corners.

---

# Colors

Background

```
#0E1117
```

Secondary Background

```
#171B22
```

Card

```
#1A1F27
```

Card Hover

```
#202631
```

Border

```
rgba(255,255,255,.06)
```

Text Primary

```
#FFFFFF
```

Secondary

```
#A3A8B3
```

Muted

```
#6F7787
```

Green

```
#B7D65C
```

Positive

```
#58D68D
```

Negative

```
#FF6B6B
```

Purple Accent

```
#8A5CF6
```

Blue Accent

```
#60A5FA
```

Orange

```
#F5A623
```

Never use saturated colors everywhere.

Only highlights.

---

# Typography

## Font

Recommended

```
Geist
```

Alternative

```
Inter
```

Apple Platforms

```
SF Pro Display
```

Weight

```
400
500
600
700
```

---

# Font Scale

Hero Balance

```
56px

700

Line Height
1.05
```

Price

```
48px

700
```

Card Heading

```
30px

600
```

Widget Numbers

```
40px

700
```

Section Title

```
22px

600
```

Body

```
16px

400
```

Secondary

```
14px

400
```

Metadata

```
13px

400
```

Tiny Labels

```
12px

500
```

Navigation

```
15px

500
```

Button

```
15px

600
```

Letter spacing

```
-0.02em
```

Numbers

Use

```
font-variant-numeric: tabular-nums;
```

---

# Layout Principles

Everything is card based.

Each card performs exactly one job.

Examples

Portfolio Card

Chart Card

Wallet Card

Strategy Card

Market Card

Trade Card

Signal Card

Watchlist Card

Never merge unrelated content.

---

# Card Anatomy

```
Radius

24px

Padding

24px

Border

1px

Background

#1A1F27

Shadow

Very subtle
```

Shadow

```
0 8px 30px rgba(0,0,0,.18)
```

Hover

```
translateY(-2px)

background slightly brighter

border brighter
```

Transition

```
250ms

ease
```

---

# Navigation

Height

```
80px
```

Padding

```
32px
```

Menu Gap

```
40px
```

Wallet Button

Rounded Pill

Large

Always on right

---

# Sidebar

Width

```
88px
```

Navigation Icons

```
22px
```

Item Height

```
56px
```

Active Item

```
Rounded Rectangle

Radius

18px

Background

#2B313D
```

Bottom Profile

Pinned

---

# Buttons

Primary

```
Green Fill

White Text

Radius

999px
```

Secondary

```
Dark Fill

Border

1px
```

Ghost

Transparent

Hover

Dark Card

Icon Button

48x48

Radius

16px

---

# Inputs

Height

```
56px
```

Radius

```
18px
```

Padding

```
18px
```

Background

```
#171B22
```

Border

```
transparent
```

Focus

```
1px Green Border
```

---

# Search

Large

Rounded

Dark

Leading Search Icon

Placeholder

Muted

---

# Chart Style

Large empty area

Thin line

```
2px
```

Glow

```
8px blur
```

Area Gradient

```
10%
```

No grid overload

Only necessary labels

Tooltip

Rounded

Dark

Small shadow

---

# Tables

Rows

72px

No hard borders

Separate rows with spacing

Text Left

Numbers Right

Status

Colored Pills

---

# Badges

Radius

```
999px
```

Padding

```
8px 14px
```

Font

```
12px

600
```

Opacity

90%

Examples

Trending

Limited

Bullish

Bearish

AI Generated

---

# Icons

Library

Lucide

Size

```
18

20

22

24
```

Never exceed

24px

Stroke

1.75

---

# Avatar

40px

Circular

Border

2px

---

# Charts

Line Width

2

Marker

10px

Glow

12px

Tooltip Radius

14px

---

# Data Cards

Top

Icon

Heading

Middle

Large Number

Bottom

Metadata

Always consistent.

---

# Visual Hierarchy

Largest

Money

Second

Section Titles

Third

Labels

Fourth

Metadata

Never use multiple competing focal points.

---

# Motion

Everything moves.

Nothing jumps.

Standard

```
250ms ease
```

Hover

```
TranslateY

-2px
```

Card Hover

```
Scale

1.01
```

Buttons

```
Scale

1.02
```

Charts

Fade

---

# Blur

Use sparingly.

```
backdrop-blur

12px
```

Only floating menus.

---

# Borders

Always subtle.

```
1px

rgba(255,255,255,.06)
```

Never thick borders.

---

# Shadows

Cards

```
0 10px 30px rgba(0,0,0,.18)
```

Dropdown

```
0 16px 40px rgba(0,0,0,.35)
```

Buttons

```
0 8px 18px rgba(0,0,0,.15)
```

---

# Empty Space

Premium UI comes from whitespace.

Never compress layouts.

Prefer

```
32px
```

instead of

```
16px
```

when possible.

---

# Tailwind Tokens

```ts
radius = {
sm:12,
md:16,
lg:20,
xl:24,
2xl:28,
full:9999
}
```

```ts
spacing = {
1:4,
2:8,
3:12,
4:16,
5:20,
6:24,
8:32,
10:40,
12:48,
16:64
}
```

---

# Component Checklist

Every new component must satisfy:

✓ Rounded

✓ Spacious

✓ Minimal

✓ One Purpose

✓ Soft Shadow

✓ Subtle Border

✓ Small Label

✓ Large Number

✓ Calm Animation

✓ Premium Typography

---

# Things To Avoid

Don't use:

❌ Neon gradients everywhere

❌ Glassmorphism overload

❌ Hard borders

❌ Sharp corners

❌ Tiny padding

❌ Multiple accent colors

❌ Dense tables

❌ Heavy shadows

❌ Bright backgrounds

❌ More than two font families

---

# Inspiration

Visual references

- Linear
- Coinbase
- Apple Wallet
- Arc Browser
- Vercel Dashboard
- Stripe Dashboard
- Mercury Banking
- Ramp
- Raycast
- Polygon Wallet
- Phantom Wallet
- TradingView
- Binance Pro (layout only)
- Figma Dashboard Concepts

---