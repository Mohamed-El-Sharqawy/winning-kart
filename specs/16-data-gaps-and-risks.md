# 16 — Data Gaps & Risks

> The honesty backbone of Winning Kart. This doc consolidates two things the
> captain asked for in one place: (A) **per-page data requirements** (entities,
> metrics, dimensions, sources, RAW vs CALCULATED) for every page `02`–`12`;
> and (B) the **master reliability classification** — every metric and data
> point in the spec classified into one of five tiers, with its limitation and
> its mitigation.
>
> Status: DRAFT (crewmate done, pending first-mate review).
>
> Scope: capt. sections 23 + M. Cross-references: every page spec `02`–`12`,
> plus `01-product-architecture.md`, `PRODUCT.md`, `DESIGN.md`,
> `src/db/schema.ts`, `src/lib/meta-api.ts`, `src/lib/types.ts`. Markdown only;
> no code; no other file modified.
>
> **Why this doc exists.** The product thesis (`01` §1, `06` §0) is that
> Winning Kart beats incumbents on *transparent attribution* and *data
> ownership*. That thesis dies the moment a flaky data point silently becomes a
> confident number. This doc is the contract that prevents it: every metric
> carries its source, every limitation ships to the user, and "we don't know"
> is always an acceptable answer (`06` §4.2, `09` §7.4).

---

## 0. The five reliability tiers

Adopted verbatim from `06` §0 and reused across all page docs.

| Tier | Mark | Meaning |
|---|---|---|
| **Available-direct-from-API** | `[API]` | Pulled verbatim from a platform API (Meta today; Google/TikTok/etc. later). |
| **Requires-calculation** | `[CALC]` | Derived in Winning Kart from values already held (ROAS, CPA, pacing %, forecast). |
| **Requires-third-party-integration** | `[3PI]` | Needs a connector that is not the ad platform (Shopify, Woo, CRM, GA4, offline upload). |
| **Requires-client-provided-data** | `[CLIENT]` | Must be supplied by the operator/client; no source computes it (margin %, LTV cohort, monthly cap). |
| **Not-reliably-available** | `[NRA]` | No source reliably provides it today; Winning Kart must approximate, label as estimate, or hide. |

Every numeric surface in the product must tag each metric with one of these
five marks in its tooltip (`05` §1.2, `06` §2). The user-facing label is the
plain-English form, never the bracketed token.

---

## 1. Per-page data requirements

Compact tables, one per page `02`–`12`. "RAW" = read straight from a platform
API; "CALC" = computed in Winning Kart; "3PI" = needs a non-ad-platform
connector; "CLIENT" = operator/client-supplied.

### 1.1 02 — Overview / Executive Dashboard

Agency Portfolio Overview + Client Portal Dashboard. Pulse-level only.

| Item | Kind | Source | Notes |
|---|---|---|---|
| Spend (per ad account, rollup) | RAW | Meta `insights.spend` | `summarizeInsights`, `meta-api.ts:162`. |
| Revenue (attributed) | RAW (platform) / CALC (WK models) | Meta `action_values[purchase]` / WK attribution | Platform by default; WK model when `06` source is connected. |
| ROAS | CALC | `revenue / spend` | Cross-checked against API `purchase_roas`. |
| CPA | CALC | `spend / purchases` | "—" with ink-3 "no purchases" note when 0. |
| Purchases | RAW | Meta `actions[purchase]` | |
| Account-health composite | CALC | `ad_accounts` + refresh metadata + Meta `account_status` | Composite, not a Meta field. |
| Spend-cap headroom | CALC | `fetchAccountInfo` (`balance`, `spend_cap`, `amount_spent`) | **Billing-model-dependent** — see §2. |
| **Required entities** | Client, Ad Account. | | |
| **Required dimensions** | Client only. | | No campaign/ad dimensions on this surface (`01` §6). |
| **Out of scope** | Profit/Margin/LTV, CTR/CPC/CPM, ATC/Checkout, per-ad rows. | | Routed to `04`/`05`/`06`. |

### 1.2 03 — Clients & Ad Accounts

Operational surface — connection health, onboarding, token state.

