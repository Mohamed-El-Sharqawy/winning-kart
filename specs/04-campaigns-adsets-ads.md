# 04 — Campaigns, Ad Sets, Ads & Creatives

> Status: DRAFT (crewmate done, pending first-mate review) · Scope: capt. §7, §8, §9
> · Source code untouched.
>
> Binding dependencies: `spec/01-product-architecture.md` (esp. §3.3 Campaigns /
> Ad Sets / Ads & Creatives nav items, §6 non-duplication table, §4.4 persistent
> filters, §5 design principles), `spec/README.md` (per-page template),
> `PRODUCT.md`, `DESIGN.md`.
>
> Code grounded against: `src/db/schema.ts`, `src/lib/meta-api.ts`,
> `src/lib/types.ts`, `src/lib/queries.ts`, `src/components/CampaignTable.tsx`,
> `src/components/AdTable.tsx`. Where this doc proposes fields the Meta client
> does not yet fetch (adset targeting, creative preview, ad-level creative
> metadata), the gap is named in-text and routed to
> `spec/16-data-gaps-and-risks.md`.

---

## 0. Cross-cutting rules (govern every page in this doc)

### 0.1 Three surfaces, one question each (anchor §6)

| Surface | Its one question | Do NOT put here |
|---|---|---|
| **Campaigns** | Which campaigns caused it? | Creative gallery, audience library management, revenue-source config. |
| **Ad Sets** | Which targeting/setup caused it? | Creative thumbnails, campaign-level budget totals duplicating Campaigns. |
| **Ads & Creatives** | Which creatives caused it? | Campaign budget pacing, audience overlap. |

### 0.2 The drill-down contract

`Ad Account → Campaign → Ad Set → Ad → Creative` is the rigid spine.

1. Each level **adds** detail; none dumps all levels at once (anchor §5.2,
   "depth by drill-down, not by scroll").
2. The breadcrumb mirrors the chain verbatim and is the canonical "back" path.
3. **Filter state flows DOWN, never UP.** Selecting a campaign on the Campaigns
   list pre-scopes the Ad Sets tab when drilled into; selecting an ad set
   pre-scopes Ads. Going back UP never narrows the parent — it restores the
   parent's last lens verbatim.
4. **Client-scoped filters survive within a client** (anchor §4.4): Ad Account,
   Platform, Objective, Status, Country, Audience, Placement all ride along
   every drill-down. Date range and Compare period are global and ride along
   across clients.
5. **Every view encodes its full filter state in the URL query string** so any
   page is deep-linkable, bookmarkable, and shareable, and a browser back/forward
   restores the exact lens.

### 0.3 Metric provenance (API-direct vs derived)

Used throughout this doc; flagged inline per metric.

- **API-direct (Meta insights already fetched in `src/lib/meta-api.ts`):**
  `spend`, `impressions`, `reach`, `clicks`, `ctr`, `cpc`, `cpm`, `frequency`,
  `actions` (purchase, add_to_cart, initiate_checkout, landing_page_view,
  link_click), `action_values` (purchase value = revenue), `purchase_roas`,
  `cost_per_action_type`.
- **API-direct (Meta entity, not yet fetched — gap for `13-data-model.md` and
  `16`):** campaign `objective`, `daily_budget`, `lifetime_budget`,
  `buying_type`; adset `optimization_goal`, `bid_strategy`, `pacing_type`,
  `targeting`, `promoted_object`; ad `creative`, `preview`, `display_format`.
- **Derived in Winning Kart** (see `summarizeInsights` / `summarizeAdLevel`):
  `roas` (revenue ÷ spend, also available API-direct via `purchase_roas`),
  `cpa` (spend ÷ purchases), `conversion_rate` (purchases ÷ link_clicks),
  `atc_rate`, `checkout_rate`, `purchase_rate_from_checkout`, spend-share %
  (entity spend ÷ parent spend).

### 0.4 Design discipline (binding, from `DESIGN.md`)

- **ROAS hero** is the largest figure on every summary card and every campaign
  row's hover affordance; rendered in Source Serif 4, tinted Olive ≥3x, Rust
  <1x, neutral between.
- **Tabular figures** (`font-variant-numeric: tabular-nums`) on every numeric
  cell. Numeric columns right-aligned via `lead-2` / `lead-3` table modifiers.
- **Hairline rules** (1px, warm Rule color); borders never exceed 1px.
- **Status as dot + semantic halo + word** — never a solid pill. Winner/loser
  rows tinted **Olive-Tint** (`#e3ead9`) / **Rust-Tint** (`#f1e0df`).
- **One accent (Clay)** — reserved for primary CTA, active selection, and brand.
  All semantic meaning uses Olive / Rust / Amber. No emoji, no neon, no glyphs.

---

## 1. Campaigns list

