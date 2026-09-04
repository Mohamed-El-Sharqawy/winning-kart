# 02 — Overview / Executive Dashboard

> Status: DRAFT (crewmate done, pending first-mate review).
>
> Cross-references: `01-product-architecture.md` (anchor — nav §3.3, non-duplication
> table §6, design principles §5, persistent filters §4.4), `PRODUCT.md`, `DESIGN.md`,
> `03-clients-ad-accounts.md`, `04-campaigns-adsets-ads.md`, `05-analytics-audiences-budget.md`,
> `06-attribution-revenue.md`, `07-reports.md`, `09-tasks-alerts-insights.md`,
> `10-integrations.md`, `11-team-permissions-client-portal.md`, `16-data-gaps-and-risks.md`.

## 0. Scope and the one question

Both surfaces in this doc answer the anchor's single Overview question:
**"What is happening right now?"** They are a pulse, not a firehose.

Per the non-duplication table (`01` §6), neither surface carries creative thumbnails,
per-ad rows, attribution-model controls, or budget-edit controls. Depth lives one click
down the entity chain in `04-campaigns-adsets-ads.md` and `05-analytics-audiences-budget.md`.

Two pages are specified here:

- **Agency Portfolio Overview** — the agency-side landing page (agency-global).
- **Client Portal Dashboard** — the client-role landing page (deliberately reduced).

Both obey the DATA → INSIGHT → DECISION → ACTION ladder (`01` §5.1). The Overview must
reach ACTION; the Portal stops at INSIGHT with trust-focused copy.

---

## 1. Agency Portfolio Overview

Region order, top to bottom: **KPI strip → Actionable Insights → Charts → Account-health
strip.** KPIs are the ever-present baseline pulse; Insights sit high because they are the
DECISION/ACTION layer that elevates numbers into next steps; Charts add context; the
health strip is the operational backstop.

### 1.1 Per-page template

- **Purpose** — the portfolio pulse across every client and ad account: what is happening
  right now, and what needs a human this morning.
- **Primary user** — agency media buyer / account manager / lead (admin or staff role).
  Lands here first every session.
- **User goal** — in under 15 seconds, know (a) is the book healthy, (b) which account is
  bleeding, (c) what is the single most valuable action to take.
- **Primary CTA** — no single fixed CTA; the page's primary affordance is the **top
  insight's CTA** (clay primary button, navigates to the offending entity). When no
  insight is active, the primary affordance becomes **Refresh** (ghost) on the health strip.
- **Secondary actions** — change date preset / compare period (top bar); filter via client
  switcher (top bar, never required); drill any KPI card; drill any chart; "Show all
  insights"; open an account from the per-client chart; jump to Alerts & Tasks; Refresh a
  stale account.
- **KPI cards** — six; see §1.2.
- **Charts** — three; see §1.3.
- **Tables** — none on the default view (pulse-level only, per non-duplication). A tabular
  breakdown belongs in `03-clients-ad-accounts.md` and Analytics.
- **Filters** — global filters only: **Date range** and **Compare period** (`01` §4.4).
  The client switcher filters this page but is never required. No client-scoped filters
  here (they belong in client-scoped pages).
- **Dimensions** — only **Client** is rendered (in the per-client chart and insights). Ad
  Account, Campaign, Ad Set, Ad, Audience, Placement, Country, Objective are NOT surfaced
  here — they are the drill-down's job.
- **Metrics** — the executive set only: spend, revenue, ROAS, CPA, purchases, account-health
  composite. The full metric set (CTR, CPC, CPM, impressions, clicks, ATC, checkout,
  frequency) lives in Campaigns/Analytics (`04`, `05`).
- **Drill-down behavior** — KPI card → the surface that owns that metric's depth
  (Spend/Revenue → Attribution & Revenue `06`; ROAS/CPA/Purchases → Campaigns `04`;
  Account Health → Account-health strip §1.5 → Ad Accounts `03`). Chart → its named drill
  target. Insight CTA → the offending entity. Per `01` §5.2, depth is by drill-down, not
  scroll; the Overview never expands into rows.
- **Empty state** — "No ad accounts connected yet." Helper: "Add a client and connect a
  Meta ad account to see your portfolio here." Primary CTA: "Open Clients" (clay) → `03`.
  No skeleton, no zero-cards grid; just the message and the CTA.
