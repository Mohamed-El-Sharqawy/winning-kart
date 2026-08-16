# Winning Kart

**The self-hosted performance-marketing platform for agencies.** Operator-owned data,
transparent attribution, a client portal worth trusting — run on infrastructure you control.

> This README is the product requirements document (PRD). Full 19-document product
> specification lives in the source workspace (`spec/`); this file is the buildable summary.

---

## 1. What Winning Kart is

A performance-marketing platform an agency runs on its own VPS against its own Postgres:

- **Agency-first multi-client hierarchy** — Agency → Client → Ad Account → Campaign → Ad Set → Ad/Creative.
- **Meta-first, platform-agnostic** — Meta Ads adapter today; Google, TikTok, Snapchat, LinkedIn are
  new adapters behind the same seam, never forks. Commerce is equally agnostic: Shopify (V1),
  WooCommerce (V2), and custom-backend revenue ingest from day one (MVP).
- **Transparent attribution** — platform-reported numbers labeled as such; WK-computed models
  (first/last/linear/time-decay/position) with match-quality tiers and a first-class Limitations
  tab. "Show your work" is the differentiator vs black-box incumbents.
- **Creative intelligence** — gallery, fatigue/anomaly detection (frequency + CTR decay + spend
  concentration), lifecycle classification, comparison.
- **A client portal clients trust at a glance** — read-mostly, plain-English, hides the back office.
- **MCP + REST API** with personal access tokens — the operator's automation (e.g. the Hermes
  agent) logs in as a normal user and works programmatically.

Primary users: **agency media buyers and account managers** (all day, every day) and **clients**
(a few times a week, trust-focused). Region: **UAE / AED / Asia-Dubai** defaults.

### Competitive thesis (condensed)

Every verified ads/attribution/reporting incumbent is cloud-only SaaS priced per-client or
per-spend. No incumbent ships a self-hosted Meta Ads dashboard with an agency hierarchy.
Winning Kart occupies that void: flat TCO, operator-owned encrypted tokens, data residency in
the operator's hands (PDPL/GDPR-aligned), premium UI.

## 2. The surfaces (one question per surface)

| Nav group | Surface | Its one question |
|---|---|---|
| Portfolio | Overview | What is happening right now? |
| Portfolio | Alerts & Tasks | What should I do next? |
| Portfolio | Clients | Who do we serve and how do I reach them? |
| Portfolio | Reports | How do I communicate this to the client? |
| Client workspace | Ad Accounts / Campaigns / Ad Sets / Ads & Creatives | Are connections healthy? Which campaigns/ targeting/ creatives caused it? |
| Client workspace | Analytics / Audiences / Budget & Pacing / Attribution & Revenue / Marketing Plans | Why? Which audiences? Spending correctly? Did spend produce revenue? What are we trying to achieve? |
| Administration | Integrations / Team & Permissions / Settings | Wired and syncing? Who can do what? How is the instance configured? |

Client Portal (read-mostly): Dashboard, Campaigns (read-only), Ads & Creatives (gallery),
Analytics (simplified), Reports (shared only), Settings (profile).

Every screen climbs **DATA → INSIGHT → DECISION → ACTION**; Overview and Alerts & Tasks must
reach ACTION. No surface duplicates another's question.

## 3. Stack (locked Aug 2026)

| Concern | Choice |
|---|---|
| Runtime / package manager | **Bun** (workspaces, no Turborepo) |
| Backend | **Elysia on Bun** — REST + **Eden Treaty** type export + MCP JSON-RPC + webhooks + Bun-cron sync |
| Backend structure | `modules/<domain>/{index,service,model}.ts` (controller / service / model) |
| Frontend | **React 19 + Vite** SPA, **TanStack Router** (typed/validated search params), **React Query v5** |
| Frontend structure | `pages/<page>/{components,hooks,services,types,dto,transformers,data}` + `shared/` + `lib/` |
| API client | **Eden Treaty** from `packages/api-client`, typed by the exported Elysia app |
| Styling | **Tailwind CSS v4 + shadcn/ui**, tokens in CSS-first `@theme` |
| Design direction | **Night Volt** — Vibrant/Bold: violet-black dark UI, volt-violet primary, lime-up/coral-down, Geist + Geist Mono, bold tabular numerals; light companion variant for reports/PDF |
| Charts | **TanStack Charts** |
| Database | **Postgres** via **Drizzle ORM** — Neon (dev, branch-per-feature), self-hosted Postgres (prod) |
| Auth | jose JWT (HS256, httpOnly cookie) + bcrypt + **personal access tokens** (Hermes automation) |
| Secrets | AES-256-GCM envelope (`lib/crypto`), operator-held `ENCRYPTION_KEY` |
| Deploy | **Coolify-managed Traefik** (auto SSL, Docker-label routing) on a generic VPS — Hostinger / AWS EC2 / DigitalOcean |
| E2E | Cypress mirroring `pages/` 1:1; fixtures match `dto/` wire shapes; `cy.loginAs(role)` helpers |

