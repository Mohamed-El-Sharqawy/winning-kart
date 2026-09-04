# 15 — Roadmap & Prioritization

> Scope: captain's section 28 + L. The prioritized feature roadmap for Winning
> Kart. Every feature surfaced across `02`–`12` is classified into MVP / V1 /
> V2 / Enterprise with rationale, dependencies, and rough effort. The roadmap
> serves the captain's thesis from `00-market-research.md`: **self-hosted,
> agency-first, Meta-first-extensible, premium paper-ledger UX, attacking the
> verified competitive gaps.**
>
> Status: DRAFT (crewmate done, pending first-mate review).
>
> Cross-references: `00-market-research.md` (gap analysis §3, positioning §5),
> `01-product-architecture.md` (anchor), `02`–`12` (feature sources),
> `PRODUCT.md`, `DESIGN.md`, `src/db/schema.ts`.

---

## 1. Prior baseline — archived, rebuilt in MVP (fresh start)

> **Aug 2026 update:** the previous Winning Kart repo was dumped. The
> capabilities below were described as "already shipped" against that archived
> project; on the fresh start they are **rebuild scope**, landing in
> milestones M0–M1 of the approved technical plan (`.lavish/winning-kart-technical-plan.html` §10).

Per `PRODUCT.md` and the old schema, the prior baseline comprised the
operator-owned foundation. The tier structure below **adds to** this set
without regressing it:

