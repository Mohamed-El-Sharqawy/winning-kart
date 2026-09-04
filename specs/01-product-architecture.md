# 01 — Product Architecture

> Anchor document for the Winning Kart specification. Every later spec doc
> (`02-…` through `16-…`) inherits the navigation tree, terminology, application
> shell, and design rules defined here. If a later doc conflicts with this one,
> this one wins until the captain amends it.
>
> Status: DRAFT (crewmate done, pending first-mate review).
>
> Cross-references: `PRODUCT.md`, `DESIGN.md`, `src/db/schema.ts`, `spec/README.md`.

---

## Terminology (used by every later doc)

| Term | Meaning |
|---|---|
| **Agency** | The operator organization that owns this Winning Kart instance. |
| **Agency user** | A staff login (admin or staff role): media buyer, account manager, analyst, lead. |
| **Client** | A brand/business the agency serves. Also a login role. |
| **Client user** | A login with the `client` role; sees only its own brand's data through the Client Portal. |
| **Ad Account** | A platform ad account (Meta `act_xxx` today), owned by exactly one Client. |
| **Platform** | An ad-network adapter. Meta first; Google, TikTok, Snapchat, LinkedIn later. |
| **Workspace** | The full agency-side application surface (all nav). |
| **Client Portal** | The deliberately reduced surface a client-role login sees. |
| **Entity chain** | Agency → Client → Ad Account → Campaign → Ad Set → Ad / Creative. |

---

## 1. Product Vision

Winning Kart is the operator-owned performance-marketing platform a real agency
runs its book on. It is **self-hosted by design** — the operator holds the
database, the encrypted tokens, the refresh schedule, and the full history — so
that data ownership, transparent attribution, and a client-portal experience
worth trusting are competitive facts, not marketing copy. The primary user is
the **agency media buyer and account manager**, who lives in the tool all day
across a portfolio of client ad accounts and needs to move from number to
decision in seconds. The second user is the **client**, who logs in to see
whether their money is working in language they can act on. Winning Kart is
**Meta-first** today and architected so Google, TikTok, Snapchat, and LinkedIn
are swappable adapters behind the same entity chain, the same navigation, and
the same paper-and-clay surface. The full competitive thesis against incumbents
(serverless-dependence, data lock-in, opaque attribution, report-only tools
that cannot plan) is stated in `00-market-research.md`; this doc takes the
thesis as given and specifies the product that delivers it.

---

## 2. Conceptual Hierarchy

Winning Kart has one backbone and several parallel chains that hang off the
Agency node. Cardinality is stated because every later page spec must respect
it.

### 2.1 The entity chain (backbone)

```
Agency
  └─ Client (brand)                 1 : many  — an agency serves N clients
       └─ Ad Account (per platform) 1 : many  — a client may own several Meta
           │                                   ad accounts, across several
           │                                   Business Managers, and later
           │                                   across several Platforms
           └─ Campaign             1 : many  — an ad account runs many campaigns
                └─ Ad Set          1 : many  — a campaign has many ad sets
                     └─ Ad / Creative  1 : many — an ad set runs many ads
```

Cardinality and ownership rules:

- **Agency → Client** is 1 : many. A client belongs to exactly one agency (single-tenant instance per agency in the current model).
- **Client → Ad Account** is 1 : many. A single client may have **multiple Meta ad accounts**, **multiple Business Managers**, accounts in **multiple currencies/timezones**, and, once other platforms ship, accounts on **multiple Platforms**. Ad-account currency and timezone live on the ad account (`schema.ts`), not the client.
- **Ad Account → Campaign → Ad Set → Ad** is the rigid spine every performance surface drills down through. Campaigns/ad sets/ads are **platform-specific**: a Meta campaign id is not a Google campaign id.
- **Creative** is parallel to Ad: one creative may serve across many ads; the creative gallery treats creative as a first-class analyzable object (fatigue, performance, reuse).

