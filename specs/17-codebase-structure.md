# 17 — Codebase Structure & Locality

> Scope: the directory convention that keeps Winning Kart clean, navigable,
> and maintainable as it grows toward V1 and beyond. **Binding on every page
> and route.** Companion to `01-product-architecture.md` (which governs the
> *product* structure); this doc governs the *code* structure.
>
> Status: REVISED (Aug 2026) — rewritten for the fresh-start two-app monorepo.
> The previous revision described the archived Next.js project; this structure
> supersedes it entirely and was specified by the captain.
>
> Cross-references: `01-product-architecture.md`, `README.md` (stack + locked
> decisions), `.lavish/winning-kart-technical-plan.html` §5.

---

## 0. The monorepo at a glance

Bun workspaces (no Turborepo). Two apps for now, plus shared packages:

- **`apps/api`** — Elysia on Bun. One process owning REST, the Eden Treaty
  type export, MCP JSON-RPC, inbound webhooks, and the data-sync cron.
- **`apps/dashboard`** — React 19 + Vite SPA. TanStack Router (typed/validated
  search params), React Query v5, Tailwind v4 + shadcn/ui.
- **`packages/db`** — Drizzle schema, migrations, seed.
- **`packages/api-client`** — Eden Treaty client (`treaty<App>`), typed by the
  app type exported from `apps/api`.
- **`packages/ui`** — design-system `@theme` tokens + primitives.
- **`packages/config`** — shared eslint (import boundaries), tsconfig.

---

## 1. Backend: `apps/api` — modules

Every domain is a **module** with the same three-file shape:

```
apps/api/src/
  index.ts              composition root — modules mounted, lifecycle
  modules/
    auth/
      index.ts          Elysia controller (routes, guards, DTO binding)
      service.ts        service (business logic, no HTTP concerns)
      model.ts          model (db access, Drizzle queries)
    user/
      index.ts · service.ts · model.ts
    clients/
      index.ts · service.ts · model.ts
    ad-accounts/  campaigns/  insights/  attribution/  reports/
    plans/  tasks/  settings/  mcp/   … same triple
  lib/                  auth (jose + PAT) · crypto (AES-256-GCM) · sync cron
  platforms/            meta/ — the first AdPlatform adapter
  connectors/           shopify/ · woo/ · custom-api/ · offline-csv/
  dto/                  shared request/response schemas (TypeBox)
```

Rules:

- **Controllers stay thin** — parse, guard, delegate to `service.ts`, return.
- **Services own logic**; **models own queries**. No HTTP types below
  `index.ts`; no Drizzle imports above `model.ts`.
- The **app type is exported** from `apps/api` so Eden Treaty in
  `packages/api-client` is fully typed end-to-end with zero codegen.
- Elysia best practices are followed (the `elysiajs/skills` pack is installed
  in the repo and consulted in review).

---

## 2. Frontend: `apps/dashboard` — pages

Code that serves a single page lives **next to that page**. The per-page
folder is uniform; only create the subfolders the page needs:

```
apps/dashboard/src/
  pages/
    clients/
      index.tsx                    page entry — layout + hooks wiring (THIN)
      components/
        ClientsTable.tsx
        ClientForm.tsx
        ClientFilters.tsx
      hooks/
        useClientFilters.ts        local UI state — filter/sort/pagination logic
        useClientForm.ts           form state, validation wiring, submit handler
      services/
        clients.service.ts         queries + mutations — useClients, useCreateClient
      types/
        clients.types.ts           view-models consumed by components
      dto/
        clients.dto.ts             wire-format types (mirror of api DTOs)
      transformers/
        clients.transformer.ts     dto -> type mapping ("one file to change")
      data/
        clients.data.ts            static filter options, column defs
    campaigns/
      index.tsx
      components/  CampaignDetail.tsx · CampaignTimeline.tsx
      hooks/       useCampaignTimeline.ts
      services/    campaigns.service.ts
      types/  dto/  transformers/  data/
    auth/
      index.tsx
      components/  LoginForm.tsx
      hooks/       useAuth.ts      (session/role read, logout)
      services/    auth.service.ts
      types/  dto/
  shared/
    ui/                    shadcn primitives
    layout/                AppShell.tsx · Sidebar.tsx
    components/            DataTable.tsx · EmptyState.tsx
    hooks/                 useDebounce.ts · useMediaQuery.ts · usePermissions.ts
    services/              notifications.service.ts
    data/                  roles.data.ts (role enums, nav config)
    types/                 common.types.ts
  lib/
    api-client.ts          Eden Treaty client from packages/api-client
    query-client.ts
    cn.ts
    format.ts
  routes/
    router.tsx
  main.tsx
  App.tsx
```

