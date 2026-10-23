# DESIGN.md — VIP Gym Management SaaS Design System (Soft Light & Gold VIP Theme)

## Overview

Supabaze's design language is engineered for clarity and eye comfort above all else. The marketing and product surfaces sit on a soft, glare-free off-white canvas (`{colors.canvas}` — `#f9f9f8`), with text rendered in `{colors.ink}` (`#171717` — near-black, never pure black). Across the entire system the only consistent chromatic event is the **Gold VIP primary** (`{colors.primary}` — `#d4af37`) — used as the filled CTA, active dot indicator, and wordmark highlight. Everything else is a calibrated warm grey ladder from `#ededeb` hairline-cool to `#171717` ink.

Typography runs **Inter** or **Circular** at weight 500 for display and 400 for body. The display tier uses tight negative letter-spacing (-1.92px at 64px) to pull the rounded humanist letterforms into editorial density. There's no atmospheric gradient, no full-bleed photography, no harsh glowing elements — the brand commits to an eye-friendly, glare-free off-white surface.

The product itself appears as composited UI screenshots on every page: dashboard tables, workout log streams, progress analytics. They sit inside `{rounded.lg}` 12px containers with subtle 1px hairlines, arranged cleanly above the hero band.

**Key Characteristics:**
- Single gold primary (`{colors.primary}` `#d4af37`) as the only chromatic highlight; everything else is monochrome/warm grey.
- **Soft glare-free off-white canvas (`#f9f9f8`)** for light mode to prevent eye strain during long sessions.
- Custom humanist sans display tier at weight 500 with negative letter-spacing of -1.92px to -0.42px.
- Composited product UI screenshots as the dominant decorative element.
- Tight 6px / 8px button radii — square-ish, technical, never pill-shaped.
- Code blocks and dark featured tiers rendered in deep `{colors.canvas-night}` (`#1c1c1c`).


## Colors

> **Source pages:** home (`/`), `/dashboard`, `/workouts`, `/analytics`, `/pricing`.

### Brand & Accent (Gold & VIP Theme)
- **Gold Primary** (`{colors.primary}` — `#d4af37`): The signature VIP CTA color. Filled-button background, brand wordmark accent, active indicator dot.
- **Gold Deep** (`{colors.primary-deep}` — `#b3922c`): Pressed-state lift of the primary.
- **Gold Soft** (`{colors.primary-soft}` — `#f3e5ab`): Lighter champagne gold used in chart accents and product UI highlights.
- **Accent Platinum** (`{colors.accent-purple}` — `#e5e4e2`): Rare accent used in VIP badges and secondary highlights.
- **Accent Bronze** (`{colors.accent-violet}` — `#cd7f32`): Secondary accent for tier status indicators.
- **Accent Amber** (`{colors.accent-yellow}` — `#ffbf00`): Chart accent / warning status indicator only.


### Surface (Calibrated for Eye Comfort)
- **Canvas** (`{colors.canvas}` — `#f9f9f8`): **Default page background (Soft Off-White / Pearl)**. Designed to eliminate glare and eye strain.
- **Canvas Soft** (`{colors.canvas-soft}` — `#f2f2ef`): Barely-tinted warm grey for alternating section bands and nested cards.
- **Canvas Night** (`{colors.canvas-night}` — `#1c1c1c`): Deep near-black used in code blocks, dark dashboard mockups, and featured VIP pricing tier.
- **Canvas Night Soft** (`{colors.canvas-night-soft}` — `#202020`): Slightly lifted dark for nested chrome.
- **Hairline** (`{colors.hairline}` — `#e2e2de`): Soft 1px borders on cards and tables matching the warm canvas.
- **Hairline Strong** (`{colors.hairline-strong}` — `#cbcbc5`): Slightly darker border for structural emphasis.
- **Hairline Cool** (`{colors.hairline-cool}` — `#ededeb`) / **Hairline Cool 2** (`#e5e5e0`): Fine chrome work.


### Text
- **Ink** (`{colors.ink}` — `#171717`): Default body text. Near-black, never pure.
- **Ink Secondary** (`{colors.ink-secondary}` — `#212121`): Slightly cooler near-black for body emphasis.
- **Ink Mute** (`{colors.ink-mute}` — `#707070`): Secondary text and helper copy.
- **Ink Mute 2** (`{colors.ink-mute-2}` — `#9a9a9a`): Tertiary text.
- **Ink Faint** (`{colors.ink-faint}` — `#b2b2b2`): Disabled / placeholder text.
- **On Primary** (`{colors.on-primary}` — `#171717`): Text on the gold primary fill — near-black, not white. The button reads as a "lit" surface with dark type.
- **On Dark** (`{colors.on-dark}` — `#ffffff`): Text on canvas-night surfaces.


## Typography