| Item | Kind | Source | Notes |
|---|---|---|---|
| Client roster fields | CLIENT | Operator-authored | `clients` table today has no `status`, industry, AM, primary-contact columns (`03` §8). |
| Ad account fields | RAW | Meta `fetchAccountInfo` + `schema.ts` | businessId/pageId/pixelId stored locally. |
| Token status | CALC | Refresh metadata + auth error class | Encrypted at rest (`crypto.ts`). |
| Balance/cap headroom | CALC | `fetchAccountInfo` | **No unified "spendable headroom"** across billing models (`03` §4.1). |
| Conversion events list | RAW | Pixel `attached_assets` / dataset edge | **Not reliably exposed** on all accounts (`03` §4.1). |
| Account restriction reason | NRA | Meta `account_status` (numeric only) | Policy reason not in API (`03` §6). |
| **Required entities** | Client, Ad Account. | | |
| **Required dimensions** | None (Clients *is* the dimension). | | |

### 1.3 04 — Campaigns, Ad Sets, Ads & Creatives

The performance-management spine. Heaviest RAW surface in the product.

| Item | Kind | Source | Notes |
|---|---|---|---|
| Spend, impressions, reach, clicks, CTR, CPC, CPM, frequency | RAW | Meta `fetchInsights` | Already in `meta-api.ts:82`. |
| Purchases, ATC, checkout, LPV, link_clicks | RAW | Meta `actions[]` | |
| Revenue (platform) | RAW | Meta `action_values[purchase]` | |
| `purchase_roas`, `cost_per_action_type` | RAW | Meta insights | |
| ROAS (WK), CPA, conversion rate, ATC rate, spend-share | CALC | `summarizeInsights` / `summarizeAdLevel` | |
| Campaign `objective`, `daily_budget`, `lifetime_budget`, `buying_type` | RAW | Meta `fetchCampaigns` | Already fetched (`meta-api.ts:73`). |
| Adset `optimization_goal`, `bid_strategy`, `pacing_type`, `targeting`, `promoted_object` | RAW | Meta — **NOT yet fetched** | Needs `meta-api.ts` extension (`04` §0.3, §3.2). |
| Ad `creative`, `preview`, `display_format` | RAW | Meta — **NOT yet fetched** | Drives the creative gallery (`04` §4.2). |
| Ad rejection reason text | NRA | Meta `ad_review_feedback` — **NOT yet fetched** | F6 needs extension (`04` §4.5). |
| Creative fatigue flag | CALC | frequency + CTR decay + spend concentration | **No platform fatigue score** (`02` §4, `04` §4.5, `09` §9). |
| Landing-page quality / mobile load / viewability | NRA | Offsite telemetry required | F3 *pattern* computable; *cause* not (`04` §4.5 F3). |
| Campaign activity log | CALC | Future `campaign_events` table | Does not exist today (`04` §2.1, §13). |
| **Required entities** | Campaign, Ad Set, Ad, Creative. | | |
| **Required dimensions** | Campaign; plus Ad Set, Ad, Creative, Placement, Audience, Country, Device, Age/Sex on detail. | | Demographic/placement breakdowns need new fetch path (`05` §2.3). |

### 1.4 05 — Analytics, Audiences, Budget & Pacing

The "why is it happening" exploration layer + spend projection.

| Item | Kind | Source | Notes |
|---|---|---|---|
| Performance metrics (full ledger set) | RAW + CALC | Meta insights + `summarizeInsights` | Per `04`. |
| Placement breakdown | RAW | Meta `breakdowns=publisher_platform,platform_position,impression_device` | **New fetch path required** — `meta-api.ts` does not pass `breakdowns` (`05` §2.3). |
| Demographic breakdown (age/sex/region/country) | RAW | Meta `breakdowns=age,gender,region,country` | Same new fetch path. |
| Hour-of-day / day-of-week | RAW | Meta `hourly_stats_aggregated_by_advertiser_time_zone` | **~7-day retention, NOT backfillable** (`05` §2.4). |
| New vs Returning | NRA | Not a clean Meta breakdown | Custom-audience membership only, else *not reliably available* (`05` §2.2). |
| Audience size | RAW (approx) | Meta returns bounds, not exact counts | Labelled "approximate" (`05` §4). |
| Audience overlap | NRA | API-restricted for arbitrary pairs | Inferred from shared custom-audience membership; never fabricated (`05` §4.2). |
| Monthly cap | CLIENT | Operator-set | Local-only field. |
| Target spend, pacing %, projected month-end, forecast cone | CALC | Formulas in `05` §5.3 | EMA run-rate, variance band. |
| Meta internal pacing (lifetime / Advantage+) | NRA | Not exposed | WK calendar-even target is an approximation (`05` §5.4). |
| CBO / Advantage+ ad-set budget | NRA | Absent by design | Pacing computed at campaign only; ad-set drill shows *share* (`05` §5.3, §5.4). |
| Multi-currency FX conversion | CALC | Order-day rate snapshot | Monthly cap in client currency vs daily_budget in ad-account currency (`05` §5.3, §6). |
| **Required entities** | Campaign, Ad Set, Ad, Audience, Placement. | | |

