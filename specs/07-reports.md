# 07 — Reports

> Agency-global surface for the question anchor §6 assigns to this page alone:
> **"How do I communicate this to the client?"**
> Reports are produced **by the agency** and **delivered to the client portal**;
> the client only ever receives. This surface carries **no live editing of
> underlying campaigns** and **no exploration-pivot controls** (anchor §6
> non-duplication). It is curated output, not a workspace.
>
> Status: DRAFT (crewmate done, pending first-mate review).
>
> Cross-references: `01-product-architecture.md` (anchor §2.2, §3.3 Reports,
> §3.5 Client Portal, §6 non-duplication, §7 platform-agnostic), `DESIGN.md`
> (paper-and-clay, One Accent Rule, Warm-Semantics Rule, Data-is-Sans,
> Eyebrow-Only, tabular figures), `PRODUCT.md` (UAE / AED / Asia/Dubai),
> `02-overview-executive-dashboard.md` (portal dashboard coexists with reports),
> `04-campaigns-adsets-ads.md` (campaign/creative source data),
> `05-analytics-audiences-budget.md` (audience/pacing source data),
> `06-attribution-revenue.md` (attribution/profit source data + honesty rule),
> `08-marketing-plans.md` (Plan-vs-Actual template source),
> `09-tasks-alerts-insights.md` (failure alerts route here),
> `10-integrations.md` (email/delivery connectors),
> `11-team-permissions-client-portal.md` (RBAC + portal scope),
> `12-settings.md` (white-label also surfaces in Settings),
> `13-data-model.md` (schema delta — none of this exists today),
> `16-data-gaps-and-risks.md` (block-data reliability).

---

## 0. Scope, thesis, and binding rules

Winning Kart's report is the **trust artifact** — a paper-ledger premium document
that beats incumbents' generic dashboards. Where competitors ship saturated
slide decks or live dashboards a client must interpret, Winning Kart ships a
**curated, branded, frozen snapshot** with the same restraint as the workspace:
serif titles, tabular figures, hairline rules, clay used like ink. The report is
what a client prints, forwards to their CFO, and believes.

**Binding rules, inherited from the anchor:**

- **Reports is agency-global** (anchor §3.3). The client switcher filters; never
  required. One report may span a single client (the norm) or roll up multiple.
- **Produced by, delivered to.** Agency users build, schedule, brand, and send.
  Client users consume read-only in the Client Portal (anchor §3.5).
- **No live campaign editing, no exploration pivots** (anchor §6). A report
  embeds curated lenses; the consumer cannot pivot dimensions, swap attribution
  model, or edit a budget from inside the report.
- **Honesty inherits from `06`.** Any attributed revenue in a report carries its
  model label and the active model's limitations; the Attribution summary block
  surfaces match quality. A report never quotes a ROAS without its model.
- **DESIGN.md is absolute.** The report is the place restraint matters most: it
  leaves the building. No emoji, no neon, no display face on data, one accent.

### Schema delta vs today

`src/db/schema.ts` has **no** reports tables. This spec requires new ones —
`report_templates`, `reports` (generated instances), `report_blocks` (block
instances + order + config), `report_schedules`, `report_deliveries`,
`white_label_config` — defined in `13-data-model.md`, flagged in
`16-data-gaps-and-risks.md`.

---

## 1. Reports surfaces (five sub-pages)

Sub-pages: **Reports list · Templates · Builder · Schedules · White-label.**
All agency-side; all admin/staff (analyst read-only on Builder/Templates;
White-label admin-only).

### 1.1 Reports list

- **Purpose** — the agency's index of generated and scheduled reports.
- **Primary user** — agency account manager (find/re-send); lead (oversight).
- **Goal** — find a report in seconds, know its status, re-share or open it.
- **Primary CTA** — "Build report" (clay) → Builder.
- **Secondary actions** — open preview; re-send to portal/email; duplicate;
  archive; filter by client/template/status/cadence.
- **KPI cards** — Reports this period · Scheduled (active count) · Delivered ·
  Failed (with rust dot).
- **Charts** — one: deliveries over time (stacked bar, by channel).
- **Tables** — the list itself: name, client, template, period covered, status
  dot (generated/scheduled/failed), generated-at, delivery channel, format.
  Winner/loser semantics do not apply here; rows are status-led.