### 2.2 Parallel chains (also hang off the Agency)

- **Agency → Team / Roles** — agency users and their RBAC (admin, staff, analyst, read-only). See `11-team-permissions-client-portal.md`.
- **Agency → Reports** — report templates, scheduled reports, white-label config. Reports are built by the agency and *delivered to* clients. See `07-reports.md`.
- **Agency → Marketing Plans** — goals → KPIs → budget → strategy → campaigns, scoped per Client, with Plan-vs-Actual. See `08-marketing-plans.md`.
- **Client → Tasks / Alerts / Insights** — the recommendation, alerting, and work-queue system. Generated from performance data; scoped per client or agency-wide. See `09-tasks-alerts-insights.md`.
- **Agency → Integrations** — platform connectors (Meta, Google…), revenue sources (Shopify, WooCommerce, CRM, API, offline upload). See `10-integrations.md`.
- **Revenue** is **not** a node in the entity chain — it is **attributed back** onto the chain. A client's revenue may come from Shopify, WooCommerce, a CRM, a custom API, or offline upload, and may arrive in any currency. Attribution is the act of tying that revenue to campaigns/ads; see `06-attribution-revenue.md`.

---

## 3. Primary Navigation

### 3.1 Evaluation and changes from the candidate list

The captain's candidate set was: Overview, Clients, Ad Accounts, Campaigns, Ad
Sets, Ads & Creatives, Analytics, Audiences, Budgets & Pacing, Attribution &
Revenue, Reports, Marketing Plans, Tasks/Actions, Alerts, Integrations, Team &
Permissions, Settings — 17 items.

Three changes, each justified:

1. **Remove "Ad Accounts" from the top-level agency nav.** Per `schema.ts`,
   `ad_accounts.clientId` is a required foreign key to `clients` — ad accounts
   are *owned by clients*. A top-level Ad Accounts page would duplicate the
   client workspace's ad-account sub-page and overlap with the Overview's
   portfolio roll-up. Ad Accounts becomes a **Client-scoped sub-page** inside the
   selected client (onboarding, token health, refresh status). Cross-portfolio
   account visibility is the Overview's job; cross-connector health lives in
   Integrations.

2. **Merge "Tasks/Actions" and "Alerts" into one surface, "Alerts & Tasks".**
   The captain's own non-duplication table (Section 6 below) assigns both the
   *same single question* — "What should I do next?" — and doc `09` already
   covers them together. One question earns one surface. Sub-pages split the
   reactive alert feed from the proactive task queue, and the top-bar bell is a
   shortcut into the Alerts sub-page.

3. **Group the remaining 16 items into three labeled sections** — Portfolio,
   Client Workspace, Administration — so the sidebar reads as a map, not a list.

Result: **16 nav items, grouped**, down from 17 flat.

### 3.2 Global vs Client-scoped — the rule

- **Agency-global** items operate across the whole portfolio. They never require
  a selected client; the client switcher acts as an optional *filter* on them.
- **Client-scoped** items require a selected client context. With **All Clients**
  selected they render a cross-client aggregated view (with a Client column);
  with a specific client selected they scope to that client. Switching client
  resets all client-scoped filters (see Section 4.4).

### 3.3 Every nav item (agency side)

Each item below uses the same eight fields. "Global vs scoped" follows the rule
above.

#### Portfolio (agency-global)

##### Overview
- **Why it exists** — the portfolio pulse: across every client and account, what is happening right now.
- **Who uses it** — agency media buyers, account managers, leads. (Clients get their own simpler Dashboard in the portal.)
- **Problem solved** — "where do I look first this morning / which account is bleeding."
- **Core data** — spend, revenue, ROAS, CPA, delta vs compare period, per client and per ad account; account-health signals (token status, last refresh, spend cap headroom).
- **Key actions** — pick date preset / compare period; open any account drill-down; trigger Refresh; jump to Alerts & Tasks for flagged items.
- **Global vs scoped** — Agency-global. Client switcher filters it; never required.
- **Sub-pages** — Portfolio overview (default); Account-health strip. Detail in `02-overview-executive-dashboard.md`.