### 1.5 06 — Attribution & Revenue

The honesty surface. Tier vocabulary in §0 is authoritative for the whole spec.

| Item | Kind | Source | Notes |
|---|---|---|---|
| Spend | `[API]` | Platform insights | |
| Purchases (platform / revenue source) | `[API]` / `[CALC]` | Meta `actions[purchase]` / count of ingested events | |
| Revenue (platform / WK models) | `[API]` / `[CALC]` | Meta / first-touch, last-touch, linear, time-decay, U-shape | WK models require order-level source. |
| ROAS, CPA, conversion rate, AOV | `[CALC]` | Derived | |
| CAC (new customers) | `[3PI]` / `[NRA]` | Needs customer cohorting across orders | No ad-platform API exposes new-vs-returning customer identity (`06` §4). |
| Profit, Margin, COGS | `[CLIENT]` | Operator-supplied margin rules | No source computes margin. |
| LTV | `[CLIENT]` / `[3PI]` | Repeat-purchase history required | Needs stable customer IDs over time. |
| Identity: deterministic click id + email hash | `[3PI]` | Shopify/Woo/CRM/custom API | Tier A match. |
| Identity: Shopify `_fbc` on non-Shopify-Plus | `[NRA]` | Custom checkouts drop the cookie | Tier degrades (`06` §1.1). |
| Identity: WooCommerce UTM/click id | `[NRA]` | Requires tracking plugin | Vanilla Woo drops it (`06` §1.2). |
| Identity: CRM ad-level match | `[NRA]` | Resolves to campaign group, not ad | Tier B/C (`06` §1.3). |
| Identity: offline conversion match | `[NRA]` | Probabilistic, lowest determinism | Tier C/D (`06` §1.5). |
| iOS-ATT-era Pixel reliability | `[NRA]` | Materially degraded since iOS 14.5 | Platform-attributed revenue overstates true ROAS (`06` §3.1). |
| **Required entities** | Revenue Event (attributed back onto Campaign/Ad Set/Ad). | | Revenue is *not* a node in the entity chain. |

### 1.6 07 — Reports

Curated output, not a data source. Inherits every gap from its source blocks.

| Item | Kind | Source | Notes |
|---|---|---|---|
| KPI block (spend/revenue/ROAS/CPA/purchases) | inherits `02` | snapshot at generation | |
| KPI block (profit/margin/LTV) | `[CLIENT]` / `[NRA]` | `06` §5.3 | Renders "requires client-provided data" placeholder, never a fabricated zero. |
| Performance chart (revenue line) | inherits `06` | Platform-attributed by default | Model label mandatory. |
| Attribution summary (model, window, match-quality) | inherits `06` | | **Mandatory one-line limitation disclosure** (`07` §3.9). |
| Audience analysis | inherits `05` + `06` | CRM matches tier B/C | Match-quality tier shown. |
| Recommendations block | inherits `09` | Fatigue-derivation gap applies | |
| **Required entities** | None direct — embeds blocks from `02`/`04`/`05`/`06`/`08`/`09`. | | |
| PowerPoint export | `[3PI]` (enterprise) | V1+ / white-label tier | Gated (`07` §5). |

### 1.7 08 — Marketing Plans

Targets and Plan-vs-Actual. Adds the *planned* column to existing actuals.

| Item | Kind | Source | Notes |
|---|---|---|---|
| Goals, KPI targets, thresholds | `[CLIENT]` | Operator-authored | |
| Budget allocation (channel/month/campaign) | `[CLIENT]` | Operator-authored | Channel is an agency convention, not a Meta entity. |
| Actuals (ROAS, revenue, spend, CPA, conversions, etc.) | inherits `02`/`04`/`05`/`06` | Same source as live surfaces | Switching attribution model re-flows actuals. |
| Variance, attainment, pace-adjusted target | `[CALC]` | Formulas in `08` §2.1 | Assumes linear delivery — caveat in first/last 10% of period. |
| Retention / return-customer KPI | `[3PI]` / `[NRA]` | Needs revenue source | Meta gives purchase counts, not new-vs-returning (`08` §8). |
| Brand-lift / aided awareness | `[NRA]` | Not in any ad API | Awareness plans lean on CPM/CTR/reach only. |
| **Required entities** | Plan, PlanLink (read-only refs to Campaign/Ad Set/Creative/Ad Account/Task). | | |

### 1.8 09 — Tasks, Alerts & Insights