### Font Family
The display and UI tier uses **Inter** (open-source via Google Fonts) at weight 500 for display with `letter-spacing: -1.92px` at 64px. Code blocks use **system mono** (`ui-monospace`, with Menlo / Monaco / Consolas fallbacks).

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xxl}` | 64px | 500 | 1.1 | -1.92px | Hero headline |
| `{typography.display-xl}` | 48px | 500 | 1.1 | -1.44px | Section opener |
| `{typography.display-lg}` | 36px | 500 | 1.15 | -0.72px | Sub-section / pricing tier |
| `{typography.display-md}` | 28px | 500 | 1.2 | -0.42px | Card title |
| `{typography.heading-lg}` | 22px | 500 | 1.2 | 0 | Compact heading |
| `{typography.heading-md}` | 18px | 500 | 1.4 | 0 | Section sub-heading |
| `{typography.body-lg}` | 18px | 400 | 1.55 | 0 | Marketing body lead |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default UI body |
| `{typography.button-md}` | 14px | 500 | 1.0 | 0 | Button label |
| `{typography.caption}` | 13px | 400 | 1.45 | 0 | Helper, footnote |
| `{typography.micro}` | 12px | 400 | 1.45 | 0 | Pill label, fine print |
| `{typography.code}` | 14px | 400 | 1.5 | 0 | Code block content |

### Principles
- **Weight 500 across display.** Mid-weight reads as engineered and luxurious.
- **Negative tracking on display.** -1.92px at 64px scaling proportionally down.
- **Mono for code.** System mono families (Menlo / Monaco).


## Layout

### Spacing System
- **Base unit**: 8px (with 2 / 4 / 12 sub-tokens for fine work).
- **Tokens**: `{spacing.xxs}` 2px · `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 24px · `{spacing.xxl}` 32px · `{spacing.huge}` 64px.
- **Section padding**: 64–96px on marketing surfaces.
- **Card internal padding**: 32px on feature/pricing cards.


### Grid & Container
- Marketing pages center in a ~1280px container with no edge-bleed.
- Pricing collapses 4-up → 2-up → 1-up at 1024 / 768 breakpoints.
- Product UI mockups stack 2-up or render as overlapping panes inside the container.


## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat, 1px hairline | Default cards |
| 1 | `box-shadow: 0 1px 3px rgba(0,0,0,0.05)` | Subtle card lift on soft canvas |
| 2 | `box-shadow: 0 8px 24px rgba(0,0,0,0.07)` | Floating composited UI mockups |
| 3 | `box-shadow: 0 16px 48px rgba(0,0,0,0.10)` | Modal overlays, deep elevation |


## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Form inputs, hairline tags |
| `{rounded.sm}` | 6px | Buttons (signature button radius), code blocks |
| `{rounded.md}` | 8px | Compact cards, alerts |
| `{rounded.lg}` | 12px | Pricing cards, feature cards, product mockups |
| `{rounded.xl}` | 16px | Modal dialogs, large container chrome |
| `{rounded.full}` | 9999px | Pill tags, VIP avatars |


## Components

### Buttons

**`button-primary-gold`** — the signature VIP CTA.
- Background `{colors.primary}` (`#d4af37`), text `{colors.on-primary}` (near-black, NOT white), type `{typography.button-md}`, padding `{spacing.sm} {spacing.lg}` (8px 16px), rounded `{rounded.sm}` 6px.
- Pressed state `button-primary-gold-pressed` shifts to `{colors.primary-deep}` (`#b3922c`).

**`button-secondary-outline`** — outline alternative on soft white.
- Background `{colors.canvas}`, text `{colors.ink}`, 1px solid `{colors.hairline-strong}` border, same shape.

**`button-on-dark`** — used on dark surfaces / code-block CTAs.
- Background `{colors.canvas-night}`, text `{colors.on-dark}`, same shape.

**`button-link`** — text-only inline button.
- Transparent background, text `{colors.ink}` rendered in `{typography.button-md}`, no padding, with a subtle underline on hover.


### Cards & Containers

**`card-feature-light`** — feature card on soft off-white canvas.
- Background `{colors.canvas}`, padding `{spacing.xxl}`, rounded `{rounded.lg}` 12px, 1px `{colors.hairline}` border (`#e2e2de`).

**`card-pricing`** — standard pricing tier.
- Background `{colors.canvas}`, padding `{spacing.xxl}`, rounded `{rounded.lg}`, 1px `{colors.hairline}` border. Title in `{typography.heading-lg}`, price in `{typography.display-md}`, body in `{typography.body-md}`, CTA `button-primary-gold` pinned bottom.

**`card-pricing-featured`** — inverted dark VIP featured tier.
- Background `{colors.canvas-night}`, text `{colors.on-dark}`, otherwise identical structure.

**`code-block`** — code snippet container.
- Background `{colors.canvas-night}`, text `{colors.on-dark}` rendered in `{typography.code}`. Padding `{spacing.lg}` 16px, rounded `{rounded.sm}` 6px.


### Inputs & Forms

**`text-input`** — standard form input.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, padding `{spacing.sm} {spacing.md}` (8px 12px), rounded `{rounded.sm}` 6px, 1px `{colors.hairline}` border.


### Pills, Tags, and Chips

**`pill-tag-gold`** — small gold pill used for "VIP" or "New" indicators.
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.micro}`, padding `{spacing.xxs} {spacing.sm}`, rounded `{rounded.full}`.

**`pill-tag-soft`** — neutral pill on light surfaces.
- Background `{colors.canvas-soft}`, text `{colors.ink}`, otherwise same shape.


## Do's and Don'ts

### Do
- Reserve `{colors.primary}` gold for filled CTAs and active indicators.
- Maintain the **soft off-white canvas (`#f9f9f8`)** for light theme to protect user eyes from glare.
- Render display tiers at weight 500 with negative letter-spacing for a clean, engineered feel.
- Use `{rounded.sm}` 6px for buttons — square-ish radii, never pill-shaped.
- Use near-black `{colors.ink}` on the gold button (not white) so the gold surface reads as "lit" with dark type.

### Don't
- Don't use blinding pure white (`#ffffff`) for light mode backgrounds; always use the eye-friendly `#f9f9f8` off-white token.
- Don't introduce random neon or bright colors as system colors.
- Don't use pill-shaped buttons; the button radius is square-ish 6px.
- Don't add atmospheric gradients to hero bands — the comfortable soft-white canvas is the design.