##### Alerts & Tasks
- **Why it exists** — the single "what should I do next" queue: things that happened (alerts) and things to do (tasks).
- **Who uses it** — agency buyers/managers. Not visible to client users.
- **Problem solved** — stops signal loss; converts detected anomalies and recommendations into owned, trackable actions.
- **Core data** — alert feed (ROAS drop, budget exhausted, ad rejected, token expired, pacing off), task queue (pause X, scale Y, refresh creative, follow up), priority by business impact, recommendation CTAs.
- **Key actions** — acknowledge / dismiss / snooze alerts; accept a recommendation into a task; assign tasks; mark done; jump to the offending entity.
- **Global vs scoped** — Agency-global. Client switcher filters it.
- **Sub-pages** — Alerts feed; Tasks queue; Recommendations. Detail in `09-tasks-alerts-insights.md`.

##### Clients
- **Why it exists** — the agency's roster and the gateway into any client's workspace.
- **Who uses it** — agency admins/managers (manage); all agency users (enter a workspace).
- **Problem solved** — onboarding, contact, contract, and "which clients exist / who owns what."
- **Core data** — client name, status, linked ad accounts count and platforms, primary contact, currency, created; per-client roll-up of spend/ROAS.
- **Key actions** — create / edit / archive a client; enter its workspace; view its ad accounts and reports. Outward consent rules apply — see `03-clients-ad-accounts.md`.
- **Global vs scoped** — Agency-global (it is the index of clients).
- **Sub-pages** — Clients list; Client detail (entry to workspace). Detail in `03-clients-ad-accounts.md`.

##### Reports
- **Why it exists** — how the agency packages performance for clients: templates, builder, scheduling, white-label.
- **Who uses it** — agency account managers (build/schedule); clients consume delivered reports in the portal.
- **Problem solved** — repeatable, branded, accurate client communication without manual slide work.
- **Core data** — report templates, scheduled jobs, generated reports, white-label config (logo, colors within theme, domain), delivery targets.
- **Key actions** — create/edit templates; build a one-off report; schedule recurring delivery; preview; send/share to client portal; export.
- **Global vs scoped** — Agency-global, with a Client filter. Reports are produced by the agency; the client only receives.
- **Sub-pages** — Reports list; Templates; Builder; Schedules; White-label. Detail in `07-reports.md`.

#### Client Workspace (client-scoped)

*These items require a selected client. With All Clients selected they render a
cross-client aggregated view; with a client chosen they scope to it.*

##### Ad Accounts
- **Why it exists** — manage the ad accounts that belong to this client across platforms (today: Meta).
- **Who uses it** — agency admins/managers. Not client-facing.
- **Problem solved** — onboarding accounts, token + pixel + page + Business Manager wiring, currency/timezone correctness, health at a glance.
- **Core data** — per account: platform, ad-account id, name, Business Manager, page, pixel, encrypted token status, currency, timezone, last refresh, error state.
- **Key actions** — add account (single or bulk `accounts.json` paste); edit; reconnect/refresh token; trigger refresh; remove (pre-flight guarded); open account drill-down.
- **Global vs scoped** — Client-scoped. This is where the former top-level "Ad Accounts" lives.
- **Sub-pages** — Ad accounts list; Add/import; Account detail (connection diagnostics). Detail in `03-clients-ad-accounts.md`.

##### Campaigns
- **Why it exists** — the primary performance-management surface: which campaigns caused the result.
- **Who uses it** — agency buyers primarily; clients read-only.
- **Problem solved** — find winners and losers fast; decide scale/pause; manage status and budgets.
- **Core data** — campaign table: spend, revenue, ROAS, CPA, CPC, CPM, CTR, impressions, clicks, conversions, status, objective, with winner/loser row tinting; trend sparkline per row.
- **Key actions** — filter/sort; drill into a campaign's ad sets and ads; open / pause / archive (where the platform write-API allows); compare selected campaigns; create task from a row.
- **Global vs scoped** — Client-scoped; further scoped by selected Ad Account and Platform.
- **Sub-pages** — Campaigns list; Campaign detail (overview, ad sets, ads, time series, creative preview). Detail in `04-campaigns-adsets-ads.md`.