- **Loading state** — KPI values render as muted em-dashes (tabular width preserved),
  charts show a hairline baseline only, insights region shows "Reading the book…" in ink-3.
  No spinner. Data resolves in place as each query returns.
- **Error state** — if a single account errors, its contribution is excluded from portfolio
  totals and it appears in the health strip with a rust dot and the error short-text;
  portfolio KPIs carry a small "N accounts excluded" note in ink-3. If the whole portfolio
  query fails, the KPI strip shows "Couldn't load portfolio data" with a Retry ghost button
  and a one-line reason; charts and insights hide gracefully.
- **Permission state** — admin/staff/analyst/read-only all see the Overview; read-only sees
  no write affordances (no Refresh, no CTA buttons), only drills. Client role is redirected
  to the Client Portal Dashboard (§2) and never sees this page.
- **Mobile/responsive behavior** — KPI grid 4-up desktop → 2-up tablet → 2-up phone with
  reduced value size under 520px (`DESIGN.md` Layout). Insights: single column, top 3
  visible. Charts: 2-up → 1-up at 980px. Health strip: collapses to a single tappable
  "Health: N issues" summary that expands inline. No horizontal scroll on the Overview itself.
- **Export behavior** — none. The Overview is a live pulse, not a report artifact; curated
  client-facing output is the Reports system's job (`07-reports.md`).
- **Related pages** — Alerts & Tasks (`09`), Clients (`03`), Campaigns (`04`), Analytics
  (`05`), Attribution & Revenue (`06`), Budget & Pacing (`05`), Integrations (`10`).
- **Recommended next action** — act on the top insight via its CTA. If none, scan the
  per-client chart for the worst-ROAS bar and drill into that client's Campaigns. If the
  health strip shows red, reconnect that account before trusting its numbers.

### 1.2 KPI cards (six — the executive set)

Uniform warm-white tickets per `DESIGN.md` (small-caps label, 1.6rem tabular value, muted
sub-line; no per-card color bars). ROAS leads visually within the uniform strip — it is the
answer to "is the money working." Each card carries: label, value (tabular), delta vs
compare period (olive ↑ / rust ↓ with the word "vs <period>"), a 30-day sparkline (thin,
ink-3 baseline, no fill), and a tooltip with the definition and the action it enables.

| # | Card | Definition & formula | Source | Compare handling | Reads / leads to |
|---|---|---|---|---|---|
| 1 | **Total Spend** | `Σ account.spend` across all in-scope ad accounts. | Meta insights (account level), direct. | Δ vs compare period, absolute + %. | "How much did we deploy?" → Attribution & Revenue. |
| 2 | **Revenue (Attributed)** | `Σ action_values[purchase]` across in-scope accounts. | Meta insights (platform-attributed; see `06`). | Δ vs compare, absolute + %. | "What came back?" → Attribution & Revenue. |
| 3 | **ROAS** (lead) | `Revenue / Spend`. Value tinted olive ≥3x, rust <1x, neutral between (`DESIGN.md`). | Derived. | Δ in points (x), not %. | "Is the money working?" → Campaigns. |
| 4 | **CPA (Cost per Purchase)** | `Spend / Purchases`. `0` shown as "—" with an ink-3 "no purchases" note. | Derived. | Δ vs compare, absolute + %. | "How efficient is acquisition?" → Campaigns. |
| 5 | **Purchases** | `Σ actions[purchase]` (count). The volume anchor that makes CPA and ROAS legible. | Meta insights (actions). | Δ vs compare, absolute + %. | "Are we winning at scale?" → Campaigns. |
| 6 | **Account Health** | Composite: `healthy / total` ad accounts, where healthy = token valid AND last refresh < 6h AND no sync error AND not restricted. | Derived from `ad_accounts` + refresh metadata + Meta `account_status`. | No delta; shows the fraction + a rust/amber dot if any account is unhealthy. | "Is the data itself trustworthy?" → Account-health strip §1.5. |

**Dropped, with reasons.** *CTR, CPC, CPM* — attention-efficiency diagnostics, not money;
they earn their place on Campaigns/Ads (`04`) where the buyer optimizes creative, not on a
portfolio pulse. *Impressions, Clicks* — top-ofunnel volume with no money signal; Analytics
(`05`) territory. *Add-to-cart, Initiate checkout* — funnel-mid; they explain *why* a number
moved, which is Analytics' question, not Overview's. *Profit / Margin / LTV* — not reliably
available from Meta (requires a revenue source per `06`); flagged for `16-data-gaps-and-risks.md`.