The queue, not the data. Detection runs on read of the latest data; signals
reuse the §2 master table.

| Item | Kind | Source | Notes |
|---|---|---|---|
| Alert triggers (CPA, ROAS, CTR, spend anomaly, revenue, pacing, fatigue, no-conv, token, restricted) | CALC | Shared detection module (`09` §1.4) | Same rules as `02` §1.4 insights. |
| Insight causal attribution | CALC | Decomposition by driver | **Honesty limit**: "unattributed" when no driver ≥ 60% (`09` §4.2, §7.4). |
| Budget-edit log (spend-anomaly "matched edit") | `[NRA]` | WK budget-edit history only | **Meta-side edits invisible** — yields "unattributed" (`09` §9). |
| Decomposition data (per-creative insights) | RAW | Meta | Partial sync → "unattributed" for that account. |
| **Required entities** | Task, Alert, Insight, with bidirectional links to all entity-chain nodes. | | |

### 1.9 10 — Integrations

Plumbing only — no performance metrics. Operational limits predominate.

| Item | Kind | Source | Notes |
|---|---|---|---|
| Connector status, last sync, error class | CALC | Scheduler + adapter responses | |
| Scopes granted vs required | RAW | OAuth response + adapter spec | Drift flagged amber. |
| Sync log, dedup hits, records pulled | CALC | Append-only log | |
| Meta Marketing API | `[API]` | App-level rate ceilings | 429 handling per `03` §6. |
| Google Ads API | `[API]` | Developer token tiers (Basic/Standard) | Standard requires Google review (`10` §11). |
| TikTok / Snapchat / LinkedIn APIs | `[API]` | Lower documented quota | Longer backoff expected. |
| Shopify REST + GraphQL | `[API]` | REST 40-bucket leak 2/sec; GraphQL 1000 points/sec | High-volume stores throttle nightly reconciliation. |
| WooCommerce poll | `[3PI]` | No vendor SLA | Unreliable for high-volume stores. |
| GA4 Data API | `[API]` | 10M hits/property/day; **sampling** above thresholds | Quota + sampling risk. |
| HubSpot API | `[API]` | Burst + daily quotas by tier | Starter is tight. |
| Salesforce API | `[API]` | Daily request limit by edition | Enterprise 1M/day; Professional 1k/day. |
| Cross-platform metric semantics | `[NRA]` (uniformity) | View-through windows, attribution windows, conversion definitions differ | Disclosed on `06` Limitations tab, never hidden (`10` §4.1). |
| **Required entities** | Connector (one row per connection); mapped entities per §1 contract. | | |

### 1.10 11 — Team & Permissions

RBAC only — no performance data (anchor §6).

| Item | Kind | Source | Notes |
|---|---|---|---|
| Agency role / client role tier | CLIENT | `agency_role`, `client_role_tier` columns | **Schema delta vs today** — both nullable, default preserves legacy behavior. |
| Permission matrix | CALC | Fixed in V1 | User-defined roles deferred to V2/Enterprise. |
| Audit log | CALC | Append-only events | Retention owned by `12`. |
| **Required entities** | User (agency-side or client-side); Client (assignment). | | |

### 1.11 12 — Settings

Configuration only — no performance data, no metrics.

| Item | Kind | Source | Notes |
|---|---|---|---|
| Workspace defaults (currency, tz, preset) | CLIENT | Operator-set | AED / Asia/Dubai defaults. |
| License tier / add-ons | `[3PI]` | Licensing service (one outbound call) | Fail-closed with grace window. |
| Retention policy (raw 90d / aggregate 2555d) | CLIENT | Operator-set | Audit uses aggregate retention. |
| API tokens (SHA-256 hashed) | CALC | `apiTokens` table | Plaintext shown once. |
| Webhooks (HMAC-signed outbound) | CALC | Per-subscription | Auto-paused after 10 consecutive 5xx. |
| **Required entities** | None — configuration surface. | | |

---

## 2. Master reliability classification

Every metric, dimension, and data point flagged across the spec. Read with the
§0 tiers. "Mitigation" states what Winning Kart *does* — derive, approximate,
label as estimate, hide, or require integration.

### 2.1 Performance & cost metrics

