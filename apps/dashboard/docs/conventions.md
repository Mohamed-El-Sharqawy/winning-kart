# Conventions

## Naming

- Components: PascalCase files with default export matching the component (`ClientsTable.tsx`).
- Hooks/services/data: camelCase (`useClients.ts`, `clients.service.ts`).
- Transformers: `*.transformer.ts`. DTOs: `*.dto.ts`. Types: `*.types.ts`.
- Types: PascalCase interfaces.

## Imports

- `@/` alias for shared imports; relative (`./`, `../`) for page-local imports.
- `import type { … }` for type-only imports (isolatedModules is on).
- Page-to-page imports are forbidden (enforced by `@wk/config` eslint base).

## Structure

- `index.tsx` pages stay under ~150 lines — split into `components/` when exceeded.
- Only create the per-page subfolders a page actually needs.
- Tests: `cypress/e2e/` mirrors `pages/` 1:1.

## Styling

- Tailwind v4 utilities over `@wk/ui` Night Volt tokens (`@theme`).
- Numerals in tables and KPIs: `font-mono` + `tabular-nums` (the `.tabular` helper class).
- Single primary accent (volt violet); up = lime, down = coral. Never a second hue.
