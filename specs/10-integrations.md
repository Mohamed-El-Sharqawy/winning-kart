# 10 — Integrations

> Agency-global Administration surface (anchor `01-product-architecture.md`
> §3.3, Integrations). Per the anchor's non-duplication table (`01` §6), this
> page answers exactly **one question: "Is everything wired and syncing?"** —
> status, sync, errors, and disconnect only. **No performance metrics live
> here.** Spend, ROAS, revenue, and every other number live on their owned
> surfaces (`02`, `04`, `05`, `06`); Integrations surfaces only the *plumbing*
> that lets those numbers exist.
>
> Status: DRAFT (crewmate done, pending first-mate review).
>
> Cross-references: `01-product-architecture.md` (binding anchor §3.3, §6, §7
> AdPlatform seam), `03-clients-ad-accounts.md` (Meta connect flow §5, error
> catalog §6), `06-attribution-revenue.md` (revenue-source ingestion §1),
> `07-reports.md` (delivery targets), `09-tasks-alerts-insights.md` (alert
> escalation), `12-settings.md` (API tokens / webhooks overlap), `13-data-model.md`
> (connector tables), `15-roadmap-prioritization.md` (MVP rationale), `16-data-gaps-and-risks.md`
> (API limits). Source: `src/lib/crypto.ts`, `src/lib/scheduler.ts`, `src/lib/mcp.ts`,
> `src/db/schema.ts` (`apiTokens` table).

---

## 0. Scope and binding rules

- **Agency-global, admin-only.** A connector catalog the operator wires, diagnoses,
  and disconnects from one place. Some connectors bind per-Client at configure
  time (revenue sources, CRM, GA4 property); others are agency-global (Slack,
  SMTP, data warehouse export, outbound webhooks). The Client switcher acts as
  an optional filter, never a requirement (anchor §3.2).
- **Self-hosted posture is the contract.** Every connector is an adapter the
  operator runs on their own instance. There is no mandatory serverless or
  managed-dependency path: no Lambda, no managed connector service, no
  third-party "Integration Platform" the operator must sign up to. The
  scheduler, the encrypted token store, the sync log, and the webhook receiver
  all live inside the Winning Kart process. Connectors that *can* run in a
  serverless target are still required to run in-process (anchor §1
  self-hosting thesis; `PRODUCT.md` Operating Context).
- **Tokens AES-256-GCM at rest — reuse the existing path.** Every long-lived
  credential (OAuth token, refresh token, API key, webhook secret, service
  account JSON) is encrypted at write time through `src/lib/crypto.ts`
  (`encrypt`/`decrypt`, AES-256-GCM, 96-bit IV, auth tag). Plaintext is never
  persisted and never re-exposed in the UI. The Master Encryption Key
  (`ENCRYPTION_KEY`) is operator-held env, not in the database.
- **Sync job model — Bun cron in-process.** Scheduled work runs on Bun's
  native cron inside the Elysia process (replacing the archived project's
  node-cron scheduler). Each connector contributes a job with its own cron
  expression, retry policy, and jitter. There is no separate queue worker;
  the scheduler is the worker. (For high-volume shops, a future V2 may
  externalize the worker — flagged in §11.) Automation beyond data sync is
  externalized to the operator's Hermes agent via PAT (see `README.md`).
- **Every connector is optional by construction.** The platform runs fully
  when zero connector credentials are configured — missing credentials mean
  "not configured", never an error state or a degraded core (captain's
  standing amendment).
- **Idempotency is required, not optional.** Every sync run is idempotent on a
  per-connector dedup key: ad-platform syncs dedup on
  `{ad_account}:{entity}:{date}:{metric_breakdown}`; revenue connectors dedup
  per the keys in `06` §1 (e.g. `{shop_domain}:{order_id}`); CRM on
  `{crm}:deal_id`. Re-runs never double-count; webhook redelivery is safe.
- **Errors escalate into `09`.** A connector error surfaces here as a status
  dot + word on its row, and (when it crosses the severity rule in §1.6) also
  raises an alert in `09-tasks-alerts-insights.md`. The dot and the alert are
  the same event rendered twice — never two sources of truth.
- **Honors `DESIGN.md`.** Status is a dot + semantic halo + word (Olive healthy
  / Amber warning / Rust error), never a solid pill. Clay is reserved for the
  primary CTA ("Connect", "Reconnect"). Tabular figures on every count/timestamp.
  No emoji or unicode glyph icons anywhere. Hairline rules do the structural
  work; borders never exceed 1px.

