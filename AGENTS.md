# Winning Kart

Pre-PR QA gate: run `bun run typecheck` and `bun run build` from the repo root, then the e2e suite from `apps/dashboard` (`bun run test:e2e:smoke` for the route-walker smoke gate). No PR is pushed before e2e passes. New pages must be added to `apps/dashboard/cypress/e2e/smoke/routes.cy.ts`. See [docs/qa-gate.md](docs/qa-gate.md).

Delivery workflow: each unit of work (ticket, docs change, feature) lands as its own PR against `main`. A PR is merged only after the owner has reviewed and approved it - never agent-merged without that review.

## Core conventions

- No comments in code.
- No emojis.
- Keep files under 150 lines; split before growing past that.
- Page-locality: a page owns its components, services, DTOs, transformers, and types under `src/pages/<page>/`; shared code goes under `src/shared/`.
- API success envelope is always `{ "data": ... }` (see [docs/api-conventions.md](docs/api-conventions.md)).
- API errors are RFC 9457 problem+json, never plain text or `{ "error": ... }`.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage labels: label string equals role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
