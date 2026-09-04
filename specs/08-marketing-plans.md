# 08 — Marketing Plans

> Client-scoped surface for the single question anchor §6 assigns here:
> **"What are we trying to achieve?"** Goals → KPIs → Budget → Strategy → linked
> Campaigns, with Plan-vs-Actual. Plans **set targets**; they do **not** edit
> campaigns (anchor §6: "plans link to campaigns, they do not duplicate them").
>
> Status: DRAFT (crewmate done, pending first-mate review).
>
> Cross-references: `01-product-architecture.md` (anchor §2.2, §3.3, §6, §5,
> §4.4), `02-overview-executive-dashboard.md`, `04-campaigns-adsets-ads.md`,
> `05-analytics-audiences-budget.md`, `06-attribution-revenue.md`,
> `07-reports.md`, `09-tasks-alerts-insights.md`,
> `11-team-permissions-client-portal.md`, `13-data-model.md`,
> `16-data-gaps-and-risks.md`, `DESIGN.md`, `src/db/schema.ts`.

---

## 0. Scope and binding rules

- **A plan is a strategy artifact, not a control surface.** It owns targets,
  budget intents, strategy text, and *links* to execution entities. It owns no
  campaign, ad set, creative, or task; it references them by id (the **link
  contract**, §1.6). Edits to live delivery state happen in
  `04-campaigns-adsets-ads.md` and `05-analytics-audiences-budget.md`.
