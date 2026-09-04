# 09 — Tasks, Alerts & Insights

> Status: DRAFT (crewmate done, pending first-mate review).
>
> Cross-references: `01-product-architecture.md` (anchor — nav §3.3, persistent
> filters §4.4, design principles §5, non-duplication table §6), `02-overview-executive-dashboard.md`
> (insight engine §1.4, severity ladder, account-health strip §1.5), `04-campaigns-adsets-ads.md`,
> `05-analytics-audiences-budget.md`, `06-attribution-revenue.md`, `07-reports.md`,
> `08-marketing-plans.md`, `10-integrations.md`, `11-team-permissions-client-portal.md`,
> `12-settings.md`, `16-data-gaps-and-risks.md`, `PRODUCT.md`, `DESIGN.md`.

## 0. Scope and the one question

This surface answers the anchor's single question — **"What should I do next?"**
Per the non-duplication table (`01` §6), Alerts & Tasks is **the queue, not the
data**: each alert and task links out to its entity rather than reproducing a
performance table. Depth lives one click down the entity chain in `04`, `05`,
and `06`.

Three sub-pages share one navigation entry and one priority model:

- **Alerts feed** — things that happened (reactive).
- **Tasks queue** — things to do (proactive / owned work).
- **Recommendations** — the diagnostic layer that turns a detected signal into a
  named cause and a recommended next step.

Agency-only surface (`01` §3.5). Not visible to client users; clients receive
curated outcomes through Reports (`07`) and the Client Portal Dashboard (`02` §2).

The whole surface obeys the DATA → INSIGHT → DECISION → ACTION ladder (`01`
§5.1), and it must always reach ACTION — a task assignee, an entity drill-down,
a reconnect, a dismiss-with-reason.

---

## 1. Shared concepts

These govern all three sub-pages.

### 1.1 Severity ladder

Shared verbatim with `02` §1.4. Severity is shown as a **7px dot + 3px halo +
word** (`DESIGN.md` "Status & role"), never a neon pill.

| Level | Color | Meaning | Surfacing |
|---|---|---|---|
| **Critical** | Rust | Money actively being lost, or data untrusted. Act today. | Bell badge count; top-3 digest on Overview (`02` §1.4); email/Slack per user prefs (`12`). |
| **Warning** | Amber | A trend that will become critical if unaddressed. Act this week. | Bell badge count; top-3 digest when fewer than three criticals exist. |
| **Info** | Neutral (ink-3 dot) | An opportunity, not a problem (e.g., a winner worth scaling, a concentration to diversify). | Bell icon, no badge count; in-feed only. |

### 1.2 Priority score (business impact, not chronology)

Every alert and every insight-backed recommendation carries a priority score:

```
priority = affected_spend × severity_weight × recency_weight × open_task_penalty
```

- **Affected spend** — the daily spend on the entity in scope, in the workspace
  default currency (AED). For data-trust events (token expired, account
  restricted, sync failure), the affected spend is the account's trailing 7-day
  daily average, because *all* of that account's data degrades.
- **Severity weight** — Critical 1.0, Warning 0.5, Info 0.1.
- **Recency weight** — 1.0 in the first 6h after detection, decaying to 0.3 at
  72h; an unresolved stale alert cools but never disappears.
- **Open-task penalty** — a multiplier < 1.0 when a related task is already open
  (see §7.2); this is the primary anti-noise lever.

Data-trust events (token expired, account restricted, sync failure) are pinned
above all performance alerts regardless of raw score, because untrusted data
invalidates every other number on the platform. This mirrors the Overview's
ranking rule (`02` §1.4).

### 1.3 The link-out rule

No sub-page embeds a full performance table. Every row carries:

- The affected **entity chain** (`01` §2.1): Client → Ad Account → Campaign →
  Ad Set → Ad / Creative, truncated to the meaningful level.
- A **deep link** to the owning surface, with the entity pre-selected and the
  global filter state preserved (`01` §4.4).
- A **supporting-metrics strip** — three to five figures maximum (tabular, right
  per `DESIGN.md`), enough to justify the severity, never a full grid.

### 1.4 Detection: on read, shared with Overview