##### Ad Sets
- **Why it exists** — the targeting/pacing/placement layer: which audiences and setups drove the result, and how is each pacing.
- **Who uses it** — agency buyers.
- **Problem solved** — ad-set-level optimization and side-by-side comparison (audience, placement, budget, bid).
- **Core data** — ad set table with the full metric set plus budget, pacing, audience, placement, bid; reach/frequency.
- **Key actions** — compare ad sets; drill to ads; adjust daily/lifetime budget; pause/resume.
- **Global vs scoped** — Client-scoped.
- **Sub-pages** — Ad sets list; Ad set detail; Compare. Detail in `04-campaigns-adsets-ads.md`.

##### Ads & Creatives
- **Why it exists** — the creative layer: which creatives caused the result, and which are fatiguing.
- **Who uses it** — agency buyers and creatives; clients read-only (gallery).
- **Problem solved** — creative intelligence and fatigue detection across many ads at once.
- **Core data** — creative gallery (preview, copy, format), per-creative performance, fatigue signals (frequency, CTR decay, spend concentration), reuse map.
- **Key actions** — filter by format/objective; flag fatigued; tag winners; create "refresh creative" task; export.
- **Global vs scoped** — Client-scoped.
- **Sub-pages** — Ads table; Creative gallery; Fatigue report. Detail in `04-campaigns-adsets-ads.md`.

##### Analytics
- **Why it exists** — the "why is it happening" deep-analysis surface, free of any single entity's management UI.
- **Who uses it** — agency analysts/buyers; clients read-only (simplified).
- **Problem solved** — cross-cutting investigation across performance, audience, placement, and time dimensions without editing anything.
- **Core data** — pivotable metric grid by dimension (campaign/ad set/ad/audience/placement/country/objective/time), cohort and trend views, funnels.
- **Key actions** — slice/dice; save a view; export; pin to a report or plan.
- **Global vs scoped** — Client-scoped (cross-client aggregation allowed with All Clients).
- **Sub-pages** — Performance; Audience; Placement; Time; Funnels. Detail in `05-analytics-audiences-budget.md`.

##### Audiences
- **Why it exists** — which audiences caused the result, plus saved/lookalike audience management.
- **Who uses it** — agency buyers.
- **Problem solved** — audience-level performance and reusable audience library.
- **Core data** — audience performance (ROAS/CPA by audience), saved audiences, lookalikes, custom audiences, overlap.
- **Key actions** — analyze; create/save audience (where API allows); tag high/low performers.
- **Global vs scoped** — Client-scoped.
- **Sub-pages** — Audience performance; Saved audiences. Detail in `05-analytics-audiences-budget.md`.

##### Budget & Pacing
- **Why it exists** — "are we spending the budget correctly" across the month/campaign/ad set.
- **Who uses it** — agency buyers/managers.
- **Problem solved** — pacing control, overspend/underspend detection, monthly budget enforcement.
- **Core data** — spend-to-date vs monthly cap, pacing %, projected month-end spend, spend-cap headroom per account, delivery status.
- **Key actions** — set monthly caps; adjust daily/lifetime budgets; receive pacing alerts; reallocate.
- **Global vs scoped** — Client-scoped.
- **Sub-pages** — Pacing overview; Budgets; Forecasts. Detail in `05-analytics-audiences-budget.md`.

