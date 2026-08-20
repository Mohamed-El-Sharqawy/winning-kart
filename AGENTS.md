# Winning Kart

Pre-PR QA gate: run `bun run typecheck` and `bun run build` from the repo root, then the e2e suite from `apps/dashboard` (`bun run test:e2e:smoke` for the route-walker smoke gate). No PR is pushed before e2e passes. New pages must be added to `apps/dashboard/cypress/e2e/smoke/routes.cy.ts`. See [docs/qa-gate.md](docs/qa-gate.md).

## Core conventions

- No comments in code.
- No emojis.
- Keep files under 150 lines; split before growing past that.
- Page-locality: a page owns its components, services, DTOs, transformers, and types under `src/pages/<page>/`; shared code goes under `src/shared/`.
- API success envelope is always `{ "data": ... }` (see [docs/api-conventions.md](docs/api-conventions.md)).
- API errors are RFC 9457 problem+json, never plain text or `{ "error": ... }`.