| Field | Value |
|---|---|
| **Purpose** | Find winners and losers fast across the selected client's campaigns; decide what to scale, pause, or investigate. |
| **Primary user** | Agency media buyer / account manager (admin role). Client role sees a read-only variant (no write actions, no bulk). |
| **Goal** | Move from number → decision in seconds: spot the campaign causing today's ROAS movement and act. |
| **Primary CTA** | **Open** a campaign's detail page (row click or "Open" link). |
| **Secondary actions** | Compare selected; Create task from row; Pause/Resume (V1, see §6); Export; Refresh now; Save current view. |
| **KPI cards** (top strip, 4-up desktop / 2-up tablet-phone, full per `02` rules) | Total Spend · Total Revenue · Blended ROAS (hero) · Purchases. Optional 5th: Active campaigns (n of m). |
| **Charts** | One compact strip chart: blended ROAS over the selected date range, with compare-period overlay. Pulse-level only — no per-campaign breakdown here (that lives on detail). |
| **Tables** | The ledger (§1.2). |
| **Filters** | Search (name / id); Status (Active/Paused/Archived/Deleted); Objective; Ad Account; Platform; Date range (global); Compare (global). All client-scoped per anchor §4.4. |
| **Dimensions** | Campaign. (Cross-campaign dimension slicing belongs to Analytics `05`.) |
| **Metrics** | See §1.2. |
| **Drill-down** | Row → Campaign detail (`/clients/:slug/campaigns/:campaignId`). |
| **Empty** | "No campaigns in this view." Sub-line: scope hint (which client/account/date). CTA: connect an ad account (`03`) or widen the date range. |
| **Loading** | Skeleton rows preserving column widths (tabular figures do not jump); KPI cards show shimmer; chart shows axes only. |
| **Error** | Surface the Meta API error class verbatim from `meta-api.ts` (`Meta API <status>: <body>`), translated per `16`: token expired (→ Reconnect in Ad Accounts), rate-limited (→ Retry in Ns), permission scope missing (→ Integrations). No silent fallback to stale cache without a dated "Cached N hours ago" banner. |
| **Permission** | Admin/staff/analyst: full read + V1 write. Read-only: read only. Client role: read-only variant, no cost-per-action type fields the agency withholds (matrix in `11`). |
| **Mobile/responsive** | Horizontal scroll with sticky first two columns (Status, Campaign); **no column hiding** per `DESIGN.md`. KPI cards collapse 4→2; chart collapses to 1; bulk-action bar docks to bottom on phone. |
| **Export** | CSV / XLSX of the visible (post-filter, post-sort) rows with all displayed columns plus `exported_at`, filter state, and ad account currency. PDF is a Reports job (`07`), not this page. |
| **Related pages** | Campaign detail (drill); Ad Sets (sibling); Budget & Pacing (for pacing edits); Analytics (cross-cutting); Reports. |
| **Next action** | Drill into the worst-ROAS high-spend campaign first (the loudest Rust-Tint row). |

### 1.2 Default vs optional columns

Today's `CampaignTable.tsx` ships 11 columns: Campaign, Spend, Impressions,
Clicks, CTR, ATC, Checkout, Purchases, Revenue, ROAS, CPA. The proposed
default keeps the buyer's eye on **decision metrics first**; volume and funnel
move to optional.

