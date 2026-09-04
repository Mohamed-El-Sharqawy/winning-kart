# Winning Kart — Product Specification (end-to-end)

This directory is the **complete product specification** for Winning Kart, produced
**before any implementation**. No source code is changed while these docs are open.
Each document is authored by a dispatched opencode/GLM-5.2 crewmate and reviewed by
the first mate for cross-document consistency.

> Status legend: TODO · IN FLIGHT · DRAFT (crewmate done, pending review) · REVIEWED · APPROVED

## Governing positioning (read first)

Winning Kart is a **self-hosted** performance-marketing platform for an agency and
its clients. It is deliberately **not dependent on serverless services** — it runs
on infrastructure the operator owns and controls, usable directly by internal users.
The competitive thesis is to cover the **gaps incumbents leave** (data ownership,
transparent attribution, client portal quality, creative intelligence, planning
combined with reporting) on a footing the captain's own agency uses in production.

- Primary platform today: **Meta Ads** (Facebook + Instagram) — system-user tokens (no expiry).
- Architected to extend later to Google, TikTok, Snapchat, LinkedIn Ads. Platform-agnostic
  across ad platforms and e-commerce (Shopify, WooCommerce, custom Next.js revenue ingest).
- Design language: **Night Volt — Vibrant/Bold** (locked Aug 2026): deep violet-black
  ground, volt-violet primary, lime-up / coral-down at full saturation, Geist + Geist
  Mono, bold tabular numerals. Implemented on **Tailwind CSS v4 + shadcn/ui** with
  CSS-first `@theme` tokens; reports/PDF render in a light companion variant. The old
  paper-and-clay theme is retired; `DESIGN.md` is authored fresh in Night Volt.