- **Filters** — client; template; cadence (one-off/daily/weekly/monthly);
  status; format; date generated.
- **Dimensions** — client; template; cadence; channel.
- **Metrics** — count, delivery success %, avg generation time.
- **Drill-down** — row → report preview (portal-style renderer) → Builder (edit
  the source template/config, never the frozen instance).
- **Empty** — "No reports yet." Helper: "Build your first report or start from a
  template." CTA → Builder / Templates.
- **Loading** — list-row shimmers, KPI tabular em-dashes.
- **Error** — row with rust dot + short-text; "Re-send" ghost. Whole-list fail:
  "Couldn't load reports" + Retry.
- **Permission** — admin/staff/analyst; analyst cannot send or schedule (no
  write CTA). Client role never sees this page.
- **Mobile/responsive** — table horizontal-scrolls (DESIGN.md: no column hiding);
  KPI cards 2-up.
- **Export** — list CSV (admin).
- **Related pages** — Builder (§1.3), Schedules (§1.4), `02` portal, `11` RBAC.
- **Next action** — open the latest generated report or re-send a failed one.

### 1.2 Templates

- **Purpose** — reusable, opinionated starting points so a report is consistent
  across months and across buyers.
- **Primary user** — agency account manager / lead (author); buyers (consume).
- **Goal** — pick a starter, know its audience and cadence, fork into a build.
- **Primary CTA** — "Use template" (clay) → Builder pre-filled.
- **Secondary actions** — preview template; duplicate; edit; archive; mark as
  agency-default for a cadence.
- **KPI cards** — none meaningful (a library, not a metric surface); show a
  single "Templates: N" count strip instead.
- **Charts** — none.
- **Tables** — template grid/list: name, audience tag (client/internal),
  cadence, blocks count, last-used, default-for.
- **Filters** — audience; cadence; block count.
- **Dimensions** — audience; cadence.
- **Metrics** — usage count (reports built from it).
- **Drill-down** — template → block outline preview → Builder.
- **Empty** — starter library ships pre-populated (§4), so never truly empty; if
  all archived: "No templates. Restore a starter or build one from scratch."
- **Loading** — card shimmer.
- **Error** — "Couldn't load templates" + Retry.
- **Permission** — admin/staff author; analyst read-only; client hidden.
- **Mobile/responsive** — grid 3-up → 2-up → 1-up; cards stack.
- **Export** — none (templates are internal artifacts).
- **Related pages** — Builder (§1.3), §4 starter set.
- **Next action** — "Use template" to start a build.

### 1.3 Builder

- **Purpose** — the authoring surface where a report is assembled, previewed,
  and saved or scheduled. Full flow in §2.
- **Primary user** — agency account manager (author).
- **Goal** — produce a report that reads like a curated letter, not a dump.
- **Primary CTA** — "Generate & preview" (clay); from preview, "Save" or
  "Schedule".
- **Secondary actions** — add/remove/reorder blocks; edit block lens; insert
  commentary; swap template; duplicate block; undo/redo.
- **KPI cards** — none in the editor chrome; the preview itself renders block
  KPIs (§3).
- **Charts** — none in chrome; preview renders block charts.
- **Tables** — the **block outline** (left rail): ordered list of block
  instances with drag handles, type, and a visibility toggle.
- **Filters** — none global (the lens is per-block; the builder is not an
  exploration surface — anchor §6).
- **Dimensions** — none surfaced globally.
- **Metrics** — none global.
- **Drill-down** — block → its config panel → live preview of that block.
- **Empty** — "Add your first block" with a clay "Add block" CTA and a row of
  starter-template suggestions.
- **Loading** — preview region shows block-by-block skeleton render.
- **Error** — per-block error ribbon if a block's data query fails ("Campaign
  table: no data for this lens — adjust date range"); never a silent blank.
- **Permission** — admin/staff edit; analyst read-only (no Generate/Schedule);
  client hidden.
- **Mobile/responsive** — two-pane (outline + preview) stacks to single column
  with a jump-to-block drawer under 980px.
- **Export** — from preview: PDF (primary), CSV/Excel (data blocks only).
- **Related pages** — Templates (§1.2), Schedules (§1.4), §2 flow, §3 blocks.
- **Next action** — Generate & preview, then Save or Schedule.