| Item | Class | Source | Limitation | Mitigation | Ref |
|---|---|---|---|---|---|
| Spend | `[API]` | Meta insights | Account currency only; multi-currency rollup needs FX. | FX snapshot at fetch; footnote blend. | `02`, `05` §6 |
| Impressions, reach, clicks | `[API]` | Meta insights | None material. | Show as-is. | `04` §0.3 |
| CTR, CPC, CPM, frequency | `[API]` | Meta insights | Frequency per-ad, not cleanly additive at rollup. | Per-ad fatigue; conservative at account level. | `02` §4, `09` §9 |
| Purchases | `[API]` / `[CALC]` | Meta `actions[purchase]` / count of ingested events | Platform count ≠ revenue-source count. | Surface both when source connected. | `06` §4 |
| Revenue (platform) | `[API]` | Meta `action_values[purchase]` | iOS-ATT decay; view-through inflates; walled-garden bias. | Tooltip + Limitations tab; never quote without model label. | `06` §3.1, §6 |
| Revenue (WK models) | `[CALC]` | first/last/linear/time-decay/U-shape | Requires order-level source + identity stitch. | Disable WK models with disclosure when source absent. | `06` §3.2–3.6 |
| ROAS | `[CALC]` | `revenue / spend` | Inherits revenue limitations. | Label by active model. | `04` §0.3, `06` §4 |
| CPA, AOV, conversion rate | `[CALC]` | Derived | AOV degraded with platform-only data. | Show "platform AOV" tag when no source. | `06` §4 |
| CAC (new customers) | `[3PI]` / `[NRA]` | Customer cohorting across orders | No ad-platform API exposes new-vs-returning identity. | Requires revenue source with `customer_email_hash`; else hide. | `06` §4 |
| Profit / Margin / COGS | `[CLIENT]` | Operator margin rules | No source computes margin. | "Requires client-provided data" placeholder; never fabricated zero. | `06` §4, §5.3 |
| LTV | `[CLIENT]` / `[3PI]` | Repeat-purchase history | Needs stable customer IDs + enough history. | Hide until source + history threshold met. | `06` §4 |

### 2.2 Audience & breakdown dimensions

| Item | Class | Source | Limitation | Mitigation | Ref |
|---|---|---|---|---|---|
| Placement breakdown | `[API]` | Meta `breakdowns` param | **`meta-api.ts` does not request it today.** | Add fetch path; flag missing data honestly. | `05` §2.3 |
| Demographic breakdown (age/sex/geo) | `[API]` | Meta `breakdowns` | Same fetch-path gap. | Same. | `05` §2.2, §2.3 |
| Hour-of-day / day-of-week | `[API]` | `hourly_stats_aggregated_by_advertiser_time_zone` | **~7-day retention; NOT backfillable.** | Schedule capture; mark heatmap "last 7 days only" beyond window. | `05` §2.4 |
| New vs Returning | `[NRA]` | Not a clean Meta breakdown | Custom-audience membership only where it exists. | Mark *not reliably available*; hide unless CA membership present. | `05` §2.2 |
| Audience size | `[API]` (approx) | Meta returns bounds, not exact | Lower/upper bound only. | Label "approximate"; never present as exact. | `05` §4 |
| Audience overlap (arbitrary pairs) | `[NRA]` | API-restricted | Dedicated endpoint not generally available. | Infer from shared custom-audience membership; mark *overlap not available* otherwise; **never fabricate a %**. | `05` §4.2 |

### 2.3 Creative intelligence

| Item | Class | Source | Limitation | Mitigation | Ref |
|---|---|---|---|---|---|
| Creative fatigue flag | `[CALC]` | frequency + CTR decay + spend concentration | **No platform fatigue score.** Account-rollup conservative. | Show derivation in tooltip; per-ad authoritative. | `02` §4, `04` §4.5 F1, `09` §9 |
| Creative preview / format | `[API]` | Meta ad `preview`, `display_format` | **Not yet fetched.** | Extend `meta-api.ts`; gallery placeholder until shipped. | `04` §4.2 |
| Ad rejection reason text | `[NRA]` | Meta `ad_review_feedback` | **Not yet fetched.** | Extend `meta-api.ts`; status-only anomaly until shipped. | `04` §4.5 F6 |
| Landing-page quality / mobile load / viewability | `[NRA]` | Offsite telemetry required | F3 *pattern* computable; *cause* not. | Surface the pattern, not the cause; route to manual investigation. | `04` §4.5 F3 |

### 2.4 Attribution & identity

