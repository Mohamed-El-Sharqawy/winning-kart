# 14 — Consolidated UX Flows

> The single end-to-end journeys document. A designer or PM reads this to walk
> a user through every major feature; screen-level detail (KPI cards, columns,
> filters, charts) lives in the page specs and is **referenced, not duplicated**,
> from here.
>
> Status: DRAFT (crewmate done, pending first-mate review).
>
> Binding dependencies: `01-product-architecture.md` (anchor — nav §3, shell §4,
> filters §4.4, design principles §5, non-duplication §6), `DESIGN.md` (paper-
> and-clay, One Accent, Warm-Semantics, Data-is-Sans, Eyebrow-Only, tabular
> figures, status as dot + 3px halo + word, no emoji, no neon), `PRODUCT.md`
> (UAE / AED / Asia/Dubai, self-hosted posture). Per-page detail in
> `02-overview-executive-dashboard.md` through `12-settings.md`.
>
> Flow format (captain's §22 + D, applied verbatim to every flow): **Feature ·
> User goal · Entry point · Steps · System behavior · Success state · Loading
> state · Empty state · Error state · Permission denied state · Relevant
> notifications · Next action.** Where a flow branches (e.g. success vs error),
> the branch is shown under Error state.

---

## 1. First-run agency setup

- **Feature** — Workspace bootstrap on a fresh Winning Kart instance.
- **User goal** — Move from an empty database to a working agency shell ready to onboard its first client.
- **Entry point** — First navigation to the instance URL with no `clients` rows; the app auto-routes to the bootstrap wizard.
- **Steps**
   1. Create the **Agency Owner** account (email + password; MFA enrollment recommended per `11` §7.2).
   2. Set workspace name, default currency (`AED`), default timezone (`Asia/Dubai`), default date preset (`12` §1).
   3. Upload agency wordmark (optional, SVG-only, must read on paper and surface — no second accent via logo).
   4. Review the fixed RBAC matrix (`11` §2) and confirm the seven roles.
   5. Land on the empty Portfolio Overview with a clay primary **Create client**.
   6. Confirm the node-cron scheduler is armed (token refresh, retention sweep, scheduled reports).
- **System behavior** — The first `admin` row is promoted to `agency_role = owner` non-destructively (`11` §9). Env-bound secrets (`DATABASE_URL`, `ENCRYPTION_KEY`) are read once at boot and are never editable in-app (`12` self-hosted operations).
- **Success state** — Overview loads with the empty-state message "No ad accounts connected yet" (`02` §1.1) plus the clay **Open Clients** CTA.
- **Loading state** — Save-in-flight warm-input style on form fields (`DESIGN.md`); no full-screen spinner.
- **Empty state** — N/A — this flow creates the first records.
- **Error state** — Branch by failure: password rejected by policy → inline rust message, stay on step 1; email already claimed → inline rust, stay on step 1; wordmark upload rejected (size, format, contrast) → stay on step 3 with the validator reason (`07` §6 accent-validator shape).
- **Permission denied state** — None at first run (no roles exist). After bootstrap, repeat access requires Owner or Admin.
- **Relevant notifications** — One confirmation toast on completion; no alert escalation.
- **Next action** — Proceed to Flow 2 (Create a Client).

---

## 2. Create a Client (→ connect accounts → configure goals/KPIs → set budget → dashboard ready)

- **Feature** — The seven-step onboarding wizard that takes a brand-new client from "we have a deal" to a live, monitored workspace.
- **User goal** — Land a new client with at least one ad account connected, goals set, and the dashboard ready — without leaving the workspace.
- **Entry point** — Clients list → **Create client** (`03` §1), or a client workspace's Ad Accounts sub-tab → **Add ad account** when none exist.
- **Steps**
   1. **Create Client** — name, slug, primary contact, currency, industry, assigned AM.
   2. **Connect Accounts** — run the Flow 3 OAuth path per ad account; one client may collect several (`03` §3).
   3. **Configure Goals** — pick the canonical goal (revenue / leads / ROAS target) inside the Marketing Plan sub-tab (`08` §1.1).
   4. **Configure KPIs** — choose the canonical KPI set (spend/ROAS/CPA defaults; ecommerce vs lead-gen variants) (`08` §1.3).
   5. **Set Budget** — monthly cap and pacing basis; feeds Budget & Pacing (`05` §5.2).
   6. **Create Dashboard** — confirm the Client Portal dashboard shape (`11` §3).
   7. **Start Monitoring** — enable scheduled sync (node-cron) and the alert rules (`09`).
- **System behavior** — Steps 1 and 2 are required to land any data; 3–6 may be skipped (workspace Overview flags "Setup incomplete" in amber until done); step 7 ends the wizard and flips the client record active. Slug becomes the route key mirroring `clients.slug` (`schema.ts`).
- **Success state** — Workspace Overview loads with all-olive health and a clay primary **Open dashboard**.
- **Loading state** — Each step shows an in-card paper-2 progress strip, not a full-screen spinner.
- **Empty state** — N/A — this flow creates the records.
- **Error state** — Per-step inline rust-tint message; the wizard stays on the failing step. OAuth-stage failures route through the Flow 3 error catalog; never persists a half-written account.
- **Permission denied state** — Admin only for the full flow. Staff with the "onboarding" capability may run steps 1–6; step 7 stays admin-only. Client role: 403.
- **Relevant notifications** — One toast on completion; no alert escalation on success.
- **Next action** — Open the dashboard, or add another ad account.

---

## 3. Connect a Meta Ad Account (full OAuth + error-state path)

- **Feature** — Connect one Meta ad account to a client with all assets wired and an initial dataset validated (`03` §5).
- **User goal** — A live, trusted ad account whose insights, structure, and token health Winning Kart owns.
- **Entry point** — Client workspace → Ad Accounts sub-tab → **Add ad account** → choose Meta.
- **Steps**
   1. **Connect Meta** — explain what will be shared; **Continue to Meta**.
   2. **OAuth** — Facebook redirect; request scopes (`ads_read`, `ads_management`, `business_management`, `read_insights`, `pages_read_engagement`, `catalogs_read`) (`03` §5.1).
   3. **Select Business** — list Business Managers the token can see.
   4. **Select Ad Account** — list `act_…` accounts in that Business.
   5. **Select assets** — pick the Page and Pixel/Dataset for this account.
   6. **Permissions/scopes review** — confirm granted scopes match the required minimum.
   7. **Initial sync** — staged progress list: account info → campaigns → ad sets → ads → account insights → entity insights → daily series (`03` §5.2).
   8. **Data validation** — sanity checks: 7d spend > 0; pixel receiving events; currency/timezone match Meta.
   9. **Dashboard ready** — encrypt the token AES-256-GCM (`src/lib/crypto.ts`), persist the ad account row, hand off to Overview.
- **System behavior** — The token is written once at step 9 and never re-exposed in the flow. Each sync stage shows its own status dot; failures are per-stage, not whole-flow.
- **Success state** — Olive dot, "Dashboard ready", clay primary **Open dashboard**.
- **Loading state** — Step 7 shows the staged progress list with per-stage status dots (`DESIGN.md` Warm-Semantics).
- **Empty state** — N/A.
- **Error state** — Route through the `03` §6 catalog by cause:
   - **Permission denied** (role not admin, or user lacks this client) → page-level 403 / hidden controls; recover in Team (`11`).
   - **Expired / revoked token** (60-day user token lapsed, or revoked in Meta) → rust dot on Token Status; recover by re-running steps 2–9.
   - **Restricted / banned account** (Meta `account_status` 2/3/7/8) → amber-or-rust dot on Status; the captain resolves in Meta; Winning Kart cannot lift it.
   - **Missing permissions** (OAuth granted fewer scopes than required) → amber badge at step 6; re-OAuth with the missing scope.
   - **API rate limit (429)** → amber dot on Last Refresh + toast; exponential backoff.
   - **API 5xx / Meta outage** → amber dot; wait and retry.
   - **Partial sync** → amber dot on Last Sync + per-stage dots; per-stage retry from Account detail.
   - **Currency / timezone mismatch** → amber badge; edit the stored value to match Meta.
   - **Duplicate account** (same `act_id` already linked) → inline rust on the add form.
- **Permission denied state** — Admin only. Client role: 403 (hidden).
- **Relevant notifications** — One toast; on a partial sync, also raise an amber task in `09` for review.
- **Next action** — Configure Goals/KPIs (Flow 2 steps 3–6) if not yet done.

---

## 4. Refresh / on-demand data pull (+ scheduled refresh path)

- **Feature** — Pull fresh data from a platform on demand, plus the scheduled path that keeps the book current.
- **User goal** — Trust that the numbers on screen reflect what Meta actually reports right now.
- **Entry point** — Any surface with a **Refresh now** affordance: Account-health strip (`02` §1.5), Ad Accounts list (`03` §4), Campaigns (`04` §1), or Integrations → connector detail (`10` §3).
- **Steps**
   1. User clicks **Refresh now** on an ad-account row (or triggers refresh from a report-build preview).
   2. Scheduler enqueues the connector sync job (`10` §1.1).
   3. Adapter runs idempotently on `{ad_account}:{entity}:{date}:{metric_breakdown}` (`10` §0 idempotency).
   4. Detection module re-runs for that account's entities (`09` §1.4), updating alerts and insights.
   5. Surface re-renders against stored data; "Last refreshed hh:mm" chip updates.
- **System behavior** — Scheduled path: node-cron jobs (structure hourly, insights daily, ad-level insights daily) with jittered cron per connector (`10` §4). 429/5xx trigger exponential backoff with a per-connector ceiling; persistent throttle > 15 min escalates an Amber alert.
- **Success state** — Olive dot on Last Refresh; figures update in place; the receiving surface re-renders without a flash to zero.
- **Loading state** — Surface keeps its prior values until the new slice resolves; the refresh chip shows "Refreshing…"; no full-screen spinner.
- **Empty state** — Account with no delivery in window: "No impressions in this filter window" (`05` §2); still a successful sync.
- **Error state** — Branch: token expired / revoked → escalate to Flow 15 (token recovery); API 4xx other → rust badge + error short-text; partial sync → amber dot + per-stage dots, escalate as a task (not an alert); sync failure (3 in a row) → escalate as Critical alert.
- **Permission denied state** — Read-only and Analyst may trigger refresh on in-scope clients; Client role never sees Refresh (portal is read-only by design, `11` §3).
- **Relevant notifications** — None on routine success. On failure, the connector error and the resulting alert are the same event rendered twice (`10` §0); never two sources of truth.
- **Next action** — Trust the data; act on any newly-surfaced alert or insight.

---

## 5. Portfolio morning check (Overview → insight → drill to campaign → ad set → creative → decision)

- **Feature** — The 15-second morning read that tells a buyer where to look first and what to do.
- **User goal** — Know (a) is the book healthy, (b) which account is bleeding, (c) the single most valuable action to take.
- **Entry point** — Agency Overview (the default landing page, `02` §1).
- **Steps**
   1. Read the **KPI strip** (Spend · Revenue · ROAS hero · CPA · Purchases · Account Health) for portfolio-level delta vs compare.
   2. Scan the **Actionable Insights** region (top 3 by `affected_spend × severity × recency`; `02` §1.4).
   3. Click the top insight's CTA (e.g. "Open <Client> campaigns") — the deep link carries full filter state (`01` §4.4).
   4. On the Campaigns list, drill the worst-ROAS high-spend Rust-Tint row (`04` §1) into Campaign detail.
   5. From Campaign detail, drill into the offending ad set, then the offending creative.
   6. At the creative detail page, classify (Winning / Losing / Fatiguing / Stable per `04` §4.4) and act.
- **System behavior** — The Overview's insight engine is shared with the Recommendations feed (`09` §1.4); an Overview digest and an alert never disagree. Filters flow DOWN the entity chain; going back UP restores the parent's last lens verbatim (`04` §0.2).
- **Success state** — Buyer reaches a single creative with a clear decision (refresh / pause / scale) within 3–4 hops.
- **Loading state** — KPIs render as muted tabular-width em-dashes; charts show hairline baselines; insights region shows "Reading the book…" in ink-3 (`02` §1.1).
- **Empty state** — "No ad accounts connected yet" → clay **Open Clients** (`02` §1.1).
- **Error state** — If a single account errors, its contribution is excluded from portfolio totals and it surfaces in the health strip with a rust dot + error short-text; portfolio KPIs carry an "N accounts excluded" note in ink-3.
- **Permission denied state** — Admin/staff/analyst/read-only all see Overview; read-only sees no write affordances (no Refresh, no CTA buttons). Client role is redirected to the Portal Dashboard (`02` §2).
- **Relevant notifications** — Top-bar bell badge counts Critical + Warning; same items appear as the top of the Alerts feed (`09` §3.2).
- **Next action** — Convert the decision into a task (Flow 11) or a write action (`04` §6).

---

## 6. Creative review (gallery → fatigue → create "refresh creative" task)

- **Feature** — The daily creative-intelligence pass: classify winners/losers, surface fatigue, brief the next iteration.
- **User goal** — Decide per creative: scale, refresh, pause, or brief the next iteration.
- **Entry point** — Client workspace → Ads & Creatives gallery (`04` §4.1).
- **Steps**
   1. Read the **Spend-by-creative Pareto** chart to spot concentration risk (`04` §4.1).
   2. Filter by Fatigue flag (precomputed: Fatiguing / Anomaly / Healthy / Scale opportunity) — default to Fatiguing.
   3. Open the worst-fatiguing creative (frequency ≥ 4 AND CTR −20% w/w AND spend share ≥ 10%; `04` §4.5 Rule F1).
   4. On Creative detail, confirm with the CTR-vs-frequency chart (CTR declining while frequency climbs).
   5. Click **Create refresh-creative task** — routes to `09` with the creative context pre-filled.
- **System behavior** — Fatigue classification is a scheduled job writing into the recommendation queue (`09`); the gallery reads the latest classification, it does not recompute inline. Rule F1 is fully computable from API-direct inputs.
- **Success state** — Task appears in the Tasks queue with `source = recommendation`, the creative deep-linked; status dot Olive on submission.
- **Loading state** — Card-grid shimmer preserving thumbnail aspect ratios; KPI em-dashes.
- **Empty state** — "No ads served impressions in this window." CTA: widen the date range or connect an ad account.
- **Error state** — Per-card error ribbon if the creative's data query fails; never a silent blank. F6 (status anomaly: ad rejected / unexpectedly paused) surfaces as its own Rust row with the rejection-reason gap noted (`16`).
- **Permission denied state** — Admin/staff full; Marketer full; Analyst read-only (no Create-task); Client role read-only gallery subset (`11`).
- **Relevant notifications** — Task creation fires the assignee's chosen channels (`09` §6); no bell ring on classification itself, only on accepted tasks.
- **Next action** — Brief the next creative iteration from the creative's sibling comparison (`04` §4.3).

---

## 7. Budget & pacing check + reallocation

- **Feature** — Spot overspend, underspend, and unexpected spikes before they cost money; reallocate before period close.
- **User goal** — Confirm the client's money is being spent at the right rate against the right ceiling, and act before month-end.
- **Entry point** — Client workspace → Budget & Pacing (`05` §5).
- **Steps**
   1. Read the **KPI strip**: Total budget · Actual spend · Target spend · Projected end-of-period · Pacing % · Days remaining.
   2. Read the **Actual vs target spend** chart (clay actual vs neutral-ink even-pace line; per-day delta bars) — the single most important artifact.
   3. Read the **Forecast cone** (median projection ± 1σ of recent daily-spend variance, narrowed by `√remaining_days`).
   4. Sort the pacing ledger by Pacing % desc (over-pacers first) or by Variance desc.
   5. Decide: **Adjust budget** (clay CTA, routes to the campaign/ad-set edit in `04` — the mutation happens at the entity surface, not here), **Reallocate** (proposal mode that surfaces as a task in `09`), or **Edit monthly cap** (local operator config; the only write native to this surface).
- **System behavior** — Target spend is delivery-type aware (daily-budget, lifetime, monthly cap, paused exclusion; `05` §5.3). CBO/Advantage+ campaigns compute pacing at the campaign only; ad-set drill-down shows spend share, not ad-set pacing. Account spend cap is the hard ceiling — once `amount_spent` approaches `spend_cap`, Meta pauses delivery; pacing shows this as a separate *At cap* state.
- **Success state** — Buyer confirms the new pace; the ledger updates with revised projection; if a reallocation task was created, it appears in `09` linked to the affected campaigns.
- **Loading state** — KPI tabular em-dashes; charts hold last value until the new slice resolves (no flicker to zero).
- **Empty state** — "No spend in this period yet." CTA: set a monthly cap, or wait for delivery.
- **Error state** — Per-line: a line whose actual source is unavailable shows a rust dot + "actual unavailable" and is excluded from rollups with an ink-3 note. Pacing alerts (overspend ≥ 15% over cap, underspend ≤ 70%, spike > 3σ, nearing-cap ≥ 95%) escalate into `09` (`05` §5.1).
- **Permission denied state** — Admin/staff edit monthly cap; Marketer reads + routes edits to `04`; Analyst read-only; **Client role: hidden entirely** (`11` §3.2 — pacing internals are operator-only).
- **Relevant notifications** — Overspend is Critical; underspend and spike are Warning; the bell badge counts them per `09` §3.2.
- **Next action** — Reallocate, adjust the cap, or accept the current pace.

---

## 8. Attribution setup (connect Shopify → choose model → compare models → review limitations)

- **Feature** — Close the loop between ad spend and real money, with the model's limits shown first-class.
- **User goal** — Move from platform-reported ROAS to an honest, model-labeled, multi-model attribution the agency can defend.
- **Entry point** — Client workspace → Attribution & Revenue → **Revenue sources** tab → **Connect revenue source** (`06` §5.1).
- **Steps**
   1. Pick source type (**Shopify** MVP, **WooCommerce** V1, CRM/custom/offline later; `06` §1).
   2. OAuth (Shopify) or paste API key/secret (WooCommerce); webhooks registered automatically.
   3. Confirm scopes (`read_orders`, `read_customers`, `read_all_orders` when over Shopify's volume threshold).
   4. Watch the initial ingestion (realtime `orders/paid` webhook + nightly reconciliation; refunds land as negative-value events).
   5. Open the **Attribution models** tab. Inspect the model-comparison table (rows = entities, columns = each model's ROAS/CPA, plus spread).
   6. Sort by spread desc to see where model choice materially changes the story.
   7. Click **Set as default model** on the chosen model.
   8. Open the **Limitations** tab; use **Copy disclosure** to capture the model's biggest limit for client communication.
- **System behavior** — Identity stitch uses the strongest available signal in priority order (deterministic click id + email hash → UTM → Pixel/CAPI → referrer → unmatched). Match-quality tiers (A/B/C/D) are surfaced as a percent-of-revenue indicator, never hidden (`06` §2). Switching the default model re-flows Plan-vs-Actual actuals (`08` §6).
- **Success state** — Default model label propagates everywhere revenue appears (Campaign rows, Overview KPIs, Reports blocks). Match-quality % visible.
- **Loading state** — Source cards show skeleton; sync log shows ledger-row shimmers; model-comparison table resolves block-by-block.
- **Empty state** — No source connected: "Connect a revenue source to close the loop between spend and revenue" (`06` §5.1). ROAS everywhere else falls back to platform attribution with a visible disclosure.
- **Error state** — Branch: webhook HMAC failure / scope revocation / app uninstall → source card status Rust + word ("Webhook failing", "Token expired"); recover via Reconnect. Identity-stitch run incomplete → banner "Attribution run for <date> incomplete — showing previous run". Profit/margin fields without client data → "requires client-provided data" placeholder, never a fabricated zero.
- **Permission denied state** — Admin/staff/analyst configure; Marketer sees outcomes but not ingestion; **Client role: hidden entirely** (`11` §3.2).
- **Relevant notifications** — Disconnects and persistent errors escalate into `09`; the client never sees ingestion events.
- **Next action** — Optionally enable the Profit & margin tab once a margin rule is added (`06` §5.3).

---

## 9. Build + schedule a client report

- **Feature** — Take a buyer from "I need to tell client X about last month" to a saved, scheduled, branded report in one continuous pass.
- **User goal** — Produce a curated letter the client can believe at a glance — not a dashboard dump.
- **Entry point** — Reports list → **Build report**, or Templates → **Use template** (`07` §1.1 / §1.2).
- **Steps**
   1. **Select Client** — one client (default) or a multi-client roll-up.
   2. **Date range** — preset or custom; the report's frozen window.
   3. **Comparison** — none / prior period / prior year.
   4. **Template** — pick a starter (`07` §4) or Blank.
   5. **Sections** — add/remove/reorder blocks from the library (`07` §3); the block outline is the structural spine.
   6. **Metrics** — per block, choose the canonical metric set.
   7. **Charts** — per chart block, choose type within the block's allowed set.
   8. **Commentary** — rich-text block(s) for the buyer's voice — what makes the report a letter, not a dump.
   9. **Preview** — full portal-fidelity render including branding.
   10. **Save** — stores template-config + frozen instance.
   11. **Schedule** — optional; convert to recurring (cadence, timezone Asia/Dubai default, delivery channel, recipients).
- **System behavior** — Each block renders against the same data seams as the workspace (read-only). The frozen instance captures the lens **and** the data at generation time, so the PDF is reproducible. Currency follows `ad_accounts.currency`; timezone defaults Asia/Dubai. White-label composes with the One Accent Rule — the agency's accent replaces the clay family; muted semantics stay warm (`07` §6).
- **Success state** — "Report generated" toast; instance appears in Reports list with an Olive dot; if scheduled, Schedules shows the next run.
- **Loading state** — Block-by-block skeleton in preview; "Generating PDF…" with a progress count on export.
- **Empty state** — Cannot start with zero clients: "Add a client first" → Flow 2. A build with no blocks: "Add a block to see your preview."
- **Error state** — Per-block data error surfaces inline as a rust ribbon without failing the whole build; PDF render failure offers "Download data CSV" fallback.
- **Permission denied state** — Admin/staff full; Analyst read-only (no Save/Schedule); Client role never sees this surface — they consume shared reports in the portal (`11`).
- **Relevant notifications** — On schedule success: silent (the deliverable is the signal). On failure after 3 retries: an alert lands in `09` for the schedule owner; **the client never receives a failure notice** — the report simply does not appear until the next successful run.
- **Next action** — After Save: share to portal or copy the link. After Schedule: confirm the next run and move on.

---

## 10. Author a Marketing Plan + review Plan-vs-Actual

- **Feature** — Set targets, link execution, and hold the plan accountable line-by-line.
- **User goal** — Move from "what are we trying to achieve" to a defensible, variance-tracked plan a client can review.
- **Entry point** — Plans list → **New plan** (`08` §3.1).
- **Steps**
   1. **Create** — modal: name, client (pre-filled if selected), period preset (month / quarter / year / custom), currency, owner. → status `draft`.
   2. **Goals** — add business goals (revenue / leads / purchases / ROAS / CPL / CPA / custom; `08` §1.1). Each goal needs type, target, operator, owner.
   3. **Objectives & KPIs** — pick marketing objective(s); add KPI targets with thresholds (`08` §1.2 / §1.3). Suggestion engine proposes KPI defaults for the chosen objective.
   4. **Budget** — set total, then allocate by channel / month / campaign (`08` §1.4). Sum vs total flagged (not blocked) when off by > 5%.
   5. **Strategy** — fill structured fields (targetAudience, offer, creativeStrategy, funnelStrategy, channelStrategy, testingPlan, executionPlan; `08` §1.5).
   6. **Link execution** — add `PlanLink`s to campaigns/ad sets/creatives, mark primary/supporting/exclude (`08` §1.6). Warns if an objective has zero primary links.
   7. **Set active** — clay primary; status flips `draft → active`; plan begins accumulating actuals from `periodStart`.
   8. **Review (later)** — reopen Plan vs Actual; on `periodEnd`, status prompts `active → completed` and freezes the verdict.
- **System behavior** — Plan-vs-Actual computes an attainment ratio per line so direction (`higher_better` vs `lower_better`) collapses into one number where `> 1` is good; pace-adjusted while in-flight, absolute after close (`08` §2.1). Status thresholds default per KPI type but are editable per line. Every variance cell carries a one-line "why" linking to the driving entity; detection is shared with the Overview engine so a plan variance and an alert never disagree.
- **Success state** — Active plan; Plan-vs-Actual renders with status dots (Olive on-track / Amber at-risk / Rust off-track) per line.
- **Loading state** — Planned columns render first (local); actuals fill with tabular em-dashes then resolve as queries return.
- **Empty state** — New draft shows scaffolded empty sections ("No goals yet — add your first"), each with an inline add control. No dead screens.
- **Error state** — Section-level: a failing section shows a rust dot and retry without blocking the others. A line whose actual source is unavailable shows "actual unavailable" and is excluded from rollups.
- **Permission denied state** — Admin/staff author; Analyst/read-only read; Client role only sees a shared summary if the agency opted in (`08` §5), with internal fields hidden.
- **Relevant notifications** — "Set active" notifies owner + linked assignees; entry appears in `09` as a plan-active signal. Off-track lines can spawn tasks directly (skipping the alert layer — the signal is structural, `09` §5).
- **Next action** — Resolve the worst-status KPI; if all Olive, confirm links are current and share to client.

---

## 11. Insight → Alert → Task → Done

- **Feature** — The DATA → INSIGHT → DECISION → ACTION ladder, end to end, for one signal.
- **User goal** — Convert a detected anomaly into an owned, tracked, completed action without losing signal.
- **Entry point** — A signal surfaces in three coordinated places: Overview top-3 digest (`02` §1.4), Alerts feed (`09` §3), Recommendations (`09` §4). All three are the same signal rendered at different fidelities.
- **Steps**
   1. **Insight** — Recommendations card with the headline ("<Metric> moved <X>% over <window>. Primary cause: <driver>.") plus supporting-metrics strip.
   2. **Decision** — Buyer reviews the recommended action; either **Accept as task** (clay primary), open the entity drill-down, or **Not useful** (feeds the anti-noise model).
   3. **Task** — Acceptance creates a task pre-filled with title, description, entity link, and `source = recommendation`. The originating alert is suppressed while the task is open (`09` §7.2).
   4. **Work** — Assignee opens the entity from the task, makes the change (write actions per `04` §6).
   5. **Done** — Status `todo → in-progress → done` (landed) or `skipped` (with one-line reason that closes the originating alert as "dismissed — acknowledged").
- **System behavior** — The honesty limit binds: an insight that cannot identify a single driver accounting for ≥ 60% of the delta is reported as "unattributed" with top contributors listed — never a fake cause. Dedupe: one signal per entity per window. Suppress-while-task-open is keyed on `entity_link` + trigger-type so a new alert type on the same entity still surfaces.
- **Success state** — Task closed as `done`; originating alert resolved; the change can optionally be attached as a commentary line to a Report ("Paused Campaign X (CPA 3× target) on 14 Aug").
- **Loading state** — "Reading the book…" in ink-3 (shared copy with Overview); cards populate as detection returns per account.
- **Empty state** — "All clear." Olive-dot positive state on Alerts; "No recommendations right now." on Recommendations.
- **Error state** — If decomposition fails for an insight type, that type is hidden for the session with an ink-3 line ("<Type> temporarily unavailable"); the rest render. If detection itself fails for an account, that account's alerts are stale and a single rust row reads "<Account>: detection not run since <ts>" linking to Integrations.
- **Permission denied state** — Admin/staff/analyst see and act; Analyst can read + accept into tasks but not perform the underlying write action; Client role never sees this surface (`11`).
- **Relevant notifications** — In-app bell on new Critical / Warning (badge counts both); email per user pref (Critical immediate, Warning batched); Slack on Critical and task @-mentions. Quiet hours 20:00–07:00 Asia/Dubai; Critical (especially data-trust) still sends.
- **Next action** — Clear the top urgent/overdue task; if it references a Critical alert, open the entity before acting.

---

## 12. Invite a team member + assign role/clients

- **Feature** — Add an agency user at the right role and scope without over-privileging.
- **User goal** — Least-privilege onboarding in under a minute.
- **Entry point** — Team & Permissions → Members → **Invite member** (`11` §4).
- **Steps**
   1. Enter invitee email.
   2. Pick role from the fixed seven (Agency Owner / Admin / Account Manager / Marketer / Analyst / Client Admin / Client Viewer).
   3. For Account Manager / Marketer / Analyst — assign one or more clients (matrix becomes Scoped to that list). For Client Admin — bind a single client. For Client Viewer — same.
   4. Confirm — invite row carries role + assignments; invitee gets a single-use email link.
   5. Invitee sets password (and enrolls MFA if Owner/Admin per `11` §7.2); inviter never sees the password.
- **System behavior** — The finer `agency_role` / `client_role_tier` discriminators load from the database on each request after `verifyToken` succeeds, so a role change takes effect on the next request, not the next login (`11` §7.1). Client-scoping is enforced at the query layer — a Client row an Account Manager is not assigned to returns 404, not 403, to avoid leaking roster existence.
- **Success state** — Invitee appears in Members as "Invited"; on acceptance, status flips Active, last-active updates on first session.
- **Loading state** — Send-in-flight on the invite button; row shimmer on Members.
- **Empty state** — "No members yet." CTA: invite the first admin.
- **Error state** — Email already taken (member or pending invite) → inline rust; SMTP/Slack delivery failure → amber banner, retry; role requires MFA but invitee skips → revert to invite-pending with a note.
- **Permission denied state** — Only Owner/Admin can invite agency-side roles. Client Admins may invite Client Viewers for their **own** client only. Everyone else: 403 on the invite endpoint.
- **Relevant notifications** — Invitee receives the invite email; inviter sees a toast. Each invite, accept, role change, and assignment writes an immutable audit row (`11` §8.1).
- **Next action** — Review any member whose last-active is > 30 days and suspend.

---

## 13. Client portal first login

- **Feature** — The first time a client user sees the portal; what is there and what is missing.
- **User goal** — In under 10 seconds, a client answers "is my money working, and is it getting better or worse."
- **Entry point** — The agency sets up a Client Admin (Flow 12) and shares at least the dashboard; the client clicks the invite link, sets a password, lands on the Client Portal Dashboard (`02` §2).
- **Steps**
   1. Client sets password from the invite email; MFA off by default for client roles.
   2. Lands on the **Portal Dashboard** — six nav items only: Dashboard, Campaigns, Ads & Creatives, Analytics, Reports, Settings (`01` §3.5).
   3. Reads four KPI cards: Spend · Revenue · ROAS (hero, with plain-English sub-line "you earned AED 3.20 for every AED 1 spent") · Purchases.
   4. Reads two charts: Spend vs Revenue (dual line) and ROAS trend with the agency target as a reference rule.
   5. Opens Campaigns (read-only), Ads & Creatives gallery (read-only subset), Analytics (simplified dimensions), Reports (only what the agency shared).
- **System behavior** — Trust copy over jargon. Hidden from the client (`11` §3.2): the Account-health strip; pacing internals and monthly caps; the Actionable Insights engine; CPC/CPM/CTR/impressions (unless the agency's per-client flag enables them); any cost/margin/profit the agency withholds; Alerts & Tasks; Integrations; Team & Permissions; Marketing Plans authoring (shared summary only); all Administration. Internal surfaces return 404, not 403, to avoid confirming existence.
- **Success state** — Client reads the ROAS hero and its trend; if it dropped, opens the latest shared report or contacts the AM.
- **Loading state** — Same muted em-dash KPIs and hairline chart baselines as the agency Overview.
- **Empty state** — "Your dashboard is being prepared. Your agency is connecting your ad accounts; check back shortly, or contact your account manager." A **Contact agency** mailto link.
- **Error state** — "We couldn't load your latest numbers. Your agency has been notified." Retry ghost. The agency is alerted via `09`. **Never expose internal error text, token status, or sync internals.**
- **Permission denied state** — Client role only on this surface. A misconfigured client with no accounts sees the empty state. Agency users never land here.
- **Relevant notifications** — The bell surfaces only the client's own client-relevant alerts; no agency work-queue items.
- **Next action** — Read the latest shared report; comment or acknowledge it (`07` §7).

---

## 14. Export data (table, report, warehouse) + the permission gate

- **Feature** — Get data out of Winning Kart at three granularities, gated so the wrong actor never leaks it.
- **User goal** — Hand a dataset to a buyer's spreadsheet, a curated artifact to a client, or a star schema to the operator's warehouse — without violating RBAC or the cost/margin toggle.
- **Entry point** — Three: (a) any ledger table **Export** control (CSV/XLSX); (b) Report Builder **Save → PDF / CSV/Excel** (`07` §1.3); (c) Settings → API & Webhooks for token-bound programmatic access, or Integrations → Data warehouse export for Postgres/BigQuery/Snowflake (`10` §9.5).
- **Steps**
   1. User opens the Export control on a Campaigns / Ad Sets / Ads / Analytics / Pacing / Attribution row set.
   2. Confirm scope (current filter state, current sort, optional selected-only).
   3. Pick format (CSV default; XLSX where supported; PDF belongs to Reports, not the table).
   4. The export bundle carries a header line with the active filter state, exported-at timestamp, and ad-account currency (`05` §6).
   5. On warehouse export: configure target (Postgres connection string / BigQuery service account / Snowflake RSA keypair), choose cadence (hourly / daily), confirm estimated row volume before enabling (`10` §9.5).
- **System behavior** — Every export appends an audit row with actor, surface, filter state, row count (`11` §8.1). Exports **never** include decrypted tokens (ad-account export) or webhook signing secrets. The cost/margin fields obey the per-client toggle (`06` §5.3): if "Share cost & margin with this client" is off, those fields are stripped from any export the client role can reach.
- **Success state** — File downloads to browser (table/report) or lands in the warehouse `winningkart_*` schema; olive toast; audit row written.
- **Loading state** — For table/report: a generated-in-flight chip; large warehouses show a progress count and per-table status.
- **Empty state** — Export-disabled when the source view has zero rows: "Nothing to export — adjust filters and try again."
- **Error state** — Branch: format render failure (PDF) → offer "Download data CSV" fallback; warehouse auth rejected / schema unreachable → rust dot on the export row, credentials preserved for reconnect; webhook delivery 5xx streak → subscription auto-paused after 10 consecutive failures, Amber alert in `09`.
- **Permission denied state** — Owner/Admin full; Account Manager / Marketer / Analyst scoped to their clients; Client Admin — only if the per-client export toggle is on; Client Viewer — Deny by default (`11` §2). Tokens are bounded by the creating admin's role and the plan tier.
- **Relevant notifications** — Silent on success; the audit log is the durable record. Warehouse auto-pause fires an Amber alert.
- **Next action** — For tables: open the file and proceed with the analysis. For reports: share to portal (Flow 9). For warehouses: query from the operator's BI tool.

---

## 15. Handle a disconnect / token expiry recovery

- **Feature** — Restore trust when a connector goes dark, without losing already-attributed history.
- **User goal** — Get a disconnected or expired connector back to healthy with the smallest possible operator action.
- **Entry point** — Three coordinated: (a) Overview Account-health strip shows a Rust row (`02` §1.5); (b) Alerts feed surfaces a Critical data-trust alert (`09` §3); (c) Integrations → connector detail shows a Rust dot on the row (`10` §3).
- **Steps**
   1. Open any of the three entry points; the CTA deep-links into the same recovery path.
   2. Read the error class on the connector row (Token expired / Account disconnected / Restricted / Webhook failing / Schema drift / Rate-limited > 15 min).
   3. Click **Reconnect** (clay primary when state is `error`/`disconnected`/`expired`).
   4. Branch by cause:
      - **Token expired / revoked** → re-run the Flow 3 OAuth (steps 2–9); the new token is AES-256-GCM encrypted in place; refresh-handler is the same scheduler tick that proactively refreshes within 7 days of expiry (`10` §1.5).
      - **Account disconnected (401 streak)** → re-OAuth; on 3 retries exhausted, escalate as Critical.
      - **Account restricted** (Meta policy hold) → Winning Kart cannot lift it; the captain resolves in Meta Business Manager, then reconnects.
      - **Webhook HMAC failure / scope revocation / app uninstall** → re-OAuth and re-register webhooks.
      - **Schema drift** (custom CRM field renamed) → re-map fields in the connector detail, then Refresh now.
   5. Watch the staged progress list re-run (same shape as Flow 3 step 7).
   6. Confirm olive dot on the row; data-trust alert resolves.
- **System behavior** — Disconnect destroys the credential and the future sync job; **never** already-attributed history (`10` §10). During the disconnect window, attributed revenue **stays**; new events stop. The dot and the alert are the same event rendered twice — never two sources of truth. Data-trust events are pinned above all performance alerts regardless of raw priority score and are exempt from the per-client rate-limit (`09` §7.3).
- **Success state** — Connector row returns to Olive; Last Sync updates; suppressed insights and alerts re-evaluate on the next detection pass.
- **Loading state** — Staged progress list with per-stage status dots; no full-screen spinner.
- **Empty state** — N/A — a disconnect only happens to an existing connector.
- **Error state** — Branch: re-OAuth fails the same way (still revoked at Meta) → stay Rust, escalate as Critical; reconnect succeeds but data validation fails (currency/timezone mismatch) → amber badge, edit the stored value to match; partial sync after reconnect → amber dot + per-stage dots, per-stage retry.
- **Permission denied state** — Admin only for ad-account reconnect. Marketer/Analyst see the alert but cannot reconnect. Client role never sees the alert — the portal surfaces only its own client-relevant alerts, never connector internals.
- **Relevant notifications** — Token-expired and account-restricted alerts fire immediately on Critical (data-trust never sleeps, even in quiet hours; `09` §6). On resolution: silent — the row returning to Olive is the signal.
- **Next action** — Verify the next scheduled sync completes; if Attribution was degraded during the gap, re-run attribution for the affected window.

---

## Assumptions made where the source page spec was ambiguous

1. **First-run bootstrap (Flow 1)** — `12` §1 lists the workspace fields but does not state the **first-run sequence** explicitly. Assumption: the bootstrap wizard runs once on the empty database, seeds the Owner via the `11` §9 promotion script, and lands on the empty Overview. If the captain intends first-run to also force MFA enrollment for the Owner, that gate should be added.
2. **Permission denied state on first run (Flow 1)** — Listed as "None at first run" because no roles exist yet. Assumption: this is correct; if the captain wants a read-only public preview mode pre-bootstrap, that is a separate flow.
3. **Refresh path for Analyst (Flow 4)** — `11` §2 grants Analyst read + ack on Alerts & Tasks and the full read surface; whether the Analyst may trigger **Refresh now** is not explicitly stated. Assumption: yes, because refresh is a read-side action and the spec lists no Refresh write-gate. Flag if the captain intends Refresh to be admin/staff/Marketer-only.
4. **Reallocation write authority (Flow 7)** — `05` §5 says reallocation runs in "proposal mode" and surfaces as a task in `09`. Assumption: any agency user with task-create rights may propose; only Admin/Marketer with `04` §6 write authority execute the budget edit. Flag if the captain wants a tighter gate.
5. **Attribution default-model propagation (Flow 8)** — `06` §5.2 says the default model "becomes the client's reported attribution"; `08` §6 says switching models re-flows plan actuals. Assumption: switching the default also re-flows Overview KPIs, Campaign rows, and any live report blocks — the spec does not say so explicitly, but anything else would create two numbers for the same metric.
6. **Client Portal first-login MFA (Flow 13)** — `11` §7.2 sets MFA "off for client roles by default." Assumption: Client Admins may opt in from Settings; Client Viewers may not be required to. Flag if the captain wants Client Admin MFA mandatory.
7. **Export toggle default for Client Admin (Flow 14)** — `11` §2 lists "Data export — Client Admin: Per-client toggle" and "Client Viewer: Deny by default." Assumption: the toggle defaults **off** for Client Admin too (safer); the spec is silent on the default. Flag if the captain prefers Client Admin export on by default.
8. **Recovery path for schema drift (Flow 15)** — `10` §12 open question #5 asks the captain to confirm a schema-drift detector in V1 of the custom CRM connector; the spec is otherwise silent on the recovery flow. Assumption: the reconnect path includes a field re-mapping step. Flag if V1 ships without it.
9. **Scheduled refresh granularity (Flow 4)** — `10` §4 says "structure hourly, insights daily, ad-level insights daily" without per-entity overrides. Assumption: the cadence is admin-tunable per connector as the spec also states. Flag if the captain wants a single global cadence.

## Flows the captain should walk first

1. **Flow 3 — Connect a Meta Ad Account.** Every error branch in the product routes through this catalog; if the recovery paths feel right, the rest of the trust model holds.
2. **Flow 11 — Insight → Alert → Task → Done.** This is the DATA → INSIGHT → DECISION → ACTION ladder made literal; it is the product's reason for existing beyond a reporting tool.
3. **Flow 9 — Build + schedule a client report.** The report is "the trust artifact that leaves the building"; if the captain cannot read a generated PDF and believe it, the honesty thesis in `06` and `07` is not landing.
4. **Flow 13 — Client portal first login.** The portal is the competitive fact against incumbents; the captain should confirm the hidden list feels trustworthy, not impoverished.
5. **Flow 15 — Handle a disconnect / token expiry recovery.** Data-trust events are pinned above all performance alerts and never sleep; the captain should validate the recovery feels calm, not alarming — the Warm-Semantics Rule is most load-bearing here.

---

*End of `14-ux-flows.md`. Honors `01` (anchor), `DESIGN.md` (paper-and-clay, One Accent,
Warm-Semantics, Data-is-Sans, Eyebrow-Only, tabular figures, status as dot + halo + word,
no emoji, no neon), and `PRODUCT.md` (UAE / AED / Asia/Dubai, self-hosted). Screen-level
detail is owned by `02`–`12`; this doc is the consolidated journey view.*