### Schema delta vs today

`src/db/schema.ts` today has `clients`, `ad_accounts`, and `apiTokens`. This
spec requires a new `connectors` table (one row per connection — ad platform
beyond Meta, revenue, CRM, analytics, communication, automation), plus a
`connector_sync_log` (append-only) and `connector_events` (ingested records
ledger for revenue/CRM). Defined in `13-data-model.md`, flagged in
`16-data-gaps-and-risks.md`. The existing `apiTokens` table is the **MCP/REST
API** path (already shipped — see §9) and stays unchanged.

---

## 1. Integration architecture — the common connector contract

Every connector — Meta today, plus every adapter this doc introduces —
implements the same contract. Adding a connector is implementing this contract,
not forking the product (anchor §7 AdPlatform seam generalized beyond ad
platforms to every external system).

| Contract field | Definition |
|---|---|
| **`id` / `type` / `category`** | Stable identifier; adapter type (`meta`, `google_ads`, `shopify`, …); category (`advertising` / `revenue` / `analytics` / `crm` / `communication` / `automation`). |
| **`binding`** | `agency` (one connection, all clients) or `client` (one connection per client: revenue sources, CRM, GA4 property). |
| **`auth_method`** | One of `oauth_authorization_code`, `oauth_client_credentials`, `api_key_header`, `basic_header`, `hmac_webhook_secret`, `service_account_json`, `smtp_password`. |
| **`auth_payload_encrypted`** | AES-256-GCM ciphertext produced by `src/lib/crypto.ts.encrypt`. Layout `"iv_b64:tag_b64:data_b64"` is reused as-is; for OAuth the payload carries `access_token`, `refresh_token`, `expires_at`, and the granted scopes list. |
| **`scopes_granted` / `scopes_required`** | Lists used by the §3 page to flag drift (missing-scope amber per `03` §6 `missing_permissions`). |
| **`sync_mode`** | `scheduled_poll`, `webhook_primary`, `webhook_plus_poll`, `push_on_event`, `on_demand`. |
| **`cron_expr`** | Per-connector cron on the shared node-cron scheduler; jittered ±N seconds to avoid stampede. |
| **`dedup_key`** | Connector-specific expression; see §0 idempotency. |
| **`rate_limit_policy`** | Token bucket / fixed window per vendor spec; the adapter enforces `429` backoff (`03` §6 `API rate limit (429)` pattern) and surfaces persistent throttling as Amber on the row. |
| **`mapped_entities`** | What this connector produces: ad-platform → Campaign/Ad Set/Ad/Insights; revenue → Revenue Event (`06`); CRM → Revenue Event (deal-level); analytics → GA4 session/conversion series; communication → delivery target. |
| **`health_state`** | One of `healthy`, `warning`, `error`, `disconnected`, `paused`. Rendered dot+halo+word. |
| **`last_sync_at` / `last_sync_status` / `last_error`** | Drives the row dot and the §11 reliability rollup. |

### 1.1 Sync job lifecycle (shared)

`queued` → `running` → `succeeded` | `partial` | `failed` → (retry per policy)
→ `succeeded` or `escalated`. Each transition appends a row to
`connector_sync_log` (started_at, ended_at, status, error class, records
pulled, dedup hits). The Connector detail page reads this log verbatim.

### 1.2 Rate-limit handling

Each adapter declares its vendor limit (calls per window, concurrency). The
sync loop (a) reads `Retry-After` when present, (b) backs off exponentially on
`429`/`5xx` with a per-connector ceiling, (c) refuses to fall back to "give up
silently" — persistent throttle (>15 min) escalates an Amber alert to `09`,
never disappears.

### 1.3 Idempotency and redelivery

Webhook-receiving connectors (Shopify, WooCommerce, custom CRM) verify HMAC
signatures, then dedup on the connector's `dedup_key` *before* writing. A
redelivered webhook is a no-op. Re-runs of a scheduled poll overwrite the same
`{entity, date, breakdown}` cell; they never insert duplicates. Offline
reconciliation of refunds and updates issues new events with `replaces`
pointers (mirrors `06` §1).

### 1.4 Error escalation into `09`

