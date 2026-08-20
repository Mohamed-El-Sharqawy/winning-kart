# Pre-PR QA gate

Every pull request follows this checklist before it is pushed for review. The route-walker smoke suite is the standard gate: it logs in as `agency-admin`, visits every admin route with stubbed API envelopes, and fails loudly at the first route-level crash, blank page, or raw object rendered as text.

## Commands

From the repo root:

```bash
bun run typecheck
bun run build
```

From `apps/dashboard`:

```bash
bun run test:e2e
bun run test:e2e:smoke
```

- `test:e2e` runs the full Cypress suite.
- `test:e2e:smoke` runs only the route walker under `cypress/e2e/smoke/`.
- The direct equivalent is `bunx cypress run --spec "cypress/e2e/smoke/*.cy.ts"` from `apps/dashboard`.

## Rules

- No PR is pushed before e2e passes. If the walker fails, the failing route's stack is printed in the assertion message; fix the app, not the assertion.
- New pages MUST be added to `apps/dashboard/cypress/e2e/smoke/routes.cy.ts`. Copy the one-line pattern: add an entry to `ROUTES` with `{ name, path, anchor }` where `anchor` is a regex for a known heading or label that only renders when the page has real content, and add any new GET endpoints to `stubApi()` using the success envelope `{ "data": ... }`.
- Fixtures for the walker live in `apps/dashboard/cypress/fixtures/walker-*.json`. `walker-audit-logs.json` intentionally includes a row with `actorUserId: null` and `targetEntityId: null` as a regression test for the null-actor crash; do not "clean it up".

## Known in-flight exception

The campaign detail route carries `pendingCrashFixMountAnchor` while its `[object Date]` render crash is being fixed: the raw-object assertion is skipped and only a mount anchor is required. When the fix lands, delete the `pendingCrashFixMountAnchor` field so the route asserts its real anchor (`/dia flower eid push/i`) and the raw-object assertion runs again.

## Environment

The suite expects the dev servers already running: dashboard on `http://localhost:5173` and the API on `http://localhost:3000` with seeded data. Login uses `cy.loginAs("agency-admin")`; all page GET requests are stubbed, only the login POST touches the live API.
