# 12 — Settings

> Scope: the **Settings** surface — agency-instance operational control. Settings
> is **agency-global** and **configuration only** (anchor §6, Feature
> Non-Duplication Rules): no performance data, no metrics, no per-client KPIs.
> This is where the **operator runs their Winning Kart instance**: identity,
> defaults, licensing, retention, security posture, programmatic access, and
> auditability.
>
> Self-hosted by design (`PRODUCT.md`, `00-market-research.md`). Every control
> here runs on the operator's Postgres + Elysia/Bun process + Bun-cron; nothing in
> Settings requires a serverless or managed dependency.
>
> Status: DRAFT.
>
> Cross-references: `01-product-architecture.md` (anchor §3.3, §6), `PRODUCT.md`,
> `DESIGN.md`, `src/db/schema.ts`, `src/lib/crypto.ts`, `src/lib/mcp.ts`,
> `09-tasks-alerts-insights.md`, `10-integrations.md`,
> `11-team-permissions-client-portal.md`, `07-reports.md`, `13-data-model.md`,
> `15-roadmap-prioritization.md`.

---

## Per-page template (applied to every sub-page)

Each sub-page carries: **Purpose · Primary user · Fields & actions · States ·
Responsive · Related.**

State vocabulary is shared: **empty** (no data / first run), **loading**
(pending I/O), **error** (failed I/O with concrete message), **permission**
(insufficient role). Forms use the warm input style (`DESIGN.md` — Surface
fill, Rule-Strong 1px border, clay focus ring); the primary action is the
clay button; data values use tabular figures; no emoji or unicode-glyph icons.
All sub-pages are admin-only unless noted; non-admins see the **permission**
state.

---

## 1. Workspace

- **Purpose** — agency-instance identity and the defaults applied to new
  entities and to outbound artifacts (reports, invoices, exports).
- **Primary user** — agency admin.
- **Fields & actions**
  - **Agency name** — display name used in the sidebar wordmark fallback,
    report headers, and email footers.
  - **Default currency** — `AED` default; propagates to new clients and ad
    accounts (ad-account currency still overrides per `src/db/schema.ts`).
  - **Default timezone** — `Asia/Dubai` default; drives scheduler-local render
    of daily series and report timestamps.
  - **Default date preset** — applied on first login and to new report
    schedules (e.g., *Last 7 days*).
  - **Logo** — upload, stored against the agency record. The brand-accent-
    within-theme rule applies: the logo must read on `--paper` and `--surface`;
    the operator cannot introduce a second accent through the logo. SVG/PNG up
    to a bounded size; the authored clay-tile wordmark remains the fallback.
  - **Business profile** — legal name, address, TRN / UAE tax registration,
    primary contact, support email. Powers report footers and invoice headers.
  - **Actions** — Save (clay primary), Reset to defaults, Preview in report
    footer.
- **States** — **empty**: first-run bootstrap pre-seeded with AED / Asia/Dubai;
  **loading**: save in flight; **error**: logo rejected (size, format, contrast
  failure), name conflict; **permission**: non-admin.
- **Responsive** — single-column form; the logo preview sits beside the upload
  control at ≥980px and stacks below at smaller widths.
- **Related** — `07-reports.md` (white-label),
  `11-team-permissions-client-portal.md`.

---

## 2. Clients (pointer)

- **Purpose** — **global client defaults** only (default currency, timezone,
  primary-contact template, slug pattern, archived-client retention).
- **Primary user** — agency admin.
- **Detail lives in** `03-clients-ad-accounts.md`. The full client list,
  onboarding flow, per-client edit, and outward-consent rules are owned there;
  Settings only holds the defaults applied at client creation.
- **States** — defaults are always present (no true empty); **permission**:
  non-admin.
- **Responsive** — single-column form.
- **Related** — `03-clients-ad-accounts.md`, `13-data-model.md`.

---

## 3. Billing

- **Purpose** — **license and managed add-ons** for the Winning Kart instance
  itself, plus invoice history. Aligns with `15-roadmap-prioritization.md`
  enterprise tier.
