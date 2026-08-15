# Dashboard architecture

This doc records the module conventions for `apps/dashboard`. The binding source is the
product spec's doc 17 (codebase structure); this file is the in-repo operational copy.

## Pages

Every page lives under `src/pages/<page>/` with this uniform shape:

```
pages/<page>/
  index.tsx              thin page entry — layout + hooks wiring (~150-line budget)
  components/            page-local presentational + interactive components
  hooks/                 local UI state (filters, forms) — NOT server data
  services/              React Query queries + mutations over the Eden Treaty client
  types/                 view-models consumed by components
  dto/                   wire-format types (mirror of the API's DTOs)
  transformers/          dto -> type mapping
  data/                  static options, column definitions
```

## Locality

Anything under `pages/<page>/**` is imported only by files within that page. Pages never
import each other's internals. A second consumer promotes the code to `shared/` or a
package. Shared code never depends on a specific page.

## Data fetching

No `useEffect` for data fetching. Server data flows exclusively through
`services/*.service.ts` (React Query v5 on the Eden Treaty client). Initial loads use
React Query with `initialData`/prefetch as needed.

## Shared

`shared/` holds cross-page code: `ui/` primitives, `layout/` (AppShell, Sidebar),
`components/`, `hooks/` (useDebounce, useMediaQuery, usePermissions), `services/`
(notifications), `data/` (role enums, nav config), `types/`.