| ID | Capability | Source (archived project) |
|---|---|---|
| **B1** | Admin/client JWT auth (jose HS256, bcrypt, httpOnly cookie, `requireAdmin`/`requireAdAccountAccess` guards) — **extended with personal access tokens for the operator's Hermes automation agent** | old `src/lib/auth.ts` |
| **B2** | Clients CRUD + client tables (brand and login split per doc 13 on the fresh schema) | old `schema.ts` |
| **B3** | Meta access tokens encrypted at rest (AES-256-GCM, 96-bit IV, auth tag, `ENCRYPTION_KEY` operator-held) | old `src/lib/crypto.ts` |
| **B4** | Ad-account onboarding: single + bulk `accounts.json` paste import | old import route |
| **B5** | Meta insights pull (account / campaign / ad-set / ad levels, daily series) — **plus Meta CAPI wiring for attribution identity (captain's locked call)** | old `src/lib/meta-api.ts` |
| **B6** | Scheduler — **Bun native cron in the Elysia process** (data sync only; all other automation is Hermes via PAT) | old `src/lib/scheduler.ts` |
| **B7** | MCP API tokens (SHA-256 at rest, JSON-RPC over HTTP, opencode-compatible) | old `src/lib/mcp.ts` |
| **B8** | Campaign + ad performance tables (winner/loser row tinting) | old components |
| **B9** | Charts — **TanStack Charts** (captain's locked choice; replaces Chart.js) | new |
| **B10** | Date presets (today / yesterday / 3/7/14/30/90d / this month / last month) | old app |
| **B11** | Design system — **direction pending captain's pick** (Tailwind v4 + shadcn/ui, `@theme` tokens; see `.lavish/winning-kart-design-directions.html`) | old `DESIGN.md`, `globals.css` |

**Verdict: REBUILD — keep the contract, not the code.** These capabilities are the floor every tier
stands on; section 6 codifies them as the must-not-regress list.

---

## 2. Feature inventory (every feature in `02`–`12`)

Stable ids are prefixed by source doc. Each id is reused in §3's classification
table.

### From `02-overview-executive-dashboard.md`
- **F02-01** Six-card KPI strip (Spend, Revenue, ROAS hero, CPA, Purchases, Account Health)
- **F02-02** Actionable Insights engine (top-3, spend-at-risk ranking, 8 triggers)
- **F02-03** Three portfolio charts (Spend vs Revenue, ROAS trend w/ target rule, Per-client bars)
- **F02-04** Account-health strip (token, refresh, cap headroom, error)
- **F02-05** Client Portal Dashboard (4 KPIs, trust copy, two charts)

### From `03-clients-ad-accounts.md`
- **F03-01** Clients list (rollups, filters, status dots)
- **F03-02** Client workspace (sub-tab hub mapping to global nav)
- **F03-03** Client Overview sub-tab (KPI row + health + activity)
- **F03-04** Ad Accounts list (client-scoped, connection diagnostics)
- **F03-05** Connect Meta OAuth wizard (9 steps, staged sync)
- **F03-06** Error-state catalog (12 classes, dot+halo+word)
- **F03-07** Bulk import 1:many (client grouping field)

### From `04-campaigns-adsets-ads.md`
- **F04-01** Campaigns list (saved views, bulk read actions, winner/loser tint)
- **F04-02** Campaign detail (KPIs, charts, funnel, sub-tables, recommendations)
- **F04-03** Ad Sets list + side-by-side comparison (≤4, normalized vs raw)
- **F04-04** Ads & Creatives gallery (card grid, sort, density toggle)
- **F04-05** Creative fatigue/anomaly detection (rules F1–F6)
- **F04-06** Creative detail + lifecycle classification (Winning/Losing/Fatiguing/Stable)
- **F04-07** Write actions: pause/resume, budget edit (Meta Marketing API)
- **F04-08** Drill-down contract (URL state, filter-flow-down, breadcrumb)

### From `05-analytics-audiences-budget.md`
- **F05-01** Analytics pivot/slice (Performance/Audience/Placement/Time, funnel, heatmaps)
- **F05-02** Analytics saved views (personal/shared/pin/attach-to-report)
- **F05-03** Client Portal Analytics (simplified, read-only)
- **F05-04** Audiences analytics + Audience Library
- **F05-05** Audience overlap (best-effort, Meta-API-restricted)
- **F05-06** Budget & Pacing (caps, projection, forecast cone, variance)
- **F05-07** Pacing alerts (overspend / underspend / spike / at-cap / no-delivery)

### From `06-attribution-revenue.md`
- **F06-01** Revenue ingestion: Shopify (OAuth, webhook + nightly reconcile)
- **F06-02** Revenue ingestion: WooCommerce (REST key/secret, hourly poll)
- **F06-03** Revenue ingestion: CRM (HubSpot / Salesforce / custom)
- **F06-04** Revenue ingestion: Custom backend API (`POST /api/revenue/ingest`, push + pull; contract in `06` §1.6)
- **F06-05** Offline conversions (CSV upload + Meta offline set tie-in)
- **F06-06** Identity stitch (5-priority signal, match-quality tiers A–D)
- **F06-07** Attribution model: Platform-attributed (Meta)
- **F06-08** Attribution models: First-touch / Last-touch / Linear / Time-decay / Position-based
- **F06-09** Model comparison view (ROAS-by-model, spread column)
- **F06-10** Profit & margin (client-provided margin rules)
- **F06-11** Limitations tab (first-class honesty disclosure)

### From `07-reports.md`
- **F07-01** Reports list + run history
- **F07-02** Templates library (5 starters: Exec monthly, Perf weekly, Creative review, Launch recap, Plan-vs-Actual)
- **F07-03** Report Builder (11-step flow, live preview)
- **F07-04** Block library (12 blocks: Cover, Exec summary, KPI, Perf chart, Campaign table, Creative gallery, Budget pacing, Audience, Attribution summary, Recommendations, Next steps, Commentary)
- **F07-05** Schedules + delivery (portal publish, email, PDF/CSV export)
- **F07-06** White-label (clay-preserving default + brand-accent enterprise mode, One Accent validator)
- **F07-07** Portal report consumption (acknowledge, per-block comments)

### From `08-marketing-plans.md`
- **F08-01** Plans list (aggregate health, period, owner)
- **F08-02** Plan detail (6 sections: goals, objectives, KPIs, budget, strategy, links)
- **F08-03** Plan vs Actual (pace-adjusted variance, on-track/at-risk/off-track)
- **F08-04** Plan sharing to client portal (opt-in, summary scope)
- **F08-05** Plan → task generation (milestones, off-track lines, tests)

### From `09-tasks-alerts-insights.md`
- **F09-01** Tasks queue + create-from-anywhere
- **F09-02** Alerts feed (11 triggers: CPA, ROAS, CTR, spend anomaly, revenue, pacing, fatigue, no-conv, disconnect, sync fail, token expired)
- **F09-03** Recommendations engine (causal attribution, "unattributed" honesty limit)
- **F09-04** Severity ladder + priority score (affected spend × severity × recency)
- **F09-05** Anti-noise (dedupe, suppress-while-task-open, per-client rate-limit)
- **F09-06** Notification channels (in-app bell, email, Slack)
- **F09-07** Morning digest + quiet hours (08:00 Asia/Dubai default)

### From `10-integrations.md`
- **F10-01** Meta adapter (formalized behind AdPlatform seam — already exists)
- **F10-02** Google Ads adapter
- **F10-03** TikTok / Snapchat / LinkedIn adapters
- **F10-04** Shopify connector (plumbing for `06`)
- **F10-05** WooCommerce connector
- **F10-06** GA4 connector (server-side, service account)
- **F10-07** HubSpot connector
- **F10-08** Salesforce connector
- **F10-09** Custom CRM connector (with schema-drift detector)
- **F10-10** Slack connector (outbound)
- **F10-11** SMTP/Email connector (outbound)
- **F10-12** Outbound webhooks (rich event subscriptions)
- **F10-13** Data warehouse export (Postgres / BigQuery / Snowflake)

### From `11-team-permissions-client-portal.md`
- **F11-01** Seven-role RBAC matrix (Owner / Admin / AM / Marketer / Analyst / Client Admin / Client Viewer)
- **F11-02** Client Portal scope rules (10 hidden surfaces)
- **F11-03** Cost/margin per-client toggle (default off)
- **F11-04** Members page + Roles & matrix page
- **F11-05** MFA (TOTP RFC 6238, mandatory Owner/Admin)
- **F11-06** SSO (SAML 2.0 / OIDC)
- **F11-07** Custom roles / per-permission overrides
- **F11-08** Audit log (append-only, 18+ event types)

### From `12-settings.md`
- **F12-01** Workspace settings (name, currency, tz, logo, business profile)
- **F12-02** Billing (license tier + managed add-ons, no usage metering)
- **F12-03** Notifications settings (per-channel severity, per-user overrides)
- **F12-04** Data retention (90d raw / 2555d rollup, export bundle, GDPR/PDPL delete)
- **F12-05** API tokens extended (scopes, rotation reminders)
- **F12-06** Security policy (password, session, IP allow-list, SSO config)
- **F12-07** Audit log viewer (filter, export, SHA-256 signed)
- **F12-08** Self-hosted ops surface (env vs in-app config boundary, scheduler view)

---

## 3. Classification

Effort: **S** ≈ days · **M** ≈ 1–2 weeks · **L** ≈ multi-week · **XL** ≈ multi-month.
MVP = required to launch and credibly beat today's Winning Kart.

| ID | Feature | Tier | Rationale | Depends on | Effort | Risk / note |
|---|---|---|---|---|---|---|
| F02-01 | KPI strip (6 cards) | **MVP** | The pulse that beats today's flat dashboard. | B5, B9 | M | Needs account-health composite derivation. |
| F02-02 | Actionable Insights engine | **MVP** | The DECISION/ACTION layer; without it the pulse is just numbers. Shares module with F09-03. | F02-01 | L | Detection rules must be deterministic and shared with `09`. |
| F02-03 | Three portfolio charts | **MVP** | Per-client bars are the only credible portfolio read. | F02-01 | M | Multi-currency normalization needs a footnote rule. |
| F02-04 | Account-health strip | **MVP** | Operator-trust backstop; token failure is the silent killer. | B3, B6 | S | — |
| F02-05 | Client Portal Dashboard | **MVP** | Closes gap #3 (portal quality) at launch. | F11-02 | M | Trust copy must be authored, not generated. |
| F03-01 | Clients list | **MVP** | Replaces today's `/admin` roster; needed for workspace routing. | B2 | M | — |
| F03-02 | Client workspace hub | **MVP** | The sub-tab spine that makes the rest navigable. | F03-01 | M | — |
| F03-03 | Client Overview sub-tab | **MVP** | Per-client pulse, non-duplicative of `02`. | F03-02 | S | — |
| F03-04 | Ad Accounts list (client-scoped) | **MVP** | Required for connection diagnostics at launch. | F03-02 | M | — |
| F03-05 | Connect Meta wizard | **MVP** | Replaces today's bare paste path with a trustworthy flow. | F03-04, B3 | L | 9-step wizard; OAuth error paths must be solid. |
| F03-06 | Error-state catalog | **MVP** | One status language; trust depends on it. | F03-04 | M | Catalog must stay in sync with `09` alerts. |
| F03-07 | Bulk import 1:many | V1 | Today's 1:1 paste works for MVP; grouping is a power-user need. | F03-04 | S | Migration of legacy 1:1 slugs is operator-visible. |
| F04-01 | Campaigns list + saved views | **MVP** | Today's table is flat; saved views are the buyer's lens memory. | F04-08 | L | URL state contract (`01` §4.4) is binding. |
| F04-02 | Campaign detail | **MVP** | The drill-down depth that justifies the workspace. | F04-01 | L | Sub-tables link out, never duplicate (`01` §6). |
| F04-03 | Ad Sets list + comparison | **MVP** | Comparison is the highest-leverage buyer workflow (`04` §3.3). | F04-01 | L | ≤4 simultaneous; mixed-objective blocking rule. |
| F04-04 | Ads & Creatives gallery | **MVP** | The creative-intelligence wedge vs AgencyAnalytics/Whatagraph. | F04-01 | L | Creative-id grouping falls back to ad-level when Meta lacks it. |
| F04-05 | Fatigue/anomaly detection (F1–F6) | **MVP** | Foreplay/AdCreative.ai charge for this; we ship it natively. F1/F2/F4/F5 fully computable today. | F04-04 | M | F3 cause and F6 reason-text flagged for `16`. |
| F04-06 | Creative detail + lifecycle | **MVP** | CTR-vs-frequency chart is the buyer's daily artifact. | F04-04 | M | — |
| F04-07 | Write actions (pause/budget) | V1 | Read-only MVP keeps the dashboard calm; writes ship MCP-first per `04` §6. | F11-08 | L | Captain gate on confirmation UX + audit destination. |
| F04-08 | Drill-down contract | **MVP** | The non-negotiable navigation spine. | F03-02 | M | URL query state must round-trip browser back/forward. |
| F05-01 | Analytics pivot/slice | V1 | Exploration depth; without attribution it duplicates Campaigns. | F04-02, F06-07 | XL | Placement/demographic breakdowns need new fetch paths (`16`). |
| F05-02 | Analytics saved views | V1 | Reusable exploration; depends on F05-01. | F05-01 | M | — |
| F05-03 | Client Portal Analytics (simplified) | **MVP** | Closes portal v1 with read-only slicing. | F11-02 | M | Hide audience library, hourly heatmap, pivots. |
| F05-04 | Audiences analytics + library | V1 | Audience-level performance needs deeper fetch + library mgmt. | F04-03 | L | Create/edit gated by Meta API support per account (`16`). |
| F05-05 | Audience overlap | V2 | Meta restricts the overlap endpoint; best-effort only (`05` §4.2). | F05-04 | M | Never fabricate an overlap %. |
| F05-06 | Budget & Pacing | V1 | Owns "are we spending correctly" — depends on monthly-cap model. | F08-02 (plan) | L | Lifetime/Advantage+ caveat is honesty-critical. |
| F05-07 | Pacing alerts | V1 | Wires `05` into `09`. | F05-06, F09-02 | S | — |
| F06-01 | Shopify ingestion | V1 | Primary ecommerce revenue path; unlocks attribution edge. | F10-04 | L | `_fbc` capture unreliable on non-Plus custom checkouts. |
| F06-02 | WooCommerce ingestion | V2 | Secondary ecommerce; flakier webhooks, hourly poll mandatory. | F10-05 | L | — |
| F06-03 | CRM ingestion (HubSpot/SF/custom) | V2 | Lead-gen revenue; matches campaign group, not ad. | F10-07, F10-08, F10-09 | XL | Tier B/C match quality disclosed in `06`. |
| F06-04 | Custom backend API ingestion | **MVP** | Agency clients may run custom stacks (Next.js + own backend), not Shopify/Woo — revenue ingestion must work for them at launch. | B7 | M | Per-client ingest key (reuses MCP/API token path), AES-encrypted; contract in `06` §1.6. |
| F06-05 | Offline conversions | V2 | In-store / call-center sales; lowest match determinism. | F06-06 | M | Probabilistic match — label honestly. |
| F06-06 | Identity stitch (5-priority, A–D tiers) | V1 | The honesty engine; without it attribution is a black box. | F06-01 **or** F06-04 | XL | iOS-ATT materially degrades Pixel/CAPI tier. |
| F06-07 | Platform-attributed model | **MVP** | Already computed today (B5); formalized with model label + window. | B5 | S | — |
| F06-08 | WK-computed models (FT/LT/Linear/TD/Position) | V1 | The "show your work" differentiator vs Moby/Apex. | F06-06 | L | Requires order-level revenue events. |
| F06-09 | Model comparison view | V1 | The literal embodiment of honesty (`06` §3.7). | F06-08 | M | Spread column sorts contested entities first. |
| F06-10 | Profit & margin | V2 | Client-provided data only; never fabricate. | F06-06, F11-03 | M | Default off for client roles. |
| F06-11 | Limitations tab | V1 | Ships with F06-08 — disclosure is the differentiator. | F06-08 | S | Pre-populated; never empty. |
| F07-01 | Reports list | V1 | Trust-artifact delivery surface. | F07-03 | M | — |
| F07-02 | Templates library (5 starters) | V1 | Opinionated starting points; ships pre-populated. | F07-03 | M | — |
| F07-03 | Report builder | V1 | The authoring surface; most of the Reports L effort. | F07-04 | XL | Block-by-block live preview is non-trivial. |
| F07-04 | Block library (12 blocks) | V1 | Composable output; Attribution summary is mandatory disclosure. | F06-11 (for Attr block) | L | Snapshot vs live contract is binding. |
| F07-05 | Schedules + delivery | V1 | Recurring client communication without manual work. | F07-03, F10-11 | L | Client never sees failure notice. |
| F07-06 | White-label (clay-preserving) | V1 | Brand-as-yours without breaking One Accent. | F07-03 | M | OKLCH chroma/hue/AA validator rejects neon. |
| F07-06b | White-label (brand-accent mode) | Enterprise | Replaces clay family with one validated accent. | F07-06 | S | Enterprise gating decision in `10` §12. |
| F07-07 | Portal report consumption | V1 | The receiving end; ack + per-block comments. | F07-05, F11-02 | M | Comments are plain text, not chat (`01` §3.5). |
| F08-01 | Plans list | V1 | Indexes per-client strategy artifacts. | F08-02 | M | — |
| F08-02 | Plan detail (6 sections) | V1 | The strategy authoring surface. | F03-02 | L | Link contract (§1.6) keeps it non-duplicative. |
| F08-03 | Plan vs Actual | V1 | The reason Plans exist (`08` §2). | F08-02, F06-07 | L | Pace-adjustment assumes linear delivery (caveat). |
| F08-04 | Plan sharing to portal | V1 | Opt-in per plan; summary scope only. | F08-02, F11-02 | S | — |
| F08-05 | Plan → task generation | V1 | Wires plans into the work queue. | F08-03, F09-01 | S | — |
| F09-01 | Tasks queue + create-from-anywhere | **MVP** | The owned "what should I do next" list. | F04-08 | L | Create-from-anywhere touches every entity row. |
| F09-02 | Alerts feed (11 triggers) | **MVP** | Reactive signal surface; shares detection with `02`. | F02-02 | L | Token/data-trust events pin above all. |
| F09-03 | Recommendations engine | **MVP** | Causal attribution with "unattributed" honesty limit. | F02-02 | L | 60%-of-delta threshold; never fake a cause. |
| F09-04 | Severity ladder + priority score | **MVP** | Shared vocabulary across bell, digest, charts. | F02-02 | S | — |
| F09-05 | Anti-noise (dedupe / suppress / rate-limit) | **MVP** | Alert fatigue kills the surface; binding. | F09-02 | M | Per-client 24h cap; data-trust exempt. |
| F09-06a | In-app bell notifications | **MVP** | Baseline delivery. | F09-04 | S | — |
| F09-06b | Email + Slack notifications | V1 | Needs SMTP + Slack connectors live. | F10-10, F10-11 | M | — |
| F09-07 | Morning digest + quiet hours | V1 | Polish layer once channels exist. | F09-06b | M | Data-trust never sleeps. |
| F10-01 | Meta adapter (formalized) | **MVP** | Already exists; promote behind AdPlatform seam. | B5 | M | — |
| F10-02 | Google Ads adapter | V1 | First platform extension; validates the seam. | F10-01 | XL | Developer-token tier (Standard) requires Google review. |
| F10-03 | TikTok / Snapchat / LinkedIn | V2 | Lower-priority platforms; longer backoff expected. | F10-01 | XL | Per `16` quota caveats. |
| F10-04 | Shopify connector | V1 | Plumbing for F06-01. | F10-01 | M | — |
| F10-05 | WooCommerce connector | V2 | Plumbing for F06-02. | F10-01 | M | — |
| F10-06 | GA4 connector | V1 | Independent attribution confirmation layer. | F10-01 | L | Sampling above thresholds (`16`). |
| F10-07 | HubSpot connector | V2 | CRM ingestion tier B/C. | F10-01 | L | — |
| F10-08 | Salesforce connector | V2 / Enterprise | Enterprise CRM; tighter API limits. | F10-01 | L | Edition-dependent daily quota. |
| F10-09 | Custom CRM connector | V2 | Schema-drift detector must ship in same release. | F10-01 | L | — |
| F10-10 | Slack connector | V1 | Outbound delivery for alerts + reports. | F09-02 | M | — |
| F10-11 | SMTP/Email connector | V1 | Outbound delivery; TLS required. | F09-02 | M | Replaces legacy Telegram notifier. |
| F10-12 | Rich outbound webhooks | V1 | Replaces today's basic webhooks with event subscriptions. | B7 | M | Auto-pause after N consecutive failures. |
| F10-13 | Data warehouse export | Enterprise | Postgres (V1+) / BigQuery / Snowflake. | F10-01 | XL | Operator's cloud bill, not ours. |
| F11-01 | Seven-role RBAC matrix | **MVP** | Non-breaking extension; foundation for portal + write gating. | B1 | L | Discriminators loaded per-request, not in JWT. |
| F11-02 | Client Portal scope rules | **MVP** | The 10 hidden surfaces; query-layer enforcement. | F11-01 | M | 404 not 403 for hidden entities. |
| F11-03 | Cost/margin per-client toggle | V1 | Default off; gates profit/margin visibility. | F11-02 | S | Per-client, not per-Viewer. |
| F11-04 | Members + Roles & matrix pages | **MVP** | Operator control of the roster. | F11-01 | M | — |
| F11-05 | MFA (TOTP) | V1 | Recommended; mandatory for Owner/Admin. | B3 | M | Same AES envelope as ad tokens. |
| F11-06 | SSO (SAML/OIDC) | Enterprise | Agency-side only; client roles stay password. | F11-01 | L | Does not bypass RBAC. |
| F11-07 | Custom roles | V2 | V1 ships the fixed matrix; flexibility later. | F11-01 | L | — |
| F11-08 | Audit log (basic event set) | **MVP** | Trust foundation; immutable, append-only. | B1, F11-01 | M | 2555-day retention. |
| F12-01 | Workspace settings | **MVP** | Instance identity + defaults. | B2 | S | Env vs in-app boundary is binding. |
| F12-02 | Billing (license + add-ons) | V1 | Self-hosted license model; no usage metering. | F11-04 | L | Revoked license degrades, never deletes data. |
| F12-03 | Notifications settings | V1 | Per-channel severity + per-user overrides. | F09-06b | M | — |
| F12-04 | Data retention (90d/2555d + export/delete) | **MVP** | Data-ownership is a selling point; must be auditable at launch. | F11-08 | M | GDPR/PDPL export/delete tool. |
| F12-05 | API tokens (scopes, rotation) | **MVP** | Extends B7 with read/write scopes. | B7 | M | Rotation reminder, no auto-expire. |
| F12-06 | Security policy (password/session/IP/SSO config) | V1 (password/session) / Enterprise (IP/SSO) | Split tier: basics V1, IP allow-list + SSO Enterprise. | F11-05, F11-06 | M | IP list warns if it would block editing admin. |
| F12-07 | Audit log viewer (filter/export) | V1 | Read surface for F11-08. | F11-08 | M | SHA-256 signed exports. |
| F12-08 | Self-hosted ops surface | **MVP** | Operator-grade scheduler + env config view. | B6 | S | No managed dependency. |

---

## 4. Release themes

### MVP — *The operator pulse + creative intelligence + client portal v1*

**Ships:** F02-01–04 · F02-05 · F03-01–06 · F04-01–04, F04-05–06, F04-08 ·
F05-03 · F06-04, F06-07 · F09-01–05, F09-06a · F10-01 · F11-01–02, F11-04,
F11-08 · F12-01, F12-04, F12-05, F12-08.

> **Revenue scope note.** MVP includes revenue **ingestion** only —
> platform-attributed (Meta, F06-07) **plus** custom-backend push for
> non-Shopify/Woo clients (F06-04). Full attribution **models** (first-touch /
> last-touch / linear / time-decay / position-based, F06-08), the identity
> stitch (F06-06), and model comparison (F06-09) remain **V1**.

**At the end of MVP, Winning Kart credibly:**
- Replaces today's flat single-account dashboard with a **portfolio pulse**
  (KPI strip + insight engine + health strip) that answers "what is happening
  right now" in 15 seconds.
- Beats Foreplay/Motion on **native creative intelligence** (gallery + fatigue
  F1/F2/F4/F5 + lifecycle classification) without a second subscription.
- Gives clients a **premium paper-ledger portal** (dashboard + read-only
  campaigns + read-only ads gallery + simplified analytics) — closing
  competitive gap #3 at launch.
- Routes every signal into one **tasks/alerts/recommendations queue** with
  honest "unattributed" disclosure, not black-box AI.
- Extends today's two-role model into a **seven-role RBAC** that the portal and
  future write actions depend on.
- **Accepts revenue from any client stack** — platform-attributed revenue
  (Meta, F06-07) out of the box, plus a documented custom-backend push/pull
  contract (F06-04) so non-Shopify/Woo clients (e.g. Next.js + own backend)
  feed revenue from day one; full attribution models ship in V1.
- Keeps the **self-hosted, encrypted-token, MCP-token, paper-ledger** posture
  intact (the must-not-regress list).

### V1 — *Attribution, reports, plans, pacing, channels*

**Ships:** F03-07 · F04-07 · F05-01–02, F05-04, F05-06–07 · F06-01, F06-06,
F06-08–09, F06-11 · F07-01–05, F07-06, F07-07 · F08-01–05 · F09-06b, F09-07 ·
F10-02, F10-04, F10-06, F10-10–12 · F11-03, F11-05 · F12-02–03, F12-06
(basics), F12-07.

**At the end of V1, Winning Kart credibly:**
- **Shows its work** against Triple Whale / Northbeam / Moby: Shopify revenue
  ingestion + identity stitch + five WK-computed attribution models + model
  comparison + first-class Limitations tab. Closing gap #2.
- **Closes the loop on client communication**: full Reports system (templates,
  builder, schedules, white-label, portal delivery) — the trust artifact
  AgencyAnalytics/Whatagraph sell, branded as the agency's.
- **Unifies planning + execution + reporting** (gap #4): Marketing Plans with
  Plan-vs-Actual, milestones generating tasks, plan block in reports.
- **Spends correctly**: Budget & Pacing with projection cone and pacing alerts.
- **Extends to Google Ads** (first non-Meta adapter) + Shopify, GA4, Slack, SMTP
  connectors, and MCP-first write actions (pause/budget).
- Adds MFA, billing, notifications polish, audit-log viewer.

### V2 — *Advanced platforms, advanced analytics, advanced attribution*

**Ships:** F05-05 · F06-02–03, F06-05, F06-10 · F10-03, F10-05, F10-07–09 ·
F11-07 · F07 (PowerPoint export).

**At the end of V2, Winning Kart credibly:**
- Covers **TikTok / Snapchat / LinkedIn** alongside Meta + Google, validating
  the AdPlatform seam across the full entity chain.
- Deepens attribution with **WooCommerce, Salesforce, custom CRM, offline
  conversions**, plus **profit/margin/LTV** where clients supply the data.
- Adds **audience overlap** (best-effort), **custom roles**, and **PowerPoint
  export** for agencies that need slide output.

### Enterprise — *SSO, warehouse, IP allow-list, brand-accent*

**Ships:** F07-06b · F10-08, F10-13 · F11-06 · F12-06 (IP/SSO).

**At the end of Enterprise, Winning Kart credibly:**
- Lands **large agencies and enterprise clients**: SAML/OIDC SSO, IP
  allow-listing, BigQuery/Snowflake warehouse export, brand-accent white-label
  mode — the procurement-grade controls that unblock larger deals without
  breaking the self-hosted posture or One Accent Rule.

---

## 5. Gap-attack mapping

The top 5 competitive gaps from `00-market-research.md` §3, mapped to the tier
that closes each.

| # | Gap | Closed by | Tier |
|---|---|---|---|
| 1 | Self-hosted ads-analytics with managed-SaaS polish | B1–B11 (baseline) + MVP polish (pulse, portal, RBAC, audit, retention) | **Baseline + MVP** |
| 2 | Transparent attribution vs black-box AI | F06-06 identity stitch + F06-08 WK-computed models + F06-09 model comparison + F06-11 Limitations tab | **V1** |
| 3 | Client portal UX quality | F02-05 portal dashboard + F05-03 portal analytics + F11-02 portal scope (MVP); F07 reports + F07-07 portal consumption (V1) | **MVP (v1) → V1 (credible)** |
| 4 | Unified planning + execution + reporting | F08 plans + F08-03 Plan-vs-Actual + F07 reports + F08-05 plan→tasks + F04-07 write actions | **V1** |
| 5 | Pricing wall for small agencies/freelancers | Self-hosted flat TCO; no per-client / per-spend meter (F12-02 license model) | **Structural — every tier** |

Secondary gaps (6 MENA fit, 7 creative-intelligence integrated, 8 MCP
openness) are addressed by the baseline (AED/Asia/Dubai defaults, MCP tokens
already shipped) and by MVP's native creative-intelligence surface.

---

## 6. Must-not-regress list

These eleven invariants are **load-bearing for the thesis**. No tier may
compromise any of them; any feature that pressures one is rejected or reshaped.

1. **Paper-and-clay theme** (`DESIGN.md`) — One Accent (clay only), Warm-
   Semantics (muted olive/rust/amber only), Data-is-Sans, Eyebrow-Only,
   tabular figures, hairline rules, no emoji/glyph icons. White-label composes
   with this world; it never overrides it to neon (F07-06 validator enforces).
2. **Self-hosted / no-serverless posture** — every connector runs in-process on
   the operator's Next.js + Postgres + node-cron. No Lambda, no managed
   connector service, no mandatory hosted dependency (F10 §1.6 binding).
3. **Data ownership** — the operator holds the database; Winning Kart ships no
   telemetry; residency is the operator's choice (UAE/PDPL-aligned by default).
   Retention controls (F12-04) make this auditable.
4. **MCP API tokens** — already in production (`apiTokens`, `mcp.ts`); the
   roadmap extends scopes (F12-05) and never removes the programmatic path.
5. **Encrypted tokens at rest** — AES-256-GCM for every credential (Meta token,
   Shopify secret, SMTP password, service-account JSON). Plaintext never
   persisted; `ENCRYPTION_KEY` operator-held env.
6. **Existing roles and auth** — `client_role` enum stays; the seven-role RBAC
   (F11-01) is a non-breaking discriminator layer, not a replacement. Today's
   `requireAdmin` / `requireAdAccountAccess` guards keep working unchanged.
7. **Agency → Client → Ad Account → Campaign → Ad Set → Ad/Creative entity
   chain** — every surface honors it; navigation, drill-down, and filter reset
   rules (`01` §2.1, §4.4) are binding on every tier.
8. **Feature non-duplication** (`01` §6) — one question per surface; no tier may
   add a second surface answering the same question. Overview stays a pulse,
   Analytics stays exploration, Reports stays curated output.
9. **Honesty over fabrication** — fatigue detection (F04-05), recommendations
   (F09-03), attribution (F06), and audience overlap (F05-05) must report
   "unattributed" / "not reliably available" rather than invent a cause or
   number. This is the differentiator vs black-box incumbents (`PRODUCT.md`
   Principles, `00` §3).
10. **Tabular figures and right-aligned numerics** on every data surface —
    misaligned numbers break trust instantly (`DESIGN.md`).
11. **The prior admin back office contract keeps working** through the
    migration — the workspace restructure (F03-*) is additive; the bulk import
    path (B4) stays until F03-07 ships a grouped replacement.
12. **Optional integrations** — the platform must run fully with zero
    connector credentials configured (captain's locked amendment). No
    connector — Slack included — may be a startup or correctness dependency.
13. **Hermes automation path** — a personal access token can be issued for
    the operator's automation agent, authenticating as a normal user. The
    product ships no speculative automation logic beyond data sync.

---

*End of `15-roadmap-prioritization.md`. The roadmap attacks the verified gaps
in priority order: MVP owns the pulse + creative intelligence + portal wedge;
V1 owns the honesty/attribute/report/plan depth; V2 owns platform and analytics
breadth; Enterprise owns procurement-grade controls. No tier regresses the
baseline.*