The detection rules live in a single shared module reused by the Overview
insight engine (`02` §1.4). Detection runs **on read of the latest data** — no
separate background job in MVP — so the Alerts feed and Overview's top-3 are
always two views of the same computation. A queued cron refresh of an ad account
re-runs detection for that account's entities; results persist as alert rows.

---

## 2. Tasks / Actions (section 16)

### 2.1 Task origins

A task is created from one of four origins. The origin is stored on the task and
shown as a quiet sub-line so an operator can tell authored work from generated
work at a glance.

1. **Marketing plan** (`08`) — a planned action, a KPI variance, or a plan-vs-
   actual deviation spawns a task pre-linked to the plan and the offending
   entity.
2. **Alert** — the operator (or, with `yolo` standing authority per
   `11`/`12`, the system) accepts an alert into a task via "Create task" on the
   alert row. The alert is then suppressed while the task is open (§7.2).
3. **Recommendation** — accepting an insight from the Recommendations sub-page
   creates a task pre-filled with the recommended action and CTA target.
4. **Manual** — the operator authors a task from scratch or from any entity row
   via the create-from-anywhere pattern (§2.4).

### 2.2 Task schema

| Field | Type | Notes |
|---|---|---|
| `id` | string | Internal. |
| `title` | string | One line, plain English. |
| `description` | markdown | Accepts the originating alert/insight summary when generated. |
| `client` | ref → Client | Required; `null` only for agency-internal tasks. |
| `entity_link` | ref → entity | Campaign / Ad Set / Ad / Account / Plan; deep-link preserved. |
| `priority` | enum | Low / Medium / High / Urgent. Mapped from the originating alert's severity when generated. |
| `assignee` | ref → agency user | Defaults to the creator; auto-assignment rules in `12`. |
| `due_date` | date | Optional; surfaced in digest when within 24h. |
| `status` | enum | `todo` / `in-progress` / `done` / `skipped`. |
| `source` | enum | `plan` / `alert` / `recommendation` / `manual`. |
| `comments` | thread | Per-task; @-mention triggers a notification (§5). |
| `created_at`, `updated_at`, `closed_at` | timestamps | Audit. |
| `linked_alert_ids`, `linked_insight_id` | refs | Bidirectional links (§4). |

### 2.3 Lifecycle, assignment, notifications