Rules:

- **`index.tsx` stays a thin composition root** — layout + hook wiring, no
  large component implementations inline. The ~150-line budget from the old
  convention carries over.
- **The DTO → transformer → type pipeline is the "one file to change" rule.**
  When the backend wire format moves, only `dto/*.ts` +
  `transformers/*.transformer.ts` change; components consume `types/*.ts`
  view-models and never see raw DTOs.
- **`services/*.service.ts` own all data access** — React Query hooks
  (`useClients`, `useCreateClient`) built on the Eden Treaty client. **No
  `useEffect` for data fetching, anywhere.** `hooks/` is for local UI state
  only (filters, forms); `services/` is for server data.
- **The locality rule (binding):** anything under `pages/<page>/**` is
  imported only by files within `pages/<page>/`. Pages never import each
  other's internals; a second consumer promotes the code to `shared/` (a
  one-way ratchet) or to a package.

---

## 3. Dashboard docs

The dashboard carries its own convention docs, kept in the repo:

```
apps/dashboard/docs/
  architecture.md             module conventions (this reconciliation)
  dto-transformer-pattern.md  the "one file to change" rule, with the example
  conventions.md              naming, folder rules, import restrictions
```

---

## 4. E2E tests: `cypress/` — mirrors `pages/` 1:1

```
apps/dashboard/cypress/
  e2e/
    clients/
      clients-list.cy.ts
      client-create.cy.ts
    campaigns/
      campaign-detail.cy.ts
    auth/
      login.cy.ts
  fixtures/
    clients.json               mock DTOs for network stubbing
    campaigns.json
  support/
    commands.ts                custom commands — cy.login(), cy.seedClient()
    e2e.ts
```

Structure notes (binding):

- **`e2e/` mirrors the `pages/` folder 1:1** — trivial to find the test for a
  given page, and the "change one file" property extends into tests: rename a
  DTO field, update `fixtures/clients.json` and the relevant transformer test,
  not five scattered spec files.
- **`fixtures/*.json` match `dto/*.ts` shapes exactly** (raw wire format, not
  `types.ts` view-models) — fixtures double as a live contract check. If a
  backend field renames and the fixture is forgotten, tests fail loudly
  instead of silently drifting.
- **`support/commands.ts` owns auth helpers** (`cy.loginAs('agency-admin')` /
  `cy.loginAs('client')`) — httpOnly-cookie E2E tests never re-implement
  login in every spec.

---

## 5. Naming & imports

- Component files: **PascalCase**, default export, filename matches component.
- `hooks/` / `services/` / `data/` files: **camelCase** (`useClients.ts`,
  `clients.service.ts`); transformers `*.transformer.ts`; DTOs `*.dto.ts`.
- Types: PascalCase interfaces in `types/*.types.ts`.
- Use the **`@/` alias for shared imports**; **relative paths (`./`, `../`)
  for page-local imports** — locality is visible at a glance in any import.
- With `isolatedModules`, use `import type { … }` for type-only imports.

---

## 6. Enforcement

- Code review against this doc on every page-touching PR.
- The `index.tsx` / `index.ts` length budget (~150 lines) is the leading
  indicator — exceed it and split.
- Shared eslint import-boundary rules in `packages/config` forbid
  `pages/<a>/** → pages/<b>/**` imports (mechanical locality).
- PRs that reintroduce `useEffect` data fetching are blocked; initial loads
  and reads go through `services/` (React Query + Eden Treaty).

---

*End of `spec/17-codebase-structure.md` (revised for the fresh-start monorepo).
Locality keeps the codebase honest: each page is a self-contained story, and
shared code earns its place by being shared.*