### 1.4 Schedules

- **Purpose** — recurring generation + delivery definitions, their health, and
  their next run.
- **Primary user** — agency account manager / lead.
- **Goal** — trust that the right report lands on the right client at the right
  cadence without manual work.
- **Primary CTA** — "New schedule" (clay) → Builder in schedule mode.
- **Secondary actions** — pause/resume; run now; edit cadence/window; change
  delivery target; view run history.
- **KPI cards** — Active schedules · Next run (soonest) · Success rate (30d) ·
  Failed last run.
- **Charts** — one: run outcomes over 30d (olive success / rust fail bars).
- **Tables** — schedule list: name, client, template, cadence, timezone, next
  run, last outcome dot, delivery channel, format.
- **Filters** — client; cadence; status (active/paused/failed); channel.
- **Dimensions** — client; cadence; channel.
- **Metrics** — success %, median generation time, retry count.
- **Drill-down** — row → run history → generated instance in Reports list.
- **Empty** — "No scheduled reports." Helper: "Schedule a recurring report so it
  lands in the client portal automatically."
- **Loading** — row shimmer; KPI em-dashes.
- **Error** — rust dot on the failing schedule + short-text ("PDF render
  failed", "delivery bounced"); "Run now" to retry on demand.
- **Permission** — admin/staff manage; analyst read-only; client hidden.
- **Mobile/responsive** — table scrolls; KPI 2-up.
- **Export** — schedules CSV (admin).
- **Related pages** — Reports list (§1.1), Builder (§1.3), §5 delivery.
- **Next action** — fix any failed schedule, then trust the cadence.

### 1.5 White-label

- **Purpose** — the brand the client sees on every report and portal page:
  wordmark, accent (within theme), sender name, domain. Co-owned with Settings
  (`12-settings.md` White-label tab).
- **Primary user** — agency admin only.
- **Goal** — make reports read as the agency's (or a sub-brand's) document
  without breaking the paper-and-clay world.
- **Primary CTA** — "Save branding" (clay).
- **Secondary actions** — upload wordmark SVG; set brand accent (validated, §6);
  set client-facing sender name; set sender email; configure custom domain
  (CNAME); preview on a sample report; reset to Winning Kart defaults.
- **KPI cards** — none (configuration surface).
- **Charts** — none.
- **Tables** — domain health table: host, CNAME target, verification status dot,
  certificate status, last-checked.
- **Filters** — none.
- **Dimensions** — none.
- **Metrics** — none.
- **Drill-down** — domain row → DNS instructions + retry verify.
- **Empty** — Winning Kart defaults shown as the starting state; "Customize to
  make reports yours" helper.
- **Loading** — sample-report preview skeleton; DNS verify spinner.
- **Error** — DNS verification fail: rust dot + the expected vs found record.
  Accent validation fail: "This color can't be used as the accent — see rule"
  with the §6 constraint quoted.
- **Permission** — admin only. Staff/analyst/client hidden.
- **Mobile/responsive** — form stacks; sample preview scales.
- **Export** — none.
- **Related pages** — `12-settings.md` (mirror tab), `11-…client-portal.md`
  (portal brand surfaces), §6 composition.
- **Next action** — upload wordmark, verify domain, generate a sample.

---

## 2. Report builder UX (full flow)

- **Goal** — take a buyer from "I need to tell client X about last month" to a
  saved, scheduled, branded report in one continuous, opinionated pass.
- **Entry** — Reports list → "Build report", or Templates → "Use template"
  (pre-fills steps 3–6).
- **Steps (numbered, in order):**
  1. **Select Client** — one client (default) or a multi-client roll-up.
  2. **Date range** — preset or custom; the report's frozen window.
  3. **Comparison** — none / prior period / prior year. Carries into every block
     that supports deltas.
  4. **Template** — pick a starter (§4) or "Blank". Skippable if entered from a
     template.
  5. **Sections** — add/remove/reorder blocks from the library (§3). The block
     outline is the structural spine.
  6. **Metrics** — per block, choose the canonical metric set (e.g., Campaign
     table: spend/revenue/ROAS/CPA/purchases default; CTR/CPC/CPM optional).
  7. **Charts** — per chart block, choose type within the block's allowed set
     (Performance chart: line default, bar optional).
  8. **Commentary** — rich-text block(s) for the buyer's voice: the "why", the
     decision, the ask. This is what makes the report a letter, not a dump.
  9. **Preview** — full portal-fidelity render; buyer sees exactly what the
     client will see, including branding.
  10. **Save** — stores the report as a template-config + frozen instance.
  11. **Schedule** — optional; convert to a recurring schedule (cadence,
      timezone, delivery channel, recipients).
