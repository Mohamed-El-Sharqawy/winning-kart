# 05 — Analytics · Audiences · Budget & Pacing

> Anchor: `01-product-architecture.md` (binding). Related: `02-overview-executive-dashboard.md`,
> `04-campaigns-adsets-ads.md`, `06-attribution-revenue.md`, `07-reports.md`,
> `08-marketing-plans.md`, `09-tasks-alerts-insights.md`, `16-data-gaps-and-risks.md`,
> `DESIGN.md`, `src/lib/meta-api.ts`, `src/db/schema.ts`, `src/lib/types.ts`.
>
> Status: DRAFT (crewmate done, pending first-mate review).
>
> Scope: three **Client-scoped** analysis surfaces (anchor §3.2 / §4.4). Each
> answers exactly one question per the non-duplication table (anchor §6). No
> surface in this doc owns create/edit/pause of campaign state, creative fatigue,
> attribution-model selection, or report scheduling; those live in `04`, `06`,
> `07`, `09`.

## 0. The three questions

| Surface | One question (anchor §6) | Failure mode if duplicated elsewhere |
|---|---|---|
| **Analytics** | Why is it happening? | Becomes a second Campaigns page if it gains edit/pause. |
| **Audiences** | Which audiences caused it? | Becomes pacing or creative-fatigue if it gains budget or frequency controls. |
| **Budget & Pacing** | Are we spending the budget correctly? | Becomes Attribution if it gains revenue-model controls. |

These are read-and-decide surfaces. The decision routes elsewhere: to
`04-campaigns-adsets-ads.md` for status & budget edits, to `09-tasks-alerts-insights.md`
for action, to `07-reports.md` for output.

---

## 1. Shared model (applies to all three surfaces)

### 1.1 Pivot / slice model
Every view is a single **slice** of the entity chain rendered as `dimensions × metrics`:

- **Dimensions** (the rows / pivots): Time (hour/day/week/month), Entity
  (Campaign/Ad Set/Ad), Audience (saved/lookalike/custom/age/gender/region/country),
  Placement (publisher_platform × platform_position × impression_device), Objective,
  Status, Device, New vs Returning (where available).
- **Metrics** (the columns): the canonical ledger set — spend, impressions, reach,
  clicks, CTR, CPC, CPM, frequency, purchases, revenue (attributed), ROAS, CPA,
  cost_per_action_type (ATC / initiate_checkout / etc.), add-to-cart,
  initiate-checkout, landing-page-views, and profit & margin from `06` where present.

A **slice** is one selected dimension against the metric set; a **pivot** is two
dimensions (e.g., Placement × Time) producing a matrix. Two-dimension pivots are
the most powerful thing this surface does that the Overview pulse (`02`) cannot.

### 1.2 Derived vs API-direct (legend, applied throughout)
- **API-direct** — read straight from a Meta Marketing API field. The `fetchInsights`
  and `fetchDailyInsights` helpers in `src/lib/meta-api.ts` already retrieve
  `spend`, `impressions`, `reach`, `clicks`, `ctr`, `cpc`, `cpm`, `frequency`,
  `actions`, `action_values`, `purchase_roas`, `cost_per_action_type`.
  `fetchAccountInfo` adds `amount_spent`, `balance`, `spend_cap`, `account_status`,
  `currency`, `timezone_name`. `fetchCampaigns` adds `daily_budget`,
  `lifetime_budget`, `buying_type`, status, objective, schedule.
- **Derived** — computed in Winning Kart from one or more API-direct values or
  from data Winning Kart holds (pacing %, projected end-of-period spend, the
  forecast cone, ROAS where the agency attribution model overrides Meta's
  `purchase_roas`, profit = revenue − spend − COGS).
- **Client-set** — supplied by the operator or client outside the ad API
  (monthly caps, COGS, target KPIs).

Every metric chip carries provenance in a tooltip ("Meta API · field" /
"Derived · formula" / "Client-set").