- **Client-scoped** (anchor §2.2 — "Agency → Marketing Plans … scoped per
  Client"). With *All Clients* selected the list aggregates per-client rows; a
  selected client scopes everything. There is no cross-client plan in this spec.
- **No new metrics invented here.** Plans target the canonical ledger set owned
  by `02`/`04`/`05`/`06` (spend, revenue, ROAS, CPA, CPL, CTR, conversions…).
  Plan-vs-Actual reads the *same* actuals those pages read; this doc adds the
  *planned* column, the variance math, and the status semantics.
- **Schema delta.** `src/db/schema.ts` has **no** plan entities today. This spec
  defines the model (§1); table DDL is deferred to `13-data-model.md`, gaps to
  `16-data-gaps-and-risks.md`.
- **Design.** Paper-and-clay (`DESIGN.md`); tabular figures on every number;
  hairline rules; muted olive/amber/rust for status only; clay reserved for the
  primary action and active selection; no emoji.

---

## 1. Plan authoring — the model

A plan is composed of six linked sections. Each is a first-class object so any
section can be edited, versioned, and reported independently.

### 1.1 Business goals (quantified outcomes)

The headline results the plan is accountable for. Each goal is one quantified
target with an operator, not a paragraph.

| Field | Meaning |
|---|---|
| `goalType` | `revenue` / `leads` / `purchases` / `roas` / `cpl` / `cpa` / `custom` |
| `direction` | `higher_better` (default) or `lower_better` (CPL, CPA) |
| `targetValue` | numeric target, e.g. `100000` |
| `currency` / `unit` | derived from the client; `unit` for counts (leads, purchases) |
| `periodStart` / `periodEnd` | the window this goal must land in |
| `ownerUserId` | single accountable agency user (no committees) |
| `sortOrder` | display rank |

Example rows: Revenue ≥ AED 100,000 (Q4); Leads ≥ 1,000; ROAS ≥ 4.0x;
CPL ≤ AED 15. Goals roll up into the Plan-detail hero.

### 1.2 Marketing objectives (the strategic lever)

One of `awareness` / `lead_gen` / `sales` / `retention`, with optional weight and
note. This is the **join to campaign execution**: a plan objective maps 1:many to
the campaign `objective` field (`04` §1) so the plan can answer "are my sales
campaigns collectively hitting the sales goal?" without owning them. Multiple
objectives per plan are allowed (e.g. 70% sales / 30% retention).

### 1.3 KPIs (operating targets with thresholds)

The metrics watched daily to know the goals are reachable. Distinct from goals:
a goal is the destination; a KPI is the dial. Each KPI line carries its own
status thresholds so the same variance math (§2) yields on-track / at-risk /
off-track without per-row configuration during review.

| Field | Meaning |
|---|---|
| `metricKey` | canonical key: `roas`, `cpa`, `cpl`, `ctr`, `conversions`, `spend`, `cpc`, `cpm`, `frequency` |
| `targetValue` | planned value |
| `direction` | `higher_better` / `lower_better` |
| `onTrackThreshold` | attainment ratio ≥ this = on-track (default `0.90`) |
| `atRiskThreshold` | attainment ratio ≥ this and `< onTrack` = at-risk (default `0.70`) |
| `scope` | optional: objective / channel / campaign id this KPI is scoped to |

Thresholds default per KPI type but are editable per line — a launch quarter may
tighten ROAS on-track to `0.95`, a brand-awareness phase may loosen CTR to `0.60`.

### 1.4 Budget (allocation lines)

A single `totalBudget` lives on the plan; allocation is a set of lines at three
levels, each line independent so an account manager can plan top-down
(channel/month) and reconcile bottom-up (campaign) without forcing one shape:

| Level | Keyed by | Use |
|---|---|---|
| `channel` | free label (Prospecting / Retargeting / Top-of-funnel) | strategy intent; not a Meta concept |
| `campaign` | `campaignId` (link, §1.6) | bottom-up reconciliation against live spend |
| `monthly` | `YYYY-MM` | pacing against monthly caps owned by `05` |

Each line: `plannedAmount`, `currency` (plan currency), optional `adAccountId`.
Variance is computed per line and rolled to total. Channel is an agency
convention; campaign and monthly are real entities/time and are the source of
truth for reconciliation.

### 1.5 Strategy documentation (structured fields, not free text)

One `PlanStrategy` record per plan with seven structured fields. Each field is a
short, bounded object (not a rich-text dump) so it can be diffed, shared in
summary, and surfaced in reports (`07`) without parsing prose.

| Field | Shape |
|---|---|
| `targetAudience` | segments, size estimates, reference audiences (link ids from `05`) |
| `offer` | offer name, mechanics, start/end, discount %, hook |
| `creativeStrategy` | pillars, formats, count, refresh cadence, brand guardrails |
| `funnelStrategy` | TOF/MOF/BOF allocation %, stage objectives, handoff events |
| `channelStrategy` | platform mix (Meta today; future adapters via `10`), placement posture |
| `testingPlan` | structured tests (hypothesis, variable, success metric, window) |
| `executionPlan` | milestones (date, owner, deliverable) — milestones can generate tasks (§6) |

### 1.6 Execution links — the link contract

A `PlanLink` row connects the plan to execution entities the plan does **not**
own. This is the boundary that keeps plans non-duplicative (anchor §6).

| Field | Meaning |
|---|---|
| `planId` | owning plan |
| `linkType` | `campaign` / `adset` / `creative` / `ad_account` / `task` |
| `entityId` | the referenced entity's id |
| `role` | `primary` / `supporting` / `exclude` (exclude = "deliberately not in scope") |
| `objective` | optional: which plan objective this link serves |
| `note` | one line |

Links are **read-only references**. Removing a link never deletes the entity;
editing the entity never touches the plan beyond re-reading its actuals. A
campaign linked to a plan still appears in `04` as the source of truth.

---

## 2. Plan vs Actual — the core

This is the reason Plans exist as a surface rather than a deck. For every goal,
KPI, and budget line the plan shows **planned · actual · variance · status ·
trend · why**, in that column order, tabular figures throughout.

### 2.1 Variance math

For each line, compute an **attainment ratio** so direction (`higher_better` vs
`lower_better`) collapses into one comparable number where `> 1` is good:

```
elapsedFraction = clamp(daysElapsedInPeriod / daysInPeriod, 0, 1)
paceAdjustedTarget = planned × elapsedFraction       # only while in-flight
actualToDate       = summed actuals in [periodStart, now]
attainment         = actualToDate / paceAdjustedTarget    (higher_better)
attainment         = paceAdjustedTarget / actualToDate    (lower_better)
```

Before `periodStart` and after `periodEnd`, pace-adjustment is off (`elapsedFraction`
= 0 or 1); a completed period uses the *final* attainment against the full
planned value. Variance is also shown in original units (`actual − planned`) and
as `%`, so a buyer can read either register.

### 2.2 Status thresholds (defaults; editable per KPI, §1.3)

| Status | Color | Attainment (higher_better) | Attainment (lower_better) | Read |
|---|---|---|---|---|
| **On-track** | Olive | `≥ 0.90` | `≥ 0.90` (i.e. actual ≤ 111% of target) | Landing it. |
| **At-risk** | Amber | `0.70 – 0.89` | `0.70 – 0.89` (111% – 143%) | Will miss without intervention. |
| **Off-track** | Rust | `< 0.70` | `< 0.70` (> 143%) | Missing now; replan or intervene. |
| Not started | Neutral | period future | period future | No signal yet. |
| Completed | Olive/Amber/Rust | final attainment | final attainment | Frozen verdict. |

**Budget is a constraint, not a goal.** Budget lines use a separate rule:
overspend vs plan `> 5%` = at-risk, `> 15%` = off-track (a cap violation),
**regardless of direction**; underspend against a *growth* goal's planned
investment surfaces as an at-risk *goal* (you're not spending enough to reach
it), not a budget win. This keeps "we under-spent, therefore we succeeded" from
hiding a missed target.

### 2.3 The "why" link

Every variance cell carries a one-line plain-English read and a drill target:
the **entity or dimension** driving the gap. A ROAS line 22% off-track reads
"`<Client> / <Campaign>` ROAS 2.3x vs 3.0x plan — drove 78% of the miss" and
drills into that campaign in `04`, or into the relevant slice in `05` Analytics.
The detection logic is shared with the Actionable Insights engine in
`02` §1.4 and the prioritization in `09`, so a plan variance and an alert never
disagree.

---

## 3. Plan surfaces (per-page template, anchor §3.3)

### 3.1 Plans list

- **Purpose** — index every plan for the selected client (or all clients), with
  one-line health per plan.
- **Primary user** — agency account manager / lead. Author and triages plans.
- **User goal** — in one scan, see which plans exist, which are active, which are
  drifting (aggregate status), and enter the right one.
- **Primary CTA** — **New plan** (clay). Disabled with helper text when no client
  is selected and *All Clients* is in scope (plans are client-scoped).
- **Secondary actions** — filter by status / period / owner; duplicate a plan as
  a starting template; archive; share to client portal (§5).
- **KPI cards** — none (the list *is* the index; KPI depth is per-plan).
- **Charts** — none.
- **Tables** — one row per plan: name, client (if *All Clients*), status badge,
  period, owner, total budget, **aggregate health** (worst line status as a dot
  + halo + word), last edited. Sortable; winner/loser tinting **off** here
  (status semantics, not performance ranking).
- **Filters** — client-scoped filters per anchor §4.4 (Client, Ad Account,
  Platform reset on client switch) plus plan-specific: status, period, owner.
  Date range does **not** filter this list (plans have their own periods).
- **Dimensions** — Client (when *All Clients*), Plan.
- **Metrics** — total budget, planned vs actual rollup %, count of at-risk lines.
- **Drill-down** — row → Plan detail (§3.2).
- **Empty state** — "No plans yet for `<Client>`." Helper: "Draft your first plan
  — goals, KPIs, budget, and the campaigns that will deliver them." Primary CTA:
  "New plan".
- **Loading** — rows as muted skeletons with tabular-width placeholders.
- **Error** — "Couldn't load plans." Retry ghost; one-line reason.
- **Permission** — admin/staff author; analyst/read-only see but cannot create;
  client role never sees this list (portal shows only *shared* plans, §5).
- **Mobile** — table → card list; status dot + name + period + aggregate health
  per row; full table on rotate / expand.
- **Export** — CSV of the list; curated output is `07`'s job.
- **Related** — Plan detail (§3.2), Clients (`03`), Reports (`07`).
- **Next action** — open the plan whose aggregate health is amber/rust.

### 3.2 Plan detail

- **Purpose** — read and edit one plan end to end: the strategy artifact.
- **Primary user** — account manager (author); reviewers (read).
- **User goal** — confirm the plan is complete, coherent, and linked to real
  execution; spot which line is drifting without leaving the page.
- **Primary CTA** — **Set active** (clay) when status = draft; once active, the
  primary CTA becomes **Share to client** (if not shared) or **Open Plan vs
  Actual** (clay).
- **Secondary actions** — edit any section inline; duplicate; archive; generate a
  task from any milestone (§6); link/unlink campaigns; export summary to `07`.
- **KPI cards** — the plan's goal set as hero tickets (label, target, current
  actual, attainment %, status dot). ROAS goal leads visually per `DESIGN.md`.