Connector errors map to `09-tasks-alerts-insights.md` alert types: token
expired, account disconnected, scope dropped, webhook failing, rate-limit
persistent, schema drift, vendor 5xx. Each has a severity (Rust/Amber) and a
recovery CTA that deep-links back into the Connector detail page's Reconnect or
Edit controls.

### 1.5 Token rotation and refresh

OAuth refresh runs inside the same scheduler (a per-connector tick that checks
`expires_at` within 7 days and refreshes proactively). The refresh response is
re-encrypted in place. A failed refresh escalates the same way as a revoked
token (Rust dot, alert in `09`, row disabled until Reconnect).

### 1.6 Self-hosted posture — the explicit rule

No connector may depend on a managed service the operator cannot self-host.
Connectors that *natively* expect serverless targets (e.g. Shopify's app
hosting requirements) are satisfied by the Winning Kart HTTP server the
operator already runs. This is the competitive fact against serverless-dependent
incumbents (anchor §1; `00-market-research.md`).

---

## 2. Category page — common template

The Integrations landing page is a category index; each category opens a list
page applying this template. The template is the anchor's per-page set
(`spec/README.md` Non-negotiables).

| Field | Value |
|---|---|
| **Purpose** | One place to wire, diagnose, and disconnect every external system of one category. |
| **Primary user** | Agency admin (`PRODUCT.md` back-office admin-only). |
| **Goal** | Trust that every connector is live, correctly scoped, and current; spot the broken one instantly. |
| **Primary CTA** | **Connect** (clay-strong primary; opens the connector picker — see §3.2 of each category). |
| **Secondary actions** | Reconnect, Refresh now, Pause sync, View sync log, Disconnect (danger-button, guarded — §3.4). |
| **KPI cards** | None. Per anchor §6 this page carries no metrics; the **count** of connected / warning / error connectors is rendered as a small-caps label, not a KPI ticket. |
| **Charts** | None. |
| **Tables** | One ledger per category — connector · binding (agency/client name) · auth method · scopes · status dot · last sync (relative, tabular-nums) · error word. |
| **Filters** | Status (healthy/warning/error/disconnected/paused), binding, last sync freshness. |
| **Drill-down** | Row → Connector detail (§3). |
| **Empty** | "No connectors in this category yet." + clay primary **Connect**. |
| **Loading** | Skeleton ledger rows; status dot shimmer only (never a full-screen spinner). |
| **Error** | Rust-tint inline banner "Couldn't load connectors — retry." |
| **Permission** | Admin only. Staff/analyst read; client role: 403 (hidden from portal nav, anchor §3.5). |
| **Mobile/responsive** | Full-density table with horizontal scroll (`DESIGN.md` Layout); row click target stays the connector name. |
| **Export** | CSV of visible rows (always excludes decrypted credentials — credentials never export). |
| **Related pages** | `03` (ad-account onboarding for Meta), `06` (revenue ingestion detail), `09` (alert feed), `12` (API tokens). |
| **Next action** | Open the connector in error, or connect a new one. |

---

## 3. Connector-detail page — common template

| Field | Value |
|---|---|
| **Purpose** | Diagnose and manage one connector end-to-end: scopes, sync log, mapped entities, reconnect, disconnect. |
| **Primary user** | Agency admin. |
| **Goal** | Trust the connection and have every recovery action one click away. |
| **Primary CTA** | **Reconnect** (when state is disconnected/expired) or **Refresh now** (when healthy). |
| **Secondary actions** | Edit binding/scopes; view sync log; view mapped entities; pause sync; export sync log CSV; **Disconnect** (danger). |
| **KPI cards** | None (no metrics on this surface). In their place: a header block with **scopes granted vs required** (per-scope dot), **records pulled (last sync, all-time)**, **dedup hits (last sync)**, **last successful sync**. All counts tabular-nums. |
| **Charts** | None. |
| **Tables** | (a) Sync log — timestamp · status · records · duration · error class. (b) Mapped entities — per-entity row counts (campaigns, ad sets, ads, revenue events, deals, etc.). (c) Per-record recent-events ledger (where applicable; horizontal-scroll on mobile). |
| **Filters** | Sync log: date range (global), status. Mapped entities: entity type. |
| **Drill-down** | Sync log row → raw error payload (admin-only, no plaintext secrets ever). Entity row → the owning surface (`04` for campaigns, `06` for revenue). |
| **Empty** | First-time connector: a staged progress list mirroring `03` §5.2 initial-sync stages for that connector type. |
| **Loading** | Sync log row shimmers; header counts as tabular-figure skeletons. |
| **Error** | Header carries the current error class as Rust dot + word; the **Reconnect** CTA becomes clay-primary when state is `error`/`disconnected`. |
| **Permission** | Admin only. |
| **Mobile/responsive** | Header block stacks 2-up; sync log and tables horizontal-scroll. |
| **Export** | Sync log CSV (always excludes decrypted credentials). |
| **Related pages** | The category list (§2); `09` (alert feed for this connector); `06` (for revenue connectors). |
| **Next action** | Reconnect if broken; otherwise return to category list. |

