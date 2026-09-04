# 03 — Clients & Ad Accounts (client-scoped)

> Status: DRAFT (crewmate done, pending first-mate review).
> Scope: the **Clients** surface and the **Ad Accounts** surface, where Ad Accounts
> is a sub-page *inside* the selected client — not a top-level nav item.
> Cross-references: `01-product-architecture.md` (binding anchor, §3.3 Clients &
> Ad Accounts, §6 non-duplication), `PRODUCT.md` (admin-only back office),
> `DESIGN.md` (paper-and-clay, status as dot+halo+word), `09-tasks-alerts-insights.md`
> (alert escalation), `10-integrations.md` (cross-connector health), `13-data-model.md`,
> `16-data-gaps-and-risks.md`. Source: `src/db/schema.ts`, `src/lib/meta-api.ts`,
> `src/lib/crypto.ts`, `src/app/admin/page.tsx`, `src/app/api/import-accounts/route.ts`.

---

## 0. Scope and the two questions answered

Per the anchor's non-duplication table (`01-product-architecture.md` §6):

- **Clients** answers *"Who do we serve and how do I reach them?"* — the roster
  and the gateway into any client's workspace. One roll-up KPI row per client at
  most; **no campaign/ad performance tables here**.
- **Ad Accounts** answers *"Are the connections healthy and correctly wired?"* —
  onboarding, token health, refresh status, currency/timezone correctness. **No
  creative analysis, no attribution, no performance drill-down.**