### 1.3 Charts (three)

Each chart container: md radius, 1px Rule border, small-caps tracked title (the ledger
eyebrow), flat at rest, shadow-2 on hover, tabular axis figures. One redraw on theme change;
no ambient motion.

1. **Spend vs Revenue (dual line, daily)** — X: day (granularity matches the preset; daily
   for ≤90d). Y: currency (single axis; if the portfolio spans currencies, normalize to the
   workspace default and footnote it). Spend = ink-3 line, revenue = olive line. Read: are
   we out-earning spend day by day. Drill → Attribution & Revenue (`06`).
2. **ROAS trend (line, daily)** — X: day. Y: ROAS (x). A reference rule at the agency ROAS
   target (default 3x, configurable). Line tinted clay — the one accent earns its place on
   the hero metric's trend. Read: is efficiency improving or degrading. Drill → Analytics
   time view (`05`).
3. **Per-client performance (horizontal bars)** — one bar per client, sorted by spend desc.
   Bar fill tinted olive (ROAS ≥ target), rust (ROAS < 1x), or neutral (between). Bar
   length = spend; a tick marks each client's ROAS. Read: which client is carrying the book,
   which is bleeding. Drill → that client's Campaigns (`04`).

**Excluded.** *CPA trend* — secondary, folded into ROAS context; available in Analytics.
*Budget pacing strip* — budget-edit controls are forbidden on Overview per non-duplication
(`01` §6); pacing is Budget & Pacing's question (`05`). *Per-ad bars* — forbidden by non-duplication.

### 1.4 Actionable Insights engine (region)

The standout. The Overview DETECTS and surfaces things; it does not just display. Insights
are computed on read of the latest data (no separate background job in MVP; detection rules
live in a shared module reused by `09-tasks-alerts-insights.md`).

**Prioritization** — by **spend-at-risk / business impact**, never chronological. Ranking
score = `affected spend × severity weight × recency weight`. Token-expired and
account-restricted outrank everything because they zero out data trust. Within performance
insights, the account with the most spend-at-risk ranks first.

