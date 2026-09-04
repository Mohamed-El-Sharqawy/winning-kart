# Creative gallery at scale - implementation spec

Consolidates every decision from the wayfinder map ([issue #22](https://github.com/Mohamed-El-Sharqawy/winning-kart/issues/22)) into a spec build sessions execute without re-deciding. Rationale lives in the ADRs and ticket resolutions linked here, not restated.

## Scope

In: a creative gallery (media table + right drawer) reachable from campaigns, ad sets, and campaign detail; a URL-store asset pipeline that fetches only media we do not have; server-side pagination (keyset cursor + infinite scroll for ads, numbered pages for campaigns and ad sets) surviving ~100k ads per account; campaign-detail navigation into the creatives tab plus a URL-driven drawer with an Ads Manager deep link; granular effective-status filtering (default Active) on all three tabs.

Out (map rulings, standing): full carousel/collection preview rendering (lead card only), client portal rollout, admin management ([issue #34](https://github.com/Mohamed-El-Sharqawy/winning-kart/issues/34)), ad control/creation, non-Meta platforms.

## Documents

- [data-and-sync.md](data-and-sync.md) - schema migration, status healing, sync changes, absence cleanup, asset resolution
- [api.md](api.md) - endpoint contracts, filters, pagination, error codes
- [dashboard.md](dashboard.md) - gallery UI, navigation, drawer, empty states

## Decision index

- [ADR 0001](../../adr/0001-url-store-asset-pipeline.md) - URL-store asset pipeline (ticket #27)
- [ADR 0002](../../adr/0002-absence-based-cleanup.md) - absence-based cleanup (ticket #29)
- [ADR 0003](../../adr/0003-keyset-pagination-window-aggregates.md) - keyset pagination, window aggregates (ticket #30)
- Gallery look and feel - variant B, click-to-play, status dropdown (ticket #24)
- Campaign-detail navigation IA (ticket #26)
- Meta creative-asset API facts - [docs/research/meta-creative-asset-api.md](../../research/meta-creative-asset-api.md)
- Storage options ranked - [docs/research/asset-storage-options.md](../../research/asset-storage-options.md)

## Verified preconditions

ADR 0002 obliged this spec to verify that no rollup sums entity-level `daily_insights` rows before the deletion purge ships. Verified: no stored rollups exist.

- Account-level `daily_insights` rows are aggregated from freshly fetched Meta campaign rows at sync time, never from stored entity rows (`apps/api/src/modules/ad-accounts/service.ts:480`).
- Retention pruning deletes only entity-level rows and preserves account rows (`apps/api/src/modules/settings-module/model.ts:76`).
- Detection alerts/insights are recomputed on every successful sync; deleting entity rows cannot corrupt them.
- No summary, rollup, or materialized-view table exists (`packages/db/src/schema.ts`).
- `revenue_events.resolvedEntityId` is plain text with no FK; revenue totals sum `revenue_events.value` only. After campaign deletion the reference dangles cosmetically; the dashboard renders a fallback label ([dashboard.md](dashboard.md)).

## Build order

Three PRs, each passing the QA gate (`bun run typecheck`, `bun run build`, e2e smoke; [docs/qa-gate.md](../../qa-gate.md)):

1. DB + sync ([data-and-sync.md](data-and-sync.md)): one drizzle migration, granular status healing, decorator deletion, absence cleanup, media resolution server-side. Deploy applies the migration with `WK_SYNC_CRON=off`, re-enabled after; the first hourly cycle heals every status and starts the media piggyback.
2. API ([api.md](api.md)): list consolidation under the performance module, pagination/filter/sort, summaries, ad detail, conventions updates.
3. Dashboard ([dashboard.md](dashboard.md)): gallery, drawer, navigation, server pagination wiring; walker fixtures updated to the new envelopes.