- **Lifecycle**: `todo` → `in-progress` → `done` (landed) | `skipped` (with a
  one-line reason that closes the originating alert as "dismissed —
  acknowledged"). `skipped` is a first-class terminal state: a skip with a
  reason is honest operator judgment, not data loss.
- **Assignment**: any agency user with the client in scope may be assigned
  (matrix in `11`). An unassigned `todo` is highlighted in the digest until it
  has an owner.
- **Notifications**: assignment, @-mention, due-in-24h, and status change each
  fire on the assignee's chosen channels (§5). A task reopened from `done`
  re-arms its linked-alert suppression check (§7.2).

### 2.4 Create-from-anywhere

Every entity row across the workspace — Campaigns, Ad Sets, Ads & Creatives,
Attribution & Revenue rows, Budget & Pacing rows, an alert, a recommendation, a
plan KPI — exposes a **"Create task"** ghost action. The modal opens with the
entity link, client, and a one-line title pre-filled from the row's context
(e.g., *"Review Creative X — frequency 5.2, CTR −27%"*). The task appears in the
queue with `source = manual` (or `alert` / `recommendation` when launched from
one). This is the universal on-ramp from DATA to ACTION (`01` §5.1).

### 2.5 Per-page template — Tasks queue

- **Purpose** — the owned, trackable "what should I do next" list across the
  whole portfolio.
- **Primary user** — agency media buyers / account managers / leads.
- **User goal** — in one screen, know what is mine, what is overdue, and what is
  urgent this morning.
- **Primary CTA** — **"New task"** (clay) when no task is selected; **"Open
  entity"** (clay) on the selected task to jump to its linked row.
- **Secondary actions** — assign / reassign; change status; set due date; filter
  by assignee / client / source / priority / status; sort by priority,
  due date, created; comment; @-mention; convert a comment into a sub-task.
- **KPI cards** — none. The non-duplication rule forbids performance tables
  here; the queue carries task counts, not money.
- **Charts** — none.
- **Tables** — one. Columns: status dot · title · client · entity link ·
  priority · assignee · due · source. Default sort: priority desc, then due asc.
  Winner/loser tinting does not apply; overdue rows take a hairline Rust-Tint
  wash on the due cell only.
- **Filters** — global Date range applies to *created/due* only; client switcher
  filters; client-scoped filters do not apply (entity already linked).
- **Dimensions** — Client, Assignee, Source, Status, Priority.
- **Metrics** — counts only (open, due-today, overdue, done-this-week), as small
  sub-line tallies.
- **Drill-down behavior** — row select opens the right-hand detail pane (title,
  description, comments, linked alert/insight, audit); **"Open entity"** drills
  to the linked row in `04` / `05` / `06` / `08`.
- **Empty state** — "Nothing queued." Helper: "Create a task from any campaign,
  ad, or alert, or accept a recommendation." CTA: "View recommendations" (clay)
  → Recommendations sub-page.
- **Loading state** — rows render as muted hairline placeholders with tabular
  width preserved on count cells; no spinner.
- **Error state** — "Couldn't load tasks." Retry (ghost). The list is local-only
  durable; never_BLOCKS on a downstream ad-platform call.
- **Permission state** — admin/staff/analyst see and edit all tasks for clients
  in their scope; read-only sees tasks but no status/edit affordances. Client
  role never sees this page (`11`).
- **Mobile/responsive behavior** — single-column list, status dot + title +
  client + due; tap to expand; primary CTA in a sticky foot bar. No horizontal
  scroll.
- **Export behavior** — CSV of the current filtered list (titles, entities,
  owners, statuses, dates). No performance metrics in the export.
- **Related pages** — Alerts feed (this doc), Recommendations (this doc),
  Campaigns/Ad Sets/Ads (`04`), Analytics (`05`), Attribution (`06`), Marketing
  Plans (`08`).
- **Recommended next action** — clear the top urgent/overdue item; if a task
  references a Critical alert, open the entity before acting.

---

## 3. Alert center (section 17)

### 3.1 Alert triggers

Each alert carries the six fields from the captain's brief: **what happened, why
it matters, severity, supporting metrics, recommended action, CTA**. Severity
thresholds and the data required are shared with the Overview insight table
(`02` §1.4); the Alerts feed is the persistent, filterable, per-client view of
the same signals, plus operational/data-trust events that the Overview only
summarises in its health strip.

| Trigger | What happened | Why it matters | Severity | Supporting metrics | Recommended action | CTA → target |
|---|---|---|---|---|---|---|
| **CPA increase** | CPA rose ≥ 25% vs prior equivalent period on steady purchase volume. | Each acquisition costs more; margin compresses first. | Critical if CPA > target; else Warning. | CPA now/prior, spend, purchases, target CPA. | Inspect creative/audience cost drivers. | "Open ad sets" → `04`. |
| **ROAS decrease** | ROAS fell ≥ 20% vs prior equivalent period. | Spend is producing less revenue per dirham. | Critical if ≥ 40% drop or spend ≥ 5× threshold; else Warning. | ROAS now/prior, revenue, spend. | Inspect campaigns driving the drop. | "Open campaigns" → `04`. |
| **CTR decrease** | Account- or campaign-level CTR fell ≥ 20% over 7d with spend stable or rising. | Creative/audience fit is degrading ahead of CPA. | Warning (escalates to Critical when CPA also breaches). | CTR now/prior, impressions, clicks, frequency. | Review creative and audience freshness. | "Open ads" → `04`. |
| **Spend anomaly** | Daily spend deviates ≥ 50% from the trailing 14-day median (up or down). | A budget changed, a campaign auto-scaled, or delivery is broken. | Critical on a >2× spike with no matching budget edit; else Warning. | Daily spend, 14-day median, active campaigns, last budget-edit timestamp. | Confirm intent; investigate unintended scale or delivery stop. | "Open budget & pacing" → `05`. |
| **Revenue decrease** | Attributed revenue fell ≥ 25% vs prior period with spend stable. | Money is leaving the funnel. | Critical if revenue loss ≥ 3× threshold; else Warning. | Revenue now/prior, purchases, AOV, attribution model. | Inspect attribution source health and conversion path. | "Open attribution" → `06`. |
| **Budget pacing off** | Projected month-end spend deviates ≥ 15% over, or ≤ 70% under, the monthly cap. | Overspend breaches client cap; underspend wastes the month. | Critical on overspend; Warning on underspend. | Spend-to-date, monthly cap, pacing %, projected month-end. | Adjust daily budgets or the cap. | "Open budget & pacing" → `05`. |
| **Creative fatigue** | An ad's frequency ≥ 4 AND CTR down ≥ 20% over 7d AND spend share ≥ 10% of its campaign. Derived (Meta exposes no fatigue score — `02` §4). | The creative is burning impressions on the same people. | Warning. | Frequency, CTR trend, spend share. | Refresh the creative. | "Open ad" → `04`. |
| **Campaign without conversions** | Spend ≥ threshold AND purchases = 0 over ≥ 7d. | Pure waste; learning phase will not save it. | Critical if spend ≥ 3× threshold; else Warning. | Spend, purchases, days active, status. | Pause or restructure. | "Open campaign" → `04`. |
| **Account disconnected** | An ad account is no longer reachable (token refresh failing or connection error). | Data goes stale silently; spend may continue on platform. | Critical (data trust). | Last successful refresh, error short-text. | Reconnect the account. | "Reconnect" → `03`; "View sync log" → `10`. |
| **Data sync failure** | A scheduled refresh failed (non-auth reason: rate limit, Meta outage, network). | Numbers are stale; trust degrades hour by hour. | Critical if stale > 6h; else Warning. | Last successful refresh, retry count, error class. | Retry the sync; check Integrations. | "Retry now" → `10`. |
| **Token expired** | Token marked expired or refresh returns an auth error. | Identical impact to disconnect; surfaces separately so the fix path is unambiguous. | Critical (data trust). | Token status, last refresh error. | Reconnect the token. | "Reconnect" → `03`. |

### 3.2 Severity surfacing

- **Top-bar bell** — unread count badge in clay-tint (≤ 9, then "9+"); the badge
  counts Critical + Warning only (Info never increments it). Click → Alerts feed.
- **Top-3 digest** — the same three highest-priority items the Overview surfaces
  (`02` §1.4) appear as the top of the feed, with the rest below in priority
  order, never chronological.
- **Per-client scoping** — the client switcher filters the feed; with All
  Clients selected, a Client column appears as the leftmost column. A per-client
  rate-limit applies (§7.3).

### 3.3 Per-page template — Alerts feed

- **Purpose** — the reactive side of "what should I do next": things that
  happened, ranked by business impact.
- **Primary user** — agency media buyers / account managers / leads.
- **User goal** — in one screen, see every open signal across the portfolio and
  decide per-row: act now, accept into a task, snooze, or dismiss.
- **Primary CTA** — the worst row's recommended action (clay), e.g.,
  *"Reconnect account"*. Changes per selected row.
- **Secondary actions** — acknowledge; snooze (1h / 24h / until-next-sync);
  dismiss-with-reason; **"Create task"** (accepts the alert into the queue);
  filter by severity / client / trigger-type / status; sort by priority or time.
- **KPI cards** — none (non-duplication).
- **Charts** — none.
- **Tables** — one. Columns: severity dot+halo · what-happened (one line) ·
  client · entity link · supporting-metrics strip · age · row actions. Default
  sort: priority desc, then age asc.
- **Filters** — global Date range bounds *detection time*; client switcher
  filters; severity, trigger-type, status (open / snoozed / acknowledged).
- **Dimensions** — Client, Trigger type, Severity, Status.
- **Metrics** — counts only (open critical, open warning, acknowledged-today,
  snoozed), as sub-line tallies.
- **Drill-down behavior** — row expand reveals the full "what happened / why it
  matters / supporting metrics / recommended action" block; primary CTA drills
  to the offending entity in `03` / `04` / `05` / `06` / `10`.
- **Empty state** — "All clear." Helper: "No alerts in the last 72 hours."
  Olive-dot positive state (a healthy empty state, per `02` §1.5).
- **Loading state** — "Reading signals…" in ink-3; rows populate as detection
  returns per account.
- **Error state** — if detection itself fails for an account, that account's
  alerts are stale and a single rust row reads *"<Account>: detection not run
  since <ts>"* linking to `10`. Other accounts render normally.
- **Permission state** — admin/staff/analyst see and act on alerts for clients
  in scope; read-only sees but cannot acknowledge/dismiss. Client role never
  sees this page.
- **Mobile/responsive behavior** — single-column feed; severity dot + one-line +
  client + age; tap to expand; row actions in an overflow menu. No horizontal
  scroll.
- **Export behavior** — CSV of the current filtered feed (no performance tables;
  only alert fields). Read-only audit use.
- **Related pages** — Tasks queue (this doc), Recommendations (this doc),
  Overview (`02`), Ad Accounts (`03`), Campaigns (`04`), Budget & Pacing (`05`),
  Attribution (`06`), Integrations (`10`).
- **Recommended next action** — act on the top Critical; if it is data-trust,
  reconnect before trusting any other row.

---

## 4. Insights / Recommendations engine

### 4.1 The diagnostic layer

An insight is the *why* beneath an alert. Where the Alerts feed says "ROAS fell
28%", a recommendation says "ROAS fell 28% because Creative X received 42% of
spend while its conversion rate dropped 28%. → Review Creative." The engine
extends the eight Overview insight types (`02` §1.4): **ROAS dropped, CPA
spiked, Overspending/under-pacing, Creative fatigue, Conversion concentration,
Spend-no-conversions, Token expired, Account restricted** — adding two
analytical types that the Overview omits for pulse restraint but the
Recommendations page can carry: **CTR decline** and **Revenue decline**.

### 4.2 Causal-attribution logic and the honesty limit

Each insight type runs the same attribution procedure:

1. Compute the aggregate delta on the headline metric (ROAS / CPA / CTR / etc.).
2. Decompose the delta across the candidate drivers (creatives, audiences,
   placements, campaigns, devices, countries) using each driver's spend share
   and its own metric delta.
3. Identify the **primary cause** as the single driver that accounts for **≥ 60%
   of the absolute delta** in the headline metric, and whose own change is in
   the same direction as the headline.
4. **Honesty limit.** If no single driver clears the 60% bar, or if multiple
   drivers tie within 10 points, or if the data required for decomposition is
   missing (e.g., attribution source down), the insight reports
   **"unattributed"** and lists the top contributors by share without naming a
   cause. Faking a cause is worse than reporting no cause; this is part of the
   trust thesis (`PRODUCT.md`).

### 4.3 Per-insight-type contract

For each type: trigger, data required, causal logic, severity, recommended
action, CTA, destination. The first eight rows align with `02` §1.4 verbatim and
are extended here with the causal-attribution column.

| Insight type | Trigger | Data required | Causal-attribution logic | Honesty limit | Severity | Recommended action | CTA → destination |
|---|---|---|---|---|---|---|---|
| **ROAS dropped** | ROAS ≥ 20% decline, affected spend ≥ threshold. | ROAS now/prior, per-campaign revenue & spend. | Decompose revenue-per-spend delta by campaign; the campaign accounting for ≥ 60% of the revenue loss while holding material spend is the primary cause. | "Unattributed" if no single campaign clears 60%. | Critical / Warning per `02`. | Inspect the named campaign's creatives and audiences. | Campaign → `04`. |
| **CPA spiked** | CPA ≥ 25% rise on steady volume. | CPA now/prior, per-creative spend, CVR. | Decompose CPA delta by creative; the creative whose spend-share × CVR-decline accounts for ≥ 60% is named. | "Unattributed" if creatives are < 3 or spread evenly. | Critical / Warning per `02`. | Review the named creative; pause or refresh. | Ad → `04`. |
| **CTR decline** *(extended)* | Account/campaign CTR ≥ 20% drop over 7d, spend stable/rising. | CTR now/prior, per-ad frequency, CTR. | Decompose impression-weighted CTR by ad; the ad whose frequency-rise × CTR-decline accounts for ≥ 60% is named. | "Unattributed" when frequency is uniform across ads. | Warning (Critical when CPA also breaches). | Refresh the named creative or rotate audiences. | Ad → `04`. |
| **Spend anomaly** *(extended)* | Daily spend ≥ 50% off the 14-day median. | Daily spend series, budget-edit log, active campaign count. | Compare against the budget-edit log: an unmatched edit is a named cause; otherwise decompose by campaign to find the largest unexpected contributor. | "Unattributed" if no budget edit and no single campaign clears 60%. | Critical / Warning per §3.1. | Confirm intent; investigate unintended scale or stop. | Budget & Pacing → `05`. |
| **Revenue decrease** *(extended)* | Attributed revenue ≥ 25% drop, spend stable. | Revenue now/prior, purchases, AOV, attribution-source status. | Decompose revenue delta into purchases × AOV; if AOV stable, decompose purchases by campaign; if AOV moved, name the AOV driver (product mix, source). | "Unattributed" when attribution source is degraded or AOV data missing. | Critical / Warning per §3.1. | Inspect attribution source and the named campaign. | Attribution → `06`. |
| **Budget pacing off** | Projected month-end ≥ 15% over / ≤ 70% under cap. | Spend-to-date, cap, pacing %. | Decompose over/under by campaign vs its planned share; the campaign most off its planned pace is named. | "Unattributed" when no plan exists to compare against. | Critical / Warning per `02`. | Adjust the named campaign's budget or the cap. | Budget & Pacing → `05`. |
| **Creative fatigue** | Frequency ≥ 4 AND CTR −20% AND spend share ≥ 10%. | Ad frequency, CTR trend, spend share. | The ad meeting the trigger *is* the cause; attribution is direct. | None — trigger-defined. | Warning. | Refresh the creative. | Ad → `04`. |
| **Conversion concentration** | One ad carries ≥ 70% of purchases, ≥ 3 active ads. | Per-ad purchases, active ad count. | The carrying ad is named; the risk is single-point-of-failure. | None — direct. | Warning. | Diversify; scale a runner-up. | Ads → `04`. |
| **Spend, no conversions** | Spend ≥ threshold AND purchases = 0 over ≥ 7d. | Spend, purchases, age. | The campaign itself is the cause; attribution is direct. | "Unattributed" if age < 7d (too early). | Critical / Warning per `02`. | Pause or restructure. | Campaign → `04`. |
| **Token expired** | Token expired / auth error. | Token status, last error. | Direct: token expiry is the cause of stale data. | None. | Critical (data trust). | Reconnect. | Account → `03`. |
| **Account restricted** | Meta `account_status` restricted/disabled. | `account_status`. | Direct: restriction is the cause. | Reason-from-Meta is itself often unknown (`02` §4). | Critical. | Resolve on Meta; then reconnect. | Account → `03`; external Meta BM. |

### 4.4 Per-page template — Recommendations

- **Purpose** — the diagnostic layer: the *why* behind the alerts, with a named
  cause and a recommended next step.
- **Primary user** — agency buyers / analysts / account managers.
- **User goal** — read one paragraph per signal that says *what, why, and what
  to do*, then either accept into a task or dismiss.
- **Primary CTA** — **"Accept as task"** (clay) on the top recommendation.
- **Secondary actions** — open the entity drill-down; mark "Not useful"
  (feeds the anti-noise model, §7.4); expand to full decomposition; filter by
  insight type, client, severity, attribution status (attributed /
  unattributed).
- **KPI cards** — none.
- **Charts** — none on the list; the expanded view shows a single small
  decomposition bar (driver share of the delta), nothing larger.
- **Tables** — none. Insights render as **cards**: severity dot+halo · one-line
  headline (template: *"<Metric> moved <X>% over <window>. Primary cause:
  <driver>."*) · supporting-metrics strip · recommended action · CTA cluster.
  An **"unattributed"** card uses the same shape with the headline
  *"<Metric> moved <X>% over <window>. Cause: unattributed."* and lists the top
  contributors without naming one.
- **Filters** — global Date range bounds the analysis window; client switcher;
  insight type; severity; attribution status.
- **Dimensions** — Client, Insight type, Severity, Attribution status.
- **Metrics** — counts only (attributed / unattributed / accepted-as-task-today).
- **Drill-down behavior** — card expand → full decomposition (top-5 drivers by
  share, tabular); CTA → entity in `04` / `05` / `06`; **"Accept as task"** →
  Tasks queue with title, description, and entity pre-filled.
- **Empty state** — "No recommendations right now." Olive-dot positive state.
- **Loading state** — "Reading the book…" in ink-3 (shared copy with `02`
  §1.1).
- **Error state** — if decomposition fails for a type, that type is hidden for
  the session and a single ink-3 line reads *"<Type> temporarily unavailable";
  the rest render.
- **Permission state** — admin/staff/analyst see and accept; read-only sees but
  cannot accept. Client role never sees this page.
- **Mobile/responsive behavior** — single-column card list; one-line headline +
  client + CTA visible; tap to expand. No horizontal scroll.
- **Export behavior** — none on the list; an accepted insight exports with its
  task (§2.5).
- **Related pages** — Alerts feed (this doc), Tasks queue (this doc), Overview
  (`02`), Campaigns (`04`), Analytics (`05`), Attribution (`06`), Marketing
  Plans (`08`), Reports (`07`).
- **Recommended next action** — accept the top attributed recommendation into a
  task; if the top card is "unattributed", open Analytics (`05`) for a manual
  investigation before acting.

---

## 5. Cross-surface wiring

A signal flows in one direction; the links are bidirectional.

```
   data refresh ─> detection (shared module, §1.4)
        │
        ├─> insight  (Recommendations)  ── "Accept as task" ──> task
        │        │
        │        └─ (same signal, summarized) ─> alert (Alerts feed)
        │                                            │
        │                                            └─ "Create task" ─> task
        │
        └─ (operational event: token / sync / restricted) ─> alert only (no insight)
```

- **insight → alert**: a detected analytical signal produces *both* an insight
  card (full decomposition) and a one-line alert (severity + what-happened +
  CTA). The Overview top-3 (`02` §1.4) is the same signal in digest form.
- **alert → task** / **insight → task**: accepting either creates a task with
  `linked_alert_ids` / `linked_insight_id` set; the originating alert is then
  suppressed (§7.2).
- **task → entity**: every task carries `entity_link`; the entity surfaces a
  back-link badge (*"1 open task"*) on its row in `04` / `05` / `06` / `08`.
- **task → report commentary** *(optional)*: when a task is closed as `done`
  with an annotated outcome, an account manager may attach it as a commentary
  line to a Report (`07`) — *"Paused Campaign X (CPA 3× target) on 14 Aug"*.
  Reports own the curation; this is an opt-in line, not auto-injected.
- **plan → task**: a plan-vs-actual variance (`08`) spawns tasks directly,
  skipping the alert layer, because the signal is structural rather than
  anomalous.

---

## 6. Notification channels

Channels and connectors are owned by `10-integrations.md`; per-user preferences
by `12-settings.md`. This doc owns *what* fires *when*.

- **In-app bell** — fires on every new Critical / Warning alert and every task
  event (assignment, @-mention, due-in-24h, status change). Info alerts never
  ring the bell. Badge counts Critical + Warning only.
- **Email** — per-user preference (`12`). Defaults: Critical alerts immediate;
  Warning + task-events batched into a morning digest at 08:00 Asia/Dubai.
- **Slack / Teams** (`10`) — Critical alerts and task @-mentions only, on the
  configured channel. Configurable per client for accounts with dedicated
  channels.
- **Digest cadence** — a single morning digest (08:00 Asia/Dubai) per user
  carrying: top-3 priority items, tasks due today, tasks overdue, count of new
  warnings. A closing digest at 18:00 is opt-in per user.
- **Quiet hours** — per-user window, default 20:00–07:00 Asia/Dubai; Critical
  alerts still send (data-trust never sleeps), everything else queues to the
  next morning digest. Friday/weekend behavior respects the same window.
- **Per-user preferences** — channel per severity, per client, per trigger type;
  managed in `12` and inherited by the bell, email, and Slack paths uniformly.
- **UAE timezone** — all scheduling is `Asia/Dubai`; a user with a different
  timezone in their profile (`11`) gets their digest at 08:00 *their* local
  time, never a fixed UTC slot.

---

## 7. Honesty & anti-noise

Alert fatigue destroys a system like this. The rules below are part of the trust
thesis (`PRODUCT.md`) and are enforced by the detection layer, not by a UI
toggle.

### 7.1 Dedupe

- One signal per entity per window. If ROAS is down on a campaign and on its
  parent account, the account alert is shown and the campaign alert is folded
  into its supporting-metrics strip with a *"+ N campaign-level signals"*
  affordance.
- A re-detected signal within the same window updates the existing row's age and
  supporting metrics; it does not create a second row.

### 7.2 Suppress while a related task is open

- When a task is created from an alert (or accepted from an insight), the
  originating alert is suppressed: it leaves the bell badge, leaves the digest,
  and shows only in the feed under a "suppressed — task open" filter.
- Suppression is keyed on `entity_link` + trigger-type, so a *new* alert type on
  the same entity still surfaces.
- Closing the task as `done` or `skipped` resolves the alert; reopening the task
  re-arms suppression.

### 7.3 Rate-limit per client

- Max **N new Critical/Warning alerts per client per 24h** (default 5; tunable
  in `12`). Beyond the cap, additional signals queue as Info and surface in the
  next digest, not the bell.
- Data-trust events (token expired, account restricted, sync failure) are
  exempt: they always surface regardless of the cap, because untrusted data
  invalidates the cap itself.

### 7.4 "Unattributed", never a fake cause

- The honesty limit (§4.2) is binding: an insight that cannot identify a single
  driver accounting for ≥ 60% of the delta is reported as **"unattributed"**
  with the top contributors listed by share. Naming a weakly-supported cause
  corrodes trust faster than missing the alert.
- An operator "Not useful" mark on an attributed insight is logged with the
  insight type and the named driver; persistent low-value attributions are
  reviewed and the threshold for that type is tightened.

### 7.5 Dismiss-with-reason, never silent drop

- Dismissing an alert requires a one-line reason; the dismissal is audited and
  the alert cannot re-fire for the same entity within 72h. This makes "I
  dismissed this" an operator decision rather than a quiet loss of signal.

---

## 8. Design rules (all three sub-pages)

`DESIGN.md` is binding; restated only where load-bearing.

- **One Accent** — clay only on the primary CTA of each page ("New task", the
  selected alert's recommended action, "Accept as task") and active selection.
  ≤ 10% of any screen.
- **Muted semantics** — severity is dot + 3px halo + word (Critical rust /
  Warning amber / Info neutral ink-3), the muted values only, never neon, in
  both light and dark themes (`DESIGN.md` "Warm-Semantics Rule"). Winner/loser
  tinting does not apply on these pages; overdue cells take a hairline Rust-Tint
  wash on the cell only, never the row.
- **Tabular figures** on every number (counts, ages, supporting metrics),
  right-aligned in any column (`lead-2` / `lead-3` modifiers).
- **Serif** (Source Serif 4) for the page H1 only; Hanken Grotesk for all
  functional UI and every number.
- **Hairline rules** (1px, warm Rule color) separate rows; no card border
  exceeds 1px; no per-row color bars.
- **No emoji or glyph icons**; buttons are text-only; severity uses dot+halo+
  word, never an icon.
- **Motion** — hover lift on cards, focus rings on actions, single chart redraw
  on theme change. No ambient pulsing on the bell or on Critical rows; pulsing
  reads as alarm, this surface reads as instrument.

---

## 9. Data gaps flagged for `16-data-gaps-and-risks.md`

- **Creative fatigue** — Meta exposes no fatigue score; the trigger derives
  frequency + CTR decay + spend concentration (`02` §4). Frequency is per-ad,
  not cleanly additive at account rollup, so account-level fatigue alerts are
  conservative.
- **Spend-cap headroom semantics** — `account_balance` meaning depends on
  billing type (`02` §4); pacing alerts must label the cap honestly.
- **Account restriction reasons** — Meta returns a numeric `account_status`; the
  *why* is often unavailable without the Business Manager UI.
- **Attribution-source dependence** — revenue-decline insights depend on a live
  attribution source per `06`; when the source is degraded, revenue insights
  report "unattributed" rather than risk a false cause.
- **Decomposition data** — CTR/CPA attribution by creative requires per-creative
  insights; if Meta returns partial rows for an account, the affected insight
  types fall back to "unattributed" for that account until the next full sync.
- **Budget-edit log** — the spend-anomaly insight's "matched edit" cause depends
  on Winning Kart's own budget-edit history; edits made directly on Meta
  Business Manager are invisible and yield "unattributed".

---

*End of `09-tasks-alerts-insights.md`. The queue, not the data; each row links
out, each signal has an honest cause or none.*