- Stack (updated Aug 2026 — fresh start, old repo archived): two-app **Bun workspaces
  monorepo** (no Turborepo) — backend **Elysia on Bun** (modules: controller/service/model;
  REST + **Eden Treaty** export + MCP JSON-RPC + inbound webhooks + Bun-cron sync), frontend
  **React 19 + Vite** SPA with **TanStack Router** (typed search params), **React Query v5**,
  **TanStack Charts**; **Drizzle ORM + Postgres** — Neon for dev, self-hosted Postgres in
  prod behind **Coolify-managed Traefik** on a generic VPS (Hostinger / AWS EC2 / DigitalOcean).
  jose JWT auth + personal access tokens (for the operator's Hermes automation agent),
  AES-256-GCM secrets. Every integration is optional — the platform runs with zero connector
  credentials configured. UAE / AED / Asia/Dubai.

## Document map (target sections A–M)

| # | File | Capt. section | Covers | Status |
|---|------|---------------|--------|--------|
| 00 | `00-market-research.md` | framing | Competitive landscape, incumbent gaps, self-hosted vs serverless split, positioning, pricing posture | DRAFT |
| 01 | `01-product-architecture.md` | 1,2,3,25,27 | Vision, navigation tree + justifications, global app shell (top bar, switchers, persistent filters), design principles, DATA→INSIGHT→DECISION→ACTION, feature non-duplication rules | DRAFT |
| 02 | `02-overview-executive-dashboard.md` | 4,26 | Overview page: KPI cards (with defs/calc/source/action), charts, actionable insights engine, dashboard design rules | DRAFT |
| 03 | `03-clients-ad-accounts.md` | 5,6 | Clients list + client workspace; Ad Accounts page; Meta connect onboarding flow + all error states | DRAFT |
| 04 | `04-campaigns-adsets-ads.md` | 7,8,9 | Campaign management + detail drill-down; Ad Set level + comparison; Ads & Creatives gallery + creative intelligence + fatigue detection | DRAFT |
| 05 | `05-analytics-audiences-budget.md` | 10,11,12 | Advanced Analytics (performance/audience/placement/time), Audiences analytics, Budget & Pacing | DRAFT |
| 06 | `06-attribution-revenue.md` | 13 | Attribution models + limitations; revenue ingestion (Shopify/Woo/CRM/API/offline); profit/margin/LTV where available | DRAFT |
| 07 | `07-reports.md` | 14,J | Client reporting system: templates, builder UX, blocks, scheduling, white-label, client portal delivery | DRAFT |
| 08 | `08-marketing-plans.md` | 15,K | Planning system: goals→KPIs→budget→strategy→campaigns; Plan vs Actual | DRAFT |
| 09 | `09-tasks-alerts-insights.md` | 16,17,I | Tasks/actions; intelligent alert center; prioritization by business impact; recommendation triggers/CTAs | DRAFT |
| 10 | `10-integrations.md` | 18 | Integrations center by category: connection flows, permissions, sync, errors, disconnect behavior | DRAFT |
| 11 | `11-team-permissions-client-portal.md` | 19,20,F,H | RBAC matrix; client-only portal scope and what is hidden from clients | DRAFT |
| 12 | `12-settings.md` | 21 | Settings tree: workspace, billing, roles, notifications, integrations, retention, API/webhooks, white-label, security, audit logs | DRAFT |
| 13 | `13-data-model.md` | 24,E | Domain model + relationships, grounded in the existing `src/db/schema.ts` | DRAFT |
| 14 | `14-ux-flows.md` | 22,D | Consolidated UX flows for every major feature (goal/steps/states/notifications/next action) | DRAFT |
| 15 | `15-roadmap-prioritization.md` | 28,L | MVP / V1 / V2 / Enterprise classification with rationale | DRAFT |
| 16 | `16-data-gaps-and-risks.md` | 23,M | Per-page data requirements + what is API-direct vs calculated vs 3rd-party vs client-provided vs not reliably available | DRAFT |
| 17 | `17-codebase-structure.md` | — | Codebase structure & locality: per-page directory layout (components/data/hooks/lib/utils/types), the locality rule, thin `page.tsx`, shared-vs-page-local promotion | REVIEWED |

## Reading order for crewmates

Every crewmate MUST read these first for grounding and consistency:
1. This `README.md` (including the fresh-start note below)
2. `spec/01-product-architecture.md` (shared navigation + terminology)
3. The rewritten `spec/17-codebase-structure.md` (the binding monorepo structure)

> **Fresh start (Aug 2026).** The previous Winning Kart repo was dumped. `PRODUCT.md`,
> `DESIGN.md`, and all `src/…` files referenced by older spec docs belonged to that
> archived project and do not exist here. Both docs will be authored fresh for this
> build. Anywhere docs 02–16 reference legacy paths (`src/db/schema.ts`,
> `src/lib/meta-api.ts`, `src/lib/crypto.ts`, `src/app/…`), read them as pointers to
> the equivalent module in the new monorepo per `spec/17-codebase-structure.md`
> (`packages/db` schema, `apps/api/src/platforms/meta`, `apps/api/src/lib/crypto`,
> dashboard `pages/…`), and treat the capabilities they describe as **rebuild scope**.

## Locked captain decisions (Aug 2026)

Product: D1 system-user Meta tokens · D2 write actions MCP-first, inline at V1.x ·
D3 Overview order KPI → Insights → Charts · D4 seven roles as specced · D5 attainment
bands 0.90/0.70 strict · D6 client rollup inherits the global date range (ecommerce-first
default) · D7 client enrichment as columns + explicit status field · D8 attribution-model
switch reflows all live surfaces. Stack: S1 TanStack Router · S2 Tailwind v4 + shadcn/ui
(`@theme` tokens) · S3 self-hosted Postgres in prod, Neon dev-only · S4 Bun workspaces
only (Turborepo retracted). Standing: automation is externalized to the operator's
Hermes agent via a personal access token; Meta **CAPI** is the attribution-identity
solution; every connector is optional by construction. Full record:
`.lavish/winning-kart-technical-plan.html` §12.

## Non-negotiables for every doc

- Honor the Night Volt design direction (Vibrant/Bold, dark; single primary accent,
  vivid up/down semantics, tabular figures, status as dot + word — no emoji). Client-facing
  reports/PDF use the light companion variant.
- Keep the Agency → Client → Ad Account → Campaign → Ad Set → Ad/Creative hierarchy explicit.
- Distinguish agency users vs client users on every surface.
- State, per page: purpose, primary user, goal, primary CTA, KPI cards, charts, tables,
  filters, drill-down, empty/loading/error/permission states, responsive behavior, export,
  related pages, recommended next action.
- Mark anything Meta cannot reliably provide in `16-data-gaps-and-risks.md`.
- No code. Markdown only.

## Open captain decisions (consolidated from crewmate reports)

These surfaced across the spec and need the captain's word before implementation:

1. **Meta token strategy** (doc 03) — system-user tokens (no expiry, needs business verification) vs 60-day user tokens (frequent reconnects). Drives the entire expired-token surface's frequency.
2. **Campaign write-action surface** (doc 04) — ship read/decide first and expose pause/budget edits via **MCP only** first, then inline dashboard writes? Or allow inline writes from day one?
3. **Overview layout order** (doc 02) — KPI → Insights → Charts (signal-first, recommended) vs KPI → Charts → Insights (traditional).
4. **RBAC shape** (doc 11) — keep Owner vs Admin as two roles? Keep Client Admin vs Client Viewer split, or one undifferentiated client role? Add a separate Read-only agency role alongside Analyst?
5. **Plan-vs-Actual thresholds** (doc 08) — default attainment bands 0.90 on-track / 0.70 at-risk (strict) vs looser (0.85/0.60).
6. **Client rollup window** (doc 03) — calendar month, trailing 30d, or the global Date range? And: does V1 serve lead-gen (keep Leads) or ecommerce-only?
7. **Client schema fields** (doc 03) — add `industry` / primary contact / assigned AM as columns on `clients`, or a separate attributes table? Is `client status` a new field or derived from ad-account status?
8. **Default attribution model reflow** (doc 14/06) — switching the default model re-flows Overview KPIs and live report blocks (recommended, avoids two numbers for one metric)?

The full draft set is complete and internally cross-referenced. No source code has been changed.