- **System behavior** — each block renders against the same data seams as the
  workspace (Campaigns/Analytics/Attribution/Plans) **read-only**; no write
  back. The frozen instance captures the lens **and** the data at generation
  time, so the PDF is reproducible. Currency follows `ad_accounts.currency`
  (default AED); timezone defaults Asia/Dubai (`PRODUCT.md`).
- **Success** — "Report generated" toast; instance appears in Reports list with
  an olive dot; if scheduled, Schedules shows the next run.
- **Loading** — block-by-block skeleton in preview; "Generating PDF…" with a
  progress count on export.
- **Empty** — cannot start with zero clients: "Add a client first" → `03`. A
  build with no blocks: "Add a block to see your preview."
- **Error** — per-block data error surfaces inline (rust ribbon) without failing
  the whole build; PDF render failure offers "Download data CSV" fallback.
- **Permission** — admin/staff full; analyst read-only (cannot Save/Schedule).
- **Notifications** — on schedule success: silent (the deliverable is the
  signal). On failure: an alert in Alerts & Tasks (`09`) assigned to the
  schedule owner; **never** a failure email to the client.
- **Next action** — after Save: share to portal or copy the link. After
  Schedule: confirm the next run and move on.

---

## 3. Report blocks library

Every block shares a contract: **purpose · data · metrics · dimensions · chart
type · interaction · constraints**. **Interaction** is one of:

- **snapshot** — frozen at generation time; identical in PDF and portal.
- **live** — portal-only; re-renders against current portal data; always labeled
  "Live" with a freshness timestamp. PDF always uses the snapshot render.

Blocks:

### 3.1 Cover / branding page
- **Purpose** — the first impression: wordmark, report title, client name,
  period, agency sender. The trust artifact's cover.
- **Data** — template metadata + white-label config.
- **Metrics / Dimensions** — none.
- **Chart type** — none (typographic).
- **Interaction** — snapshot.
- **Constraints** — serif title only (Data-is-Sans); wordmark is the sole SVG;
  no full-bleed color wash (≤10% clay, One Accent).

### 3.2 Executive summary
- **Purpose** — one paragraph + the hero number, in plain English. The page a
  CFO reads.
- **Data** — derived from the report's KPI block + buyer commentary.
- **Metrics** — ROAS hero (olive/rust by value), spend, revenue, delta vs
  compare.
- **Dimensions** — none (roll-up).
- **Chart type** — none; optional 30-day ROAS sparkline (thin, ink-3).
- **Interaction** — snapshot; sparkline live-in-portal (opt-in).
- **Constraints** — ROAS hero in serif per DESIGN.md; copy is the buyer's
  authored voice, not auto-generated filler.

### 3.3 KPI block
- **Purpose** — the canonical metric set as uniform tabular tickets.
- **Data** — same seams as `02` KPIs.
- **Metrics** — spend, revenue, ROAS, CPA, purchases default; AOV/conversion
  rate optional; **profit/margin/LTV opt-in and only if `06` source exists**.
- **Dimensions** — none (cards); optional "by client" if multi-client roll-up.
- **Chart type** — none (cards).
- **Interaction** — snapshot; live opt-in.
- **Constraints** — no per-card color bars (DESIGN.md); each metric carries its
  attribution-model label when revenue-based.

### 3.4 Performance chart (spend / revenue / ROAS over time)
- **Purpose** — the headline trend.
- **Data** — daily series from insights + attribution.
- **Metrics** — spend, revenue (attributed, labeled by model), ROAS.
- **Dimensions** — time; optional campaign overlay (top N).
- **Chart type** — dual-axis line (spend/revenue) + ROAS line; bars optional.
- **Interaction** — snapshot in PDF; live + hover tooltips in portal.
- **Constraints** — clay reserved to the ROAS line (the hero); spend/revenue in
  ink-3/olive; tabular axis figures; no ambient motion.