| Item | Class | Source | Limitation | Mitigation | Ref |
|---|---|---|---|---|---|
| Platform attribution window | `[API]` | Meta account setting | Black box; vendor-controlled. | Read + label; never claim as WK truth. | `06` §3.1 |
| iOS-ATT-era Pixel reliability | `[NRA]` | Materially degraded since 14.5 | Platform ROAS overstates true marketing ROAS. | Mandatory tooltip; Limitations tab; offer WK last-touch as contrast. | `06` §3.1, §6 |
| Shopify `_fbc` (non-Shopify-Plus) | `[NRA]` | Custom checkouts drop cookie | Tier-A match unavailable. | Degrade to tier B/C; show match-quality %. | `06` §1.1 |
| WooCommerce UTM / click id | `[NRA]` | Requires tracking plugin | Vanilla Woo drops both. | Require plugin; hourly poll fallback; show tier. | `06` §1.2 |
| CRM ad-level match | `[NRA]` | Resolves to campaign group | Not specific ad. | Label tier B/C; never present as ad-level. | `06` §1.3 |
| Offline conversion match | `[NRA]` | Probabilistic | Lowest determinism. | Label tier C/D; surface both platform and upload counts. | `06` §1.5 |
| Cross-platform metric semantics | `[NRA]` (uniformity) | View-through, attribution windows, conversion defs differ | No platform agrees with another. | Normalize canonical; disclose delta on Limitations tab. | `10` §4.1 |

### 2.5 Budget, pacing & billing

| Item | Class | Source | Limitation | Mitigation | Ref |
|---|---|---|---|---|---|
| Monthly cap | `[CLIENT]` | Operator-set | Local-only. | Track locally; not a Meta field. | `05` §5.2 |
| Target spend, pacing %, projection, forecast cone | `[CALC]` | Formulas in `05` §5.3 | Assumes linear delivery. | Caveat in first/last 10% of period; convergence logic enforces end-of-period accuracy. | `05` §5.3, `08` §8 |
| Meta internal pacing (lifetime / Advantage+) | `[NRA]` | Not exposed | WK calendar-even target ≠ Meta's truth. | Tooltip caveat; show as operator-grade approximation. | `05` §5.4 |
| CBO / Advantage+ ad-set budget | `[NRA]` | Absent by design | Pacing computed at campaign only. | Ad-set drill shows spend *share*, not ad-set pacing. | `05` §5.3 |
| Spend-cap headroom | `[CALC]` | `fetchAccountInfo` | **No unified "spendable headroom"** across billing models. | Footnote prepaid vs threshold vs invoicing; never present as simple "remaining". | `02` §4, `03` §4.1, `09` §9 |
| Account restriction reason | `[NRA]` | Meta `account_status` (numeric only) | Policy reason not in API. | Surface code + word; deep-link to Meta Business Manager for the why. | `02` §4, `03` §6 |
| Budget-edit log (Meta-side edits) | `[NRA]` | WK history only | Edits on Meta are invisible to WK. | Spend-anomaly insight falls back to "unattributed". | `09` §9 |

### 2.6 Plans, insights & operational signals

| Item | Class | Source | Limitation | Mitigation | Ref |
|---|---|---|---|---|---|
| Retention / return-customer KPI | `[3PI]` / `[NRA]` | Revenue source required | Meta gives purchase counts, not new-vs-returning. | Partial without source; lean on CPM/CTR/reach for awareness. | `08` §8 |
| Brand-lift / aided awareness | `[NRA]` | No ad API exposes it | Awareness plans can't target a lift number. | Out of scope; use reach/CTR proxies. | `08` §8 |
| Conversion events list (pixel) | `[API]` | Pixel `attached_assets` / dataset edge | Not reliably exposed on all accounts. | Best-effort list; flag incomplete. | `03` §4.1 |
| Insight causal attribution | `[CALC]` | Decomposition | No driver ≥ 60% → can't name cause. | **Honesty limit**: report "unattributed" + top contributors. | `09` §4.2, §7.4 |
| Connector API limits (all vendors) | `[API]` | Vendor-specific | Token tiers, edition caps, points, sampling, quota. | Adapter enforces backoff; persistent throttle escalates amber. | `10` §11 |

---

## 3. Risk register

Ranked by threat to the product thesis. The top three explicitly threaten the
**transparent-attribution differentiator** (`01` §1; `06` §0).

### R1 — Platform attribution bias & iOS-ATT Pixel decay
- **Risk.** The default ROAS number (Meta `action_values[purchase]` /
  `purchase_roas`) systematically overstates true marketing ROAS because Meta
  credits itself favorably (walled-garden bias) and Pixel/CAPI reliability has
  been materially degraded on iOS since 14.5.
- **Impact.** Every downstream surface that defaults to platform attribution
  (`02` KPIs, `04` campaign rows, `05` Analytics, `07` reports, `08` Plan
  actuals) carries the bias. A client who defends a number to their CFO
  inherits Meta's overclaim.