##### Attribution & Revenue
- **Why it exists** — "did spend actually produce revenue/profit" — revenue ingestion, attribution models, profit/margin/LTV where available.
- **Who uses it** — agency analysts/managers (configure); clients see results only.
- **Problem solved** — closing the loop between ad spend and real money, including the limits of each attribution model.
- **Core data** — revenue sources per client (Shopify/Woo/CRM/API/offline), attribution model settings, attributed revenue per entity, cost/profit/margin, LTV where data exists.
- **Key actions** — connect a revenue source; choose/compare attribution models; upload offline conversions; review model limitations.
- **Global vs scoped** — Client-scoped (revenue sources belong to a client's business).
- **Sub-pages** — Revenue sources; Attribution models; Profit & margin; Limitations. Detail in `06-attribution-revenue.md`.

##### Marketing Plans
- **Why it exists** — "what are we trying to achieve" — goals → KPIs → budget → strategy → campaigns, with Plan vs Actual.
- **Who uses it** — agency account managers (author); clients review (if shared).
- **Problem solved** — strategy-to-execution alignment and accountability.
- **Core data** — plan goals, target KPIs, planned budget, strategy notes, linked campaigns, Plan-vs-Actual variance.
- **Key actions** — create/edit a plan; link campaigns; track variance; share to client portal.
- **Global vs scoped** — Client-scoped.
- **Sub-pages** — Plans list; Plan detail; Plan vs Actual. Detail in `08-marketing-plans.md`.

#### Administration (agency-global)

##### Integrations
- **Why it exists** — the connections hub by category: ad platforms, revenue sources, communication, automation.
- **Who uses it** — agency admins.
- **Problem solved** — one place to wire, diagnose, and disconnect every external system.
- **Core data** — connectors by category, connection status, last sync, scopes/permissions, errors, disconnect behavior.
- **Key actions** — connect; reconnect; view sync log; disconnect (with stated downstream effects).
- **Global vs scoped** — Agency-global (connector catalog); some connections bind per-client at configure time.
- **Sub-pages** — Ad platforms; Revenue sources; Communication; Automation. Detail in `10-integrations.md`.

##### Team & Permissions
- **Why it exists** — RBAC for agency users; client portal scope rules.
- **Who uses it** — agency admins.
- **Problem solved** — least-privilege and clear separation of agency vs client surfaces.
- **Core data** — agency users, roles (admin/staff/analyst/read-only), client assignments, client-role accounts, permission matrix.
- **Key actions** — invite; assign role; assign clients; revoke; view audit log.
- **Global vs scoped** — Agency-global.
- **Sub-pages** — Members; Roles & matrix; Client portal scope. Detail in `11-team-permissions-client-portal.md`.

##### Settings
- **Why it exists** — workspace, billing, roles, notifications, retention, API/webhooks, white-label, security, audit logs.
- **Who uses it** — agency admins.
- **Problem solved** — operational control of the instance.
- **Core data** — workspace profile, default currency/timezone, notification rules, data retention, API tokens (MCP), webhooks, security policy, audit log.
- **Key actions** — edit workspace; manage API tokens; set retention; configure webhooks; review audit log.
- **Global vs scoped** — Agency-global.
- **Sub-pages** — Workspace; Notifications; Retention; API & Webhooks; White-label; Security; Audit log. Detail in `12-settings.md`.

### 3.4 Proposed agency sidebar (grouped)

```
PORTFOLIO
  Overview
  Alerts & Tasks
  Clients
  Reports

CLIENT WORKSPACE      (requires a selected client; All Clients = aggregated)
  Ad Accounts
  Campaigns
  Ad Sets
  Ads & Creatives
  Analytics
  Audiences
  Budget & Pacing
  Attribution & Revenue
  Marketing Plans

ADMINISTRATION
  Integrations
  Team & Permissions
  Settings
```

### 3.5 Client Portal nav (deliberately simpler)

A client-role login never sees the full agency nav. The portal is read-mostly,
trust-focused, and hides the back office entirely.

```
CLIENT PORTAL
  Dashboard          (their overview: spend, revenue, ROAS, purchases)
  Campaigns          (read-only performance)
  Ads & Creatives    (read-only gallery)
  Analytics          (read-only, simplified dimensions)
  Reports            (reports the agency has shared with them)
  Settings           (profile, password, notification preferences)
```

Hidden from client users: Clients, Ad Accounts (management), Budget & Pacing
(internal), Attribution config (they see outcomes, not ingestion), Integrations,
Team & Permissions, Alerts & Tasks (internal), Marketing Plans (unless shared),
Administration, and any cost/margin fields the agency chooses to withhold
(see `11-team-permissions-client-portal.md` for the exact field-level matrix).

---

## 4. Global Application Shell

### 4.1 Sidebar structure

- **Agency side:** the grouped sidebar in Section 3.4. Section headers (Portfolio
  / Client Workspace / Administration) are tracked uppercase labels per
  `DESIGN.md` — hairline-separated, never heading-sized. The active item takes
  the clay-tint wash and a clay left border (1px only). The Client Workspace
  group shows a subtle "requires client" hint when All Clients is selected.
- **Client Portal side:** the flat list in Section 3.5, no section headers, no
  back-office items. The wordmark is the same authored clay-tile mark; the role
  tag shows "Client" in neutral surface/ink-2.

### 4.2 Top bar — agency

Left to right:

| Element | Purpose | Agency-only? |
|---|---|---|
| **Wordmark** | brand identity (authored SVG clay tile + spark) | shared |
| **Client switcher** | master scope; selects a client or All Clients | **agency-only** |
| **Platform switcher** | selects adapter: Meta (today) / Google / TikTok / Snapchat / LinkedIn | **agency-only** (client portal uses a fixed/simplified version) |
| **Date range** | preset or custom range; persists globally | shared |
| **Compare period** | toggle prior-period or YoY comparison | **agency-only** (client portal offers a simpler compare) |
| **Global search** | find clients, accounts, campaigns, ads, reports by name/id | **agency-only** |
| **Notifications (bell)** | shortcut into Alerts sub-page; unread count badge | shared (client sees only their own alerts) |
| **Help** | contextual docs / onboarding | shared |
| **Profile** | role tag, theme toggle, preferences, sign out | shared |

### 4.3 Top bar — client portal

Reduced: **Wordmark · Date range · Notifications · Help · Profile**. No client
switcher (a client is one client). No global search across the book. No
compare-period complexity beyond a simple toggle. The platform switcher, if
shown, is read-only and limited to the platforms the agency has connected for
that client.

### 4.4 Persistent filters — the rule

**Two filter tiers govern behavior on navigation:**

**Global filters** (persist across *all* navigation, including client switches):

- **Date range** — the operator's working window; survives every navigation.
- **Compare period** — prior-period / YoY / off; survives every navigation.

**Client-scoped filters** (persist *within* a selected client, reset on client switch):

- Client (the switcher itself)
- Ad Account
- Platform
- Campaign
- Objective
- Status
- Country
- Audience
- Placement

**The rule, stated unambiguously:**

1. **Global filters (Date range, Compare period) never change unless the user changes them.** They survive switching client, platform, or page.
2. **Switching Client resets every client-scoped filter** (Ad Account, Platform, Campaign, Objective, Status, Country, Audience, Placement) to that client's defaults — because those filters reference entities owned by the previous client.
3. **Switching Platform resets Ad Account, Campaign, Ad Set, Ad, Audience, Placement** — because those are platform-specific entities (a Meta campaign id is meaningless on Google). Client, Status, Objective, Country, Date range, and Compare survive.
4. **All other navigation (between pages within the same client + platform) preserves the full filter state verbatim**, so a buyer's lens travels with them.
5. **Every view encodes its full filter state in the URL query string**, so any page is deep-linkable, bookmarkable, and shareable, and a browser back/forward restores the exact lens.
6. **The Client switcher is the single deliberate "reset client-scoped filters" action.** There is no other implicit reset.

---

## 5. Design Principles

These are actionable rules a builder can follow, anchored to `DESIGN.md`.

### 5.1 The DATA → INSIGHT → DECISION → ACTION ladder

Every screen is built to move the user up this ladder; a screen that only shows
a number without a path to action has failed.

- **DATA** — accurate, tabular-figured, right-aligned, sourced. The ledger base.
- **INSIGHT** — the number with context: delta vs compare period, vs target, vs
  benchmark; a one-line plain-English read ("ROAS down 22% vs last 7 days,
  driven by Campaign X").
- **DECISION** — the judgment the insight enables, made obvious by hierarchy
  (winner/loser tinting, the ROAS hero figure, ranking).
- **ACTION** — a concrete next step one click away: pause, scale, refresh
  creative, create task, open drill-down, add to report.

A page may legitimately stop at DATA+INSIGHT (e.g., Analytics exploration), but
it must never present DATA with no insight path. Overview and Alerts & Tasks
must reach ACTION.

### 5.2 Progressive disclosure — basic vs advanced

- **Basic default:** every surface opens in its clearest form — the canonical
  KPI set, the default sort, the recommended chart. A first-time user can read
  it without configuring anything.
- **Advanced behind intent:** secondary metrics, custom columns, pivot
  dimensions, attribution-model comparison, and bulk actions live behind an
  explicit "Advanced" / "Columns" / "Filters" control — never cluttering the
  default read.
- **Depth by drill-down, not by scroll:** the entity chain (Account → Campaign →
  Ad Set → Ad) is the disclosure mechanism. Each level adds detail; none dumps
  all levels at once.

### 5.3 "Marketing Command Center" without the neon cockpit

- **Calm authority, not a dashboard of blinking lights.** The Command-Center
  feel comes from *coverage* (the whole portfolio legible at once) and *signal
  hierarchy* (the one thing that needs attention is visually first), never from
  saturated color or motion.
- **Clay is the only accent** (One Accent Rule, `DESIGN.md`). Clay marks the
  active selection, the primary action, and the brand — nothing else. If
  something "needs color," it earns a neutral or a muted semantic (olive/rust/
  amber), never a new hue.
- **Restraint reads as professionalism to clients.** The portal is the report;
  the workspace is the instrument; both share the same quiet world.
- **Motion is rare and explanatory** — a hover lift, a focus ring, a chart
  redraw on theme change. No ambient pulsing, no auto-rotating carousels.

### 5.4 Density through structure

- **Density comes from rhythm and hairline rules, not from removing whitespace.**
  Tight in-group spacing (10–14px), generous section separation (24–32px), more
  space above a heading than below.
- **Tabular figures everywhere data lives** (`font-variant-numeric: tabular-nums`),
  right-aligned numeric columns via the `lead-2`/`lead-3` table modifiers. This
  is the ledger signature; misaligned numbers break trust instantly.
- **Status as a dot + semantic halo + word**, never a solid neon pill.
  Winner/loser rows take Olive-Tint / Rust-Tint washes, not colored bars.
- **Serif (Source Serif 4) for titles and the ROAS hero only; Hanken Grotesk
  for every number and all functional UI.** No display face on data, no sans on
  editorial titles (Data-is-Sans Rule, Eyebrow-Only Rule, `DESIGN.md`).
- **Hairline rules (1px, warm rule color) do the structural work;** borders
  never exceed 1px; the old 4px KPI accent bars are retired.
- **No emoji or unicode-glyph icons anywhere.** Buttons are text-only; the
  wordmark mark is the sole authored SVG. Semantic meaning uses muted color +
  word, not an icon.

---

## 6. Feature Non-Duplication Rules

One question per surface. If a second surface tries to answer the same question,
one of them is wrong. "Do not put X here" prevents metric dumping — especially
on Overview, which must stay a pulse, not a firehose.

| Surface | Its one question | Do NOT put here |
|---|---|---|
| **Overview** | What is happening right now? | No creative thumbnails, no per-ad rows, no attribution-model controls, no budget-edit controls. Pulse-level only; drill down for detail. |
| **Analytics** | Why is it happening? | No create/edit/pause actions, no report scheduling. Exploration only; action happens in the entity surfaces. |
| **Campaigns** | Which campaigns caused it? | No creative-level gallery, no audience library management, no revenue-source config. Campaign entity only. |
| **Ad Sets** | Which targeting/setup caused it? | No creative thumbnails, no campaign-level budget totals duplicating Campaigns. Ad-set entity only. |
| **Ads & Creatives** | Which creatives caused it? | No campaign budget pacing totals, no audience overlap. Creative and ad entity only. |
| **Audiences** | Which audiences caused it? | No creative fatigue, no pacing controls. Audience entity only. |
| **Budget & Pacing** | Are we spending the budget correctly? | No creative analysis, no attribution-model selection. Spend projection and caps only. |
| **Attribution & Revenue** | Did spend actually produce revenue/profit? | No creative thumbnails, no pacing edits. Revenue ingestion, models, profit/margin only. |
| **Marketing Plans** | What are we trying to achieve? | No live tactical editing of campaigns; plans link to campaigns, they do not duplicate them. |
| **Alerts & Tasks** | What should I do next? | No full performance tables; each alert/task links out to its entity. The queue, not the data. |
| **Reports** | How do I communicate this to the client? | No live editing of underlying campaigns; no exploration pivot controls. Curated output only. |
| **Clients** | Who do we serve and how do I reach them? | No campaign/ad performance tables; the Clients list rolls up one KPI row per client at most. |
| **Ad Accounts** | Are the connections healthy and correctly wired? | No creative analysis, no attribution. Connection health and onboarding only. |
| **Integrations** | Is everything wired and syncing? | No performance metrics; status, sync, errors, disconnect only. |
| **Team & Permissions** | Who can do what? | No performance data at all. RBAC only. |
| **Settings** | How is the instance configured? | No performance data. Configuration only. |

---

## 7. Platform Extensibility Note

Meta is the first adapter, not a special case. The architecture treats every ad
platform behind a common **AdPlatform** seam, so that Google, TikTok, Snapchat,
and LinkedIn enter the product as new adapters rather than forks of it.

The seam (described, not coded — detail in `13-data-model.md`):

- **Ad account gains a Platform discriminator.** Today every row is implicitly
  Meta; the model makes platform explicit (`ad_accounts.platform`), and the
  per-platform identifiers (Business Manager, page, pixel for Meta; customer id
  / merchant for Google; etc.) live in a platform-specific payload.
- **Every platform implements the same contract:** list ad accounts for a
  credential, list campaigns/ad sets/ads, fetch insights at each level, fetch
  daily series, and (where the platform allows) perform write actions
  (pause/resume, budget edit). Insights are normalized into Winning Kart's
  canonical metric set; platform-only metrics surface as optional columns.
- **The Platform switcher selects which adapter answers** the current view. A
  cross-platform view (portfolio roll-up) aggregates the normalized metrics;
  entity-level drill-downs are always within one platform, because a Meta
  campaign id is not a Google campaign id.
- **Tokens stay encrypted at rest** under the same AES-256-GCM path; each
  adapter brings its own OAuth/connection flow (see `10-integrations.md`).
- **Revenue attribution (`06-attribution-revenue.md`) is platform-agnostic** —
  revenue is tied to the client and attributed back onto whichever platform's
  entities earned it, so adding platforms does not change the attribution model.

This seam is why Section 3's navigation and Section 4's filters are
platform-aware (Platform is a filter; switching it resets platform-specific
entities) and why no nav item is named "Meta …" — the surfaces are generic and
the adapter answers.

---

*End of `01-product-architecture.md`. This is the anchor: navigation,
terminology, shell, and rules defined here are binding on `02`–`16`.*