### 3.5 Campaign table
- **Purpose** — which campaigns drove the result.
- **Data** — Campaigns surface (`04`) read-only.
- **Metrics** — spend, revenue, ROAS, CPA, purchases, CTR/CPC/CPM (optional).
- **Dimensions** — campaign; optional status/objective columns.
- **Chart type** — none (table; ledger style with winner/loser tints).
- **Interaction** — snapshot; portal rows are drillable to read-only campaign
  detail (the report does not edit — anchor §6).
- **Constraints** — top-N by spend (default 10, configurable); right-aligned
  numerics; no per-row edit affordance.

### 3.6 Creative gallery
- **Purpose** — show the creatives that moved the number.
- **Data** — Ads & Creatives (`04`).
- **Metrics** — per-creative spend, ROAS, frequency, CTR.
- **Dimensions** — creative; format; objective.
- **Chart type** — thumbnail grid (the one sanctioned image surface).
- **Interaction** — snapshot; portal thumbnails open a read-only creative
  detail.
- **Constraints** — winner/loser tint via hairline halo, never neon; thumbnails
  render as authored by the platform (not re-colored).

### 3.7 Budget pacing
- **Purpose** — are we spending the budget correctly, against the month.
- **Data** — Budget & Pacing (`05`).
- **Metrics** — spend-to-date, monthly cap, pacing %, projected month-end.
- **Dimensions** — campaign / ad set (optional).
- **Chart type** — pacing bar with a target rule.
- **Interaction** — snapshot.
- **Constraints** — **portal default: hidden** unless the agency explicitly
  shares (margin/pacing is operator-sensitive, `06` §5.3, `11`).

### 3.8 Audience analysis
- **Purpose** — which audiences drove the result.
- **Data** — Audiences (`05`).
- **Metrics** — ROAS/CPA by audience, reach, frequency.
- **Dimensions** — audience; placement; country.
- **Chart type** — horizontal bars (top audiences by spend, tinted by ROAS).
- **Interaction** — snapshot.
- **Constraints** — CRM-sourced audience matches labeled with match-quality tier
  (`06` §2); no fabricated precision.

### 3.9 Attribution summary
- **Purpose** — the honesty block: which model, what window, what match quality.
- **Data** — Attribution & Revenue (`06`).
- **Metrics** — active model, ROAS under it, spread across models, match-quality
  % (A+B vs C+D).
- **Dimensions** — model.
- **Chart type** — ROAS-by-model small bar; match-quality donut (olive/rust
  muted only).
- **Interaction** — snapshot.
- **Constraints** — **mandatory one-line disclosure** of the active model's
  biggest limitation (from `06` §3 / Limitations tab). This is the differentiator
  vs black-box incumbents.

### 3.10 Recommendations
- **Purpose** — what the agency advises, curated from `09` recommendations.
- **Data** — Tasks/Alerts/Insights (`09`), filtered to accepted/published.
- **Metrics / Dimensions** — none (prose + linked entities).
- **Chart type** — none.
- **Interaction** — snapshot.
- **Constraints** — only recommendations the agency has accepted/edited; never
  raw auto-alerts; ranking by business impact, not chronology.

### 3.11 Next steps
- **Purpose** — the ask: budget change, creative refresh, launch window.
- **Data** — buyer-authored.
- **Metrics / Dimensions / Chart** — none.
- **Interaction** — snapshot.
- **Constraints** — text-only, buyer's voice; this closes the report as a letter.

### 3.12 Commentary / rich-text
- **Purpose** — the buyer's authored voice anywhere in the report.
- **Data** — buyer-authored.
- **Chart type** — none.
- **Interaction** — snapshot.
- **Constraints** — Hanken Grotesk body, serif for any sub-heading; no embedded
  images (keeps the PDF reproducible and on-theme).

**Snapshot vs live summary:** Cover, Executive summary, Campaign table,
Creative gallery, Budget pacing, Audience analysis, Attribution summary,
Recommendations, Next steps, Commentary are **snapshot** by default. KPI block
and Performance chart offer an opt-in **live** portal render. The PDF is always
100% snapshot — it is the frozen trust artifact.