- **Likelihood.** Certain — the decay is already in production.
- **Mitigation.** (a) Mandatory model label on every revenue figure. (b)
  Limitations tab ships pre-populated (`06` §5.4). (c) When a revenue source is
  connected, WK last-touch is offered as the honest contrast. (d) The
  Attribution summary report block carries a one-line disclosure (`07` §3.9).
- **Threat to differentiator.** Direct — this is the differentiator's central
  case. Honesty here is the product.

### R2 — Revenue-source identity-match reliability is uneven
- **Risk.** The strength of WK's own attribution models depends on identity
  signals (`fbclid`/`_fbp`/`_fbc`/email hash) that are unreliable on
  non-Shopify-Plus custom checkouts, vanilla WooCommerce, CRM leads, and
  offline conversions. Without order-level match, WK falls back to platform
  attribution — collapsing back into R1.
- **Impact.** Identity tier B/C/D matches dominate for clients on lower-tier
  commerce stacks; the "show your work" comparison view (`06` §3.7) shows a
  wide spread between platform and WK models, which can read as "the tool
  disagrees with itself" to an unprepared buyer.
- **Likelihood.** High for any client not on Shopify Plus with a tuned
  tracking setup.
- **Mitigation.** (a) Match-quality indicator on every source card and
  attribution view (`06` §2). (b) Each model's limitations are first-class
  (`06` §5.4). (c) Onboarding (`03` §5.6) flags missing scopes and pixel
  health. (d) Honest "platform-only" disclosure when no source is connected.
- **Threat to differentiator.** Direct — transparent attribution requires a
  transparent *match quality*.

### R3 — Creative fatigue is a derived signal, not a platform score
- **Risk.** Fatigue detection (F1) and the fatigue flag on creative cards
  depend on `frequency + CTR decay + spend concentration`. Meta exposes no
  fatigue score; frequency is per-ad and not cleanly additive at account
  rollup, so account-level fatigue alerts are conservative.
- **Impact.** The Ads & Creatives gallery (`04` §4) and the creative-fatigue
  alerts (`09` §3.1) are flagship surfaces. A fatigue miss costs the buyer
  spend on a dying creative; a false positive costs them a working creative.
- **Likelihood.** Moderate — the signal is real but imperfect.
- **Mitigation.** (a) Per-ad fatigue is authoritative; account-rollup
  surfaces as "watch" not "critical" by default. (b) Fatigue flag tooltip
  shows its derivation. (c) Thresholds are agency-configurable per client
  (`04` §4.4). (d) F3 (clickbait/mismatch) surfaces the *pattern* only and
  routes the *cause* to manual investigation, never naming an unsupported
  cause (`04` §4.5 F3, `09` §4.2).
- **Threat to differentiator.** Indirect — creative intelligence is a flagship
  vs incumbents, but it is not the attribution thesis.

### R4 — Revenue and margin data are entirely client-provided
- **Risk.** Profit, margin, COGS, and LTV cannot be computed from any ad
  platform or store order alone; they require the client to supply margin
  rules and enough repeat-purchase history.
- **Impact.** The Profit & margin tab (`06` §5.3), the profit-ROAS / profit-CPA
  cards, and the report KPI block's profit variants are inert until supplied.
- **Likelihood.** Certain for the data; moderate for client willingness
  (margin is operator-sensitive — `11` §3.3 default-off toggle).
- **Mitigation.** "Requires client-provided data" placeholder, never a
  fabricated zero; per-client margin visibility toggle; opt-in block in
  reports.
- **Threat to differentiator.** Low — handled honestly.

### R5 — Hourly stats retention (~7 days) breaks historical heatmaps
- **Risk.** Meta retains `hourly_stats_aggregated_by_advertiser_time_zone` for
  only ~7 days; the standard `time_increment=1` path returns daily granularity
  only. Historical hour-of-day heatmaps cannot be backfilled.
- **Impact.** The Time dimension of Analytics (`05` §2.4) loses its
  hour-of-day view beyond the last week unless Winning Kart captures and
  stores hourly data on a schedule.
- **Likelihood.** Certain.
- **Mitigation.** Schedule hourly capture from day one; label the heatmap
  "last 7 days only" beyond the captured window; never present a partial
  capture as a full history.

### R6 — Multi-currency portfolios require FX conversion footnotes
- **Risk.** Ad-account currency lives on the ad account (`schema.ts`); monthly
  caps live in client currency; revenue sources may arrive in any currency.
  Any portfolio rollup blends currencies.
- **Impact.** A portfolio Overview total, a multi-client report, or a Plan
  with multi-currency ad accounts can produce a misleading aggregate.
