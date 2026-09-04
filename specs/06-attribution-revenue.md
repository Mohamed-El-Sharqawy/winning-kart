# 06 — Attribution & Revenue

> Client-scoped surface for the question anchor §6 assigns to this page alone:
> **"Did spend actually produce revenue/profit?"**
> This is the single surface where Winning Kart closes the loop between ad spend
> and real money. It does **not** show creative thumbnails and does **not** edit
> pacing — those belong to `04-campaigns-adsets-ads.md` and
> `05-analytics-audiences-budget.md`.
>
> Status: DRAFT (crewmate done, pending first-mate review).
>
> Cross-references: `01-product-architecture.md` (anchor §2.2, §6, §7, §13),
> `10-integrations.md` (connector plumbing), `04-campaigns-adsets-ads.md`
> (entity drill-down), `16-data-gaps-and-risks.md` (reliability rollup),
> `13-data-model.md` (schema delta), `00-market-research.md` (positioning).

---

## 0. Scope and binding rules

- **Revenue is not a node.** Per anchor §2.2, revenue arrives from outside the
  entity chain (a client's storefront, CRM, or offline upload) and is
  *attributed back* onto Agency → Client → Ad Account → Campaign → Ad Set → Ad.
  No "Revenue" object owns campaigns; revenue events own nothing but an
  identity signal that resolves onto a campaign/ad.
- **Platform-agnostic by design** (anchor §7): the same ingestion + attribution
  applies once Google/TikTok/Snapchat/LinkedIn adapters ship. Identity signals
  (click id, UTM, email hash) are platform-agnostic; only the click-id field
  name differs (`fbclid`, `gclid`, `ttclid`, `scclid`, etc.).
- **Honesty is the differentiator.** Incumbents hide attribution internals
  (Moby, Apex, Synapse — see `00-market-research.md:79`). Winning Kart's edge is
  *showing the work*: every number says which model, which window, which signal
  produced it, and every model's limitations ship as a first-class tab.
- **No creative, no pacing edits here** (anchor §6 non-duplication).

### Data reliability vocabulary (used throughout; feeds `16`)

Every metric in this doc is tagged with one of five tiers, repeated in §6 rollup:

- **[API-direct]** — pulled verbatim from a platform API.
- **[calculated]** — derived from values Winning Kart already holds.
- **[3rd-party-required]** — needs a connector that is not the ad platform.
- **[client-provided]** — must be supplied by the client/operator; Winning Kart
  cannot derive it (e.g. margin %, LTV cohort).
- **[not-reliably-available]** — no source reliably provides it today.

### Schema delta vs today

`src/db/schema.ts` and `src/lib/meta-api.ts` currently have **no** revenue
source, attribution-model, or margin tables. Revenue today is the
Meta-reported `action_values[purchase]` value summed in `summarizeInsights`
(`meta-api.ts:188`) and ROAS is `revenue/spend` (`:207`). This spec requires new
tables (ingestion connectors, revenue events, identity signals, attribution
runs, margin rules) — defined in `13-data-model.md`, flagged in
`16-data-gaps-and-risks.md`.

---

## 1. Revenue ingestion

Five source adapters ship the same ingestion contract. Each produces **revenue
events** shaped: `{ source, source_order_id, ts_utc, value, currency,
customer_email_hash, customer_phone_hash, click_ids, utm, referrer,
landing_url, line_items? }`. Events are **immutable once ingested**; corrections
are new events with a `replaces` pointer (dedup below).

### 1.1 Shopify — primary ecommerce path [3rd-party-required]

- **Connection flow.** OAuth via Shopify App (read_orders, read_customers,
  read_all_orders if revenue > volume threshold). Shopify store bind is
  **per-Client** (one Client may have multiple stores in multiple currencies).
- **Ingestion.** Realtime webhook `orders/paid` + nightly reconciliation via
  Orders REST/GraphQL (catches missed webhooks and refunds). Refunds land as
  negative-value events tied to the original `order_id`.
- **Dedup key.** `{shop_domain}:{order_id}`. Idempotent on webhook redelivery.
- **Currency.** Store base currency (settled) vs presentment currency (charged).
  Winning Kart stores both; ROAS uses base currency converted at order-day rate
  into the ad account's currency (`ad_accounts.currency`).
- **Identity signals available.** `landing_site`, `referring_site`, `_fbc`/
  `_fbp` cookies (if Pixel present), customer email (hashed at ingest, never
  stored raw), UTM parsed from `landing_site` query. Shopify's own
  `attribution` object (first_interaction / last_direct) is captured but
  **not trusted blindly** (see §2).
- **Error / disconnect.** Webhook subscription failures, scope revocation, app
  uninstall — surfaced on Revenue sources tab + Integrations; cross-link
  `10-integrations.md`. On disconnect, attributed revenue **stays**; new events
  stop.
- **Identity reliability flag for `16`.** Email + UTM reliably present;
  click id present **only if** Pixel or UTM-tagged landing page — flag
  `_fbc` capture as *unreliable for non-Shopify-Plus stores with custom
  checkouts*.

### 1.2 WooCommerce [3rd-party-required]

- **Connection flow.** REST API v3 key/secret (consumer_key/consumer_secret)
  generated by the store admin; webhook secret registered for `order.created`,
  `order.completed`. No OAuth; keys are scoped read.
- **Ingestion.** Webhook + hourly poll fallback (WC webhooks are flakier than
  Shopify's — hourly poll is mandatory, not optional).
- **Dedup key.** `{store_url}:{order_key}` (order_key is globally unique per
  store).
- **Currency.** Single-currency by default; multi-currency plugins (WPML,
  CURCY) put per-order currency in `order.currency`. Winning Kart reads that
  field and falls back to store base.
- **Identity signals available.** Customer email, UTM from order meta (requires
  a tracking plugin — capture is *not reliable* on vanilla WC), referrer.
  **Click id `_fbc` is unreliable** unless the store runs a tracking plugin —
  flag for `16`.
- **Error / disconnect.** Key revocation, plugin uninstall (breaks UTM meta),
  site down. WC's lower operational maturity than Shopify means the sync-health
  card must show "last successful poll" prominently.

### 1.3 CRM — HubSpot, Salesforce, custom [3rd-party-required]

- **Connection flow.** HubSpot OAuth (scope `deals` + `companies` +
  `contacts`); Salesforce OAuth (scope on Opportunity, Contact, Account,
  LeadSource); custom CRM via the generic API in §1.4.
- **Ingestion.** Deals/opportunities in closed-won stage with `amount`,
  `closedate`, `lead_source`. Sync is **daily** (CRM deals mutate post-close;
  real-time webhooks create churn). Re-sync re-derives attribution.
- **Dedup key.** `{crm}:deal_id` / `{crm}:opportunity_id`.
- **Currency.** Deal currency field (HubSpot `hs_currency`, SF `CurrencyIsoCode`).
- **Identity signals available.** Lead source, UTM (if captured at lead form),
  contact email. **Click id rarely present** — CRM attribution is lead-source
  granularity, not ad-level. Reliability flag: CRM matches usually resolve to
  campaign *group* or channel, **not** to a specific ad.
- **Error / disconnect.** Token expiry (refresh per platform), field schema
  drift (custom field renamed by client admin), pipeline reconfiguration.

### 1.4 Custom backend API [3rd-party-required]

- **Connection flow.** Winning Kart issues a per-Client ingest key; the client
  posts events to `POST /v1/ingest/revenue`. No inbound OAuth; the key is the
  credential.
- **Contract Winning Kart expects** (the spec — implementers must conform):
  ```jsonc
  {
    "source": "custom",
    "source_order_id": "<client-unique>",
    "ts_utc": "2026-08-11T09:14:00Z",
    "value": 249.00,
    "currency": "AED",
    "customer_email_hash": "<sha256 normalized lowercase>",
    "customer_phone_hash": "<sha256 e164>",
    "click_ids": { "fbclid": "...", "gclid": "..." },   // any present
    "utm": { "source": "...", "medium": "...", "campaign": "...", "content": "...", "term": "..." },
    "referrer": "https://...",
    "landing_url": "https://...",
    "line_items": [{ "sku": "...", "qty": 1, "price": 249.00, "category": "..." }]
  }
  ```
  Required: `source_order_id`, `ts_utc`, `value`, `currency`. Identity signals
  are optional but each missing field degrades match quality (§2).
- **Dedup key.** `{source}:{source_order_id}`.
- **Error / disconnect.** HTTP 4xx/5xx retries with exponential backoff; key
  revocation in Revenue sources tab.

### 1.5 Offline conversions [client-provided + 3rd-party-required]

Two distinct paths, both supported:

- **CSV upload.** Operator uploads a CSV (event_time, event_name, value,
  currency, order_id, email_hash, phone_hash). Dedup: `{upload_batch}:{order_id}`.
  Useful for in-store / call-center / off-platform sales.
- **Meta offline conversion set tie-in.** Same CSV (or matching subset) is also
  posted to a Meta offline event set via the Conversions API; Meta matches it
  back to its pixel users and credits campaigns per its own model. Winning Kart
  surfaces *both*: the platform-attributed revenue (from Meta) and the
  independent upload count. When they disagree, that disagreement is **shown
  on the Limitations tab**, not hidden.
- **Identity reliability flag for `16`.** Offline events match against Meta's
  user graph probabilistically; offline-only matches have the **lowest
  determinism** of any source — flag as tier C/D in §2.

### 1.6 Custom backend revenue contract [3rd-party-required]

The canonical, MVP contract Winning Kart exposes for clients on a custom stack
(Next.js + their own backend, not Shopify/Woo). It supersedes and refines the
illustrative payload in §1.4 above; `10` §9.4 wires its *connection*, this
section owns the *contract*.

- **Transport.** Both modes are supported: (a) **push** — the client posts
  events to `POST /api/revenue/ingest`; (b) **pull** — Winning Kart fetches a
  client-defined REST URL on a schedule. The client picks whichever their
  stack allows.
- **Auth.** Bearer token — a per-Client **revenue-ingest key** that reuses the
  existing MCP/API token mechanism (`apiTokens`, `src/lib/mcp.ts`), scoped to
  exactly one Client. The endpoint **never accepts cross-client data**: a key
  issued for Client A cannot write revenue against Client B.
- **Idempotency.** Key = `{source} + {source_order_id}`. Re-deliveries and
  replays are deduped, never double-counted (same rule as the §0 connector
  idempotency contract).
- **Payload (JSON).**
  ```jsonc
  {
    "source": "custom",                   // string; identifies the client stack
    "source_order_id": "<client-unique>",
    "timestamp": "2026-08-11T09:14:00Z",  // ISO-8601, UTC
    "value": 249.00,                      // decimal
    "currency": "AED",                    // ISO-4217
    "customer_ref": "<string | sha256 email hash>",
    "click_id": { "fbclid": "...", "_fbp": "...", "_fbc": "..." }, // optional
    "utm": { "source": "...", "medium": "...", "campaign": "..." },// optional
    "items": [ { "sku": "...", "qty": 1, "price": 249.00 } ],      // optional
    "status": "paid"                      // paid | refunded | cancelled
  }
  ```
  Required: `source`, `source_order_id`, `timestamp`, `value`, `currency`,
  `status`. `customer_ref`, `click_id`, `utm`, and `items` are optional but
  each absence degrades match quality (below).
- **Response.** `202 Accepted` with:
  ```jsonc
  { "accepted": true, "match_quality": "A" | "B" | "C", "deduped": false }
  ```
  Returned per order in both push and pull modes.
- **Match-quality tiers** (the contract returns A/B/C; §2's stitch priority
  remains the internal authority; carried from `16` §2.4):
  - **A** — `click_id` match (fbclid / `_fbp` / `_fbc` resolved). Best; ties
    the order to a specific ad. Highest reliability.
  - **B** — UTM or referrer match. Resolves to a campaign group. Medium.
  - **C** — no resolved click_id and no UTM; falls back to platform-attributed
    aggregate (or sits as unmatched revenue pending enrichment). Lowest.
  - The tier is surfaced per order and on every attribution view; Winning Kart
    **never fabricates a match** — absent signals stay absent.
- **Reliability.** The client retries push on `5xx` / timeout with exponential
  backoff; Winning Kart dedupes on every receipt so retries are safe. Partial
  batches are accepted (each event scored independently); a single bad event
  does not reject the batch.
- **Honesty contract (the iOS-ATT / custom-checkout limitation).** If
  `click_id` is absent **and** `utm` is absent, the order is recorded as
  revenue but flagged `match_quality: "C"` and **excluded from WK-computed
  attribution models** (first-touch / last-touch / linear / time-decay /
  position-based) until enriched. This is the same iOS-ATT / custom-checkout
  identity decay documented in `16-data-gaps-and-risks.md` §2.4 (R1, R2) —
  revenue ingestion does not invent the missing identity. Platform-attributed
  revenue (from Meta, F06-07) remains available regardless, with its own
  disclosed bias.

---

## 2. Identity matching / stitch

Attribution is only as honest as the identity it runs on. Winning Kart stitches
each revenue event to a campaign/ad using the strongest available signal, in
this priority order:

1. **Deterministic click id + email hash** (fbclid/gclid/ttclid captured on the
   landing URL *and* email hash on the order) → ties event to a specific ad.
2. **UTM parameters** (utm_source/medium/campaign/content) → ties event to a
   campaign (and ad set if utm_content carries it).
3. **Pixel/CAPI match** (Meta `_fbp`/`_fbc` cookie paired with Conversions API
   event) → platform-attributed; Winning Kart reports Meta's number verbatim.
4. **Referrer + landing path heuristics** → ties to channel group only.
5. **No signal** → event lands in **Unattributed revenue**, never dropped.

### Match-quality tiers (shown to user)

| Tier | Signal | What it resolves to | Reliability |
|---|---|---|---|
| **A — Deterministic** | click id + email hash | specific ad | high |
| **B — Probabilistic order-level** | UTM or referrer | campaign group | medium |
| **C — Platform-attributed aggregate** | Pixel/CAPI | campaign per Meta | medium (Meta's own claim) |
| **D — Unmatched** | none | channel group or none | n/a |

**What the user sees when match quality is low.** Each Revenue source card and
each Attribution model view carries a **Match quality** indicator: percent of
revenue value in tiers A/B vs C/D, with a one-line read ("62% deterministic,
24% platform-attributed, 14% unmatched"). Low quality does **not** hide the
number — it shows the number with its confidence band. This is the trust
contract: hiding unmatched revenue would betray the §0 honesty rule.

### Order-level vs aggregate

- **Order-level** paths (Shopify, Woo, CRM, custom API, offline CSV) keep one
  revenue event per order; attribution runs per event and aggregates up the
  chain. All WK-computed models (first-touch, last-touch, linear, time-decay,
  position-based) require this.
- **Aggregate** paths (Meta insights with no revenue source connected) cannot
  run WK models — Winning Kart can only display platform attribution in that
  case, with an explicit disclosure.

---

## 3. Attribution models

Six models. Each is shown with definition, credit computation, what it's good
for, its limitations, and data requirements. Every limitation ships to the
Limitations tab — the honesty *is* the differentiator (§0).

### 3.1 Platform attribution (Meta-attributed) [API-direct + calculated]

- **Definition.** Credit assigned by Meta's own model, reported through
  `action_values[purchase]` and `purchase_roas` on the insights API.
- **Credit computation.** None by Winning Kart — Meta's. The ad account's
  configured attribution window (default 7d_click / 1d_view post-iOS-14) is the
  only knob; Winning Kart reads it and labels it.
- **Good for.** Continuity with what Meta optimizes against; the number Meta's
  delivery system sees.
- **Limitations.** Black box (Meta's algorithm and window are vendor-controlled),
  walled-garden bias (Meta credits itself favorably vs other platforms), iOS-ATT
  decay since 14.5 (Pixel + cookie reliability dropped materially on iOS),
  view-through inflates platform ROAS vs advertiser click-based ROAS, invisible
  to cross-platform paths, sampling on large accounts.
- **Data requirements.** Meta Marketing API insights; no revenue source needed.

### 3.2 First-touch [calculated, 3rd-party-required]

- **Definition.** 100% credit to the first campaign/ad that touched the
  customer before purchase.
- **Credit computation.** From the touch timeline per order (clicks/sessions
  stitched by identity) — first touch gets `value`.
- **Good for.** Top-of-funnel discovery, awareness value, identifying
  acquisition sources.
- **Limitations.** Ignores all subsequent touches, rewards first-click
  unfairly, biased toward awareness campaigns, weak when funnel is long.
- **Data requirements.** Order-level ingestion + identity stitch with a
  captured first-touch signal. Not available from platform insights alone.

### 3.3 Last-touch (non-platform, WK-computed) [calculated, 3rd-party-required]

- **Definition.** 100% credit to the last touched campaign/ad before purchase.
- **Credit computation.** Last touch in the per-order timeline receives
  `value`.
- **Good for.** Direct-response decision-making, conversion-path end value,
  the closest-to-platform number that is *not* platform-reported.
- **Limitations.** Ignores all assist, undervalues awareness/retargeting,
  over-credits branded search and bottom-funnel, often disagrees sharply with
  platform (the disagreement is informative, not a bug).
- **Data requirements.** Same as first-touch.

### 3.4 Linear [calculated, 3rd-party-required]

- **Definition.** Equal credit across all touches.
- **Credit computation.** `value / N` to each of N touches.
- **Good for.** Balanced view across funnel; no modeler bias.
- **Limitations.** Dilutes significance per touch, treats all touches equally
  regardless of impact, noisy when many touches.
- **Data requirements.** Full touch timeline per order.

### 3.5 Time-decay [calculated, 3rd-party-required]

- **Definition.** More recent touches get more credit, exponential decay
  (configurable half-life, default 7 days).
- **Credit computation.** Each touch weighted by `2^(-age_days / half_life)`,
  weights normalized to sum to `value`.
- **Good for.** Recency-weighted, realistic for short funnels.
- **Limitations.** Penalizes long funnels, half-life is arbitrary, misses
  early-journey impact.
- **Data requirements.** Full touch timeline + timestamps.

### 3.6 Position-based / U-shape [calculated, 3rd-party-required]

- **Definition.** 40% to first touch, 40% to last touch, 20% split across
  middle touches.
- **Credit computation.** Fixed weights; middle touches share the 20% equally.
- **Good for.** Balanced recognition of discovery + conversion.
- **Limitations.** Fixed weights are arbitrary, doesn't fit single-touch paths
  (collapses to first=last=100%, degenerate).
- **Data requirements.** Full touch timeline.

### 3.7 Model comparison view

Side-by-side table: rows = entities (Campaigns / Ad Sets / Ads), columns =
each model's ROAS and CPA. A **spread** column shows max–min ROAS across models
per row; high spread flags where model choice materially changes the story.
Default sort by spread descending surfaces the most contested entities first.
This view is the literal embodiment of "show your work" — the same campaign
renders honestly different across models, and the operator sees all of them.

---

## 4. Business-outcome metrics

Each metric states its source and reliability tier.

| Metric | Definition | Tier |
|---|---|---|
| **Spend** | Platform spend in account currency. | [API-direct] |
| **Purchases** | Order count (revenue-source) or `actions[purchase]` count (platform). | [API-direct] / [calculated] |
| **Revenue** | Sum of attributed revenue events under the selected model. | [calculated] |
| **ROAS** | Revenue / Spend. | [calculated] |
| **CPA** | Spend / Purchases. | [calculated] |
| **AOV** | Revenue / Purchases. Needs revenue-source; if only platform data, AOV = `action_value / action_count` from Meta (lower fidelity). | [calculated] / [API-direct] |
| **Conversion rate** | Purchases / Link clicks. | [calculated] |
| **CAC** | Spend / New customers. **New-customers** requires first-party customer identity across orders — *not* in any ad platform API. Needs revenue-source with customer_email_hash cohorting. | [3rd-party-required], partially [not-reliably-available] |
| **Profit** | Revenue × Margin %. Margin is **never** in any ad platform or store order. | [client-provided] |
| **Margin** | (Revenue − COGS) / Revenue per order, SKU, or flat %. Client must supply. | [client-provided] |
| **LTV** | Total revenue per customer across repeat purchases over a window. Requires revenue-source with stable customer IDs across orders over time + enough history. | [client-provided] / [3rd-party-required] |

**Profit, margin, and LTV require client-provided data** — Winning Kart cannot
compute any of them from ad-platform data alone. Where missing, the Profit &
margin tab shows the metric as **"requires client-provided data"** rather than
a fabricated number. Flagged for `16`.

---

## 5. Page layouts (four tabs, full template each)

The Attribution & Revenue page is **client-scoped** (anchor §13). With **All
Clients** selected it renders an aggregated cross-client view (with a Client
column); with a specific client selected it scopes. Tabs: **Revenue sources ·
Attribution models · Profit & margin · Limitations**.

### 5.1 Tab A — Revenue sources

- **Purpose.** Manage this client's revenue connectors and see their sync
  health.
- **Primary user.** Agency analyst/manager (configure); client never sees this
  tab (portal hides ingestion, anchor §3.5).
- **Goal.** Trust that revenue is flowing in correctly and completely.
- **Primary CTA.** "Connect revenue source" (opens source picker).
- **Secondary actions.** Re-sync now; view sync log; disconnect (guarded,
  downstream-effects dialog); upload offline CSV.
- **KPI cards.** Connected sources count · Revenue (selected period, all
  sources) · Match quality % (A+B / total) · Last sync freshness.
- **Charts.** Revenue by source (stacked daily bar); match-quality over time
  (line).
- **Tables.** Per-source card: name, type, status dot, last sync, event count,
  error count, dedup audit count. Below: a recent-events ledger (date, order id,
  value, currency, tier, attributed entity) with horizontal scroll on mobile
  (DESIGN.md table rule — no column hiding).
- **Filters.** Source type; status (healthy/warning/error); date range
  (inherits global).
- **Dimensions.** Source type; currency; tier.
- **Metrics.** Events ingested, value ingested, dedup hits, error rate.
- **Drill-down.** Source → sync log → single event detail (raw payload + which
  campaign it attributed to).
- **Empty.** No source connected: one centered card "Connect a revenue source
  to close the loop between spend and revenue" with the connect CTA; ROAS
  everywhere else falls back to platform attribution with a visible disclosure.
- **Loading.** Source cards show skeleton; sync log shows ledger-row shimmers.
- **Error.** Source card status dot → Rust + word ("Token expired", "Webhook
  failing", "Schema drift"); error count links to sync log.
- **Permission.** Admin/staff/analyst; client role hidden entirely.
- **Mobile/responsive.** Cards stack; ledger horizontal-scrolls.
- **Export.** Source list CSV; sync log CSV.
- **Related pages.** `10-integrations.md` (connector plumbing); `04-campaigns-adsets-ads.md` (where attributed revenue shows on rows).
- **Next action.** Fix any source in error; or proceed to Attribution models.

### 5.2 Tab B — Attribution models

- **Purpose.** Choose, switch, and compare attribution models.
- **Primary user.** Agency analyst (configure) and buyer (consume); client sees
  the *selected* model's output in their portal, not the picker.
- **Goal.** Understand how each model tells the story differently and pick the
  one this client reports under.
- **Primary CTA.** "Set as default model" (selected model becomes the
  client's reported attribution).
- **Secondary actions.** Open model comparison; open Limitations for this
  model; configure window/half-life (advanced).
- **KPI cards.** Active model · ROAS under active model · ROAS spread (max−min
  across all models) · Match quality %.
- **Charts.** ROAS-by-model bar (one bar per model); revenue-by-model ribbon
  over time.
- **Tables.** Model comparison table (rows = campaigns, columns = models'
  ROAS/CPA, plus spread); on narrow screens scrolls horizontally.
- **Filters.** Entity level (Campaign/Ad Set/Ad); date range (global);
  platform (global).
- **Dimensions.** Model; entity level; campaign; ad set; ad.
- **Metrics.** ROAS, CPA, attributed revenue, attributed purchases, per model.
- **Drill-down.** Row → campaign detail (`04-campaigns-adsets-ads.md`) carrying
  the active model in the URL so the lens travels.
- **Empty.** No revenue source connected and no platform attribution: "Connect
  a revenue source or select platform attribution to see models." If only
  platform data exists, WK-computed models are disabled with a one-line reason.
- **Loading.** Comparison table shimmer; KPI cards show tabular-figure skeleton.
- **Error.** If identity stitch fails for a run: banner "Attribution run for
  <date> incomplete — showing previous run"; link to sync log.
- **Permission.** Admin/staff/analyst configure; client role sees selected
  model output in Campaigns and portal but no picker.
- **Mobile/responsive.** KPI cards 2-up; comparison table scrolls.
- **Export.** Comparison table CSV; per-model revenue series CSV.
- **Related pages.** `04-campaigns-adsets-ads.md`; Limitations tab (this page).
- **Next action.** Review the Limitations tab before defending any number.

### 5.3 Tab C — Profit & margin

- **Purpose.** Where margin data exists, express outcomes as profit and
  margin-aware ROAS rather than revenue-only.
- **Primary user.** Agency account manager (configure margin rules);
  analysts/buyers consume.
- **Goal.** Move the conversation from "did spend make revenue" to "did spend
  make profit."
- **Primary CTA.** "Add margin rule" (per SKU, per category, per order, or flat
  %).
- **Secondary actions.** Import margin CSV; edit rule; recalc; toggle "hide
  margin from client portal" (per `11-team-permissions-client-portal.md`).
- **KPI cards.** Profit · Margin % · Profit-ROAS (profit/spend) · Profit-CPA
  (spend/profit-acquiring-orders). Each card carries a "client-provided" tag if
  margin data is partial.
- **Charts.** Profit-over-time line; margin-by-category bar; profit-ROAS vs
  revenue-ROAS delta chart.
- **Tables.** Margin rules table (SKU/category/order/flat · % · applies-to ·
  last-updated); profit-by-campaign table (campaign · revenue · margin · profit
  · profit-ROAS).
- **Filters.** Margin rule type; category; date range (global).
- **Dimensions.** SKU; category; campaign; ad set.
- **Metrics.** Revenue, COGS (derived from rule), margin %, profit, profit-ROAS,
  profit-CPA.
- **Drill-down.** Margin rule → affected orders; profit row → campaign detail
  with margin lens.
- **Empty.** No margin rules: centered card "Profit and margin require
  client-provided data — add a margin rule to enable profit views." Profit KPI
  cards show "requires client-provided data" muted placeholder, never a
  fabricated zero.
- **Loading.** KPI cards tabular skeleton; rules table shimmer.
- **Error.** Rule conflicts (SKU rule vs category rule) → amber banner with
  resolution CTA.
- **Permission.** Admin/staff/analyst; client role sees profit **only if** the
  agency explicitly shares it (default off — margin is operator-sensitive).
- **Mobile/responsive.** KPI cards 2-up; tables scroll horizontally.
- **Export.** Margin rules CSV; profit-by-campaign CSV.
- **Related pages.** `11-team-permissions-client-portal.md` (margin visibility
  toggle); `07-reports.md` (margin in reports is opt-in).
- **Next action.** If margin data exists, switch the default ROAS reporting to
  profit-ROAS for this client.

### 5.4 Tab D — Limitations

- **Purpose.** A transparent, first-class disclosure of every model's blind
  spots — a trust feature, not a footnote.
- **Primary user.** Agency analyst/manager preparing to defend a number to a
  client; clients (read-only, simplified) in the portal.
- **Goal.** Make it impossible to quote a Winning Kart attribution number
  without also knowing its limits.
- **Primary CTA.** "Copy disclosure" (puts a plain-English disclosure of the
  active model into clipboard for pasting into a client report).
- **Secondary actions.** Filter by model; filter by severity; export PDF.
- **KPI cards.** None (this is a reading surface, not a metric surface —
  density through structure, not numbers).
- **Charts.** None.
- **Tables.** Limitations table: model · limitation · severity (high/medium/
  low) · what it means · what to do. Pre-populated rows for every §3 limitation
  (cross-device, view-through, iOS-ATT, walled-garden bias, last-touch bias,
  CRM identity gaps, pixel double-count, sampling).
- **Filters.** Model; severity; data-source type.
- **Dimensions.** Model; severity; source type.
- **Metrics.** None.
- **Drill-down.** Row → relevant sync-log or model comparison anchor.
- **Empty.** Never empty — pre-populated by default. If a client has zero
  revenue sources, only the platform-attribution limitations show.
- **Loading.** Instant (static content).
- **Error.** None (read-only static).
- **Permission.** All roles read; admin can pin custom client-facing notes.
- **Mobile/responsive.** Single-column reading layout; table becomes stacked
  cards under 600px (the one place card view is permitted — readability beats
  ledger density for prose).
- **Export.** Disclosure PDF (branded per white-label, `07-reports.md`).
- **Related pages.** Attribution models tab (this page); `07-reports.md`.
- **Next action.** Use "Copy disclosure" when communicating the number
  externally.

---

## 6. Reliability rollup (feeds `16`)

Summary of every metric/signal in this doc against the §0 tiers, for
`16-data-gaps-and-risks.md` to consume verbatim.

| Item | Tier | Notes |
|---|---|---|
| Spend | [API-direct] | per ad platform insights |
| Purchases (platform) | [API-direct] | Meta `actions[purchase]` |
| Purchases (revenue source) | [calculated] | count of ingested events |
| Revenue (platform model) | [API-direct] | Meta `action_values[purchase]` |
| Revenue (WK models) | [calculated] | requires order-level source |
| ROAS / CPA | [calculated] | derived |
| AOV | [calculated] | needs source; degraded with platform-only |
| Conversion rate | [calculated] | derived |
| CAC (new customers) | [3rd-party-required] / [not-reliably-available] | needs customer cohorting |
| Profit / Margin | [client-provided] | no source computes it |
| LTV | [client-provided] / [3rd-party-required] | needs repeat-purchase history |
| Shopify click id capture | [not-reliably-available] | on non-Shopify-Plus custom checkouts |
| WooCommerce UTM/click id | [not-reliably-available] | requires tracking plugin |
| CRM ad-level match | [not-reliably-available] | resolves to campaign group, not ad |
| Offline conversion match | [not-reliably-available] | probabilistic, lowest determinism |
| iOS-ATT-era Pixel reliability | [not-reliably-available] | materially degraded since iOS 14.5 |

---

*End of `06-attribution-revenue.md`. Revenue is attributed back onto the entity
chain; the honesty of this surface is the product's competitive edge against
black-box attribution incumbents.*