- **Charts** — one: cumulative pace (planned vs actual cumulative line over the
  period, with today marker). No creative, no per-ad.
- **Tables** — four ledger tables stacked: Goals, KPIs (with thresholds),
  Budget allocation (channel / campaign / monthly), Linked entities (the link
  contract, §1.6). Tabular figures, right-aligned numerics, status as dot+halo.
- **Filters** — none beyond the plan's own scope; the global date range does
  *not* apply (the plan's period governs).
- **Dimensions** — within-plan: objective, channel, campaign, month.
- **Metrics** — planned, actual, variance, variance %, attainment, status, trend.
- **Drill-down** — any variance cell → `04`/`05` at the driving entity/slice; any
  linked campaign → `04`; any milestone → generated task in `09`.
- **Empty state** — a new draft shows scaffolded empty sections ("No goals yet —
  add your first", etc.), each with an inline add control. No dead screens.
- **Loading** — section-by-section resolve; planned values render instantly
  (local), actuals stream in as queries return.
- **Error** — section-level: a failing section shows a rust dot and retry without
  blocking the others.
- **Permission** — admin/staff edit; analyst/read-only read; client role only if
  shared (§5), and then read-only with internal fields hidden.
- **Mobile** — sections collapse into an accordion (Goals, KPIs, Budget,
  Strategy, Links); tables scroll horizontally per `DESIGN.md` (no fabricated
  card view, no column hiding).
- **Export** — "Send to report" creates a plan block in `07`; "Export summary"
  (PDF/Markdown) of the read-only summary (§5).
- **Related** — Plan vs Actual (§3.3), Campaigns (`04`), Budget & Pacing (`05`),
  Attribution (`06`), Tasks (`09`), Reports (`07`).
- **Next action** — resolve the worst-status KPI; if all green, confirm links are
  current and share to client.

### 3.3 Plan vs Actual

- **Purpose** — the accountability read: did execution deliver the plan, line by
  line, with the "why".
- **Primary user** — account manager (review); lead (1:1s, QBRs); client (if
  shared, simplified).
- **User goal** — in 60 seconds, know what's on / at-risk / off and where to look.
- **Primary CTA** — **Generate task** from any off-track line (clay, routes to
  `09`); or **Open <entity>** to drill into the driver.
- **Secondary actions** — toggle pace-adjustment on/off (off = absolute vs full
  plan); switch attainment register (ratio / units / %); collapse to goals-only;
  annotate a line with a written "why" (stored on the line, audit-logged).
- **KPI cards** — top-of-page rollups: # on-track, # at-risk, # off-track, total
  budget burn %, projected period-end attainment for the lead goal.
- **Charts** — cumulative pace (plan vs actual) per goal; small-multiple trend
  per KPI with status tint. No creative, no per-ad.
- **Tables** — the variance ledger: every goal/KPI/budget line as a row with
  `planned · actual · variance · variance% · attainment · status · trend · why`.
  Sort by status (worst first) by default; hairline rows, tabular figures, dot+
  halo status, olive/amber/rust tints on off-rows only.
- **Filters** — section toggle (Goals / KPIs / Budget / All); status filter
  (off-track only by default for triage); objective filter.
- **Dimensions** — plan line (goal/kpi/budget) × time.
- **Metrics** — the §2.1 set.
- **Drill-down** — `why` cell → driving entity in `04` or slice in `05`.
- **Empty state** — "Plan not started." if period is future; "Collecting
  actuals…" if < 24h into period and actuals are sparse.
- **Loading** — planned columns render first; actuals fill with tabular em-dashes
  then resolve.
- **Error** — per-line: a line whose actual source is unavailable shows a rust
  dot + "actual unavailable" and is excluded from rollups with an `ink-3` note.
- **Permission** — admin/staff/analyst/read-only full read (read-only: no
  Generate task); client role sees the *shared summary* variant (§5).
- **Mobile** — table scrolls horizontally; KPI rollup cards 2-up; "why" cell
  truncates with tap-to-expand.
- **Export** — "Send to report" → `07` Plan-vs-Actual block; PDF/CSV export.
- **Related** — Plan detail (§3.2), Campaigns (`04`), Analytics (`05`),
  Attribution (`06`), Reports (`07`), Tasks (`09`).
- **Next action** — generate a task from the top off-track line, or annotate the
  "why" for the next review.

---

## 4. Authoring UX flow

Goal: a first-time author can produce a complete, coherent plan without leaving
a guided path; an expert can skip steps. Linear by default, branchable anytime.

- **Step 0 — Create.** From Plans list → "New plan". Modal: name, client
  (pre-filled if one selected), period presets (this month / this quarter / this
  year / custom), currency (client default), owner (self). → status `draft`.
  *Validation:* name + period required. *Next:* Step 1.
- **Step 1 — Goals.** Add business goals (§1.1). *Validation:* each goal needs
  type, target, operator, owner. *State cue:* "Add at least one goal to enable
  Set active." *Next:* Step 2.
- **Step 2 — Objectives & KPIs.** Pick marketing objective(s) (§1.2); add KPI
  targets with thresholds (§1.3). *Suggestion engine:* proposes KPI defaults for
  the chosen objective (sales → ROAS/CPA/CTR; lead_gen → CPL/conversions;
  awareness → CPM/CTR/reach; retention → return-customer rate where available).
  *Next:* Step 3.
- **Step 3 — Budget.** Set total, then allocate by channel / month / campaign
  (§1.4). *Validation:* sum of any level vs total flagged (not blocked) when off
  by > 5%. *Next:* Step 4.
- **Step 4 — Strategy.** Fill structured fields (§1.5). *Validation:* none
  (strategy can be partial), but a completeness meter shows filled/total.
  *Next:* Step 5.
- **Step 5 — Link execution.** Add `PlanLink`s to campaigns/ad sets/creatives
  (§1.6); mark primary/supporting/exclude. *Validation:* warns if a plan
  objective has zero primary links ("sales objective has no sales-obj campaigns
  linked"). *Next:* review.
- **Step 6 — Set active.** Primary CTA flips status `draft → active`; the plan
  begins accumulating actuals from `periodStart`. *Notification:* owner + linked
  assignees; entry appears in `09` as a plan-active signal. *Next:* live with it.
- **Step 7 — Review (later).** Reopen Plan vs Actual (§3.3) any time; on
  `periodEnd`, status prompts `active → completed` and freezes the final
  verdict; archive is a later, reversible action.

*Skip / branch:* any step can be skipped in draft; "Set active" gates on at
least one goal and one KPI. *Autosave:* every edit persists on blur; version
history keyed by section (not whole-plan snapshots) keeps diffs reviewable.

---

## 5. Client sharing

A plan (or a *read-only summary* of one) can be shared to the client portal
(`11`). Sharing is **opt-in per plan**, never default.

- **Shared (visible to client):** the plan name, period, goal targets, KPI
  targets, channel/month budget allocation (amounts, not pacing internals),
  strategy summary fields (audience, offer, creative pillars, funnel, channel,
  testing), and the Plan-vs-Actual **summary** view (status dots + variance %,
  not raw diagnostics).
- **Internal-only (never shared):** owner-only notes, the `exclude` link role
  and its notes, per-campaign budget reconciliation against live spend,
  pacing internals and monthly caps (owned by `05`), CPA/CPC/CPM unless the
  agency's per-client flag enables them (`02` §2.2), cost/margin/profit fields
  the agency withholds, the "why" free-text if tagged internal, and any
  alert/task linkage.
- **Mechanism.** A `PlanShare` record: `{planId, scope: summary|full,
  shareToken, expiresAt?, revokedAt?}`. Client portal lists shared plans under
  a "Plans" entry that is **only present when ≥ 1 plan is shared** — the nav
  item is hidden by default (anchor §3.5 hides Marketing Plans unless shared).
  A shared plan is read-only to the client role; revoking hides it immediately.

---

## 6. Relationship to other surfaces

- **`04` Campaigns / `05` Budget & Pacing — read targets, never edit.** A plan's
  goal/KPI/budget lines are the authoritative *targets* those surfaces can show
  as reference lines (e.g. the ROAS-target rule on charts in `02`/`05`; the CPL
  target as a column reference in `04`). Plans do not push edits into campaigns;
  campaigns do not mutate plans. The link contract (§1.6) is the only join.
- **`09` Tasks — plans generate tasks; tasks do not own plans.** Any plan
  milestone, any off-track variance line, and any strategy testing-plan row can
  spawn a task. The task entity (owned by `09`) carries a `sourcePlanId` (and
  optional `sourceGoalId` / `sourceKpiId`); the plan surfaces "Tasks generated
  (N)" by querying, not by storing its own task table. Completing a task never
  auto-completes a plan line; the actual must move.
- **`07` Reports — plans are a first-class report block.** A plan summary or a
  Plan-vs-Actual block is a buildable block in the report builder, sourced from
  the shared (non-internal) fields of §5. Curated client output is `07`'s job;
  the plan surface only ships the data.
- **`06` Attribution — actuals feed the plan.** Plan-vs-Actual ROAS/revenue
  actuals read whichever attribution model is active for the client (`06`),
  with the same honesty overlay (model + window disclosed). Switching models
  re-flows plan actuals; the plan stores no attribution decision of its own.
- **`02` Overview — plans are not on the pulse.** Per non-duplication the
  Overview stays a pulse; the worst plan-status *can* surface as a single
  insight line ("Q4 plan for `<Client>` is off-track on ROAS") routing here.

---

## 7. Design rules (load-bearing restatement)

`DESIGN.md` binds; only what carries weight here: **One Accent** — clay on New
plan / Set active / Share to client / Generate task / active row only. **Muted
semantics** — olive/amber/rust for on/at-risk/off, always dot + 3px halo + word,
never a solid pill, never neon. **Tabular figures** on every planned, actual,
variance, and % cell; right-aligned numeric columns via `lead-2`/`lead-3`.
**Serif** for plan title and the goal hero only; Hanken Grotesk for all data and
UI. **Hairline rules** between sections and rows; no card border > 1px; no per-
card color bars. **No emoji/glyph icons**; buttons text-only. **Motion** —
cumulative-pace chart redraws on theme/change-of-period; variance cells fade in
on resolve; no ambient pulsing.

---

## 8. Data gaps flagged for `16-data-gaps-and-risks.md`

- **Retention / return-customer KPIs** — Meta gives purchase counts, not
  reliably new vs returning purchasers; the retention objective's KPI set is
  partial without a revenue source from `06`.
- **Awareness reach / brand-lift** — reach is API-direct; brand-lift and aided
  awareness are not. Awareness-objective plans must lean on CPM/CTR/reach.
- **Pace-adjustment assumes linear delivery.** Real delivery is front/back-loaded
  by campaign spend cap and learning phase; the pace-adjusted target is a guide,
  not a verdict, in the first/last 10% of a period (surfaced as an `ink-3` note).
- **Channel allocation is an agency convention.** "Prospecting / Retargeting"
  channels are not Meta entities; reconciliation to live spend happens at the
  campaign-line level, not the channel-line level.
- **Multi-currency plans.** Plan currency is single; ad accounts may span
  currencies (`schema.ts`). Conversion uses the same rules as `06` (order-day
  rate into plan currency) and is footnoted on the variance ledger.

---

*End of `08-marketing-plans.md`. Plans set targets and link execution; they do
not edit it.*