- **Likelihood.** High for any agency with international clients.
- **Mitigation.** FX snapshot at fetch/order day; footnote every blended
  total; per-client display currency; never silently normalize.

### R7 — Connector API limits can throttle or sample data
- **Risk.** Every connector has limits: Google Ads developer-token tiers,
  Salesforce edition caps (Professional = 1k/day), Shopify GraphQL points,
  GA4 sampling, HubSpot tier quotas, TikTok/Snapchat/LinkedIn lower ceilings.
- **Impact.** Syncs back off, partial syncs surface as amber, historical data
  can be sampled (GA4) or capped (Salesforce Professional).
- **Likelihood.** Moderate; varies by client stack.
- **Mitigation.** Adapter-level backoff; persistent throttle escalates amber
  to `09`; idempotent re-runs; per-connector sync log; sampling disclosed on
  the GA4 sync card.

### R8 — Audience overlap and audience size are bounded, not exact
- **Risk.** Meta restricts the overlap endpoint and returns size bounds rather
  than exact counts.
- **Impact.** The Audiences surface (`05` §4) can't present a confident
  overlap % or an exact audience size; fabricating either would betray the
  trust thesis.
- **Likelihood.** Certain.
- **Mitigation.** Approximate-only labels; "overlap not available" for
  uncovered pairs; never fabricate precision.

### R9 — Account restriction reasons are opaque
- **Risk.** Meta returns a numeric `account_status`; the policy/billing reason
  requires the Business Manager UI.
- **Impact.** A restricted-account alert can say *what* but not *why*, leaving
  the buyer to chase Meta.
- **Likelihood.** Intermittent but high-impact when it occurs.
- **Mitigation.** Surface the code + plain word; deep-link to BM; never invent
  a reason.

### R10 — Schema gaps block several V1 surfaces
- **Risk.** Today's schema (`schema.ts`) has `clients`, `ad_accounts`,
  `apiTokens` only. Revenue sources, attribution models, margin rules, plans,
  reports, connectors, tasks, alerts, audit log, agency roles — none exist.
- **Impact.** Most page specs `06`–`12` are blocked on `13-data-model.md`.
- **Likelihood.** Certain.
- **Mitigation.** Out of scope for this doc — owned by `13-data-model.md`. The
  reliability classifications here assume the schema ships.

---

## 4. Estimate labeling policy

This policy is part of the trust thesis. It binds every numeric surface in the
product.

**Rule 1 — Every metric carries its source.** Each numeric chip has a tooltip
stating its tier (`§0`), its formula or API field, and — for revenue — the
active attribution model and window (`05` §1.2, `06` §2). Provenance is not
optional.

**Rule 2 — Approximate, modeled, or low-match-quality metrics carry a visible
"estimate" affordance.** Per `DESIGN.md` the affordance is **muted, not
alarming**: a small ink-3 "estimate" tag next to the value, never a rust or
amber wash (those are reserved for genuine alerts). The tag's tooltip states
*why* the value is an estimate (e.g., "match quality 62% deterministic",
"approximate audience size from Meta bounds", "platform-attributed — may
overstate true ROAS").

**Rule 3 — Match quality is shown, never hidden.** When a revenue figure
depends on identity tiers A/B/C/D (`06` §2), the match-quality % appears on
the source card and on every attribution view. Low quality does not hide the
number — it shows the number with its confidence band.

**Rule 4 — "We don't know" is an acceptable value.** When a metric cannot be
reliably obtained (`[NRA]`), the surface shows either (a) a derived
approximation explicitly labelled as such, (b) a "requires client-provided
data" / "requires integration" placeholder, or (c) nothing — never a
fabricated zero or a borrowed platform number dressed as WK truth. This rule
is the operational expression of `09` §7.4 ("Unattributed, never a fake
cause").

**Rule 5 — Reports inherit the policy.** A report block that depends on a
`[NRA]` or `[CLIENT]` data point ships with the same label the workspace
carries (`07` §8). The PDF is the trust artifact that leaves the building;
its labels do not soften for the client audience.

**Rule 6 — Limitations are first-class, not footnotes.** The Attribution &
Revenue Limitations tab (`06` §5.4), the mandatory one-line disclosure on the
report Attribution summary block (`07` §3.9), and the pre-populated
limitations table are the *productization* of this policy. They are surfaces,
not documentation.

---

*End of `16-data-gaps-and-risks.md`. The honesty backbone: every metric
tagged, every limitation shipped, "we don't know" always available. Conflicts
defer to `01-product-architecture.md`, `06-attribution-revenue.md`, and
`DESIGN.md`.*