Both surfaces are **admin-only** per `PRODUCT.md` ("Back-office workflow
(admin only)"). Client-role users never see either surface; they reach their
data through the Client Portal nav (`01` §3.5).

---

## 1. Clients list

| Field | Value |
|---|---|
| **Purpose** | The agency's roster: who we serve, how to reach them, and a one-line pulse per client. |
| **Primary user** | Agency admin (manage); all agency users (enter a workspace). |
| **Goal** | Find a client fast, judge its standing in one glance, and enter its workspace. |
| **Primary CTA** | **Create client** (clay primary button, top-right). |
| **Secondary actions** | Search (name/slug/email/ad-account id); filter; sort; bulk archive/export; **enter workspace** (row click). |
| **KPI cards** | None. The list itself is the data; the workspace Overview carries the KPI row. |
| **Charts** | None. A chart here duplicates Overview (`02`). |
| **Tables** | One ledger table — see column set below. |
| **Filters** | Status (active/paused/archived), industry, assigned account manager, platform, account-health. |
| **Dimensions** | None — Clients is the dimension. |
| **Metrics** | Monthly spend rollup, ROAS rollup, linked-account count — only these three, as rollups. |
| **Drill-down** | Row → Client workspace (§2). |
| **Empty** | "No clients yet. Create your first client to start onboarding ad accounts." + clay primary **Create client**. |
| **Loading** | Skeleton ledger rows (paper-2 placeholder strips), no spinner. |
| **Error** | Inline rust-tint banner: "Couldn't load clients — retry." If auth lost, route to `/login`. |
| **Permission** | Admin only. Staff/analyst/read-only may read the list and enter workspaces but cannot create/edit/archive. Client role: 403. |
| **Mobile/responsive** | Table keeps full density with horizontal scroll (`DESIGN.md` Layout); the row's primary click target stays the client name. |
| **Export** | CSV/JSON of the current filtered view (excludes decrypted tokens — never exports tokens). |
| **Related pages** | Client workspace (§2); Overview (`02`); Reports (`07`); Team & Permissions (`11`). |
| **Next action** | Enter the selected client's workspace. |

### 1.1 Column set — default vs optional

Each column must earn its place against the one-question rule. The default set
is the daily-read pulse; optional columns sit behind a **Columns** control
(`DESIGN.md` §5.2 progressive disclosure).

| # | Column | Default? | Justification |
|---|---|---|---|
| 1 | **Client** (serif name + status dot) | default | Identity + liveness in one cell. Status dot per `DESIGN.md` (olive/amber/rust halo + word). |
| 2 | **Status** (active / paused / archived) | default | Reachability of the client relationship; gates whether scheduled sync runs. |
| 3 | **Ad accounts** (count + platform chips, e.g. "3 · Meta") | default | Coverage at a glance; chips are neutral surface tags, not colored by platform. |
| 4 | **Primary contact** (name + email) | default | "How do I reach them" is the page's question. |
| 5 | **Monthly spend** (rollup, tabular-nums, right-aligned) | default | The one operational number; respects the global Date range. Multi-currency clients show the rollup in a chosen display currency with a muted footnote. |
| 6 | **ROAS** (rollup, hero-style, olive/rust by value) | default | The decision number. Uses Meta-reported `purchase_roas` until attribution (`06`) ships; footnote when rollup blends currencies. |
| 7 | **Account health** (worst connection status across the client's ad accounts) | default | "Is anything broken right now" — rust if any account is disconnected/restricted, amber if any token is near expiry, olive otherwise. |
| 8 | **Last sync** (relative, e.g. "12m ago") | default | Trust signal; stale (>24h) shows amber dot. |
| 9 | Industry | optional | Segmentation, not daily read. |
| 10 | Currency (display currency) | optional | Most clients are single-currency; only relevant for multi-currency portfolios. |
| 11 | Leads (count) | optional | Lead-gen objective only; many clients never use it. |
| 12 | Assigned account manager | optional | Useful in agencies with AMs; pure filter attribute. |

**Numeric columns use tabular-nums and right alignment via the `lead-2`/`lead-3`
table modifiers** (`DESIGN.md` Tables). Status is a dot+halo+word, never a
solid pill. No row-level winner/loser tinting — that signature belongs to
performance tables (`04`).

---

## 2. Client detail / workspace

| Field | Value |
|---|---|
| **Purpose** | The hub a user enters to do everything for one client. |
| **Primary user** | Agency admin/buyer/AM. |
| **Goal** | Move from "I'm on this client" to the right sub-surface without losing context. |
| **Primary CTA** | **Add ad account** (if none) / otherwise no global CTA — sub-tabs own their CTAs. |
| **Secondary actions** | Edit client, return to list, switch client (top-bar switcher resets client-scoped filters per `01` §4.4). |
| **KPI cards** | Only on the Overview sub-tab — see §2.2. |
| **Charts** | Only on the Overview sub-tab — one trend strip, no deep analytics. |
| **Tables** | Per sub-tab; this page owns none directly. |
| **Empty** | New client, no ad accounts: a clear path into the §3 onboarding flow. |
| **Loading** | Skeleton sub-tab. |
| **Error** | Per sub-tab. |
| **Permission** | Admin; staff/analyst per their role matrix (`11`). Client role sees the portal equivalent, not this workspace. |
| **Mobile/responsive** | Sub-tabs collapse to a horizontal scroll strip; KPI row goes 2-up under 520px. |
| **Export** | Per sub-tab. |
| **Related pages** | All Client-scoped nav items live behind these sub-tabs. |
| **Next action** | Driven by the sub-tab; default landing is Overview. |

### 2.1 Sub-tab mapping (the workspace nav)

The workspace owns a horizontal sub-tab strip (not a second sidebar) that maps
to the Client-scoped group of the global sidebar (`01` §3.4) so the user can
reach the same surfaces either way:

| Sub-tab | Maps to global nav | Notes |
|---|---|---|
| **Overview** | (workspace-only) | KPI row + health + recent activity. See §2.2. |
| **Ad Accounts** | Ad Accounts | §4 below; onboarding lives here. |
| **Campaigns** | Campaigns | Entry only — drills into `04`. |
| **Reports** | Reports | Filtered to this client. |
| **Marketing Plan** | Marketing Plans | Goals/KPIs/budget — see `08`. |
| **Budget** | Budget & Pacing | See `05`. |
| **Tasks / Alerts** | Alerts & Tasks | Filtered to this client. |
| **Team** | Team & Permissions | Members assigned to this client. |
| **Integrations** | Integrations | Connectors bound to this client. |
| **Activity** | (workspace-only) | Append-only audit trail. |

### 2.2 Client Overview sub-tab (deliberately narrow)

The Overview here is **not** a performance deep-dive — that lives in Campaigns
and Analytics. It carries:

- **One KPI row**: Spend, Revenue, ROAS, Purchases (4-up; 2-up on tablet/phone),
  each with a muted delta-vs-compare sub-line. Source = the same rollups as the
  Clients list, just larger.
- **Account-health strip**: one row per linked ad account showing connection
  status, last sync, and any active error badge (links into Ad Accounts).
- **Recent activity**: a bounded, timestamped list of the last ~20 events
  (account connected, token rotated, campaign paused by an alert, report sent,
  etc.). Append-only; not a performance table.

No creative thumbnails, no per-campaign rows, no attribution controls — those
non-duplication guardrails come straight from `01` §6.

---

## 3. UX flow — Create-client → connect → configure

Captain's §5 onboarding journey. Format: goal / entry / steps / system
behavior / states.

- **Goal**: take a brand-new client from "we have a deal" to "dashboard is
  live and monitored" without leaving the workspace.
- **Entry**: Clients list → **Create client**, or Ad Accounts sub-tab →
  **Add ad account** when the client has none.

**Steps** (7):

1. **Create Client** — name, slug, primary contact, currency, industry,
   assigned AM. Slug becomes the route key (mirrors today's `clients.slug`,
   `schema.ts`).
2. **Connect Accounts** — choose Meta (today) or future adapter; run the §5
   OAuth flow per ad account. One client may collect several.
3. **Configure Goals** — pick the canonical goal (revenue, leads, ROAS target)
   inside the Marketing Plan sub-tab (`08`).
4. **Configure KPIs** — choose the canonical KPI set this client reports on
   (spend/ROAS/CPA defaults; ecommerce vs lead-gen variants).
5. **Set Budget** — monthly cap and pacing basis; feeds Budget & Pacing (`05`).
6. **Create Dashboard** — confirm the Client Portal dashboard shape the client
  will see (`11`).
7. **Start Monitoring** — enable scheduled sync (node-cron) and the alert
   rules (cross-link `09`).

- **System behavior**: the flow is a wizard whose step indicator is the seven
  labels above. Steps 1 and 2 are required to land any data; 3–6 may be
  skipped and completed later (the workspace Overview flags "Setup incomplete"
  in amber until they are done); step 7 ends the wizard.
- **Success**: workspace Overview loads with all-green health and a clay
  primary **Open dashboard**.
- **Loading**: each step shows an in-card progress state (paper-2 strip), not
  a full-screen spinner.
- **Empty**: irrelevant (this flow creates the records).
- **Error**: per-step inline rust-tint message; the wizard stays on the
  failing step. OAuth errors route through the §6 catalog.
- **Permission**: admin only. Staff with the "onboarding" capability (`11`)
  may run steps 1–6; step 7 (enable monitoring) stays admin-only.
- **Notifications**: one toast on completion. No alert escalation on success.
- **Next action**: open the dashboard or go to Ad Accounts to add another.

---

## 4. Ad Accounts list (inside a client)

| Field | Value |
|---|---|
| **Purpose** | Manage the ad accounts that belong to *this* client; verify they are healthy and correctly wired. |
| **Primary user** | Agency admin/AM. Not client-facing. |
| **Goal** | Confirm every connection is live, correctly attributed, and current. |
| **Primary CTA** | **Add ad account** (single) — opens the §5 onboarding flow. |
| **Secondary actions** | **Import from accounts.json** (bulk, §7); edit; reconnect; refresh now; remove (pre-flight guarded). |
| **KPI cards** | None — this is a health surface, not a performance surface. |
| **Charts** | None. |
| **Tables** | One ledger table — column set below. |
| **Filters** | Platform, status, token status, error state. |
| **Dimensions** | None. |
| **Metrics** | None performance; only operational signals (last refresh, balance/cap headroom). |
| **Drill-down** | Row → Account detail (connection diagnostics). |
| **Empty** | "No ad accounts linked. Add one or import from accounts.json." + clay primary. |
| **Loading** | Skeleton rows. |
| **Error** | Per-row error badge from the §6 catalog; page-level rust banner only on full-list fetch failure. |
| **Permission** | Admin; staff per role matrix. Client role: 403. |
| **Mobile/responsive** | Full-density table with horizontal scroll. |
| **Export** | CSV of visible rows (excluding decrypted tokens). |
| **Related pages** | Integrations (`10`); Alerts & Tasks (`09`); Campaigns (`04`). |
| **Next action** | Open Campaigns for a healthy account; reconnect a failed one. |

### 4.1 Columns

platform · ad-account id/name · Business Manager · page · pixel/dataset ·
conversion events · currency · timezone · status · token status · last refresh ·
balance/cap headroom (where available) · error state.

- **Platform / status / token status / error state** are dot+halo+word.
- **Balance/cap headroom** draws from `fetchAccountInfo`
  (`src/lib/meta-api.ts`): for prepaid accounts it is `balance`; for
  threshold/invoicing accounts it is `spend_cap − amount_spent`. Footnote the
  distinction inline so the number is not misread. **Mark for `16`**: Meta does
  not expose a reliable unified "spendable headroom" across billing models; the
  computed value is best-effort.
- **Conversion events** lists the events wired to the pixel/dataset (e.g.
  `PageView, AddToCart, Purchase`). **Mark for `16`**: the full event set
  requires the pixel's attached `attached_assets`/dataset edge; not all
  accounts expose it reliably.

### 4.2 Remove — pre-flight guards

Remove is **danger-buttoned** (`DESIGN.md` Buttons) and refuses to run unless
all of:

1. The account has no live campaigns (status check via Marketing API); paused
   campaigns must be archived first or explicitly carried over.
2. No scheduled report (`07`) currently references this account.
3. No active alert/task (`09`) blocks deletion; open items must be dismissed
   or reassigned.
4. The admin re-types the account slug to confirm (mirrors today's confirm
   dialog, hardened).

On removal the encrypted token (`accessTokenEncrypted`, `schema.ts`) is
destroyed with the row (`onDelete: cascade` from `clients`).

---

## 5. UX flow — Connect Meta Ad Account (onboarding)

Captain's §6 onboarding flow. Format: goal / entry / steps / system behavior /
states.

- **Goal**: connect one Meta ad account to this client with all assets wired
  and an initial dataset validated.
- **Entry**: Ad Accounts sub-tab → **Add ad account** → choose Meta.

**Steps** (9):

1. **Connect Meta** — explain what will be shared; primary **Continue to Meta**.
2. **OAuth** — redirect to Facebook; request scopes (see §5.1).
3. **Select Business** — list Business Managers the token can see.
4. **Select Ad Account** — list `act_…` accounts in that Business.
5. **Select assets** — pick the Page and Pixel/Dataset that this account will
   use (drives creative posting and conversion tracking).
6. **Permissions/scopes review** — confirm the granted scopes match the
   required minimum; warn if any are missing (treat as §6 error
   `missing_permissions`).
7. **Initial sync** — pull account info, campaigns, ad sets, ads, daily series
   (same shape as `fetchFullReport`, `src/lib/meta-api.ts`); show a staged
   progress list (see §5.2).
8. **Data validation** — sanity checks: spend in the last 7d > 0? Pixel
   receiving events? Currency/timezone match what the Business reports?
9. **Dashboard ready** — encrypt the token AES-256-GCM
   (`src/lib/crypto.ts`), persist the ad account row, hand off to the
   workspace Overview.

- **System behavior**: the encrypted token is written once at step 9 and never
  re-exposed in the UI (no "reveal token" on this flow; today's reveal control
  in `src/app/admin/page.tsx` is admin-only and stays). The stored fields map
  to `adAccounts` in `schema.ts`: `adAccountId`, `businessId`, `pageId`,
  `pixelId`, `currency`, `timezone`, `accessTokenEncrypted`.
- **Success**: green dot, "Dashboard ready", clay primary **Open dashboard**.
- **Loading**: step 7 shows the staged progress list with per-stage status.
- **Empty**: not applicable.
- **Error**: route through the §6 catalog; the wizard stays on the failing
  step and never persists a half-written account.
- **Permission**: admin only.
- **Notifications**: one toast; on a partial sync (step 7), also raise an
  amber task in `09` for review.
- **Next action**: configure Goals/KPIs (steps 3–6 of §3 if not yet done).

### 5.1 Required Meta scopes

`ads_read` (read insights, default), `ads_management` (write actions — pause,
budget edit), `business_management` (Business Manager access for asset
selection), `read_insights` (Marketing API insights), `pages_read_engagement`
(page picture, page context), `catalogs_read` (if a product catalog is wired).
Note: system-user tokens (preferred for production, no 60-day expiry) need
Business verification; user tokens work but expire — flag for `16` and for the
§6 expired-token surface.

### 5.2 Initial-sync stages

Each stage shows a labelled row with a status dot; failures are per-stage, not
whole-flow:

1. Account info (name, currency, timezone, balance, status).
2. Campaigns list.
3. Ad sets list.
4. Ads list.
5. Account-level insights (trailing 30d default).
6. Campaign/ad-set/ad-level insights.
7. Daily time series.

---

## 6. Error-state catalog

One surface, one status language. All statuses render as dot + halo + word per
`DESIGN.md`. "Auto-retry" = the scheduler (`scheduler.ts`) tries again on the
next tick; "Escalate" = an alert is raised into `09` and shown as a rust badge
on the Ad Accounts row and the Account-health strip on the workspace Overview.

| Error | Cause | How it surfaces | User-facing message | Recovery | Auto-retry? / Escalate? |
|---|---|---|---|---|---|
| **Permission denied** | Role not admin; or agency user lacks this client assignment. | Page-level 403 / hidden controls. | "You don't have access to this client. Ask an admin." | Admin grants access in Team (`11`). | No / No. |
| **Expired / revoked token** | 60-day user token expired; or token revoked in Meta. | Rust dot on **Token status**; row-level badge. | "Meta access expired. Reconnect to resume sync." | Run §5 steps 2–9 again (re-OAuth). | No (needs human) / Escalate. |
| **Account disconnected** | Network failure, app removed from Business, or repeated 401s. | Rust dot on **Status**; row disabled. | "This account is disconnected. Reconnect to continue." | Reconnect from row action. | 3 attempts then / Escalate. |
| **Account restricted / banned** | Meta policy hold (`account_status` 2/3/7/8). | Amber or rust dot on **Status** (severity by code). | "Meta has placed a restriction on this account. Resolve in Ads Manager." | Captain resolves in Meta; Winning Kart cannot lift it. | No / Escalate. **Mark for `16`**: Meta exposes the status code, not the policy reason. |
| **API rate limit (429)** | Too many calls in window. | Amber dot on **Last refresh**; toast. | "Rate limited by Meta. Retrying shortly." | Backoff; next scheduled tick. | Yes, exponential / No (silent unless persistent >1h, then Escalate). |
| **API 4xx (other)** | Bad request, invalid act_id, permission scope dropped. | Rust badge on row. | "Meta rejected the request (code N). Check account setup." | Edit account row; re-add scope. | No / Escalate. |
| **API 5xx** | Meta-side outage. | Amber dot on **Last refresh**. | "Meta is unavailable. Retrying." | Wait; next tick. | Yes / Escalate only if >15 min. |
| **Missing permissions** | OAuth granted fewer scopes than §5.1 requires. | Amber badge at onboarding step 6; row badge afterwards. | "Required permission missing: ads_management. Reconnect to grant." | Re-OAuth with the missing scope. | No / Escalate. |
| **Data sync failure** | Whole sync throws (token bad upstream, network). | Rust dot on **Last sync**. | "Last sync failed. Retrying in N min." | Scheduler retry; manual **Refresh now**. | Yes / Escalate if 3 in a row. |
| **Partial sync** | Some stages succeeded, some failed (e.g. insights 200, ads 5xx). | Amber dot on **Last sync** + per-stage dot in detail. | "Partial sync — some data may be stale." | Per-stage retry from Account detail. | Yes for failed stages / Escalate as a task, not an alert. |
| **Currency / timezone mismatch** | Stored `currency`/`timezone` (`schema.ts`) differs from what Meta now reports. | Amber badge on row. | "Currency/timezone changed in Meta. Update the stored value to match." | Edit row; confirm overwrite. | No / No (admin-only check). |
| **Duplicate account** | Same `adAccountId` already linked (this client or another). | Inline rust message on add form. | "This ad account is already linked to client X." | Either cancel or move the account (archive-duplicate path). | No / No. |

---

## 7. Bulk import — `accounts.json` paste

The legacy bulk path exists today (`src/app/api/import-accounts/route.ts`,
`src/app/admin/page.tsx` `ImportModal`). This spec keeps it as a power-user
shortcut with a clearly bounded contract.

- **Format** — the exact shape the existing endpoint accepts:
  ```json
  {
    "accounts": {
      "<slug>": {
        "name": "...",
        "ad_account_id": "act_123",
        "business_id": "...", "page_id": "...", "pixel_id": "...",
        "currency": "AED", "timezone": "Asia/Dubai"
      }
    },
    "tokens": { "<slug>": "EAA..." }
  }
  ```
- **Validation** — per-row, server-side: each entry must have
  `ad_account_id` and a matching entry in `tokens`; otherwise it lands in
  `errors[]` with a reason ("missing ad_account_id", "missing token in tokens
  map"). Malformed top-level JSON returns 400 "Invalid JSON".
- **Per-row error reporting** — the response partitions into `created`,
  `skipped`, `errors`, with a summary `{ created, skipped, errors }`. The
  modal shows three counters (olive / muted / rust) and lists each row under
  its bucket so a captain can fix and re-paste the failing rows only.
- **Idempotency** — keyed on `ad_accounts.slug` (and `clients.slug`). Re-running
  with the same slug is a no-op for that row: it appears in `skipped[]` with
  reason "ad account already exists". This is the existing behavior and is
  preserved.
- **Today's limitation — needs captain's call** — the current flow creates
  *one client per ad account* (1:1). Real agencies have *one client with many
  ad accounts*. The bulk format above has no client grouping. See §8.
- **Token handling** — tokens are AES-256-GCM encrypted at write time
  (`src/lib/crypto.ts`, `encrypt`); plaintext never persisted; the modal
  surfaces a one-time generated password per created client that must be
  copied immediately (existing behavior, kept).

**State matrix** (modal): *empty* (paste prompt + sample) → *importing*
(disabled button, paper-2 strip) → *result* (three counters + per-bucket
lists) → *done* (reloads the client list). Error at parse-time returns to the
*empty* state with a rust inline message ("Invalid JSON — paste the full
contents of accounts.json").

---

## 8. Open questions for the captain

These are the columns and states where this crewmate will not guess:

1. **Client `status` field** — the schema today has no client-level status
   column. Is "Active/Paused/Archived" a new field on `clients`, or derived
   from the worst ad-account status? Affects §1.1 columns 1 & 2 and the
   scheduler's skip rule.
2. **Client enrichment fields** — `industry`, `primary contact (phone/owner)`,
   `assigned account manager`. None are in `schema.ts` today. Add as columns
   on `clients`, or as a separate `client_attributes` table?
3. **Rollup window** — is "Monthly spend" a fixed calendar month, trailing
   30d, or whatever the global Date range is set to? Today the dashboard is
   date-range-driven; the Clients list would inherit that, but the column
   header says "monthly".
4. **Leads column** — does V1 serve lead-gen objectives at all, or ecommerce
   only? If ecommerce-only, drop column 11.
5. **Bulk import grouping** — should the `accounts.json` format grow a
   `client` field so multiple ad accounts can attach to one client? Today's
   endpoint is strictly 1:1, which forces awkward client-per-account slugs.
6. **Token strategy** — system-user tokens (no expiry, Business verification
   required) vs long-lived user tokens (60-day expiry, frequent §6 reconnects).
   This single decision drives the entire expired-token surface's frequency
   and the onboarding UX.

---

*End of `03-clients-ad-accounts.md`. Honors `01` §3.3, §3.4, §6; `PRODUCT.md`
admin-only back office; `DESIGN.md` One-Accent, Warm-Semantics, Data-is-Sans,
Eyebrow-Only, and status-as-dot rules. No code touched.*