- **Primary user** — agency admin who holds the license relationship.
- **What billing means for a self-hosted product** — billing here is *not* SaaS
  usage metering against the operator's own data. It covers two things only:
  (a) the **license** that unlocks the running instance at a plan tier, and
  (b) optional **managed add-ons** the operator subscribes to (managed
  backups, managed connect-proxy for restricted regions, priority support).
  It never meters clients, ad accounts, rows, or refreshes; the operator's
  data and compute are the operator's. A revoked or expired license degrades
  to the free tier's feature gates but **never deletes or withholds data** —
  the instance stays readable.
- **Fields & actions**
  - **License key** — apply / replace; validated against the licensing service
    (one outbound call, fail-closed with grace window if unreachable).
  - **Plan tier** — read-only display derived from the key (Free / Pro /
    Enterprise); drives feature gates surfaced across Settings.
  - **Seats** — allotted vs in-use (read from
    `11-team-permissions-client-portal.md`).
  - **Renewal / expiry** — date and grace window; surfaces a warning banner 14
    days before expiry.
  - **Managed add-ons** — subscribe / unsubscribe; per-add-on status, price,
    next billing date.
  - **Invoice history** — date, period, amount, plan/add-on, downloadable PDF;
    CSV export of the table.
- **States** — **empty**: no license applied; instance runs in Free tier with
  gates visible; **loading**: validating key; **error**: invalid / expired key,
  grace-period warning, outbound license service unreachable; **permission**:
  non-admin.
- **Responsive** — table on top, key form below; numeric columns collapse to a
  stacked list under 760px (no fabricated card view; `DESIGN.md`).
- **Related** — `15-roadmap-prioritization.md`, `00-market-research.md`,
  `PRODUCT.md`.

---

## 4. Team (pointer)

- **Purpose** — list, invite, assign clients, revoke agency users.
- **Primary user** — agency admin.
- **Detail lives in** `11-team-permissions-client-portal.md`. The Settings
  entry is a deep link; no duplicate surface.
- **States** — **permission**: non-admin.
- **Related** — `11-team-permissions-client-portal.md`.

---

## 5. Roles (pointer)

- **Purpose** — RBAC matrix (admin / staff / analyst / read-only / client) and
  per-role permission editing.
- **Primary user** — agency admin.
- **Detail lives in** `11-team-permissions-client-portal.md`. Settings links
  in and does not restate the matrix.
- **States** — **permission**: non-admin.
- **Related** — `11-team-permissions-client-portal.md`.

---

## 6. Notifications

- **Purpose** — how alerts and tasks surface to humans. Aligns with
  `09-tasks-alerts-insights.md` severity vocabulary.
- **Primary user** — agency admin (workspace defaults); each user (personal
  overrides).
- **Fields & actions**
  - **Channels** — in-app (always on), email, Slack (webhook URL validated).
  - **Per-workspace defaults** — severity threshold per channel (Critical /
    High / Medium / Low), digest cadence (Realtime / Hourly / Daily /
    Weekly), quiet-hours window in the workspace timezone.
  - **Per-user overrides** — each user may tighten (never loosen) the
    workspace defaults, pick a personal cadence, and set personal quiet hours.
  - **Alert severity thresholds** — derived from the four severities defined
    in `09-tasks-alerts-insights.md`; e.g., email only for High and above,
    Slack only for Critical.
  - **Actions** — Send test notification (per channel), Reset to workspace
    default, Mute (bounded).
- **States** — **empty**: no overrides set; defaults to in-app Realtime on
  Critical only; **loading**: test send in flight; **error**: Slack webhook
  401 / failure, email bounce, channel disabled; **permission**: admin edits
  workspace defaults; any signed-in user edits own overrides.
- **Responsive** — two-column matrix at ≥980px, stacked at smaller widths.
- **Related** — `09-tasks-alerts-insights.md`, `10-integrations.md` (Slack).

---

## 7. Integrations (pointer)

- **Purpose** — entry to the connectors hub (ad platforms, revenue sources,
  communication, automation).
- **Primary user** — agency admin.
- **Detail lives in** `10-integrations.md`. Settings links in; the only
  Settings-local control is the **notification-channel reuse** flag for Slack
  connectors (whether a Slack integration doubles as a notification channel).
- **States** — **permission**: non-admin.
- **Related** — `10-integrations.md`, `06-attribution-revenue.md`.

---

## 8. Data retention

- **Purpose** — how long data is kept and how the operator answers a
  data-subject request. **Data ownership is a selling point**: Winning Kart
  ships no telemetry, the operator holds the database, and these controls
  make that fact auditable.