### Locked product decisions

D1 system-user Meta tokens · D2 write actions MCP-first (inline at V1.x) · D3 Overview order
KPI → Insights → Charts · D4 seven RBAC roles (Owner/Admin/AM/Marketer/Analyst/Client
Admin/Client Viewer) · D5 plan attainment bands 0.90/0.70 · D6 client rollup inherits global
date range (ecommerce-first) · D7 client enrichment as columns + explicit status · D8
attribution-model switch reflows all live surfaces. Standing amendments: every integration is
optional (zero-credential operation must work); automation beyond data sync belongs to Hermes
via PAT; **Meta CAPI** is the attribution-identity solution.

## 4. Roadmap

- **MVP** — portfolio pulse + insight engine, clients/ad accounts/Meta wizard, campaigns/ad
  sets/creatives + fatigue rules, tasks/alerts/recommendations, client portal v1, RBAC, audit
  log, retention, API tokens + PATs + MCP, platform + custom-backend revenue ingest.
- **V1** — Shopify + CAPI identity stitch + 5 attribution models + Limitations, full Reports
  (builder/schedules/white-label), Marketing Plans + Plan-vs-Actual, Budget & Pacing, Analytics
  pivots, Google Ads adapter, Slack/SMTP (optional), MFA, inline write rails.
- **V2** — TikTok/Snapchat/LinkedIn, WooCommerce/CRM/offline conversions, profit & margin,
  audience overlap, custom roles.
- **Enterprise** — SSO, IP allow-list, warehouse export, brand-accent white-label.

Milestones M0 (foundation) → M5 (operator hardening), each ending demonstrable.

## 5. Repository structure

```
apps/
  api/            Elysia on Bun (src/modules/<domain>/{index,service,model}.ts, lib/, platforms/, connectors/, dto/)
  dashboard/      React 19 + Vite (src/pages/<page>/…, shared/, lib/, routes/; docs/; cypress/)
packages/
  db/             Drizzle schema + migrations + seed (greenfield, per spec doc 13 catalog)
  api-client/     Eden Treaty client — treaty<App> typed by apps/api export
  ui/             Night Volt design system — @theme tokens + shadcn primitives
  config/         shared eslint (import boundaries) + tsconfig
```

Binding conventions live in `apps/dashboard/docs/` (architecture, dto-transformer-pattern,
conventions) and mirror the product spec's doc 17. Locality rule: page-local code never
crosses page boundaries; a second consumer promotes to `shared/` or a package.

## 6. Development

```bash
bun install                # install all workspaces
cp .env.example .env       # fill DATABASE_URL (Neon dev branch), ENCRYPTION_KEY, JWT_SECRET
bun run db:generate        # generate Drizzle migrations
bun run db:migrate         # apply
bun run db:seed            # seed demo clients/accounts/insights
bun run dev                # api (:3000) + dashboard (:5173) concurrently
bun run test:e2e           # cypress (dashboard)
```

## M1 — connecting a real Meta ad account

1. Create a Meta system user token with the scopes `ads_read`, `ads_management`,
   `business_management`, `read_insights`, `pages_read_engagement`, `catalogs_read`, tied to
   the `act_` account — via Meta Business Settings, per locked decision D1.
2. Open a client workspace → Ad Accounts → **Add ad account**.
3. Paste the name, the `act_` id, and the token.
4. The staged sync runs and campaign data lands in the workspace Campaigns tab.
5. The hourly cron keeps accounts fresh; `WK_SYNC_CRON=off` disables it.

The wording for every connection error comes from the wizard's error catalog.

## 7. Deployment

Production runs on a generic VPS (Hostinger / AWS EC2 / DigitalOcean) under **Coolify**: the
Traefik proxy terminates automatic Let's Encrypt SSL and routes by Docker labels — `/api` to
the Bun api container, everything else to the nginx-served dashboard SPA. Postgres runs on the
VPS host with nightly dumps and WAL archiving off-host; Neon is dev-only.

- Full setup guide: [`docs/deployment.md`](docs/deployment.md)
- Neon → self-hosted cutover runbook: [`docs/migration-runbook.md`](docs/migration-runbook.md)

## 8. Source documents

Product spec (19 documents) and the approved technical plan with the full decision record
live in the originating workspace (`spec/`, `.lavish/`). This README condenses them for the
repo; conflicts defer to the spec and the locked decisions above.