**DEFAULT (always visible, sortable, the buyer's primary read):**

| # | Column | Source | Why default |
|---|---|---|---|
| 1 | Status (dot + halo + word) | API-direct (campaign.status) | The one non-numeric leading column; tells you if the row is even delivering. |
| 2 | Campaign (name + 7d sparkline) | API-direct (name) + derived (sparkline from `fetchDailyInsights`) | Identity + trend at a glance. |
| 3 | Objective | API-direct (campaign.objective) | Filters interpretation of every other metric (CONVERSIONS vs REACH vs BRAND_AWARENESS). |
| 4 | Budget (daily or lifetime, in account currency) | API-direct (daily_budget / lifetime_budget) | Pacing reference; without it ROAS is unactionable. |
| 5 | Spend | API-direct (insights.spend) | Cost base for every derived ratio. |
| 6 | ROAS | Derived (revenue ÷ spend; cross-checked against API `purchase_roas`) | The hero metric; tinted Olive/Rust; rightmost of the "core 3" so the eye lands. |
| 7 | Revenue | API-direct (action_values.purchase) | The numerator; needed to trust ROAS. |
| 8 | CPA | Derived (spend ÷ purchases) | Decision metric for scale/pause. |
| 9 | Purchases | API-direct (actions.purchase) | Volume guard against ratio-only reading (high ROAS on 1 purchase ≠ scale). |
| 10 | CTR | API-direct (insights.ctr) | Cheapest fatigue/quality signal. |
| 11 | Frequency | API-direct (insights.frequency) | Cheapest fatigue signal — earns default because fatigue is in scope (`04` §4). |

**OPTIONAL / CUSTOMIZABLE (off by default, toggled via Columns control):**

| Column | Source | Why optional |
|---|---|---|
| Impressions | API-direct | Volume diagnostic; rarely the decision metric. |
| Reach | API-direct | Distinct from impressions; useful for frequency math but duplicative on default read. |
| Clicks | API-direct | Subsumed by CTR on default read. |
| CPC | API-direct | Cost-efficiency; needed only when diagnosing auction pressure. |
| CPM | API-direct | Auction pressure; same as above. |
| Add to Cart | API-direct (actions.add_to_cart) | Funnel depth; default on only for ecommerce clients (configurable per client in `03`). |
| Initiate Checkout | API-direct (actions.initiate_checkout) | Funnel depth; same rule. |
| Landing Page Views | API-direct (actions.landing_page_view) | Offsite load signal — flags clickbait/landing mismatch (see §4). |
| Conversion Rate | Derived (purchases ÷ link_clicks) | Already inferable from Purchases + Clicks. |
| Cost per ATC / Cost per Checkout | Derived (spend ÷ action count) | Funnel-stage CPA; advanced only. |
| Δ vs Compare | Derived (compare-period delta) | Off by default to keep the ledger scannable; toggle for review mode. |
| Created / Updated | API-direct (campaign timestamps) | Audit; rarely decision-relevant in-line. |
| Buying Type | API-direct (campaign.buying_type) | AUCTION vs RESERVED; advanced. |

**Saved Views.** A named, shareable URL state capturing: visible optional
columns, sort, active filters, and (optionally) a pinned row selection for
comparison. Agency-scoped (not client-scoped) so a buyer's "Bleeders view"
applies across clients. Per-user "My views" plus a shared "Team views" section.

**Bulk Actions.** Two tiers:

- **Read-only (always safe, V1):** Add to comparison; Create task from each;
  Export selected; Add to report.
- **Write (deferred to V1.x or V2, see §6 gate):** Pause selected; Resume
  selected; Adjust daily budget (Δ amount or %) for selected; Move to a
  Marketing Plan. Bulk write requires a confirmation dialog enumerating every
  affected campaign by name, the projected new state, and a "this is a Meta
  write action" warning.

---

## 2. Campaign detail page

`/clients/:slug/campaigns/:campaignId` — the drill-down for "which campaign
caused it, and what's inside it."

| Field | Value |
|---|---|
| **Purpose** | Explain a single campaign: its summary, performance over time, and the ad sets / ads / creatives inside it. |
| **Primary user** | Agency buyer. |
| **Goal** | Decide whether to scale, hold, or pause this campaign, and where inside it the result is coming from. |
| **Primary CTA** | **Pause/Resume** (V1 write, gated per §6) **or Adjust budget** (V1.x write, gated). On read-only roles the primary CTA becomes **Create task**. |
| **Secondary actions** | Drill to an ad set; drill to an ad; Compare this campaign; Add to report; Create task; Refresh now. |
| **KPI cards** | Spend · Revenue · **ROAS (hero)** · CPA · Purchases · Frequency. Six-up desktop, 3-up tablet, 2-up phone; each card carries a muted sub-line (Δ vs compare, Δ vs parent account). |
| **Charts** | (a) Spend vs Revenue over time (daily line, account timezone). (b) ROAS over time, with compare overlay and a horizontal reference line at 1x and 3x (the Olive/Rust thresholds). (c) Funnel: Impressions → Reach → Clicks → Landing Page Views → ATC → Initiate Checkout → Purchases (collapsible). |
| **Tables** | Ad set performance (default sort by Spend desc); Creative performance (top N by ROAS, link into Ads & Creatives). |
| **Filters** | Inherits all client-scoped filters. Adds adset-level and ad-level filters as in-page sub-scopes (Date and Compare are global, never re-set here). |
| **Dimensions** | This campaign only. Sub-sections slice by Ad Set, Ad, Creative, Placement, Audience, Country, Device, Age/Sex (where Meta provides breakdowns — flag the breakdown API cost for `16`). |
| **Metrics** | The full default set from §1.2 plus section-specific metrics (Placement CPM, Audience reach/frequency). |
| **Drill-down** | Ad set row → Ad Set detail; creative row → Ads & Creatives detail. |
| **Empty** | "Campaign has no activity in this date range." Sub-line: status + first/last seen delivery dates. |
| **Loading / Error / Permission / Mobile** | Same contracts as §1; the page's own Meta errors are scoped to the campaign id and surface the same error-class translation. |
| **Export** | Per-section CSV; whole-page PDF belongs to Reports (`07`). |
| **Related pages** | Ad Sets; Ads & Creatives; Budget & Pacing (budget detail lives there, not here); Attribution & Revenue (revenue attribution detail lives there, not here); Marketing Plans (if linked). |
| **Next action** | If ROAS Rust and Frequency high → drill Creatives; if ROAS Rust and Frequency low → drill Ad Sets for audience/placement diagnosis. |

### 2.1 Section order (top-to-bottom)

1. **Campaign summary strip** — name, status, objective, buying type,
   budget (daily/lifetime, account currency), dates, parent ad account,
   platform. Breadcrumb: Client › Ad Account › **Campaign**.
2. **KPI cards** — six-up, ROAS hero.
3. **Performance charts** — Spend/Revenue, ROAS-over-time with thresholds,
   funnel.
4. **Budget pacing summary (LINK OUT, do not duplicate).** One line: "Pacing
   92% of monthly target" linking to `05` Budget & Pacing for the controls and
   projection. Anchor §6 forbids budget-edit here.
5. **Ad set performance** — table, sorted by Spend desc, with mini sparkline
   and ROAS tint per row.
6. **Creative performance** — top 5 creatives by ROAS, each row a card preview
   (thumbnail left, metrics right) linking into Ads & Creatives.
7. **Audience performance** — per-saved-audience ROAS/CPA (where adset
   targeting exposes the audience; gap for `16`).
8. **Placement performance** — Feed / Stories / Reels / Marketplace / etc.,
   CPM and ROAS per placement.
9. **Demographic breakdown** — Age/Sex heatmap of impressions and ROAS.
10. **Conversion funnel** — the funnel chart from §2 expanded with rates.
11. **Attribution summary (LINK OUT, do not duplicate).** One line: attributed
    revenue and model name, linking to `06` for the model details and
    limitations.
12. **Activity / History** — append-only event log: status changes, budget
    edits (who, when, old → new), creative swaps. Sourced from a future
    `campaign_events` table (gap for `13-data-model.md`).
13. **Recommendations** — generated insights (e.g., "Frequency 4.8 + CTR
    −31% w/w: creative fatiguing, see Ads & Creatives"). Each links to its
    owning surface; see `09`.

---

## 3. Ad Sets list + detail

### 3.1 Ad Sets list

| Field | Value |
|---|---|
| **Purpose** | Which targeting/setup drove the result; how each ad set is pacing. |
| **Primary user** | Agency buyer. |
| **Goal** | Decide per-ad-set scale/pause, audience/placement optimization, and which ad sets to compare. |
| **Primary CTA** | **Compare** (select 2–N, see §3.3) **or Open** an ad set. |
| **Secondary actions** | Pause/Resume (V1.x write, §6); Adjust daily/lifetime budget (V1.x write, §6); Create task; Drill to Ads; Export; Save view. |
| **KPI cards** | Spend · ROAS · CPA · Frequency · Reach. Five-up; 2-up phone. |
| **Charts** | Spend by ad set (horizontal bar, top 10, account currency) with ROAS tint per bar. |
| **Tables** | Ad set ledger (§3.2). |
| **Filters** | Search; Status; Optimization goal; Bid strategy; Pacing status; Parent Campaign; Date (global); Compare (global). |
| **Dimensions** | Ad set; groupable by parent campaign. |
| **Metrics** | See §3.2. |
| **Drill-down** | Row → Ad Set detail (`/clients/:slug/adsets/:adsetId`). |
| **Empty / Loading / Error / Permission / Mobile / Export** | Same contracts as §1; error class translation identical. |
| **Related pages** | Campaigns (parent); Ads & Creatives (children); Audiences (audience library, sibling, not duplicated here); Budget & Pacing. |
| **Next action** | If two ad sets share an audience and diverge ≥30% on ROAS → Compare them. |

### 3.2 Ad set ledger — what matters at this level

The ad set is where **targeting, optimization, and pacing** become readable.
Default columns layer the entity-specific metadata onto the metrics.

**Entity metadata (leading, API-direct via extension to `meta-api.ts` — gap for `13`/`16`):**

| Column | Source | Why it matters here |
|---|---|---|
| Status | API-direct | Dot + halo + word. |
| Ad set name | API-direct | Identity. |
| Parent campaign | API-direct | One level up; groupable. |
| Optimization event | API-direct (optimization_goal) | "Optimizing for Purchases" vs "Link clicks" — the dominant lever on CPA quality. |
| Bid strategy | API-direct (bid_strategy) | LOWEST_COST_WITHOUT_CAP vs COST_CAP vs BID_CAP; changes the meaning of spend. |
| Budget (daily / lifetime) | API-direct | Pacing math denominator. |
| Pacing | API-direct (pacing_type) + derived | Standard vs accelerated; surfaced as "On pace / Under / Over" with link to `05`. |

**Performance metrics (numeric, right-aligned, tinted):**

| Column | Source | Default? |
|---|---|---|
| Spend | API-direct | yes |
| Impressions | API-direct | optional |
| Reach | API-direct | yes (audience saturation signal) |
| Frequency | API-direct | yes (fatigue signal) |
| CPM | API-direct | optional |
| Clicks | API-direct | optional |
| CTR | API-direct | yes |
| CPC | API-direct | optional |
| Purchases | API-direct | yes |
| CPA | Derived | yes (decision) |
| Conversion Rate | Derived | optional |
| Revenue | API-direct | yes |
| **ROAS** | Derived | yes (hero, rightmost) |

**Audience display (readable).** A single collapsed "Audience" cell per row
expanding to: saved audience name(s), lookalike source + tier, custom-audience
count, location/age/sex summary, placements (auto vs explicit list). Long lists
render as "+3 more" with hover affordance — no pill soup, per `DESIGN.md`
("density through structure, not clutter").

### 3.3 Ad Set comparison tool

The captain's §8 feature. Comparison is the single highest-leverage ad-set
workflow: split-test reading, audience/placement/bid diagnosis.

**Selection mechanism.** Checkbox column on the Ad Sets list (and on the
Campaign detail's ad-set table). A floating dock (bottom on phone, right rail
on desktop) shows the staged set with **"Compare"** CTA. Maximum **N = 4** ad
sets per comparison — beyond four, the side-by-side metric columns compress
below readable width and the diff signal dilutes.

**Comparison view layout.**

- **Header strip**: each selected ad set as a column header (status dot, name,
  parent campaign, optimization event, bid strategy, audience summary). Sticky
  on vertical scroll.
- **Grouped metric rows** mirroring §3.2's order: Volume (Spend, Impressions,
  Reach, Frequency) → Efficiency (CPM, CPC, CTR) → Conversion (Purchases, CPA,
  Conversion Rate, Revenue, **ROAS**).
- **Delta highlighting**: every numeric cell shows its raw value plus a muted
  Δ against the **first selected** ad set (the baseline, marked with a small
  "baseline" tag). Δ ≥ +10% better (lower for cost metrics, higher for revenue
  metrics) tints Olive-Tint; Δ ≥ −10% worse tints Rust-Tint; ±<10% neutral.
  Thresholds configurable per agency.
- **Normalized vs raw toggle**:
  - **Raw** (default): absolute values in account currency and counts.
  - **Normalized**: per-1k-impressions (CPM, CPR — cost per result, frequency
    normalized) and per-1-AED-spend variants, so ad sets with very different
    budgets become comparable on efficiency.
- **Spend share mini-bar** under each column header: what % of the comparison
  cohort's total spend this ad set consumed — guards against "winner" being an
  artifact of budget.

**What's comparable and what isn't.**

| Comparable | Why |
|---|---|
| Same optimization event | Comparing CPA across "Link clicks" vs "Purchases" optimization is meaningless; the tool flags mixed optimization events with an Amber banner ("Ad sets optimize for different events; CPA comparison is indicative only") and disables normalized CPA. |
| Same currency & date range | Enforced globally; no override. |
| Different audiences | **Yes** — that's the point. Spend share + reach/frequency make the comparison fair. |
| Different placements | **Yes** — placement row breakouts appear per ad set. |
| Different bid strategies | **Indicative only** — flagged with the same Amber banner; spend patterns under COST_CAP vs LOWEST_COST_WITHOUT_CAP aren't directly comparable. |
| Different objectives | **No** — the tool blocks comparison and surfaces "Objectives differ; compare within one objective." A ROAS-optimizing buyer is not served a false equivalence with a REACH campaign. |

**Export.** CSV of the comparison grid (raw and normalized sheets), the
selection criteria, and `exported_at`.

---

## 4. Ads & Creatives

The captain's §9 feature: the creative-intelligence experience. This is the
heart of the product for a media buyer who has to answer "which creative is
winning and which is dying" daily.

### 4.1 Creative gallery (default view)

| Field | Value |
|---|---|
| **Purpose** | See all ads/creatives side by side; classify winners and losers; spot fatigue and scale opportunities at a glance. |
| **Primary user** | Agency buyer + creative strategist; client role read-only (gallery subset). |
| **Goal** | Decide which creative to scale, refresh, pause, or brief the next iteration on. |
| **Primary CTA** | **Open** creative detail. |
| **Secondary actions** | Compare selected (2–4); Tag winner/loser; Create "refresh creative" task; Pause ad (V1.x write, §6); Export. |
| **KPI cards** | Spend · **ROAS (hero)** · CPA · CTR · Frequency · Active ads (n of m). |
| **Charts** | Spend-by-creative Pareto (top 10 by spend, ROAS-tinted) — surfaces concentration risk immediately. |
| **Tables / Grid** | The **creative card grid** (§4.2). |
| **Filters** | Format (Image / Video / Carousel / Collection); Objective; Status; Placement; Parent campaign; Parent ad set; Date (global); Compare (global). Fatigue flag (precomputed: Fatiguing / Anomaly / Healthy / Scale opportunity). |
| **Dimensions** | Ad → Creative. Creative is first-class: one creative may serve across many ads; the gallery groups by `creative_id` when available, else falls back to ad-level. |
| **Metrics** | See §4.2 card spec. |
| **Drill-down** | Card → Creative detail (`/clients/:slug/creatives/:creativeId`). |
| **Empty / Loading / Error / Permission / Mobile / Export** | Same contracts as §1; mobile collapses to one-column card grid with full metric list under each thumbnail (no metric hiding — `DESIGN.md`). |
| **Related pages** | Campaigns; Ad Sets; Ads table (list view alternative); Reports (creative snapshots belong there). |
| **Next action** | If top-spend creative shows Frequency ≥ 4 and Rust ROAS → flag fatiguing and create refresh task. |

### 4.2 Creative card spec

Each card is one creative (or one ad when creative-id grouping isn't
available). Layout per `DESIGN.md`'s account-card pattern: flat at rest,
shadow-2 on hover, md radius, 1px Rule border, 16–20px padding.

| Field | Source | Position on card |
|---|---|---|
| Thumbnail / preview | API-direct via ad `preview` (gap for `16`; video shows first frame with play affordance — text-only "Video", not a glyph) | Top, 4:5 / 1:1 / 9:16 native aspect (no forced crop). |
| Ad name | API-direct (ad_name) | Below thumbnail, serif small headline. |
| Campaign · Ad set | API-direct | Muted sub-line, two lines max with ellipsis. |
| Status | API-direct | Dot + halo + word, top-right of preview. |
| Format badge | API-direct (creative display_format) | Top-left of preview, label style (uppercase, tracked). |
| **ROAS** (hero) | Derived | Right of name, large tabular figure, Olive/Rust/neutral. |
| Spend | API-direct | Under ROAS, paired with Revenue. |
| Revenue | API-direct | Under Spend. |
| CPA | Derived | Pair row. |
| Purchases | API-direct | Pair row. |
| CTR | API-direct | Pair row. |
| CPC | API-direct | Optional row (off unless toggled). |
| CPM | API-direct | Optional row. |
| Frequency | API-direct | Always shown; Rust-tinted cell when ≥4. |
| Impressions | API-direct | Optional. |
| Fatigue flag | Derived (§4.4) | Bottom strip: word + dot (Fatiguing=Rust, Anomaly=Amber, Healthy=neutral, Scale=Olive). |

**Card sort options:** ROAS · CPA · CTR · Spend · Purchases · Revenue ·
Frequency. Default sort: Spend desc (the budget is the buyer's first lens);
secondary sort: ROAS desc.

**Density toggle:** Comfortable (full card, all rows) vs Compact (thumbnail
120px, metrics in single dense grid). Default comfortable.

### 4.3 Creative comparison + detail page

`/clients/:slug/creatives/:creativeId`.

| Field | Value |
|---|---|
| **Purpose** | One creative's full lifecycle and performance; how it compares to its sibling creatives in the same ad set or campaign. |
| **Primary user** | Agency buyer + creative strategist. |
| **Goal** | Decide refresh/replace; brief the next creative iteration with evidence. |
| **Primary CTA** | **Create refresh-creative task** (routes to `09`); secondary **Pause** (V1.x write, §6). |
| **KPI cards** | Spend · **ROAS (hero)** · CPA · CTR · Frequency · First seen / Last seen (lifecycle). |
| **Charts** | (a) Spend/ROAS over time with compare overlay. (b) CTR-over-time with frequency overlay — the canonical fatigue visualization (CTR declining while frequency climbs). (c) Funnel share: this creative's contribution to its parent ad set's funnel. |
| **Tables** | Reuse map: every ad using this creative, with per-ad metrics. Sibling creatives in the same ad set (the implicit comparison set). |
| **Comparison tool** | Side-by-side with up to **3** sibling creatives (4 total) — same layout rules as §3.3 but baseline is "this creative" by default. |
| **Drill-down** | Ad row → Ads table; Campaign row → Campaign detail. |
| **Lifecycle classification** | "Winning" / "Losing" / "Fatiguing" / "Stable" with thresholds (§4.4). |
| **States, permissions, mobile, export** | Per §1 contracts. |

### 4.4 Creative winning/losing classification thresholds

Applied per creative within its **parent ad set cohort** over the selected date
range (so a creative is graded against its actual peers, not the whole
account):

| Label | Threshold (proposed defaults, agency-configurable) | Tint |
|---|---|---|
| **Winning** | ROAS ≥ 1.5× cohort median **and** Purchases ≥ 10 (volume guard) | Olive-Tint |
| **Losing** | ROAS < 0.67× cohort median **and** Spend ≥ 5% of cohort spend (signal guard) | Rust-Tint |
| **Fatiguing** | See §4.5 rules below | Amber-Tint |
| **Stable** | None of the above | neutral |

Thresholds are derived from API-direct inputs (Spend, ROAS, Purchases,
Frequency, CTR) and **do not require any third-party data**; they are
configurable per client because ecommerce vs lead-gen vs awareness campaigns
justify different ratios.

### 4.5 Fatigue & anomaly detection

The captain's §9 fatigue/anomaly engine. Each rule below specifies: trigger
formula, signals, severity, message, recommended action, CTA, and
**computability** (what is API-direct today vs derived vs unreliable and
routed to `16`).

Detection runs as a scheduled job (writes results into the recommendation
queue owned by `09`); the gallery and detail pages **read** the latest
classification, they do not recompute inline.

#### Rule F1 — Creative fatigue

| | |
|---|---|
| **Trigger** | `frequency ≥ F_HIGH (default 4.0)` **AND** `CTR_recent_7d ≤ 0.80 × CTR_prior_7d` (≥20% decline week-over-week). Optional corroboration: `CPA_recent_7d ≥ 1.25 × CPA_prior_7d`. |
| **Signals** | API-direct: `frequency`, `ctr`. Derived: 7-day windows from `fetchDailyInsights` time series. CPA derived from `spend ÷ purchases`. |
| **Severity** | Amber (warning). Rust (critical) when frequency ≥ 6 **and** CTR decline ≥ 40%. |
| **Message** | "Creative is fatiguing: frequency {f} and CTR is down {n}% w/w. Refresh recommended." |
| **Recommended action** | Launch a refresh creative; rotate this ad out of the active ad set within 7 days. |
| **CTA** | Create "refresh creative" task (`09`); link to creative detail. |
| **Computability** | Fully computable from API-direct inputs today. |

#### Rule F2 — High spend, low conversion

| | |
|---|---|
| **Trigger** | `spend_share ≥ S_SHARE (default 15%) of parent cohort` **AND** `ROAS < ROAS_FLOOR (default 1.0×)` sustained ≥ 3 days. |
| **Signals** | API-direct: `spend`, `purchase_roas` / derived ROAS. Derived: spend-share. |
| **Severity** | Rust (negative, acting now). |
| **Message** | "{name} consumed {n}% of cohort spend at {roas}× ROAS — bleeding budget." |
| **Recommended action** | Pause or reduce budget; investigate targeting/creative mismatch. |
| **CTA** | Pause (V1.x write, §6); link to ad set for setup diagnosis. |
| **Computability** | Fully computable from API-direct inputs today. |

#### Rule F3 — High CTR, low conversion (clickbait / landing mismatch)

| | |
|---|---|
| **Trigger** | `CTR ≥ 1.5× cohort median` **AND** `Conversion Rate ≤ 0.5× cohort median` **AND** `Spend ≥ 5% of cohort spend`. |
| **Signals** | API-direct: `ctr`, `actions` (purchases, link_clicks). Derived: conversion rate. |
| **Severity** | Amber (warning). |
| **Message** | "High CTR but low CVR — likely creative/landing mismatch or clickbait signal." |
| **Recommended action** | Audit landing page relevance; check load speed on mobile; consider narrowing the audience the creative targets. |
| **CTA** | Link to creative detail; create task in `09`. |
| **Computability** | CTR/CVR/spend computable from API-direct today. **Unreliable portion flagged for `16`:** the *cause* (landing page quality, mobile load speed, viewability) is not available from Meta insights and requires an offsite telemetry source (e.g., a Chrome DevTools probe or analytics SDK); the rule surfaces the *pattern*, not the cause. |

#### Rule F4 — High conversion, low spend (scale opportunity)

| | |
|---|---|
| **Trigger** | `ROAS ≥ 1.5× cohort median` **AND** `Spend ≤ 0.5× cohort median` **AND** `Frequency < 3.0` (room to scale). |
| **Signals** | API-direct: `spend`, `purchase_roas` / derived ROAS, `frequency`. Derived: cohort medians. |
| **Severity** | Olive (positive opportunity). |
| **Message** | "Scale opportunity: {roas}× ROAS at low saturation — consider raising budget." |
| **Recommended action** | Raise ad set daily budget; duplicate creative into a sibling ad set to expand reach. |
| **CTA** | Adjust budget (V1.x write, §6); link to ad set detail. |
| **Computability** | Fully computable from API-direct inputs today. |

#### Rule F5 — Spend concentration

| | |
|---|---|
| **Trigger** | Top-1 creative's `spend_share ≥ 50%` of parent ad set **OR** top-3 creatives' combined share ≥ 80%. |
| **Signals** | API-direct: `spend` per creative. Derived: cumulative share. |
| **Severity** | Amber (warning, diversification risk). |
| **Message** | "Concentration risk: top creative is {n}% of ad set spend. A single fatigue event would cripple delivery." |
| **Recommended action** | Introduce 2–3 fresh creatives into rotation; rebalance budgets across ad sets using the same audience. |
| **CTA** | Link to creative gallery; create "refresh creative" task. |
| **Computability** | Fully computable from API-direct inputs today. |

#### Rule F6 (companion) — Status anomaly

| | |
|---|---|
| **Trigger** | Ad `review_rejection` or status ≠ parent ad set's status unexpectedly (e.g., ad PAUSED while ad set ACTIVE without operator action). |
| **Signals** | API-direct: ad `status`, `ad_review_feedback` (gap for `16` — Meta exposes rejection reasons; not yet fetched). |
| **Severity** | Rust (action now). |
| **Message** | "Ad rejected or unexpectedly paused: {reason}." |
| **Recommended action** | Edit the creative to comply; resubmit; or pause the parent ad set if delivery is crippled. |
| **CTA** | Link to creative detail; route rejection-reason detail to `09` and `10`. |
| **Computability** | Status is API-direct; rejection-reason text needs an extension to `meta-api.ts` (gap for `13`/`16`). |

**Per-rule provenance summary:** F1, F2, F4, F5 are **fully computable from
API-direct inputs already in `src/lib/meta-api.ts` today**. F3's *pattern* is
computable; its *cause* is not, and is flagged for `16`. F6's trigger is
API-direct; its reason-text needs a client extension flagged for `13`/`16`.

---

## 5. Drill-down flow summary

```
Ad Account  (slug)
   │   adds: connection health, currency, timezone, balance, spend cap
   │
   ▼
CAMPAIGNS LIST
   │   question: "Which campaigns caused it?"
   │   adds: campaign-level Spend/Revenue/ROAS/CPA, objective, budget, status
   │   action: Pause/Resume (V1), Budget edit (V1.x), Compare, Drill
   │
   ▼  [row click / breadcrumb back returns here with last lens restored]
CAMPAIGN DETAIL  /clients/:slug/campaigns/:id
   │   adds: time series, funnel, ad-set & creative sub-tables,
   │        audience/placement/demographic breakdowns,
   │        pacing LINK-OUT to Budget & Pacing,
   │        attribution LINK-OUT to Attribution & Revenue,
   │        activity history, recommendations
   │
   ▼  [ad-set row → drill]
AD SETS LIST / AD SET DETAIL  /clients/:slug/adsets/:id
   │   question: "Which targeting/setup caused it?"
   │   adds: optimization_goal, bid_strategy, audience, placements, pacing,
   │        reach/frequency, per-ad-set metrics
   │   action: Pause/Resume (V1.x), Budget edit (V1.x), Compare (≤4), Drill
   │
   ▼  [ad row → drill]
ADS TABLE / CREATIVE GALLERY
   │   question: "Which creatives caused it?"
   │   adds: creative preview, format, per-creative metrics,
   │        fatigue/anomaly flags, winning/losing classification,
   │        reuse map (one creative across many ads)
   │   action: Pause ad (V1.x), Tag, Refresh-creative task, Compare (≤4)
   │
   ▼  [creative card → drill]
CREATIVE DETAIL  /clients/:slug/creatives/:id
       adds: lifecycle, CTR-vs-frequency fatigue chart, sibling comparison,
            ad-level reuse map, full fatigue/anomaly breakdown

NAVIGATION CONTRACT
  ─ Breadcrumb: Client › Ad Account › Campaign › Ad Set › Creative (verbatim)
  ─ Filters flow DOWN (selection pre-scopes child), never UP
  ─ Global filters (Date, Compare) survive every hop
  ─ Client-scoped filters (Ad Account, Platform, Objective, Status,
    Country, Audience, Placement) persist within client, reset on client switch
  ─ Every URL is deep-linkable and bookmarkable
```

---

## 6. Write actions — Meta API permission/modeling gates

This doc is primarily read-and-decide. The write actions proposed below all
require **captain confirmation** of two things before they ship: (a) that the
agency-side dashboard should expose them at all (vs MCP-only or deferred to a
later release), and (b) the modeling of safety rails (bounds, currencies,
confirmation UX). The Meta Marketing API supports them; the product question
is whether and how Winning Kart should.

| Write action | Meta API path | Proposed phase | Captain gate |
|---|---|---|---|
| **Pause / Resume campaign** | `POST /{campaign_id}` with `status=PAUSED\|ACTIVE` | V1 | Reversible, low risk. Confirm: bulk-up-to-N limit, confirmation UX, audit log destination. |
| **Pause / Resume ad set** | `POST /{adset_id}` with `status=...` | V1.x | Same as above; slightly higher impact (pauses all child ads). Confirm: same rails. |
| **Pause ad** | `POST /{ad_id}` with `status=...` | V1.x | Confirm: same rails. |
| **Adjust campaign daily / lifetime budget** | `POST /{campaign_id}` with `daily_budget` / `lifetime_budget` | V1.x | **Needs captain confirmation on modeling**: per-account-currency formatting (AED today), Meta minimum-budget enforcement, lifetime-vs-daily guardrails (lifetime requires pacing_type and end time), and the confirmation-UX requirement (old → new, projected pacing change, named operator). Bulk budget edit (Δ amount / %) compounds risk and should ship only after single-edit is proven. |
| **Adjust ad set daily / lifetime budget** | `POST /{adset_id}` with budget fields | V1.x | Same modeling questions as campaign budget; ad sets are the more common budget-edit surface (Advantage+ campaigns often use adset budget). |
| **Change bid strategy / bid amount** | `POST /{adset_id}` with `bid_strategy` / `bid_amount` | **V2 or later** | Higher complexity; affects delivery model. Captain should confirm whether this is in Winning Kart's scope at all (could be MCP-only). |
| **Change optimization event** | `POST /{adset_id}` with `optimization_goal` | **Not recommended** | Often requires pixel/event re-verification; high risk of dead-time. Recommend defer indefinitely and document as out-of-scope. |
| **Creative refresh / replace** | Requires creating a new ad (or new creative + ad update) | **V2 or later** | Not a single-endpoint write; needs creative-upload pipeline. Captain gate: scope and storage of creative assets (operator-owned vs Meta-hosted only). |
| **Create task** (no Meta write) | Local only — routes to `09` | V1 | No Meta permission needed. Always safe. |
| **Add to report** (no Meta write) | Local only — routes to `07` | V1 | Always safe. |

**MCP alternative.** Per `PRODUCT.md` the platform already ships API tokens for
MCP tool calls. For every write above, the captain may decide to ship the
**read surface** in the dashboard while exposing writes **only via MCP** (so
the dashboard stays calm and authoritative, and automation performs the
writes). This split is consistent with `01` §5.3 ("calm authority, not a
dashboard of blinking lights") and is recommended for V1: pause/resume and
budget edit become **MCP-only first**, dashboard-inline second.

**Token scope.** All writes require the `ads_management` scope on the stored
token (already required for the existing read path). No additional OAuth scope
is needed; the captain gate is a product/safety decision, not an auth decision.

---

*End of `04-campaigns-adsets-ads.md`. Inherits the anchor (`01`) and
`DESIGN.md`; conflicts defer to those. Gaps and unreliable signals routed to
`16-data-gaps-and-risks.md`; data-model extensions (campaign_events,
creative metadata, adset targeting) routed to `13-data-model.md`;
recommendation routing to `09-tasks-alerts-insights.md`; budget detail to
`05-analytics-audiences-budget.md`; attribution detail to `06-attribution-revenue.md`.*