- **Primary user** — agency admin (policy); operator / DPO (export/delete
  execution).
- **GDPR / UAE PDPL posture** — data residency is the operator's choice
  (UAE-first by default given the Asia/Dubai / AED defaults); the right to
  access and the right to be forgotten are executed **by the operator**,
  through the export and delete tools on this page, against the operator's
  own Postgres. No Winning Kart process reads customer data out of the
  instance.
- **Fields & actions**
  - **Raw insights retention** — days of row-level insights kept before
    roll-up. **Default: 90 days.**
  - **Aggregate / daily roll-up retention** — days of rolled-up daily series
    retained. **Default: 2555 days (~7 years)** for compliance-grade history.
  - **Token storage policy** — read-only statement: Meta and platform tokens
    are AES-256-GCM encrypted at rest (`src/lib/crypto.ts`); a rotation
    reminder fires every 60 days.
  - **Export all** — generates a JSON + CSV bundle scoped to one client or
    the whole agency (insights, plans, reports metadata, audit events).
  - **Delete on request** — soft-delete → 30-day grace (recoverable) → hard
    delete. Each step writes an audit event; hard delete is irreversible and
    requires re-typing the entity name.
- **States** — **empty**: first-run defaults applied (no true empty);
  **loading**: export bundle generating (long-running, with progress);
  **error**: export generation failed, disk-space warning, delete blocked by
  outstanding dependencies; **permission**: admin.
- **Responsive** — single-column form; export history table collapses to
  stacked rows under 760px.
- **Related** — `11-team-permissions-client-portal.md` (audit),
  `13-data-model.md`.

---

## 9. API keys & Webhooks

- **Purpose** — programmatic access (MCP API tokens, already in
  `src/db/schema.ts` and `src/lib/mcp.ts`) and outbound event subscriptions
  (webhooks).
- **Primary user** — agency admin (token admin); ops / integration engineer
  (consumer).
- **Fields & actions**
  - **API tokens** — name, SHA-256 hash at rest, `createdAt`, `lastUsedAt`,
    `revokedAt`. Generate issues a plaintext shown **once**; revoke is
    irreversible; tokens never expire automatically but a 90-day rotation
    reminder is shown.
  - **Scopes** — `read:insights`, `read:accounts`, `read:clients`,
    `write:campaigns` (where the platform write-API permits). Scopes available
    per token are bounded by plan tier and the creating admin's role.
  - **Webhook endpoints** — URL, signing secret, subscribed events (e.g.,
    `insights.refreshed`, `alert.raised`, `token.expired`), last delivery
    timestamp, last HTTP status, recent delivery log.
  - **Rate limit** — per-token budget (default 60 req/min, configurable per
    token up to plan ceiling); 429 with `Retry-After` on breach.
  - **Actions** — Generate token, Revoke token, Test webhook (signed ping),
    View delivery log, Rotate signing secret.
- **States** — **empty**: no tokens — MCP disabled and a banner explains how
  to enable; **loading**: token generation / webhook ping in flight;
  **error**: revoke failed, webhook delivery 5xx streak (auto-paused after 10
  consecutive failures), duplicate URL; **permission**: admin.
- **Responsive** — two stacked tables (tokens, webhooks); columns scroll
  horizontally under 760px per `DESIGN.md`.
- **Related** — `PRODUCT.md` (MCP), `src/lib/mcp.ts`, `10-integrations.md`.

---

## 10. Branding / White-label (pointer)

- **Purpose** — client-facing brand customization.
- **Primary user** — agency admin.
- **Detail lives in** `07-reports.md` (white-label section). Settings links in
  and re-states only the **brand-accent-within-theme rule**: the operator may
  swap the wordmark, set a client-portal accent, and configure a custom domain
  (enterprise tier, `15-roadmap-prioritization.md`), but the accent stays
  within the clay family per the One Accent Rule (`DESIGN.md`). No second hue
  is introduced through white-label.
- **States** — **permission**: non-admin.
- **Related** — `07-reports.md`, `DESIGN.md`, `15-roadmap-prioritization.md`.

---

## 11. Security