### 1.3 Saved views
Any combination of (dimension × metrics × filters × compare period × chart type)
can be named, made personal or shared with the agency, pinned to a client
workspace, or attached to a **report block** in `07-reports.md`. Saved views are
how Analytics becomes reusable without becoming a Campaigns clone: the same view
answers the same question next week with no reconfiguration. Every saved view
encodes its full filter state in the URL (anchor §4.4 #5).

### 1.4 Persistent filters (anchor §4.4, restated)
- **Global** (survive every navigation, including client switch): Date range, Compare period.
- **Client-scoped** (reset on client switch): Ad Account, Platform, Campaign, Objective, Status, Country, Audience, Placement.
- All three surfaces in this doc are **Client-scoped**. With All Clients selected
  they render cross-client aggregated views with a Client column; with one client
  selected they scope to it. Switching Platform resets Campaign/Ad Set/Ad/Audience/Placement
  because those are platform-specific entities.

### 1.5 Design language (binding, `DESIGN.md`)
- One accent (clay) for active selection, primary action, and brand only. Semantic
  meaning via muted olive/rust/amber; no neon, no second hue (One Accent Rule,
  Warm-Semantics Rule).
- Tabular figures (`font-variant-numeric: tabular-nums`) and right-aligned numeric
  columns via `lead-2`/`lead-3` everywhere data lives (Data-is-Sans Rule).
- Hairline rules (1px, warm rule color) carry structure; borders never exceed 1px;
  the 4px KPI accent bars are retired.
- Status is a dot + semantic halo + word; winner/loser rows take Olive-Tint /
  Rust-Tint washes, never solid fills.
- No emoji or unicode-glyph icons; text-only controls; the wordmark mark is the
  sole authored SVG.
- DATA → INSIGHT → DECISION → ACTION ladder (anchor §5.1): these surfaces
  legitimately stop at DECISION; the ACTION lives one click away in Campaigns /
  Ad Sets / Alerts & Tasks.
- Charts re-render theme-aware via `lib/chartTheme.ts`; flat-by-default at rest.

---

## 2. Analytics — "Why is it happening?"

**Purpose.** A powerful, exploration-only surface, denser and more pivotable than
the Overview pulse (`02`). The buyer/analyst comes here to confirm or kill a
hypothesis — "did CPM spike on IG Reels on Tuesday?", "is CPA worse on Audience
Network?", "do 18–24 women convert better in Dubai than Abu Dhabi?" — without
leaving a read-only lens.

**Primary user.** Agency analyst and senior media buyer. Client users get a
deliberately reduced variant (§3).

**Goal.** Move from a number that caught the eye on Overview/Campaigns to a
confirmed cause — a dimension value or a single cell — in under three interactions.

**Primary CTA.** *Apply slice* (commits the selected dimension + metric set to the
grid). There is no edit/pause/budget CTA. The single "action" the page offers is
*Open in Campaigns* — a deep link that carries full filter state to `04`.

**Secondary actions.** *Save view* (personal / shared / pin to workspace / attach
to report — `07-reports.md`); *Export* (CSV / XLSX for the grid, PNG for the
chart, PDF for the whole view); *Pin to report* (sends the current view as a block
to a chosen report template); *Compare to* (prior period / YoY, from the global
top bar); *Reset to default view*.

**KPI cards** (six tickets, all tabular figures): Spend, Revenue, ROAS (hero,
serif per `DESIGN.md`), CPA, CTR, CPM. Each card carries the delta-vs-compare as
a muted olive/rust sub-line and a one-line plain-English read ("ROAS down 18% vs
prior 7 days; CPM up 22% on Reels"). KPI cards reflect the **current filter
state**, not the whole account.

**Charts.** The chart area is determined by the active category (§2.1–2.4). One
chart per view by default; a second *breakdown* chart can be docked side-by-side
on wide screens (2-up collapsing to 1-up at 980px, per `DESIGN.md`).

**Tables.** The ledger table — paper-2 header, small-caps tracked labels, hairline
rule row separators, `lead-2`/`lead-3` numeric alignment, winner/loser tint by
ROAS quartile. The active dimension is the row key; selected metrics are the
columns. A sparkline column (cumulative spend or ROAS over the date range) sits
behind *Columns → Trend*.

**Filters.** The full client-scoped filter set (anchor §4.4) plus an
Analytics-only control: *Dimension* (pick the slice) and *Metrics* (multi-select
column set, with presets: *Performance*, *Cost efficiency*, *Funnel*, *Audience*).

**Dimensions.** Time · Entity (Campaign/Ad Set/Ad) · Audience (type, age, gender,
region, country) · Placement (publisher/platform/device) · Objective · Status.
See §2.1–2.4 for which apply per category.

**Metrics.** The full ledger set (§1.1), each marked API-direct or Derived per §1.2.

**Drill-down.** Within a category: from a dimension value to a second dimension
(e.g., Placement → Age). Across surfaces: from any row to *Open in Campaigns /
Ad Sets* with filter state preserved (anchor §4.4 #5). From any cell to a saved
view scoped to that cell.

**Empty.** "No impressions in this filter window." Plain copy, one suggested next
step ("Widen the date range or clear the Placement filter").

**Loading.** Skeleton ledger rows on paper-2; the chart container holds its last
value until the new slice resolves (no flicker to zero).

**Error.** Plain copy with the underlying Meta API error class translated to
operator language; *Retry* and *Copy diagnostic* (the latter is what
`09-tasks-alerts-insights.md` watches for connection failures).

**Permission.** Agency admin/staff/analyst: full slice + saved views + export +
pin-to-report. Read-only agency role: no Save/Pin. Client role: the simplified
variant in §3 only.

**Mobile / responsive.** KPI grid 4 → 2 → 2-with-reduced-size at <520px; tables
keep full density with horizontal scroll (no fabricated mobile card view, per
`DESIGN.md`); charts 2-up collapse to 1-up at 980px; the *Dimension* control
moves into a bottom sheet.

**Export.** CSV and XLSX for the grid; PNG for the chart; PDF for the entire view
with the saved-view name as the title. Every export carries a header line with
the active filter state and a generated-at timestamp.

**Related pages.** `02-overview-executive-dashboard.md` (the pulse that sends you
here), `04-campaigns-adsets-ads.md` (where you act on the finding),
`07-reports.md` (where a saved view lands), `09-tasks-alerts-insights.md` (where
a finding becomes a task), `16-data-gaps-and-risks.md` (what Meta will not give you).

**Next action.** Decide whether the finding warrants a budget/status change (→
`04`), a task (→ `09`), or a client-facing report block (→ `07`).

### 2.1 Performance category
The default category. Answers "what happened, end to end".

- **Dimensions:** Time (default day), Campaign, Ad Set, Ad, Objective.
- **Metrics (API-direct):** spend, impressions, reach, clicks, CTR, CPC, CPM,
  frequency; `actions` (`offsite_conversion.fb_pixel_purchase`, `add_to_cart`,
  `initiate_checkout`, `landing_page_view`, `link_click`), `action_values`
  (purchase revenue), `purchase_roas`, `cost_per_action_type`.
- **Metrics (Derived):** ROAS where the agency attribution model overrides Meta's
  `purchase_roas` (per `06`); CPA = spend / purchases; funnel-step rates
  (ATC rate, checkout rate, purchase-from-checkout).
- **Funnel — the signature chart for this category:** Impressions → Reach
  (deduped) → Clicks (link) → Landing-page views → Leads (custom, where mapped)
  → Add-to-cart → Initiate checkout → Purchases (with revenue bound to the final
  step). Each step sized by volume, with step-to-step conversion % in a small-caps
  label; olive/rust halos on steps whose rate beats or trails the compare period
  past an operator-set threshold.
- **Recommended viz per metric:**
  - Volume metrics (spend, impressions, reach, clicks, purchases, revenue) →
    vertical **funnel** with delta halos.
  - Rate metrics (CTR, CPC, CPM, CPA, ROAS, frequency) → **tabular KPI strip**
    with delta-vs-compare and an inline sparkline.
  - Time series of a single metric → **single thin line** on a paper-2 ground.
- **Recommended viz overall:** Funnel + six-up KPI strip + a thin spend-vs-revenue
  line for the window.

### 2.2 Audience dimension
Answers "who is the result coming from".

- **Dimensions:** Age, Gender, Age × Gender, Country, Region, Device
  (`impression_device`), New vs Returning (flag for `16`), Audience type
  (saved / lookalike / custom).
- **Metrics:** Spend, Reach, Frequency, CTR, CPC, CPM, CPA, ROAS, Purchases,
  Revenue, ATC, Checkout.
- **Recommended viz:** a **heat grid** — rows = age band × gender, columns = the
  chosen metric, cells tinted by performance quartile (olive for top quartile,
  rust for bottom) — paired with small-multiples bars for Country and Device.
  The heat grid is the strongest single artifact on this page for spotting
  "18–24 women on iOS in Dubai at 3× ROAS" patterns.
- **Drill-down:** cell → campaigns serving that demographic; dimension → second
  dimension (e.g., Age × Placement).
- **Flag for `16`:** New vs Returning is not a clean Meta insights breakdown;
  resolved via custom-audience membership where it exists, otherwise marked
  *not reliably available*.

### 2.3 Placement dimension
Answers "where is the result coming from".

- **Dimensions:** `publisher_platform` (Facebook, Instagram, Messenger, Audience
  Network) × `platform_position` (Feed, Stories, Reels, Marketplace, In-Stream,
  Right-Hand Column, Search) × `impression_device` (mobile, desktop, oculus).
  Meta returns these via the `breakdowns` parameter; `src/lib/meta-api.ts` does
  not currently request them, so this category requires a new fetch path (flag
  for `16`).
- **Metrics:** Spend, Share-of-spend (%), Impressions, Reach, Frequency, CTR,
  CPC, CPM, CPA, ROAS, Conversions, Video-views (where available).
- **Recommended viz:** **stacked horizontal bar** of spend by placement,
  segmented by `publisher_platform` and sorted by spend, paired with a CPM/CTR
  bar chart on the same x-axis order so the eye reads "share of spend vs cost
  efficiency" together. A small stacked-area chart of daily spend by placement
  handles the time-stacked view.
- **Drill-down:** placement → ads serving that placement; placement × audience
  (which demographic over-indexes on Reels).

### 2.4 Time dimension
Answers "when is the result happening" — hour-of-day and day-of-week shape.

- **Dimensions:** hour-of-day (advertiser timezone), day-of-week, week, month,
  ISO date.
- **Metrics:** Spend, Impressions, CPM, CTR, CPA, ROAS, Conversions.
- **Recommended viz:** **day-of-week × hour-of-day heatmap** of a single chosen
  metric (default ROAS, second heatmap for CPM), plus a thin **cumulative spend
  line overlaid on an even-pace target line** so the buyer sees drift against
  plan. Day / week / month granularity renders as a thin line.
- **Flag for `16`:** Meta does not return sub-day granularity through the
  standard `time_increment=1` path used in `src/lib/meta-api.ts`. Hourly data
  requires the `hourly_stats_aggregated_by_advertiser_time_zone` insight, which
  Meta retains for only a short window (~7 days) and which is **not** a stable
  long-history source. Winning Kart must capture hourly data on a schedule to
  populate a heatmap beyond the last week, and the historical heatmap cannot be
  back-filled retroactively.

### 2.5 Pivot / slice model — summary
A view = (one Dimension | two-dimension Pivot) × (Metric set) × (Filters) ×
(Compare) × (Chart). Saved views persist this tuple; *Pin to report* sends it as
a block to `07-reports.md`.

---

## 3. Client Portal — simplified Analytics variant

The Client Portal (anchor §3.5) exposes Analytics read-only with a deliberately
smaller lens, because the client is reading a report, not optimizing a book.

- **Categories exposed:** Performance (default), Audience (Age/Gender/Country
  only), Time (day/week/month — no hourly heatmap).
- **Hidden categories:** Placement detail beyond publisher rollup, New vs
  Returning, hourly heatmap, two-dimension pivots, Save / Pin-to-report,
  Export-to-PDF builder (the client receives reports the agency builds — `07`).
- **KPI cards:** Spend, Revenue, ROAS, Purchases only.
- **Filters:** Date range, a simple Compare toggle, Campaign. No
  Status/Objective/Placement/Country edits; the lens is what the agency intends
  the client to read.
- **Permission:** client role only; agency field-withholding per
  `11-team-permissions-client-portal.md` (cost/margin fields can be hidden from
  this view).

---

## 4. Audiences — "Which audiences caused it?"

**Purpose.** Audience-level performance — which saved / lookalike / custom
audiences are winning, which are underperforming, where they overlap, what
demographics and geographies they reach — without leaking into creative fatigue
(`04`) or budget pacing (this doc §5).

**Primary user.** Agency media buyer deciding scale, pause, exclude, expand, or
build-a-lookalike at the audience level.

**Goal.** Rank audiences by ROAS/CPA within spend bands, identify overlap and
demographic concentration, and surface the *actionable* decision per view.

**Primary CTA.** *Compare audiences* (side-by-side panel for 2–4 selected
audiences). No create/pause CTA lives on this page; the marketer's decision is
executed elsewhere — → Campaigns/Ad Sets (`04`) for scale/pause/exclude, → the
Audience Library entry point (§4.3) for build-lookalike where the API allows.

**Secondary actions.** *New audience* (only where Meta's Marketing API supports
it for this account — flagged in `16`); *Build lookalike* (1%, 1–3%, 3–5%
selectable); *Tag winner / Tag underperformer* (agency-local tag, durable);
*Add to exclude list* (writes a task in `09`, not an immediate API mutation);
*Open in Ad Sets* (deep link to ad sets using the selected audience); *Export*;
*Save view*.

**KPI cards** (six, top strip): Audience count, Spend on audiences, Reach,
Avg CTR, Avg CPA, Avg ROAS — over the active filter window, with delta-vs-compare.

**Charts.**
- *Audience comparison* — small-multiples bars or radar (2–4 audiences × the
  chosen metrics).
- *Demographic breakdown* — heat grid (Age × Gender for the selected audience,
  tinted by ROAS).
- *Geographic breakdown* — horizontal bars of spend and ROAS by country/region,
  sorted by spend.
- *Performance trend* — thin multi-line of ROAS over time for the selected
  audiences (neutral ink series; clay reserved for the highlighted comparison
  audience).

**Tables.** The Audience performance ledger — columns: Audience name · Type
(saved/lookalike/custom) · Size (approximate where Meta exposes it) · Spend ·
Reach · Frequency · CTR · CPC · CPM · Conversions · CPA · Revenue · ROAS.
Winner/loser tint by ROAS band; an *Overlap indicator* column (a clustered dot
when this audience heavily overlaps with another selected one).

**Filters.** Client-scoped set plus Audience-type, Audience-tag
(winner/underperformer), Spend band, and an Overlap-threshold slider.

**Dimensions.** Audience (default), Type, Tag, Demographic (Age/Gender),
Geography (Country/Region), Device.

**Metrics.** The ledger set (§1.1). **Size** is API-direct (approximate; lower
and upper bound from Meta) where exposed; flagged in `16`.

**Drill-down.** Audience → its ad sets (→ `04`); audience → demographic heat
grid; audience → overlap report with another selected audience.

**Empty.** "No audiences served impressions in this window." Single suggested
next step.

**Loading / Error / Permission / Mobile / Export.** Same shape as Analytics (§2).
Permission gates *New audience* and *Build lookalike* on (a) agency admin/staff
role and (b) Meta API scope confirmed for the account (flagged in `16`).

**Related pages.** `04-campaigns-adsets-ads.md` (act on the finding),
`05`/this doc §2 (Analytics for cross-dimension exploration),
`09-tasks-alerts-insights.md` (exclude/scale becomes a task),
`16-data-gaps-and-risks.md`.

**Next action.** Decide per audience: scale (winner), pause/exclude (loser),
expand (build lookalike from winner), refresh creative (fatigue is owned by
`04`, surfaced as a task in `09`).

### 4.1 Actionable decisions per view

| View | Decision it supports |
|---|---|
| Audience performance table | Scale top-quartile ROAS; pause bottom-quartile within spend band. |
| Comparison | Pick which of 2–4 candidates to consolidate budget into. |
| Demographic heat grid | Seed a lookalike from the over-indexing age × gender × geo cell. |
| Geographic breakdown | Exclude high-spend/low-ROAS regions; expand high-ROAS regions with localized creative. |
| Performance trend | Spot audience decay before frequency crosses a threshold — surfaces a *refresh creative* task (`04`/`09`), not a pacing action. |
| Overlap | Merge or exclude audiences cannibalizing the same users (raises effective CPM). |

### 4.2 Audience OVERLAP — Meta data limits (flag for `16`)
Meta's audience-overlap capability is restricted at the API level; the dedicated
overlap endpoint is not generally available for arbitrary audience pairs.
Approximate overlap can be inferred only where Meta exposes audience membership
(custom- and lookalike-source overlap), and audience-size endpoints return
**bounds** rather than exact counts. Winning Kart must: (a) compute inferred
overlap from shared custom-audience membership where available; (b) mark pairs
without API coverage as *overlap not available*; (c) never present a fabricated
overlap percentage. Detail in `16-data-gaps-and-risks.md`.

### 4.3 Audience Library
A read-mostly registry of saved, lookalike, and custom audiences for the selected
client × ad account — columns: name, type, source (e.g., lookalike seed) where
applicable, approximate size, parent ad sets, last-served date, agency tags.
Create/edit/delete where Meta's API allows (gated per `16`); otherwise the
library is a *view* of what Meta holds, with management happening in Meta's own
surface and Winning Kart refreshing on schedule.

---

## 5. Budget & Pacing — "Are we spending the budget correctly?"

**Purpose.** A dedicated feature, not a sidebar of Campaigns. It owns one
question: whether the client's money is being spent at the right rate against
the right ceiling, and what to expect by period end.

**Primary user.** Agency media buyer and account manager.

**Goal.** Spot overspend, underspend, and unexpected spikes before they cost the
client money or leave budget unspent, and re-allocate before period close.

**Primary CTA.** *Adjust budget* — initiates a budget edit and routes to the
campaign/ad-set edit in `04`. The mutation itself happens at the entity surface
(`04`); this surface owns the *question*, not the write. The only write native
to this surface is *Edit monthly cap*, which is local operator config (not a Meta
API mutation unless explicitly chosen).

**Secondary actions.** *Reallocate* (proposal mode: shift budget from one
campaign to another; surfaces as a task in `09`); *Export pacing report*;
*Subscribe to pacing alerts* (links to `09`); *Save view*.

**KPI cards** (six, top strip): Total budget (period), Actual spend, Target spend
(Derived, §5.3), Projected end-of-period spend (Derived), Pacing % (Derived),
Days remaining. Each carries a muted semantic dot — olive for on/under pace,
rust for over pace, amber for delivery anomaly.

**Charts.**
- **Actual vs target spend** — dual series on a single chart: thin clay line for
  actual cumulative spend, thin neutral-ink line for the even-pacing target,
  daily bars (clay-tint-2) for the per-day delta. The single most important
  artifact on the page.
- **Budget progress bar** — horizontal bar (spend / cap) with a clay marker at
  the target-spend point and an olive/rust marker at the projected-spend point;
  reads "you are here, you will end here" in one glance.
- **Forecast cone** — fan chart from today to period end, widening with
  uncertainty; median line = projection; outer band = ±1σ of recent daily-spend
  variance, narrowed by `√remaining_days`. Convergence in §5.3.
- **Daily-spend velocity** — single line of last-14-days spend against a
  horizontal even-pace reference line.
- **Spend by campaign (stacked)** — stacked bar of daily spend by campaign,
  top-N + "Other"; identifies which campaigns drive spikes.

**Tables.** Pacing ledger by Campaign (drill to Ad Set where the campaign is
CBO/Advantage+): Budget (daily/lifetime), Scheduled start/end (lifetime),
Spend-to-date, Target-to-date, Pacing %, Projected end spend, Delivery status
(Active / Paused / Not started / At cap / Error), Variance vs target. Winner/loser
tint is replaced by *on-pace / over / under* tint (olive / rust / amber).

**Filters.** Client-scoped set plus Delivery-type (Daily / Lifetime / CBO /
Advantage+), Period (month / quarter / custom), Cap-type (account spend cap /
campaign budget / monthly operator cap).

**Dimensions.** Campaign (default), Ad Set, Period-day, Delivery-type, Account.

**Metrics.** Defined in §5.2.

**Drill-down.** Campaign → ad-set pacing; day → hourly spend (where available;
the §2.4 hour-of-day limit applies and is flagged in `16`); account → spend-cap
headroom.

**Empty.** "No spend in this period yet." Single suggested next step (set a
monthly cap, or wait for delivery).

**Loading / Error / Permission / Mobile / Export.** Same shape as §2/§4.
Permission gates *Edit monthly cap* to agency admin/staff; clients never see
this surface (anchor §3.5 hides it).

**Related pages.** `04-campaigns-adsets-ads.md` (where budget edits happen),
`09-tasks-alerts-insights.md` (alerts and tasks this surface emits),
`08-marketing-plans.md` (plan budget this surface measures against),
`16-data-gaps-and-risks.md`.

**Next action.** Reallocate, adjust cap, or accept the current pace.

### 5.1 Alerts this surface emits (link to `09`)
- **Overspending** — pacing % above an operator-set upper band (default 110% of target).
- **Underspending** — pacing % below the lower band (default 90%).
- **Unexpected spend spike** — daily spend > mean + N·σ (default N = 3, rolling 14-day window).
- **Nearing budget** — projected end-of-period spend within X% of the cap (default 95%).
- **No delivery** — zero spend on a campaign expected to deliver; routes to
  `09-tasks-alerts-insights.md` connection diagnostics.

Each alert becomes a typed item in the `09` queue with the offending entity, the
threshold breached, and a suggested action; nothing in this surface mutates
campaign state autonomously.

### 5.2 The model — fields

| Field | Provenance | Notes |
|---|---|---|
| Total budget (period) | Client-set or Campaign `daily_budget` / `lifetime_budget` (API-direct) | Operator picks which ceiling applies per client. |
| Daily budget | Campaign/Ad Set `daily_budget` (API-direct) | Per `fetchCampaigns` in `src/lib/meta-api.ts`. |
| Lifetime budget | Campaign `lifetime_budget` (API-direct) | Needs scheduled start/end. |
| Monthly budget | Client-set | Operator-enforced cap Winning Kart tracks locally. |
| Actual spend | `spend` (API-direct) | Per the date range. |
| Target spend | Derived (§5.3) | The "where we should be" line. |
| Remaining | Derived = cap − actual | |
| Projected end-of-period spend | Derived (§5.3) | Includes forecast cone. |
| Pacing % | Derived = actual / target | 100% = on pace. |
| Days remaining | Derived | Period-end − today, in the ad account's timezone. |
| Account spend-cap headroom | Derived = `spend_cap − amount_spent` | From `fetchAccountInfo`; `balance` is used when `spend_cap = 0` (prepaid / invoicing — comment in `meta-api.ts`). |

### 5.3 Calculation logic (formulas)

**Target spend (the even-pace line).** Delivery-type aware:

- **Daily-budget campaign / account monthly cap:**
  `target_spend = daily_budget × elapsed_days_in_period`
  (or `monthly_cap × (elapsed_days / days_in_period)` for a monthly cap).
- **Lifetime-budget campaign:**
  `target_spend = lifetime_budget × (elapsed_days / scheduled_total_days)`
  where `scheduled_total_days = end_date − start_date` and
  `elapsed_days = today − start_date`, both in the **ad account's timezone**
  (`ad_accounts.timezone`, default `Asia/Dubai` per `schema.ts`).
- **Paused / not-started:** excluded from target so paused campaigns do not drag
  pacing below 100%.
- **Account spend cap (hard ceiling):** the effective target is the lesser of the
  delivery target and `spend_cap − amount_spent`; pacing reports the *effective* line.

**Pacing %.**
`pacing_pct = actual_spend / target_spend × 100`
100% = on pace; >100% = ahead / over; <100% = behind. Reported against the
*effective* target above.

**Projection (end-of-period forecast).**
`projection = actual_spend + (run_rate × remaining_days)`
where:
- `run_rate` = weighted recent daily spend, default an EMA over the last 7
  **active** delivery days (paused days skipped), α = 0.3;
- `remaining_days = period_end − today`, in the account timezone.

**Convergence logic.** As `today → period_end`, the projection must converge to
`actual_spend`. Enforced two ways: (1) on the final day,
`projection = actual_spend + partial_day_spend_so_far`; (2) the blend shifts
from *run-rate-dominated* early in the period (≥50% of days remaining) to
*actual-spend-dominated* late (≤20% remaining), linearly interpolated between.
The variance band (forecast cone) is ±1σ of last-14-days daily spend, narrowed
by `√remaining_days`.

**Edge cases (explicit).**
- **Lifetime budget mid-flight** — Meta paces lifetime campaigns on its own
  schedule; Winning Kart's target is calendar-even, so pacing ≠ Meta's internal
  pacing. Surfaced as a metric tooltip caveat and flagged in `16`.
- **CBO / Advantage+ campaign** — budget lives at the campaign level; ad sets
  have no own budget. Pacing is computed at the campaign only; the ad-set
  drill-down shows spend *share*, not ad-set pacing.
- **Account spend cap** — `spend_cap − amount_spent` is the hard ceiling; once
  `amount_spent` approaches `spend_cap`, Meta pauses delivery. Pacing shows this
  as a separate *At cap* state, distinct from over-pacing-against-plan.
- **Prepaid / invoicing accounts** — `balance` is the relevant headroom when
  `spend_cap = 0` (per the comment in `src/lib/meta-api.ts`); surfaced separately
  from a cap.
- **Multi-currency** — monthly cap is in client currency; `daily_budget` and
  `spend` arrive in ad-account currency. Conversion happens at fetch time using a
  snapshot rate; flagged in `16`.
- **Paused or rejected campaigns** — excluded from target; included in
  *historical* spend; surfaced as a delivery-status column.

### 5.4 Meta exposes vs Winning Kart computes (flag for `16`)
- **Meta exposes:** `daily_budget`, `lifetime_budget`, `spend`, `spend_cap`,
  `amount_spent`, `balance`, campaign schedule, `buying_type`.
- **Winning Kart computes:** target_spend, pacing %, projection, forecast cone,
  monthly cap (client-set, local), alert thresholds, multi-currency conversion,
  paused-campaign exclusion logic.
- **Flagged in `16`:** Meta's internal pacing for lifetime and Advantage+
  campaigns is **not exposed**; Winning Kart's calendar-even target is an
  operator-grade approximation, not Meta's truth. CBO/Advantage+ ad-set-level
  budgets are absent by design.

---

## 6. Cross-cutting notes

- **Multi-currency.** Every numeric column carries the ad-account currency code
  (`ad_accounts.currency`, default `AED` per `schema.ts`); the monthly cap in
  Budget & Pacing may be in client currency, requiring FX conversion (flagged in `16`).
- **Timezone.** All period math uses `ad_accounts.timezone` (default
  `Asia/Dubai`); the global date range is interpreted in that timezone, not the
  operator's browser timezone.
- **Refresh.** These surfaces read Winning Kart's stored insights (refreshed via
  the scheduler and on-demand, per `src/lib/meta-api.ts`); they do not call Meta
  live on every render. A stale chip shows "Last refreshed: hh:mm" with a
  *Refresh* ghost button.
- **No mutations from these surfaces.** All three pages are read-and-decide.
  Edits route to `04` (status / budget), `09` (tasks), `07` (reports), or the
  Audience Library's gated create path (§4.3).

---

*End of `05-analytics-audiences-budget.md`. Binding dependencies: `01-product-architecture.md`
(anchor), `DESIGN.md`, `src/lib/meta-api.ts`, `src/db/schema.ts`, `src/lib/types.ts`.
Data gaps recorded for `16-data-gaps-and-risks.md`: hourly stats retention,
new-vs-returning, audience-overlap API restrictions, audience-size bounds, Meta
internal pacing for lifetime/Advantage+, multi-currency FX, Advantage+ ad-set-level
budgets, and the missing `breakdowns` fetch path for placement/demographic slicing.*
