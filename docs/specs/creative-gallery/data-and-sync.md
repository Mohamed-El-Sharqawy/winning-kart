# Data and sync

## Schema migration (one drizzle migration)

Status columns `campaigns.status`, `ad_sets.status`, `ads.status` become the ten live effective-status values plus the fallback: `ACTIVE, PAUSED, CAMPAIGN_PAUSED, ADSET_PAUSED, PENDING_REVIEW, DISAPPROVED, PREAPPROVED, PENDING_BILLING_INFO, WITH_ISSUES, IN_PROCESS, UNKNOWN`. `ARCHIVED` and `DELETED` leave the model.

Steps, in order:

1. Delete campaigns, ad sets, and ads whose status is `ARCHIVED` or `DELETED` (Meta listings already exclude them); FK cascades remove children. Collect the deleted ids.
2. Purge their history: `DELETE FROM daily_insights WHERE "entityLevel" <> 'account' AND "entityId" IN (<collected ids>)`.
3. Map remaining statuses: `ACTIVE` stays `ACTIVE`; `PAUSED` becomes `UNKNOWN` (the granular value was collapsed away; healing below restores it).
4. Replace the check constraints with the new enum; add `ads` columns: `videoId` text null, `effectiveStoryId` text null, `carouselCount` integer null, `thumbnailResolvedAt` timestamptz null, `posterUrl` text null, `posterResolvedAt` timestamptz null, `sourceUrl` text null, `sourceResolvedAt` timestamptz null. Constrain `ads.format` to `IMAGE | VIDEO | CAROUSEL`; existing null formats become `IMAGE`. Drop `ads.previewImageUrl` (one 512x640 thumbnail serves grid and drawer).
5. Add index `daily_insights ("adAccountId", "entityLevel", "date")`: every window-metrics query filters exactly this triple.

## Sync pipeline

Field sets (`apps/api/src/platforms/meta/client.ts`):

- `AD_FIELDS` (full pass): `id,adset_id,name,status,effective_status,updated_time,creative{id,thumbnail_url,video_id,effective_object_story_id,object_story_spec{link_data{child_attachments{id}},template_data}}`
- Light passes: campaigns `id,updated_time,effective_status`; ad sets `id,campaign_id,updated_time,effective_status`; ads `id,adset_id,updated_time,effective_status,creative{id}` (raw `status` is replaced by `effective_status`).
- Every request carrying `thumbnail_url` also passes `thumbnail_width=512&thumbnail_height=640`.

Light passes persist status for every visited row, not only changed ones: a per-level status upsert keyed by platform id. One cycle after deploy, every row carries its granular status; this is the healing sweep, no separate backfill job.

`normalize.ts` (`mapEntityStatus`): the ten values map verbatim; everything unknown maps to `UNKNOWN`; `ADD_REPORTS_RUNNING` stays `ACTIVE` as today. `normalizeAd` derives format: `VIDEO` when `creative.video_id` is present; `CAROUSEL` when `object_story_spec.link_data.child_attachments` has more than one entry or `template_data` is present (`carouselCount` = attachment count, lead card = first attachment); else `IMAGE`. Persist `videoId`, `effectiveStoryId`, `carouselCount`, `thumbnailUrl` + `thumbnailResolvedAt`. Poster and source are never resolved at sync time.

Deleted with the decorator (`decorateAdCreatives` in `stages.ts`, `getCreativeDetails` in `client.ts`, `updateAdCreative` in the model, the `WK_DECORATE_MAX` knob and its row in `docs/sync-pacing.md`): no backfill sweeps exist anymore; media arrives via changed-ad piggyback (field expansion) or page-scoped resolution (api.md).

Absence cleanup: after the three structure stages all succeed in one run - any failed stage skips cleanup entirely - per level, DB platform ids absent from the union of all light pages are hard-deleted (campaign cascades remove ad sets and ads); the collected deleted ids purge their `daily_insights` rows (`entityLevel <> 'account'`). `revenue_events` is untouched (README, verified preconditions). Partial page failures abort the stage, so cleanup never sees partial data.

## Asset resolution (URL-store mechanics)

"Having" media means having a fresh-enough URL, never bytes (ADR 0001). TTL knob: `WK_MEDIA_URL_TTL_DAYS`, default 7, clamp 1-30, `envInt` pattern, documented in `docs/sync-pacing.md`.

Refresh paths, all lazy:

- On-serve: the ads list and ad detail endpoints re-resolve stale (age >= TTL) or missing thumbnails inline before responding - one multi-id Graph read per at most 50 stale ids: `GET /?ids=<platformAdIds>&fields=id,creative{...}`. The ad detail endpoint also refreshes poster and source via `GET /<videoId>?fields=source,picture`. A warm cache adds zero Meta calls. Resolution goes through the account's platform adapter and is RateGuard-paced like any other call.
- On-failure: the client reports dead media (image error event) via `POST /ad-accounts/:id/ads/media/resolve` with `force` (api.md); force bypasses the TTL check.
- Piggyback: changed and new ads refresh their URLs free via field expansion on the full pass.

Video: click-to-play. Poster and source resolve at the drawer/detail fetch; the `<video>` element plays direct from the Meta CDN. No proxy, no byte storage (ADR 0001).