**Progressive disclosure** — the top 3 insights are visible by default (the "what needs a
human this morning" set). A "Show all (N)" affordance expands the list. The top-bar bell
carries the same count and links into Alerts & Tasks (`09`). Each insight card: a severity
dot (rust critical / amber watch), a plain-English one-liner, the affected entity, the
recommended action, and a clay primary CTA.

**Severity ladder** (shared with `09`): *Critical* (rust) — money actively being lost or data
untrusted; *Watch* (amber) — a trend that will become critical if unaddressed; *Info*
(neutral) — an opportunity, not a problem.

| Insight | Trigger (with thresholds) | Data required | Severity | One-liner (template) | Action | CTA → target |
|---|---|---|---|---|---|---|
| **ROAS dropped** | ROAS fell ≥ 20% vs the prior equivalent period, affected spend ≥ workspace threshold (default AED 500/day). | ROAS current + prior, spend. | Critical if ≥ 40% drop or spend ≥ 5× threshold; else Watch. | "<Client> ROAS fell 28% (4.1x → 3.0x) over 7 days; AED 3,400 at risk." | Inspect the campaigns driving the drop. | "Open <Client> campaigns" → `04`. |
| **CPA spiked** | CPA rose ≥ 25% with purchases not collapsing (efficiency, not volume); affected spend ≥ threshold. | CPA current + prior, purchases. | Critical if CPA > target CPA; else Watch. | "<Client> CPA up 31% (AED 42 → AED 55) on steady volume." | Inspect creative/audience cost drivers. | "Open <Client> ad sets" → `04`. |
| **Overspending / under-pacing** | Projected month-end spend deviates ≥ 15% from monthly cap (over) or ≤ 70% (under). Requires a cap set. | Spend-to-date, monthly cap, pacing %. | Critical if overspend; Watch if under. | "<Client> is pacing 22% over its AED 20,000 monthly cap; projected AED 24,400." | Adjust daily budgets or the cap. | "Open <Client> budget & pacing" → `05`. |
| **Creative fatigue** | An ad's frequency ≥ 4 AND CTR down ≥ 20% over 7d AND spend share ≥ 10% of its campaign. Derived (Meta exposes no fatigue score). | Ad-level frequency, CTR trend, spend share. | Watch. | "<Client> / <Ad> is fatiguing (freq 5.2, CTR −27%); a refresh likely lifts results." | Refresh the creative. | "Open <Ad>" → `04`. |
| **Conversion concentration** | A single ad carries ≥ 70% of a client's purchases in-period, with ≥ 3 active ads. | Ad-level purchases, active ad count. | Watch. | "<Client>: one ad drives 78% of purchases — concentration risk if it fatigues." | Diversify; scale a runner-up. | "Open <Client> ads" → `04`. |
| **Spend, no conversions** | Ad/campaign spend ≥ threshold AND purchases = 0 over the period (period ≥ 7d to avoid new-campaign false positives). | Spend, purchases, age. | Critical if spend ≥ 3× threshold; else Watch. | "<Client> / <Campaign> spent AED 1,800 with zero purchases in 7 days." | Pause or restructure. | "Open <Campaign>" → `04`. |
| **Token expired** | Token marked expired or refresh returns an auth error. | Token status, last refresh error. | Critical (data trust). | "<Client> / <Account> token expired — data stale since 2h ago." | Reconnect the token. | "Reconnect account" → `03`. |
| **Account restricted** | Meta `account_status` indicates restricted/disabled. | Meta `account_status`. | Critical. | "<Client> / <Account> is restricted on Meta — ads may have stopped serving." | Resolve on Meta, then reconnect. | "Open account diagnostics" → `03`; external "Open Meta Business Manager". |

### 1.5 Account-health strip

A thin horizontal strip below the charts. One row per ad account that needs attention, plus
a summary line. Each row: client name, account name, status (dot + 3px halo + word per
`DESIGN.md` — olive healthy, amber stale/expiring, rust error/restricted), last refresh
(relative time), spend-cap headroom (from the `account_balance` derivation in
`src/lib/meta-api.ts`), and a one-line error short-text if any. Failures use muted
rust/amber, never neon (Warm-Semantics Rule). CTAs: "Reconnect" (clay, → `03`), "View sync
log" (ghost, → `10`), "Refresh now" (ghost). Compact template: **purpose** operational trust
signal; **primary user** buyer/admin; **goal** scan which accounts are stale/restricted/over
cap in one pass; **primary CTA** "Reconnect" on the worst row; **filters/dimensions/metrics**
inherit the Overview's global filters, dimension = ad account, metrics = token status / last
refresh / spend-cap headroom / sync error; **drill** row → Ad Accounts detail (`03`);
**empty state** "All accounts syncing fresh" with an olive dot (a positive empty state);
**loading** "Checking accounts…"; **error** the strip itself is the error surface;
**permission** read-only sees the strip but no Refresh/Reconnect buttons; **mobile**
collapses to "Health: N issues" tappable summary; **export** none (live signal); **related**
`03`, `10`, `12`; **next action** resolve the top red row before trusting its numbers.

---

## 2. Client Portal Dashboard

The same DATA→INSIGHT philosophy, simplified for a non-buyer. Trust is the design goal: a
client who can read this in 10 seconds and believe it.

### 2.1 Per-page template

- **Purpose** — show the client whether their money is working, in language they can act on.
- **Primary user** — client user (client role). Logs in a few times a week, not all day.
- **User goal** — "Is my spend producing revenue? Is it getting better or worse?"
- **Primary CTA** — no write affordance (read-mostly per `01` §3.5). The page's primary
  affordance is **"Open latest report"** (clay link) if the agency has shared one; otherwise
  the date-range control.
- **Secondary actions** — change date range; toggle the simpler compare (prior period only;
  no YoY complexity per `01` §4.3); open Campaigns (read-only); open Ads & Creatives gallery
  (read-only); open Analytics (read-only, simplified); open shared Reports.
- **KPI cards** — four only: **Spend, Revenue, ROAS, Purchases** (the canonical portal set
  per `01` §3.5). Same uniform ticket style. ROAS value tinted olive/rust by the same
  thresholds. Each card carries a plain-English sub-line ("you earned AED 3.20 for every
  AED 1 spent") — trust copy, not jargon.
- **Charts** — two: **Spend vs Revenue (dual line, daily)** and **ROAS trend (line, daily)**
  with the agency target as a reference rule. No per-client chart (the client is one client).
  No per-ad anything.
- **Tables** — none on the dashboard. Performance tables live in the client's read-only
  Campaigns view (`04`).
- **Filters** — Date range only (global). The simpler compare toggle (prior period / off). No
  client switcher, no platform switcher beyond a read-only indicator of connected platforms.
- **Dimensions** — none surfaced (pulse-level). Dimension slicing is in the client's
  read-only Analytics (`05`), simplified.
- **Metrics** — spend, revenue, ROAS, purchases. Nothing else on this page.
- **Drill-down behavior** — KPI card → the client's read-only Campaigns view. Chart → the
  client's read-only Analytics. No write affordances anywhere.
- **Empty state** — "Your dashboard is being prepared." Helper: "Your agency is connecting
  your ad accounts; check back shortly, or contact your account manager." A "Contact agency"
  mailto link. No zero-state grid.
- **Loading state** — same muted em-dash KPIs and hairline chart baselines as the Overview.
- **Error state** — if the client's data can't be loaded, "We couldn't load your latest
  numbers. Your agency has been notified." Retry ghost button. The agency is alerted via
  Alerts & Tasks (`09`). Never expose internal error text, token status, or sync internals.
- **Permission state** — client role lands here. A misconfigured client with no accounts sees
  the empty state. Agency users never land here.
- **Mobile/responsive behavior** — KPI 2-up on phone; charts 1-up; larger touch targets;
  trust copy stays legible. Mobile is a real daily context for clients (`PRODUCT.md`).
- **Export behavior** — no raw export from the dashboard. The client receives curated reports
  via Reports (`07`). If the agency enables it, a "Download PDF" of the latest shared report
  is available; default off.
- **Related pages** — client-portal Campaigns, Ads & Creatives, Analytics, Reports, Settings
  (`01` §3.5).
- **Recommended next action** — read the ROAS hero and its trend; if it dropped, open the
  latest report or contact the account manager.

### 2.2 What is hidden vs the agency Overview

Hidden from the client (anchored to `01` §3.5 and `11-team-permissions-client-portal.md`):
the Account-health strip (token status, last refresh, sync errors, spend-cap headroom); all
pacing internals and monthly caps (Budget & Pacing is agency-only); the Actionable Insights
engine (internal diagnostic); CPA unless the agency explicitly enables it (per-client flag,
default off); CPC, CPM, CTR, impressions, clicks, ATC, checkout (diagnostic, not
client-meaningful); any cost/margin/profit fields the agency withholds; the per-client chart
(the client is one client); Alerts & Tasks; Integrations; Team & Permissions; Marketing Plans
(unless shared); all Administration. The client sees outcomes, never ingestion.

---

## 3. Design rules (both pages)

`DESIGN.md` is binding; the rules below restate only what is load-bearing for these two
surfaces. **One Accent** — clay only on primary CTAs, active selection, the wordmark, and the
ROAS-trend line; ≤ 10% of any screen. **Muted semantics** — olive/rust/amber only, always the
muted values; status as dot + halo + word, never a neon pill. **Tabular figures** on every
number, right-aligned where columns exist. **Serif** (Source Serif 4) for page H1 and the
ROAS hero only; Hanken Grotesk for all functional UI and data. **Hairline rules** (1px, warm
rule color) do the structural work; no card border exceeds 1px; no per-card color bars. **No
emoji or glyph icons**; buttons are text-only; the wordmark mark is the sole authored SVG.
**Motion** — chart redraw on theme change, hover lift on insight cards, focus rings; no
ambient pulsing, no auto-rotate.

---

## 4. Data gaps flagged for `16-data-gaps-and-risks.md`

- **Profit / Margin / LTV** — Meta gives spend and purchase-attributed revenue, not COGS or
  true profit. Excluded from Overview KPIs; requires a revenue source per `06`.
- **Creative fatigue** — Meta exposes no "fatigue score"; the insight derives frequency + CTR
  decay + spend concentration. Frequency is meaningful per-ad, not cleanly additive at
  account rollup.
- **Spend-cap headroom semantics** — `account_balance = spend_cap − amount_spent` when a cap
  is set; otherwise it is `balance`, whose meaning depends on billing type (prepaid vs
  invoicing/threshold). The health strip must label this honestly, not as a simple "remaining."
- **Account restriction reasons** — Meta returns a numeric `account_status`; the *why*
  (policy, billing) is limited and often requires the Business Manager UI.
- **Platform-attributed revenue bias** — ROAS here is platform-attributed and overstates true
  marketing ROAS. Surfaced via tooltip; detailed in `06`.

---

*End of `02-overview-executive-dashboard.md`. Pulse-level only; depth is one drill down.*