### 3.1 Disconnect dialog (shared, guarded)

Disconnect is a danger-button flow that always: (1) states in plain English
what stops, (2) states what data *stays*, (3) requires the admin to re-type the
connector name, (4) on confirm, destroys the encrypted credential (cascade per
schema, mirroring `03` §4.2's pattern) and tears down webhooks / app
subscriptions where the API allows. Per-connector divergence in §10.

---

## 4. Category A — Advertising platforms

Per anchor §7 these are all adapters behind the same AdPlatform seam; Meta
shipped today (`src/lib/meta-api.ts`), the rest are new adapters, not forks.
**MVP: Meta.** Later: Google Ads (V1), TikTok / Snapchat / LinkedIn Ads (V2).

| Adapter | MVP | Auth | OAuth model | Key scopes | What it enables |
|---|---|---|---|---|---|
| **Meta Ads** | **MVP** (exists) | OAuth Authorization Code + PKCE | Long-lived user token (60-day, refresh) *or* System-User token (no expiry, Business verification) | `ads_read`, `ads_management`, `business_management`, `read_insights`, `pages_read_engagement`, `catalogs_read` | Insights, structure, write actions (pause/budget), page picture, catalog. Flow defined in `03` §5.1. |
| **Google Ads** | V1 | OAuth 2.0 (Authorization Code) + Developer Token (Google API access tier: Standard/Basic) | Refresh-token; developer token tied to a Google account | `https://www.googleapis.com/auth/adwords`, `openid`, `email`, `profile` | Customer + sub-account crawl, campaign/ad-group/ad, insights (Google's `metrics.*`), conversion upload. Click id `gclid`. |
| **TikTok Ads** | V2 | OAuth 2.0 (app registered in TikTok Marketing API) | Refresh-token, advertiser_id pinned at auth | `advertiser.management`, `reporting`, `campaign.management`, `user.profile` | Campaign/ad-group/ad, insights, identity resolution via `ttclid`. |
| **Snapchat Ads** | V2 | OAuth 2.0 (Snap Marketing API app) | Refresh-token | `snap-marketing-api` (snap partner scope) | Ad account / campaign / ad squad / creative, insights, identity via `scclid`. |
| **LinkedIn Ads** | V2 | OAuth 2.0 (LinkedIn Developer app) | Refresh-token (60-day, refresh); organization pivot required | `r_ad_campaigns`, `r_ad_creative`, `r_organization`, `rw_organization` (for asset), `r_ad_analytics` | Campaign groups / campaigns / creatives, analytics, account-by-organization pivot. |

**Sync model.** All five: scheduled poll (default cadence — structure hourly,
insights daily, ad-level insights daily; cadence admin-tunable per connector).
**Mapped entities.** Ad Account → Campaign → Ad Set → Ad / Creative + Insights
+ Daily Series, normalized into the canonical metric set (`01` §7).
**Disconnect.** Encrypted token destroyed (cascade); scheduled sync stops;
**attributed revenue stays** (same rule as `06` §1.1); new insights stop;
row moves to `disconnected` state. The user is warned: "Spend and insights for
this account will stop refreshing. Already-recorded performance and attributed
revenue remain."

### 4.1 Cross-platform note (flag for `16`)

Meta, Google, TikTok, Snapchat, LinkedIn each expose different metric semantics
(view-through windows, attribution windows, conversion definitions). The
AdPlatform seam normalizes *canonical* metrics; platform-only metrics surface
as optional columns (`01` §7). Where the same metric means different things
across platforms, the discrepancy is disclosed on `06`'s Limitations tab, not
hidden. Flagged for `16-data-gaps-and-risks.md`.

---

## 5. Category B — E-commerce / revenue

Plumbing lives here; ingestion semantics, dedup, currency handling, identity
signals, and attribution are owned by **`06-attribution-revenue.md` §1**.
**MVP: Shopify** (primary ecommerce path per `06` §1.1) **+ Custom backend
API** (per `06` §1.6, §9.4 below) — agency clients may run custom stacks
(Next.js + own backend), not Shopify/Woo, so revenue ingestion must work for
them at launch. **V1: WooCommerce.**

### 5.1 Shopify (MVP)

- **Auth.** OAuth via Shopify App (public or custom). Store bind is **per
  Client** (one Client may have multiple stores, multiple currencies — `06` §1.1).
- **Scopes.** `read_orders`, `read_all_orders` (required when store exceeds
  Shopify's volume threshold), `read_customers`, `read_products`,
  `read_fulfillments`. Webhooks registered for `orders/paid`, `refunds`,
  `app/uninstalled`.
- **Sync.** Webhook primary + nightly reconciliation via Orders REST/GraphQL
  (catches missed webhooks, refunds, edits).
- **Data available.** Order events, refunds (negative-value, tied to original),
  customer email hash (hashed at ingest, never raw), `_fbc`/`_fbp` cookies if
  Pixel present, UTM from `landing_site`, currency (base + presentment).
- **Error handling.** Webhook HMAC failure, scope revocation, app uninstall,
  store transfer. Maps to `09` alerts.
- **Disconnect.** User warned: "Order ingestion from this store will stop.
  Already-attributed revenue remains on its campaigns; new orders will not be
  matched." Webhooks torn down via Shopify API where possible; encrypted token
  + shop-domain record destroyed.

### 5.2 WooCommerce (V1)

- **Auth.** REST API v3 key/secret (`consumer_key` / `consumer_secret`) issued
  by the store admin; webhook secret registered for `order.created`,
  `order.completed`. **No OAuth.**
- **Scopes.** Keys are read-scoped at issue; there are no granular scopes.
- **Sync.** Webhook + **hourly poll fallback (mandatory, not optional)** —
  WooCommerce webhooks are flakier than Shopify's (`06` §1.2).
- **Data available.** Order events, customer email, UTM (only if a tracking
  plugin captures it), order currency. Click id `_fbc` **unreliable** without a
  tracking plugin (`16`).
- **Error handling.** Key revocation, plugin uninstall (breaks UTM meta), site
  downtime. The connector card must surface "last successful poll"
  prominently.
- **Disconnect.** Same warning as Shopify; keys revoked via the WC admin
  (manual step displayed to operator); encrypted key/secret destroyed.

---

## 6. Category C — Analytics

**V1: Google Analytics 4 (GA4), server-side.** No MVP analytics connector —
Meta-attributed traffic is the V0 baseline.

### 6.1 GA4 (V1, server-side)

- **Auth.** Google Service Account JSON (operator-generated) + property
  binding; **or** OAuth 2.0 server-to-server with `https://www.googleapis.com/auth/analytics.readonly`.
  Service Account is the recommended posture (no expiry, no refresh-token
  churn); the JSON is AES-256-GCM encrypted at rest as a single blob.
- **Scopes.** `analytics.readonly` (GA4 Data API v1). Optional
  `analytics.edit` only if the operator wants Winning Kart to push
  offline conversion uploads back to GA4 (off by default).
- **Sync.** Daily pull of property-level session/conversion series, per
  campaign UTM, for the global date range. Poll cadence is per-property.
- **Data available.** Sessions, conversions, revenue (GA4's `purchase` event),
  engagement metrics — joined into Analytics (`05`) as an independent
  confirmation layer against ad-platform attribution.
- **Error handling.** Quota exceeded (`RESOURCE_EXHAUSTED`), sampling threshold
  crossed, property deleted, service account key revoked.
- **Disconnect.** User warned: "GA4 series will stop refreshing on Analytics.
  Already-imported series remain; new days will be empty." Service-account
  binding destroyed; the JSON the operator holds is unaffected.

---

## 7. Category D — CRM

**V1: HubSpot. V2: Salesforce, custom CRM.** Revenue events from CRM feed
`06` §1.3 — the ingestion contract is owned there; this section owns the
*connection*.

### 7.1 HubSpot (V1)

- **Auth.** OAuth Authorization Code; refresh-token; per-Client bind.
- **Scopes.** `crm.objects.contacts.read`, `crm.objects.companies.read`,
  `crm.objects.deals.read` (new granular style); legacy `contacts`/`companies`/
  `deals` for older hubs.
- **Sync.** Daily pull of closed-won deals with `amount`, `closedate`,
  `lead_source`, contact email hash. Daily because CRM deals mutate post-close;
  real-time webhooks create churn (`06` §1.3).
- **Data available.** Deal-level revenue events with lead-source granularity.
  Match quality is tier B/C — usually resolves to campaign group, **not** a
  specific ad (`06` §2).
- **Error handling.** Token expiry (refreshed in-flight), scope dropped, custom
  field renamed (schema drift), pipeline reconfigured.
- **Disconnect.** User warned: "Closed-won deals from HubSpot will stop
  ingesting. Already-attributed CRM revenue remains." OAuth revoked via
  HubSpot; encrypted refresh-token destroyed.

### 7.2 Salesforce (V2)

- **Auth.** OAuth (Authorization Code + refresh_token, `offline_access`) or
  JWT Bearer (server-to-server, certificate-based). JWT recommended for
  production.
- **Scopes.** `api`, `refresh_token`, `offline_access`, `web`.
- **Sync.** Daily pull of `Opportunity` (closed-won) + `Contact` + `Account` +
  `LeadSource`. Same dedup/identity rules as HubSpot (`06` §1.3).
- **Data available.** Same shape as HubSpot; tier B/C match.
- **Error handling.** Token refresh failures, edition API limits (see §11),
  field schema drift, pipeline reconfiguration.
- **Disconnect.** Same warning as HubSpot. OAuth revoked or JWT cert
  invalidated; encrypted credential destroyed.

### 7.3 Custom CRM (V2)

- **Auth.** Generic API key in `Authorization` header; per-Client bind.
- **Sync.** Configurable: webhook push to the §9.4 ingest endpoint, or daily
  poll of a configurable deals endpoint.
- **Data available.** Whatever the custom CRM emits — Winning Kart maps fields
  at configure time. Must conform to the §1.4 revenue-event contract in `06`.
- **Error handling.** HTTP 4xx/5xx with exponential backoff; key revocation.
- **Disconnect.** Encrypted API key destroyed; the operator is reminded to
  revoke the key on the CRM side as well.

---

## 8. Category E — Communication (alert & report delivery)

These connectors are delivery targets for `09-tasks-alerts-insights.md`
(alerts) and `07-reports.md` (scheduled reports). **V1: Slack + Email (SMTP).**
The legacy Telegram notifier in `src/lib/scheduler.ts` is replaced by this
category (migration path in `15-roadmap-prioritization.md`).

### 8.1 Slack (V1)

- **Auth.** OAuth (Slack app); bot token `xoxb-…` + incoming-webhook.
  Agency-global bind (one workspace), with per-channel routing configured on
  each alert/report.
- **Scopes.** `chat:write`, `incoming-webhook`, `channels:read` (for channel
  picker), `users:read.email` (optional, for assignment @-mentions).
- **Sync model.** `push_on_event` — no scheduled poll; the alert engine and
  the report scheduler invoke the adapter inline.
- **Data available.** None ingested; this connector is outbound only.
- **Error handling.** `channel_not_found`, `not_in_channel`, `rate_limited`
  (1 msg/sec/channel), app uninstalled → alert in `09` (the irony is flagged
  in the alert preview so the operator routes a backup channel).
- **Disconnect.** User warned: "Alerts and reports scheduled to Slack will
  stop delivering. Already-sent messages remain in your workspace history."
  OAuth revoked via Slack; encrypted bot token destroyed; channel routing
  config preserved (so reconnect is one click) but inactive.

### 8.2 Email (SMTP) (V1)

- **Auth.** SMTP host/port/user/password stored AES-256-GCM; TLS required
  (STARTTLS or SMTPS); per-connection envelope-from configurable.
- **Scopes.** N/A (credential-based).
- **Sync model.** `push_on_event`, outbound only.
- **Data available.** None ingested.
- **Error handling.** Auth rejected (credentials rotated at the SMTP host),
  recipient bounce, greylist timeout, TLS handshake failure → alert in `09`,
  with the failing recipient hidden in the captain-facing summary.
- **Disconnect.** User warned: "Email delivery of alerts and reports will
  stop." SMTP password destroyed; connection profile preserved for reconnect.

---

## 9. Category F — Data / automation

This category has **three MVP connectors that already ship today** (REST API,
MCP, basic outbound webhooks) plus two Enterprise-tier additions.

### 9.1 REST API (MVP — exists)

- **Auth.** Bearer token; SHA-256 hashed at rest in the existing `apiTokens`
  table (`schema.ts`); plaintext shown once at creation; revocation via
  `revokedAt` (`src/lib/mcp.ts` `verifyApiToken`).
- **What it enables.** Programmatic read of client/account performance,
  campaign management (write actions where the platform permits), used by
  operators to wire Winning Kart into their own automation, dashboards, and
  AI agents (PRODUCT.md Operating Context).
- **Disconnect.** Revoke in `12-settings.md` (or here); token hash preserved
  for audit; plaintext unrecoverable.

### 9.2 MCP (MVP — exists)

- **Auth.** Same Bearer token / `apiTokens` path as REST API (`src/lib/mcp.ts`,
  JSON-RPC 2.0 over HTTP, stateless). Used by opencode and other MCP clients
  to call `list_accounts`, `get_account_summary`, and the rest of
  `src/lib/meta-tools.ts`.
- **What it enables.** External AI agents authenticate once and call Winning
  Kart tools. Connection health is operational (the endpoint is the Winning
  Kart process itself).
- **Disconnect.** Same as REST API — revoke the underlying token; the MCP
  surface is always available while any token is live.

### 9.3 Webhooks — outbound (MVP — basic; richer events V1)

- **Auth.** Per-subscription HMAC secret; Winning Kart signs every outgoing
  POST with `X-WinningKart-Signature: sha256=<…>`; consumer verifies.
- **Scopes.** N/A (publisher-subscriber contract).
- **Sync model.** `push_on_event`. Events: campaign paused, alert raised,
  report generated, connector state change. Configurable per subscription.
- **Data available.** None ingested; outbound only.
- **Error handling.** Non-2xx responses retry with exponential backoff, then
  disable the subscription after N consecutive failures; surfaced as Amber
  here and as a `09` alert. Permanent consumer-side 4xx disables immediately.
- **Disconnect.** Subscription deleted; consumer expected to handle absence.
  HMAC secret destroyed.

### 9.4 Custom backend API (MVP, inbound revenue)

Per `06` §1.6 — Winning Kart issues a per-Client ingest key; the client posts
events to `POST /api/revenue/ingest` (push) or Winning Kart pulls a client-
defined REST URL. **MVP rationale:** agency clients may run custom stacks
(Next.js + own backend), not Shopify/Woo — revenue ingestion must work for
them at launch. Listed here because its *connection* (ingest key, AES-256-GCM
at rest, reusing the existing MCP/API token path) is owned by this surface;
its *contract* is owned by `06`.

### 9.5 Data warehouse export (Enterprise — V1+)

Three adapters, all Enterprise tier. Operator-side analytics / BI integration.

| Target | Auth | Cadence |
|---|---|---|
| **Postgres** | Connection string (TLS required), AES-256-GCM at rest | Hourly / daily append to a `winningkart_*` schema |
| **BigQuery** | Google Service Account JSON (write scope) | Hourly / daily streaming insert + daily partition |
| **Snowflake** | Account / user / warehouse / RSA keypair | Daily COPY INTO a Winning Kart database |

All three export the **canonical metric set** as star-schema tables (fact:
insights, revenue_events; dim: client, ad_account, campaign, ad_set, ad, date).
**Disconnect** for each: credentials destroyed; export job halted; the
operator is reminded to drop the receiving schema/warehouse objects on their
side.

---

## 10. Disconnect behavior — consolidated

The Disconnect flow is a danger-buttoned modal (shared §3.1) plus per-connector
wording. The rule is uniform across connectors: **destruction is of the
credential and the future sync job; never of already-attributed history.**

| Connector | What stops | What stays | Warning shown |
|---|---|---|---|
| Ad platforms (Meta + future) | Insights + structure sync | Spend history, attributed revenue, scheduled reports referencing the account | "Insights will stop refreshing; recorded performance and revenue remain." |
| Shopify / WooCommerce | Order ingestion | Already-attributed revenue | "New orders will not be matched; attributed revenue remains." |
| GA4 | Daily series pull | Already-imported series | "GA4 series will stop; recorded history remains." |
| HubSpot / Salesforce / Custom CRM | Deal ingestion | Already-attributed CRM revenue | "Closed-won deals will stop ingesting; attributed revenue remains." |
| Slack / SMTP | Alert + report delivery | Sent history (Slack) / sent mail log (SMTP) | "Future alerts and reports will not deliver." |
| Outbound webhook | Outbound pushes | Prior delivered payloads | "Consumer will stop receiving events." |
| REST API / MCP token | Programmatic access | Audit log of past calls | "Clients using this token will fail until rotated." |
| Data warehouse export | New exports | Already-exported warehouse rows | "New rows will not be written; existing warehouse data is yours to keep or drop." |

---

## 11. Reliability rollup (feeds `16`)

Per `06`'s tier vocabulary. Items here are connector *operational* limits,
complementary to the metric-level rollup in `06` §6.

| Item | Tier | Notes / API limit |
|---|---|---|
| Meta Marketing API | [API-direct] | App-level rate ceilings; 429 handling per `03` §6. System-user token preferred. |
| Google Ads API | [API-direct] | Developer token tiers (Basic / Standard); Standard requires Google review — flag for `16`. |
| TikTok / Snapchat / LinkedIn APIs | [API-direct] | Lower documented quota; longer backoff expected during scale — flag for `16`. |
| Shopify REST + GraphQL | [API-direct] | REST 40-bucket leak 2/sec; GraphQL 1000 points/sec — high-volume stores can throttle nightly reconciliation. |
| WooCommerce poll | [3rd-party-required] | No vendor SLA; depends on store hosting — flag unreliable for high-volume stores. |
| GA4 Data API | [API-direct] | 10M hits/property/day free tier; **sampling kicks in** above thresholds — flag for `16`. |
| HubSpot API | [API-direct] | Burst + daily quotas by subscription tier (Starter limits are tight). |
| Salesforce API | [API-direct] | Daily API request limit by edition (Enterprise 1M/day; Professional 1k/day) — flag for `16`. |
| Slack API | [API-direct] | 1 msg/sec/channel; short bursts allowed. |
| SMTP relay | [3rd-party-required] | Depends on provider (SendGrid / Postmark / self-hosted); no vendor SLA uniform across operators. |
| BigQuery / Snowflake export | [3rd-party-required] | Cost-based (BigQuery slots, Snowflake credits) — operator's bill, not a connector limit. |

---

## 12. Open questions for the captain

1. **Telegram deprecation.** The existing notifier (`src/lib/scheduler.ts`) is a
   Telegram-only path. Confirm it is fully replaced by the Communication
   category (Slack + SMTP), with a one-time migration of any operator's
   configured bot. Rationale lives in `15`.
2. **Per-Client vs agency-global default for GA4.** GA4 property is per-Client
   by default; some agencies share one GA4 property across clients. Confirm
   multi-Client binding is a V1+ stretch.
3. **Self-hosted webhook ingress.** Shopify/WooCommerce webhooks require a
   public HTTPS endpoint on the Winning Kart process. Confirm the operator
   always runs behind TLS (already required for the app); document the ingress
   pattern in `12-settings.md`.
4. **Data warehouse export billing posture.** BigQuery/Snowflake charges land
   on the operator's cloud bill, not Winning Kart's. Confirm we surface
   estimated row volume in the export config UI so the operator can size
   before enabling.
5. **Custom CRM field mapping.** Field mapping is done once at configure time
   and breaks when the CRM admin renames fields. Confirm we ship a schema-drift
   detector in V1 of the custom CRM connector, not V2.
6. **Enterprise gating.** Are BigQuery / Snowflake / Salesforce gated behind a
   license tier in the operator's instance, or available to all self-hosters
   with no enforcement? (Affects `15` packaging posture.)

---

*End of `10-integrations.md`. Honors `01` §3.3 (Integrations), §6 (one
question: "is everything wired and syncing"), §7 (AdPlatform seam generalized
to all connectors); `PRODUCT.md` self-hosted posture and admin-only back
office; `DESIGN.md` One-Accent, Warm-Semantics, Data-is-Sans, Eyebrow-Only,
status-as-dot, and no-emoji rules. No code touched.*