---

## 4. Templates (starter library)

| Template | Audience | Default sections | Cadence |
|---|---|---|---|
| **Executive monthly** | client (CFO/owner) | Cover, Executive summary, KPI, Performance chart, Campaign table (top 10), Attribution summary, Recommendations, Next steps, Commentary | monthly |
| **Performance weekly** | client (day-to-day contact) | Cover, KPI, Performance chart, Campaign table (top 5), Budget pacing (opt-in), Next steps | weekly |
| **Creative review** | client + internal creative | Cover, Creative gallery, Campaign table (creative-grouped), Attribution summary, Recommendations (refresh), Commentary | monthly or per-launch |
| **Campaign launch recap** | client | Cover, Executive summary, Performance chart (since launch), Campaign table, Audience analysis, Creative gallery, Next steps | one-off (post-launch) |
| **Plan-vs-Actual** | client + internal | Cover, Plan summary (from `08`), KPI vs target, Performance chart vs plan, Campaign table, Attribution summary, Next steps | monthly |

Each template ships with sane defaults; the buyer overrides per-build.

---

## 5. Scheduling & delivery

- **Cadences** — daily, weekly (day-of-week), monthly (day-of-month), one-off.
  Weekly/monthly carry a "send on" day and a "cover the prior period" window.
- **Timezone** — schedule timezone defaults **Asia/Dubai** (`PRODUCT.md`); per-
  schedule override available (e.g., a client on GMT). Generation runs in the
  schedule's tz; the PDF footer prints both schedule tz and the data's source
  ad-account tz (`ad_accounts.timezone`).
- **Currency** — report currency = primary ad-account currency (default AED);
  multi-currency roll-ups normalize to the workspace default with a footnote,
  same rule as `02` §1.3.
- **Delivery channels:**
  - **Client Portal** (primary) — publishes to the client's Reports tab
    (`01` §3.5); appears as a new card; the agency sees a "delivered" status.
  - **Email** — branded sender name/address from White-label (§6); PDF attached
    plus a portal deep-link; plain-text fallback. Routes through a
    communication connector in `10-integrations.md`.
  - **Export formats** — **PDF primary** (the trust artifact). **CSV/Excel** for
    data blocks (Campaign table, KPI, Audience analysis). **PowerPoint** is
    **V1+/enterprise** (gated by white-label tier) — the slide master inherits
    the paper-and-clay world; no neon template variants.
- **Failure / retry** — generation or delivery failure retries **3×** with
  exponential backoff. After exhaustion: an alert lands in Alerts & Tasks (`09`)
  for the schedule owner; **the client never receives a failure notice** — the
  report simply does not appear until the next successful run. A "Run now"
  affordance lets the buyer force a retry.
- **Freshness guarantee** — a scheduled report's data is frozen at generation
  time and stamped on the cover; a re-run supersedes the prior instance in the
  portal (with the prior retained for history per retention policy, `12`).

---

## 6. White-label / branding — composition with the One Accent Rule

**The rule (binding):** White-label **composes with** the paper-and-clay world;
it never overrides it to neon. There is exactly one accent slot in DESIGN.md,
and white-label may **recolor that one slot**, never add a second.

**Composition mechanics:**

- **The brand accent replaces the clay family — it does not add to it.** The
  agency supplies one color; it is mapped onto the `clay` / `clay-strong` /
  `clay-hover` / `clay-ink` / `clay-tint` / `clay-tint-2` tokens. The One Accent
  Rule is preserved because there is still exactly one non-neutral, non-semantic
  hue.
- **The muted semantics (olive / rust / amber) are never recolorable.** They
  belong to the warm world, not the brand. A brand that ships "red for negative"
  overrides is forbidden — that breaks the Warm-Semantics Rule.
- **Tints auto-derive.** The agency picks one accent; the tint/tint-2 variants
  are computed by mixing the accent with `paper` at fixed ratios (85% / 70%).
  Hand-picked secondary tints are not allowed — they drift toward neon.
