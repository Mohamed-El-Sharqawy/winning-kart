# URL-store asset pipeline for creative media

The creatives gallery needs thumbnail and video media for up to ~100k ads per ad account, with a Postgres-only preference and a hard never-bulk-refetch rule. We decided on a URL-store with lazy refresh: Postgres holds platform IDs, expiring Meta CDN URLs, and resolution timestamps — never bytes. New/changed ads carry media free via field expansion (`creative{thumbnail_url,video_id}`) on the full-ad fetch the sync already makes; already-synced unchanged ads resolve page-scoped on demand at first gallery view; video plays directly from the Meta CDN, so no proxy and no Range-serving machinery. Refresh is lazy-only: an on-serve TTL window (default 7 days, config-tunable), on-failure repair, and free piggyback on changed-ad re-fetches — the hourly cron keeps 100% of its budget for entity sync.

## Considered Options

- URL-store + lazy refresh — chosen: $0, zero dump bloat, purest expression of "fetch only what we lack".
- Lazy-caching proxy backed by bytea — the designated evolution if URL rot measurably bites (repair rate on viewed pages climbs).
- bytea full store — rejected: 0.5 GB dev-plan cap, dump bloat.
- Local disk + assets table — rejected: backups fork (pg_dump + volume), anchors the API to one host.
- R2/S3 object storage — rejected for now: new external dependency; remains the escape hatch for permanent video archive.

## Consequences

- `getCreativeDetails`, the `DECORATE_MAX` 200/run cap, and null-fill decoration are deleted; page-scoped on-demand resolution replaces backfill sweeps.
- The Elysia 1.4.23+ HTTP Range regression is moot while video streams from Meta's CDN; re-visit only if we ever self-host video.
- "Having" an asset means having a fresh-enough URL, not bytes.