- **Purpose** — harden access to the instance.
- **Primary user** — agency admin.
- **Fields & actions**
  - **MFA policy** — required / optional, grace enrollment window,
    recovery-code generation on enable.
  - **Password policy** — min length, complexity, rotation, breach-list check
    (bounded offline list; no third-party dependency).
  - **Session timeout** — sliding window, default 8h; "remember device"
    optional and bounded.
  - **IP allow-list** — CIDR entries, evaluated at the auth layer; enterprise
    tier. The list warns when it would block the editing admin.
  - **SSO** — SAML / OIDC metadata upload or URL; enterprise tier. Mapping to
    agency roles is configured here.
  - **Token rotation** — Meta token rotation cadence (default 60 days, matches
    `src/lib/crypto.ts` posture), API-token rotation reminder (90 days).
- **States** — **empty**: first-run defaults (MFA optional, 8h session);
  **loading**: SSO metadata fetch in flight; **error**: metadata invalid, IP
  list would block self, password rejected by policy; **permission**: admin.
- **Responsive** — single-column form; SSO metadata section collapses by
  default behind a labeled toggle (progressive disclosure, anchor §5.2).
- **Related** — `11-team-permissions-client-portal.md`, `13-data-model.md`,
  `src/lib/crypto.ts`.

---

## 12. Audit logs

- **Purpose** — the who-did-what trail for the instance. Aligns with
  `11-team-permissions-client-portal.md`.
- **Primary user** — agency admin; DPO / operator for export.
- **Fields & filters**
  - **Columns** — timestamp (tabular), actor (user or token name), action,
    target entity (type + id), outcome, IP, user-agent.
  - **Filters** — actor, action category, target type, date range, outcome.
  - **Export** — CSV, signed (SHA-256 over the rendered file).
- **Retention** — owned by the **Data retention** policy; audit events use the
  aggregate retention default (2555 days / ~7 years) so deletion events remain
  provable for the compliance window.
- **States** — **empty**: fresh install with only bootstrap events;
  **loading**: filter / query in flight; **error**: query timeout, export
  failed; **permission**: admin.
- **Responsive** — full ledger table with horizontal scroll under 760px;
  filter bar collapses to a drawer.
- **Related** — `11-team-permissions-client-portal.md`, `13-data-model.md`.

---

## Self-hosted operations

This surface is the operator's control of a self-hosted instance, not a tenant
panel inside a hosted product. Three consequences run through every sub-page:

1. **Env config vs in-app config** — secrets and infrastructure wiring live
   in environment variables read once at boot (`DATABASE_URL`,
   `ENCRYPTION_KEY` per `src/lib/crypto.ts`, scheduler cron expressions,
   port, logging level). These are **never editable in-app**. Everything else
   — workspace identity, defaults, retention policy, notification rules,
   token and webhook state, security posture — lives in Postgres and is
   edited through Settings. The boundary is: *if changing it would require a
   restart, it is env config; if it can take effect on the next request, it
   is in-app config.*

2. **Backup of the Postgres store** — the operator's responsibility and
   explicitly called out on the Data retention page. Recommended posture:
   nightly `pg_dump` plus WAL archiving for point-in-time recovery; encrypted
   off-host copy; periodic restore test. Winning Kart does not require a
   managed Postgres service — any standard Postgres deployment works (dev runs
   on Neon; production is self-hosted Postgres on the VPS per the locked stack),
   and the schema (in `packages/db`) is portable.

3. **Scheduler (Bun cron) controls** — Bun's native cron runs in-process
   (`PRODUCT.md`); the Workspace page surfaces a read-only view of active
   jobs (token refresh, scheduled reports, alert evaluation, retention
   sweep) with last-run / next-run timestamps and per-job pause/resume. No
   external queue, worker fleet, or managed scheduler is required.
   Automation beyond data sync belongs to the operator's Hermes agent via a
   personal access token (see `README.md` locked decisions) — the platform
   ships no speculative automation logic.

**Governing principle.** Nothing in Settings — and therefore nothing in the
day-to-day operation of the instance — **requires a serverless function, a
managed database, or a hosted dependency**. The entire Settings surface
operates on the operator's Postgres, the operator's Elysia (Bun) process, and
the operator's Bun-cron. This is the self-hosted posture from `PRODUCT.md` and
`00-market-research.md`, made concrete and auditable. Deployment is managed by
Coolify (Traefik proxy, auto SSL, Docker-label routing) on a generic VPS —
Hostinger, AWS EC2, or DigitalOcean.

---

*End of `12-settings.md`. Inherits the anchor (`01-product-architecture.md`);
no performance data lives here (anchor §6).*