- **Accent validator (rejects neon):** the supplied color is converted to OKLCH
  and must pass:
  1. **Chroma gate** — `C ≤ 0.13` (clay itself is ~0.11). Anything brighter is
     clamped or rejected with a one-line reason.
  2. **Hue gate** — warm hues (0–60°, 320–360°) pass directly. Cool hues
     (blue/green/purple) pass only in a desaturated "muted ink" mode
     (`C ≤ 0.06`), else rejected. No pure cyan/magenta.
  3. **AA gate** — the `clay-strong`-equivalent must hit ≥ 4.5:1 against white
     (white-on-accent for primary buttons). If not, the accent is auto-darkened
     to the passing value, with a preview note.
- **Modes:**
  - **Clay-preserving (default).** Winning Kart's clay stays; only the wordmark,
    sender name, and domain are customized. Recommended for most agencies.
  - **Brand-accent (enterprise).** Agency supplies one validated accent that
    replaces the clay family; wordmark swaps; semantics stay muted-warm.
- **Wordmark / sender / domain** — wordmark upload is SVG-only (the sole
  authored SVG per DESIGN.md); sender name + email are client-facing; custom
  domain via CNAME with DNS verification (§1.5). Portal pages and reports both
  inherit the resolved brand.

The net effect: an agency can make the report *theirs*, but no agency can ship a
neon report. The world stays paper-and-clay; only the ink changes.

---

## 7. Client portal report consumption

The client's Reports tab (`01` §3.5) is the receiving end. A client user lands
there and sees the reports the agency has shared with them, newest first.

- **Opening / viewing** — a report opens in a portal-fidelity renderer that
  matches the PDF page-for-page. The client sees cover, blocks, and commentary
  exactly as authored. Multi-page reports paginate with a hairline index.
- **Export** — the client may download the **PDF** (the frozen artifact) and, if
  the agency enabled it per-template, a **CSV/Excel** of data blocks. PowerPoint
  download is agency-side only.
- **What is hidden from the client** (anchored to `11` and `06` §5.3):
  - Internal-only template variants (audience = internal).
  - Cost/margin/profit blocks the agency withheld (default off).
  - Budget pacing block unless explicitly shared.
  - The builder, schedules, white-label, run history, failure states — all
    agency-only.
  - Any block the agency toggled off in this specific build.
- **Comment / acknowledge** — two deliberate, calm affordances:
  - **Acknowledge** — a single text-only "Acknowledge" action that signals back
    to the agency the report was seen. Surfaces as a read receipt on the
    Reports list row (olive dot, no fanfare).
  - **Comment** — a per-block comment thread (read-mostly; client posts, agency
    responds). Comments are plain text, no @mentions, no rich media — the portal
    is trust-focused, not a chat app (`01` §3.5). New comments from a client
    create a low-priority task in Alerts & Tasks (`09`) for the account manager.
- **Mobile/responsive** — the renderer reflows blocks to a single column under
  980px; tables horizontal-scroll; the PDF download is the print-ideal form.

---

## 8. Data gaps flagged for `16-data-gaps-and-risks.md`

Blocks whose data depends on a `16` risk (tiers per `06` §0):

- **Attribution summary** — depends on `06` §6: platform-attribution bias
  ([not-reliably-available] post iOS-ATT), CRM ad-level match
  ([not-reliably-available]), offline-conversion match
  ([not-reliably-available]). The mandatory disclosure line is what makes the
  block honest.
- **KPI block** (profit/margin/LTV variants) — [client-provided] /
  [not-reliably-available]; renders "requires client-provided data" placeholder
  rather than a fabricated zero (`06` §5.3).
- **Audience analysis** — CRM/lead-source matches resolve to campaign group, not
  ad ([not-reliably-available]); block labels match-quality tier.
- **Performance chart** (revenue line) — platform-attributed revenue overstates
  true marketing ROAS ([not-reliably-available] bias); labeled by model.
- **Recommendations** — if derived from creative-fatigue signals, inherits the
  fatigue-derivation gap (`02` §4: frequency + CTR decay + spend concentration,
  no platform fatigue score).

The PDF's frozen nature isolates the client from live-data gaps (a snapshot is
honest about what it was), but **live** KPI/Performance portal renders must show
the same match-quality and model labels as the workspace — never a clean number
without its confidence band.

---

*End of `07-reports.md`. The report is the trust artifact: curated by the
agency, branded within the one-accent world, and delivered to a portal the
client can believe at a glance.*
