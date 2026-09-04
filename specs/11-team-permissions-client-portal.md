# 11 — Team & Permissions + Client Portal Scope

> Status: DRAFT (crewmate done, pending first-mate review) · Scope: capt. §19,
> §20, F, H · Source code untouched; this doc proposes a non-breaking RBAC
> extension only.
>
> Binding dependencies: `spec/01-product-architecture.md` (esp. §3.3 Team &
> Permissions nav item, §3.5 Client Portal nav, §4 application shell, §6
> non-duplication table — "Team & Permissions: no performance data at all,
> RBAC only"), `spec/README.md` (per-page template), `PRODUCT.md`, `DESIGN.md`
> (role-tag styles: Admin = clay-tint / clay-ink; Client = neutral surface /
> ink-2 / hairline — no new hues).
>
> Code grounded against: `src/db/schema.ts` (`clientRole` enum is today
> `["admin", "client"]`; `clients`, `ad_accounts`, `api_tokens` tables),
> `src/lib/auth.ts` (jose JWT, HS256, `wk_session` httpOnly cookie, 7-day TTL,
> `requireAdmin` / `requireAdAccountAccess` guards), `src/lib/password.ts`
> (bcrypt, 12 rounds).
>
> Companion specs: write-action gates inherit `spec/04-campaigns-adsets-ads.md`
> §6; cost/margin visibility rules inherit `spec/06-attribution-revenue.md`
> §5.3; security policy + audit-log surfaces align with the future
> `spec/12-settings.md`.

---

## 0. Cross-cutting rules

### 0.1 Non-breaking extension principle

Today there are exactly two roles in the `client_role` enum (`admin`,
`client`) and a single `clients` table holds both agency users and client
users. This doc specifies a **full RBAC matrix without breaking what exists**:

- The existing `admin` enum value is preserved and becomes the storage tier
  that all five **agency-side** roles (Owner, Admin, Account Manager,
  Marketer, Analyst) authenticate as. A new nullable `agency_role` column
  discriminates among them; absent or `admin` = the legacy full-admin.
- The existing `client` enum value is preserved and becomes the storage tier
  that both **client-side** roles (Client Admin, Client Viewer) authenticate
  as. A new nullable `client_role_tier` column discriminates; absent or
  `admin` = the legacy client who could see their own workspace.
- The `requireAdmin` / `requireAdAccountAccess` guards in `auth.ts` keep
  working unchanged; finer checks layer **on top of** them, not in place of
  them. Migration is additive and is detailed in §9.

### 0.2 What this surface is NOT (anchor §6)

Team & Permissions is **RBAC only**. No performance data, no spend/ROAS
columns on the Members table, no per-user KPIs. The Members list shows
identity, role, assignment, status, and last activity — never performance.

### 0.3 Role-tag styling (binding, `DESIGN.md`)

All five agency-side roles render with the **Admin tag** style
(`background: clay-tint #f3e2d6; color: clay-ink #8f3f25`). The two
client-side roles render with the **Client tag** style (`background: surface;
color: ink-2; hairline border`). Differentiation between, say, Agency Owner
and Analyst is **by text label**, never by introducing a new hue. There is no
per-role color; clay stays the single accent.

---

## 1. Roles

Seven roles, mapped to today's two-tier model. The captain's candidate list is
adopted in full; deviations are listed in §10.

| Role | Side | Today's enum | Discriminator | One-line identity |
|---|---|---|---|---|
| **Agency Owner** | agency | `admin` | `agency_role = owner` | First admin; full access including billing + settings ownership. |
| **Admin** | agency | `admin` | `agency_role = admin` (default) | Day-to-day management across the book; not billing owner unless granted. |
| **Account Manager** | agency | `admin` | `agency_role = account_manager` | Manages a defined set of assigned clients end-to-end. |
| **Marketer** | agency | `admin` | `agency_role = marketer` | Campaign analytics + optimization (write actions per `04` §6 gates). |
| **Analyst** | agency | `admin` | `agency_role = analyst` | Read + analyze, no writes. |
| **Client Admin** | client | `client` | `client_role_tier = admin` (default) | Manages their own client workspace config + their own client users. |
| **Client Viewer** | client | `client` | `client_role_tier = viewer` | Read-only Client Portal. |

### 1.1 Agency Owner

- **Who:** the operator who runs this Winning Kart instance. Typically one
  person; the first `admin` row seeded in the database.
- **CAN access:** all 16 agency nav items (anchor §3.4), every client
  workspace, all Administration including **billing ownership** and the
  workspace-level Settings (security policy, retention, API tokens,
  white-label, audit log). Can assign and revoke every other role, including
  transferring Ownership.
- **CANNOT:** nothing on the agency side. The only boundary is that Ownership
  transfer is itself audited and requires a second confirmation (§8).

### 1.2 Admin

- **Who:** a senior agency operator — the legacy `admin`. Functionally
  indistinguishable from Owner on the performance and client-management
  surface.
- **CAN access:** all 16 agency nav items; full read + write across every
  client workspace; manage clients, ad accounts, integrations, reports,
  marketing plans; invite Team members and assign roles **except** Owner.
- **CANNOT:** own billing by default (Settings → Billing sub-page is
  read-only or hidden unless the Owner explicitly grants billing authority to
  this individual); transfer Ownership; revoke the Owner.

### 1.3 Account Manager

- **Who:** the lead on a portfolio of clients. Identity is "owns the
  relationship with client X, Y, Z."
- **CAN access (scoped to assigned clients):** Clients (their entries only),
  the full Client Workspace (Ad Accounts, Campaigns, Ad Sets, Ads & Creatives,
  Analytics, Audiences, Budget & Pacing, Attribution & Revenue, Marketing
  Plans), Reports (for their clients), Alerts & Tasks (for their clients).
  Overview renders but is filtered to their clients.
- **CANNOT:** see unassigned clients or their performance; manage agency-wide
  Integrations; open Team & Permissions; open Settings (except their own
  profile); connect or disconnect ad accounts outside their roster; manage
  billing. Client-scoping is enforced at the query layer — a Client row they
  are not assigned to returns 404, not 403, to avoid leaking roster
  existence.

### 1.4 Marketer

- **Who:** the hands-on media buyer / optimizer. Narrower than Account
  Manager: focused on the campaign entity chain and the optimization actions
  on it.
- **CAN access (scoped to assigned clients):** Campaigns, Ad Sets, Ads &
  Creatives, Analytics, Audiences, Budget & Pacing — **with write actions**,
  subject to the gates in `04` §6 (Pause/Resume V1, budget edit V1.x, all
  gated by confirmation UX + audit log). Can read Reports and Marketing Plans
  for context; can create tasks (`09`).
- **CANNOT:** manage the Clients roster (create/archive a client), author
  Marketing Plans, manage Integrations, manage attribution configuration
  (they see outcomes, not ingestion — same rule as clients in `06`),
  open Team & Permissions or Settings, see unassigned clients, perform bulk
  budget edits until single-edit is proven (`04` §6).

### 1.5 Analyst

- **Who:** the read-only power reader. Investigates, slices, exports, reports
  — never mutates state.
- **CAN access (scoped to assigned clients, or all clients if the agency
  configures a book-wide Analyst):** the full Client Workspace read surface,
  Analytics (the primary tool), Reports (read + export), Overview, Alerts &
  Tasks (read + acknowledge, no task assignment). Can save and share Analytics
  views.
- **CANNOT:** perform any write action in `04` §6 (no pause/resume, no budget
  edit, no creative refresh); create tasks; manage clients, ad accounts,
  integrations, plans, team, or settings. Every `POST`/write endpoint refuses
  with 403.

### 1.6 Client Admin

- **Who:** a login on the **client side** who represents the brand. Typically
  the client's marketing lead. The legacy `client` row behaves as this by
  default.
- **CAN access:** the six Client Portal nav items (anchor §3.5: Dashboard,
  Campaigns, Ads & Creatives, Analytics, Reports, Settings) for **their own
  client only**; within Settings, manage their own notification preferences
  and password; **invite and manage Client Viewer accounts that belong to
  their own client** (they cannot create agency users or viewers for other
  clients).
- **CANNOT:** see any other client; see any of the 10 hidden surfaces listed
  in §3.2; see the field-level data the agency has withheld (§3.3).

### 1.7 Client Viewer

- **Who:** a read-only client-side login — a client's stakeholder who should
  see the numbers but touch nothing (a finance lead, an exec sponsor).
- **CAN access:** the six Client Portal nav items, read-only.
- **CANNOT:** manage any users or settings other than their own password and
  notification preferences; export is gated by the agency's per-client toggle
  (§3.3); no write actions of any kind.

---

## 2. Permission matrix

Rows = nav items and key actions; columns = the seven roles. Cell values:
**Allow**, **Deny**, **Scoped** (scoped = allowed only against the user's
assigned clients, or for client roles, only their own client). Field-level
visibility lives in §3.3, not here.

| Surface / Action | Owner | Admin | Account Manager | Marketer | Analyst | Client Admin | Client Viewer |
|---|---|---|---|---|---|---|---|
| Overview (portfolio pulse) | Allow | Allow | Scoped | Scoped | Scoped | Portal Dashboard | Portal Dashboard |
| Alerts & Tasks | Allow | Allow | Scoped | Scoped (ack only) | Scoped (read + ack) | Deny | Deny |
| Clients (roster management) | Allow | Allow | Scoped | Deny | Deny | Deny | Deny |
| Ad Accounts (connect/manage) | Allow | Allow | Scoped | Deny | Deny | Deny | Deny |
| Campaigns — read | Allow | Allow | Scoped | Scoped | Scoped | Portal (own) | Portal (own) |
| Campaigns — write (pause/budget, `04` §6) | Allow | Allow | Scoped | Scoped | **Deny** | Deny | Deny |
| Ad Sets — read/write | Allow | Allow | Scoped | Scoped | read only | Deny | Deny |
| Ads & Creatives — read | Allow | Allow | Scoped | Scoped | Scoped | Portal (own) | Portal (own) |
| Ads & Creatives — write / refresh | Allow | Allow | Scoped | Scoped | Deny | Deny | Deny |
| Analytics (cross-cutting) | Allow | Allow | Scoped | Scoped | Allow (primary) | Portal (simplified) | Portal (simplified) |
| Audiences | Allow | Allow | Scoped | Scoped | read only | Deny | Deny |
| Budget & Pacing | Allow | Allow | Scoped | Scoped | read only | Deny (internals) | Deny (internals) |
| Attribution & Revenue — config | Allow | Allow | Scoped | Deny | read only | Deny | Deny |
| Attribution & Revenue — outcomes | Allow | Allow | Scoped | read only | Allow | Per §3.3 | Per §3.3 |
| Marketing Plans — author | Allow | Allow | Scoped | Deny | Deny | Deny | Deny |
| Marketing Plans — review shared | Allow | Allow | Scoped | read only | read only | Allow (shared) | Allow (shared) |
| Reports — author/schedule | Allow | Allow | Scoped | Deny | read only | Deny | Deny |
| Reports — consume shared | Allow | Allow | Allow | Allow | Allow | Allow | Allow |
| Integrations | Allow | Allow | Deny | Deny | Deny | Deny | Deny |
| Team & Permissions | Allow | Allow | Deny | Deny | Deny | Own users only | Deny |
| Settings — workspace/billing | Allow | Scoped (billing w/ grant) | Deny | Deny | Deny | Deny | Deny |
| Settings — own profile/password/notifications | Allow | Allow | Allow | Allow | Allow | Allow | Allow |
| Manage API tokens | Allow | Allow | Deny | Deny | Deny | Deny | Deny |
| View cost / margin / profit | Allow | Allow | Scoped | Scoped | Scoped | Per-client toggle (§3.3) | Per-client toggle (§3.3) |
| Data export | Allow | Allow | Scoped | Scoped | Scoped | Per-client toggle | Deny by default |
| Audit log (read) | Allow | Allow | Deny | Deny | Deny | Deny | Deny |

---

## 3. Client Portal scope (capt. §20, F, H)

The Client Portal is the deliberately reduced surface a `client`-role login
sees. It is read-mostly, trust-focused, and hides the back office entirely
(anchor §3.5). Its nav is six items: **Dashboard, Campaigns, Ads & Creatives,
Analytics, Reports, Settings**.

### 3.1 What clients CAN see

- **Dashboard:** their own spend, revenue, ROAS, purchases, CPA — the hero
  metrics — over the agency-set date range, with a simple compare toggle.
- **Campaigns:** read-only performance table for their own campaigns
  (default columns per `04` §1.2, minus any withheld fields per §3.3).
- **Ads & Creatives:** read-only gallery subset (thumbnail, format, ROAS,
  spend, revenue, frequency) — the gallery is the trust surface, not an
  optimization tool.
- **Analytics:** simplified dimensions (campaign, ad set, creative, time);
  no audience-library or placement-authoring; exploration only.
- **Reports:** only the reports the agency has explicitly shared with them
  (`07`). This is the curated communication channel.
- **Marketing Plans:** the **summary** of a plan the agency has shared
  (`08`), not the authoring surface.
- **Recommendations:** only the items in `09` the agency has marked
  client-relevant (e.g., "we recommend refreshing creative next week"), never
  the internal work queue.
- **Settings:** their own profile, password, notification preferences. Client
  Admin additionally manages their own client's Viewer accounts.

### 3.2 What is HIDDEN from clients

The following agency surfaces are unreachable from any client-role route and
return 404 (not 403, to avoid confirming existence):

- **Clients** (the roster — a client never sees the agency's other clients).
- **Ad Accounts management** (connect/disconnect, token health, refresh
  status). Clients see ad-account *outcomes* inside Campaigns, never the
  connection plumbing.
- **Budget & Pacing internals** (monthly caps, pacing %, projected month-end
  spend, spend-cap headroom). Clients see spend that happened, not pacing
  control.
- **Attribution config + ingestion** (revenue-source wiring, model selection,
  offline upload, model limitations). Clients see attributed outcomes, never
  ingestion — the rule carried from `06`.
- **Integrations** (the entire connector catalog and sync log).
- **Team & Permissions** (the agency's user roster and matrix).
- **Alerts & Tasks internal queue** (the agency's "what should I do next"
  list). The client bell surfaces only their own client-relevant alerts.
- **Marketing Plans authoring** (goals → KPIs → budget → strategy). Shared
  summary only.
- **All Administration** (Settings → Workspace, Billing, Retention, API &
  Webhooks, White-label, Security, Audit log).
- **Ad Sets as a standalone surface.** The portal folds ad-set-level detail
  into the Campaigns drill-down rather than exposing the agency-side Ad Sets
  page with its targeting/placement/bid mechanics.

### 3.3 Field-level visibility (the exact hidden-from-client list)

These fields are hidden from every client-role login regardless of the
per-client cost/margin toggle, because they are operator-internal:

1. **Internal notes** on clients, campaigns, creatives (any free-text field
   marked `internal`).
2. **Other clients' data** — any cross-client aggregation, comparison, or
   roster metadata. Enforced at the query layer, not the UI.
3. **Token / connection diagnostics** — encrypted-token status, refresh
   timestamps, error states, Business Manager / page / pixel IDs.
4. **Pacing internals** — pacing %, projected month-end spend, spend-cap
   headroom, monthly-cap configuration.
5. **Spend-share %** within a parent cohort (an operator diagnostic, not a
   client metric).
6. **Cost-per-action-type breakdowns** the agency has marked withheld
   (carried from `04` §1 Permission line).
7. **Audit log** content beyond the client's own login history.

**The agency-controlled cost/margin/profit toggle.** Per `06` §5.3, profit,
margin %, profit-ROAS, profit-CPA, COGS, and margin rules are **default off**
for client roles ("margin is operator-sensitive"). The toggle lives on the
client record (managed in `03`) and is named **"Share cost & margin with this
client."** When **off** (default), the portal hides: cost (COGS), margin %,
profit, profit-ROAS, profit-CPA, and any margin-rule detail. When **on**, the
portal surfaces those fields read-only inside Dashboard and Analytics. The
toggle is per-client, not per-Viewer — a Client Admin and a Client Viewer for
the same client see the same field set.

---

## 4. Members page (per-page template)

Sub-page of Team & Permissions. Agency-side; client roles never reach it.

| Field | Value |
|---|---|
| **Purpose** | Manage agency-side members: invite, assign role, assign clients, revoke. |
| **Primary user** | Agency Owner, Admin. |
| **Goal** | Keep the roster current and least-privilege. |
| **Primary CTA** | **Invite member** (email + role + optional client assignment). |
| **KPI cards** | None (anchor §6: no performance data here). Count chips only: total members, by role. |
| **Tables** | Members ledger: name, email, role tag (clay-tint/clay-ink), client assignments, status (Active / Invited / Suspended), last active, created. |
| **Filters** | Role, Status, client assignment. |
| **Drill-down** | Row → member detail (assignments, audit trail for that user). |
| **Empty** | "No members yet." CTA: invite the first admin. |
| **Permission** | Owner/Admin: full. Others: 403. |
| **Next action** | Review any member whose last-active is > 30 days and suspend. |

---

## 5. Roles & matrix page (per-page template)

| Field | Value |
|---|---|
| **Purpose** | The read-only RBAC matrix from §2, rendered; the agency's source of truth for who can do what. |
| **Primary user** | Agency Owner, Admin. |
| **Goal** | Answer "what can role X do?" without reading code. |
| **Primary CTA** | **Edit client-portal scope** (jumps to §6 page). |
| **Tables** | The §2 matrix, with the seven role columns and a legend (Allow / Deny / Scoped). |
| **Filters** | Toggle agency roles vs client roles; highlight differences from default. |
| **Permission** | Owner/Admin: read. Edit is via the per-role permission policy (V2; V1 ships the fixed matrix). |

V1 ships the **fixed** matrix in §2 (roles are standard, not user-defined).
Custom roles and per-permission overrides are V2/Enterprise (§7).

---

## 6. Client portal scope page (per-page template)

| Field | Value |
|---|---|
| **Purpose** | The agency's control surface for what each client can see: the cost/margin toggle, the shared-reports and shared-plans registry, and the field-withhold preview. |
| **Primary user** | Agency Owner, Admin, Account Manager (scoped to their clients). |
| **Goal** | Set trust boundaries per client without editing code. |
| **Primary CTA** | **Edit a client's portal scope** (opens the client record in `03`). |
| **Tables** | Per-client roster: client name, cost/margin toggle state (Shared / Withheld), shared reports count, shared plans count, last changed by + when. |
| **Filters** | Toggle state, account manager. |
| **Permission** | Owner/Admin: all clients. Account Manager: their clients only. |
| **Next action** | Any client showing "Withheld" with a recent request from the Client Admin → review whether to share. |

---

## 7. Auth & security model

### 7.1 Sessions (existing, preserved)

Authentication is **jose JWT, HS256**, in an httpOnly `wk_session` cookie,
7-day TTL, `sameSite=lax`, `secure` in production (`src/lib/auth.ts`). The
session payload carries `sub` (user id) and `role` (`admin` / `client`). The
finer `agency_role` / `client_role_tier` discriminators are **loaded from the
database on each request** after `verifyToken` succeeds, not baked into the
JWT — so a role change takes effect on the next request, not the next login.
Passwords remain **bcrypt, 12 rounds** (`src/lib/password.ts`).

### 7.2 MFA (recommended V1)

**TOTP-based MFA (RFC 6238)** is recommended for V1, mandatory for Owner and
Admin, optional for other agency roles, off for client roles by default. The
secret is stored AES-256-GCM alongside the password hash (same envelope as ad
tokens). Recovery codes are one-time, hashed at rest. MFA is enforced after
password verification, before the session cookie is set. The existing
`requireAdmin` guard gains an `mfa_verified` check; failure reroutes to the
MFA challenge page.

### 7.3 Password reset

Standard email-based flow: a single-use, SHA-256-hashed reset token (same
storage pattern as `api_tokens`), 30-minute expiry, sent to the member's
address. Reset invalidates all existing sessions for that user. The Owner
account's email is pinned in Settings and cannot be orphaned.

### 7.4 Invite flow

Owner/Admin invites via email; the invite row carries the assigned role (and
client assignments for AM/Marketer/Analyst, or the bound client for Client
Admin/Viewer). The invitee sets their own password (and enrolls MFA if
required); the inviter never sees the password. Client Admins can invite
Client Viewers for their own client only, using the same flow scoped to a
single client id.

### 7.5 SSO (Enterprise)

**SAML 2.0 / OIDC** is an Enterprise-tier feature (V2+), mapped to the
agency-side roles. Client-side roles stay on email/password/MFA. SSO does not
bypass RBAC — it only replaces the password step; role assignment still
happens in Team & Permissions.

### 7.6 Security policy alignment

The instance-wide policy — password minimums, MFA requirement per role,
session length, IP allow-list (Enterprise), failed-login lockout — lives in
**Settings → Security** (`spec/12-settings.md`). Team & Permissions reads
that policy and enforces it on invite, role change, and login; it does not
own a parallel policy.

---

## 8. Audit log

### 8.1 Events recorded

Every state-changing and trust-relevant action appends an immutable,
append-only audit row. Minimum event set:

- **Auth:** login success, login failure, logout, MFA enroll/disable, password
  reset requested/consumed, session invalidated.
- **Membership:** member invited, invite accepted, role changed (old → new),
  client assignment changed, member suspended/revoked.
- **Role / scope:** client-portal cost/margin toggle flipped (old → new),
  shared-report or shared-plan visibility changed.
- **Connections:** ad account connected / disconnected / token refreshed
  (per `03`), integration connected / disconnected (per `10`).
- **Write actions:** every `04` §6 write (pause/resume, budget edit) with
  actor, target entity, old → new, and confirmation receipt.
- **Data exports:** each export with actor, surface, filter state, row count.
- **API tokens:** token created (with name), token revoked, token last-used
  is a separate periodic summary, not a per-call event.
- **Ownership:** Ownership transfer (two confirmations, both actor and target
  recorded).

### 8.2 Retention and access

- **Retention:** audit rows are retained for the period configured in
  Settings → Retention (default 24 months). Purging is a Settings-owned job,
  never a Team & Permissions action.
- **Who can view:** Owner and Admin (full log); Account Manager, Marketer,
  Analyst — no access; Client roles — only their own login history
  (Dashboard → Activity), never the agency log.
- **Integrity:** rows are append-only; no update or delete path exists in the
  application. Direct-DB tampering is out of scope (operator-trust boundary).

---

## 9. Migration from today's two-role model (non-breaking)

1. **Schema:** add nullable `agency_role` and `client_role_tier` columns to
   `clients`. Both default such that every existing row keeps behaving
   exactly as before: an `admin` row with null `agency_role` is treated as
   `admin` (full Admin); a `client` row with null `client_role_tier` is
   treated as `admin` (Client Admin).
2. **Seed Owner:** the first `admin` row by `created_at` is promoted to
   `agency_role = owner` in a one-time migration script. No other row's
   behavior changes.
3. **Auth guards:** `requireAdmin` and `requireAdAccountAccess` are
   unchanged. Finer role checks are added as new helpers
   (`requireAgencyRole(...)`, `requireClientOwnership(...)`) layered above
   the existing two.
4. **UI:** the role tag on existing admin rows stays clay-tint/clay-ink; the
   label text widens from "Admin" to the specific role label. Client tags
   stay neutral.
5. **No breaking API change:** any client consuming today's `role: admin |
   client` JWT continues to work; the new discriminators are server-side
   database reads, not JWT claims.

---

## 10. Deviations from the captain's candidate roles

The captain's candidate list of seven roles is adopted **in full**. Three
deliberate choices, each surfaced for review:

1. **Agency Owner vs Admin are two roles, not one.** The captain listed both.
   Today's enum has only `admin`; both Owner and Admin authenticate as
   `admin` and split on a new `agency_role` discriminator. The functional
   difference is narrow but meaningful: **billing ownership and Ownership
   transfer** are Owner-only by default. Keeping them distinct avoids the
   "any admin can cancel billing" problem without inventing a new auth tier.
2. **No separate "Read-only" agency role is added.** Anchor §3.3 sketched
   agency roles as "admin/staff/analyst/read-only" (four). The captain's
   candidate list replaces that sketch with five (Owner, Admin, AM, Marketer,
   Analyst). The Analyst role already covers read-only-analyze, and adding a
   sixth "Read-only" would duplicate Analyst's surface. This is a deliberate
   narrowing of the anchor's §3.3 sketch in favor of the captain's explicit
   candidate list; flag if the captain prefers Analyst and Read-only split.
3. **Client Admin vs Client Viewer split the legacy `client` row.** Today
   every `client` row can manage its own workspace equally. The spec
   preserves that (legacy clients become Client Admin by default) and adds
   Client Viewer as a genuine read-only tier. If the captain prefers a single
   undifferentiated client role, drop Client Viewer and the matrix collapses
   cleanly with no other change.

---

*End of `11-team-permissions-client-portal.md`. Inherits the anchor (`01`)
and `DESIGN.md`; conflicts defer to those. Write-action gates are owned by
`04` §6; cost/margin toggle by `06` §5.3; security policy + audit-log surface
align with `12-settings.md`. Schema extensions (the two nullable role
columns) route to `13-data-model.md`; any unreliably enforceable boundary
routes to `16-data-gaps-and-risks.md`.*
