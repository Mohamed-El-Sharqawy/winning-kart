# DESIGN.md — Winning Kart design system

**Direction: Night Volt — Vibrant / Bold.** Locked by the captain 15 Aug 2026
(round 1: "Vibrant or Bold"; round 2: Night Volt over Voltage Light and Solar Flare).
Implemented on Tailwind CSS v4 + shadcn/ui with CSS-first `@theme` tokens in
`packages/ui/src/theme.css`. Supersedes the retired paper-and-clay theme.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--color-volt-ground` | `#0b0714` | page ground |
| `--color-volt-surface` | `#151022` | cards, panels |
| `--color-volt-surface-2` | `#1a142a` | inputs, table headers |
| `--color-volt-border` | `#2c2342` | hairline borders |
| `--color-volt-border-2` | `#3b3057` | emphasized borders |
| `--color-volt-primary` | `#8b5cf6` | the one accent — primary CTA, active selection |
| `--color-volt-primary-strong` | `#a78bfa` | hero values, focus |
| `--color-volt-up` | `#a3e635` | positive deltas, winners, ROAS ≥ 3x |
| `--color-volt-down` | `#fb7185` | negative deltas, losers, critical, ROAS < 1x |
| `--color-volt-up-tint` | `#182413` | winner row wash |
| `--color-volt-down-tint` | `#2e141b` | loser row wash |
| `--color-volt-text` / `-2` / `-3` | `#f5f3ff` / `#cfc6e8` / `#9d92c9` | text hierarchy |

Typography: **Geist** for UI, **Geist Mono** for every numeral (`tabular-nums` — the
`.tabular` helper). Radius: `--radius-wk: 10px`.

## Rules (binding on every surface)

1. **One accent** — volt violet marks the primary action, active selection, and brand.
   Up/down semantics are lime/coral and never reused for decoration.
2. **Vivid but disciplined** — full-saturation semantics, always AA-checked against
   their surface. Contrast beats vibrancy when they conflict.
3. **Tabular figures everywhere data lives** — Geist Mono, `tabular-nums`, right-aligned
   numeric columns.
4. **Winner/loser as tint washes** (`-up-tint` / `-down-tint` rows), never color-alone:
   the value itself is colored and signed.
5. **Status as dot + halo + word** — no neon pills, no emoji, no glyph icons; buttons
   are text.
6. **Density through rhythm** — tight in-group spacing, generous section separation,
   1px borders only.
7. **Motion rare and explanatory** — hover lift, focus ring, chart redraw on theme
   change. No ambient pulsing.
8. **Reports/PDF light companion variant** — same hue family on a light ground
   (`#f5f3ff` ground, violet primary, darker up/down: `#3f6212` / `#be123c`) so
   client-facing artifacts print cleanly. Client portal renders the dark UI.
9. **White-label composes** — an agency may recolor the single accent slot
   (OKLCH-validated), never add a second hue.

## Data-is-Mono rule

Every number renders in Geist Mono with tabular figures. Hero values (ROAS) render at
display weight and take the up/down/primary tint by value. Misaligned or sans numerals
in a data table are a design bug.
