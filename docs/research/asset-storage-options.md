# Asset storage and serving options (fact sheet)

Resolves #25. Scope: creative thumbnails and video poster frames, 10-200 KB each, 100k+ assets across clients/ad accounts; full videos are stream-only candidates. Stack: Bun + Elysia (`apps/api`) behind Traefik, Postgres via Drizzle (Neon in dev), Docker Compose, no Redis or object storage today. `apps/api/src/platforms/meta/normalize.ts:247` already persists Meta `thumbnail_url` / `image_url` as URL strings only; no `assets` table exists yet.

Assumptions: 100k assets at 10-200 KB is 1-20 GB (50 KB avg = ~5 GB). Prices are US list prices checked 2026-09-04.

## Platform constraints (verified)

- Meta CDN URLs are not permanent. Fivetran: "there is no permanent link for thumbnail_url" ([fivetran](https://support.fivetran.com/hc/en-us/community/posts/25748000485399-Connector-Improvement-Facebook-Ads-Creative-Ad-Images)); Airbyte's connector downloads thumbnail bytes rather than storing the URL ([airbyte](https://docs.airbyte.com/integrations/sources/facebook-marketing)). Meta's own reference page is scraper-blocked; treat every stored fbcdn.net URL as perishable.
- Bun.serve auto-handles HTTP byte-range requests when the response body is a `Bun.file` ([bun-server](https://bun.com/docs/runtime/http/server), confirmed in [elysia-1868](https://github.com/elysiajs/elysia/issues/1868)); mobile Safari refuses `<video>` playback without Range support ([elysia-1868](https://github.com/elysiajs/elysia/issues/1868)).
- Elysia regression: 1.4.23 through at least 1.4.28 rewrap response bodies, severing the `Bun.file` association, so Range silently stops working ([elysia-1868](https://github.com/elysiajs/elysia/issues/1868)). This repo resolves `elysia@1.4.29` (`bun.lock`) - inside the affected window; verify or hand-roll Range before self-hosting video.
- Postgres `bytea`: max 1 GB per value; TOAST compresses/out-of-lines rows above ~2 KB into ~2000-byte chunk rows ([toast](https://www.postgresql.org/docs/current/storage-toast.html)). 50 KB asset = ~25 TOAST rows; 100k assets = ~2.5M chunk rows. `EXTERNAL` storage (no compression) makes bytea substring reads fetch only the needed chunks - relevant to Range serving ([toast](https://www.postgresql.org/docs/current/storage-toast.html)).
- Large objects: chunked rows + B-tree index, random-access read/write, own permission model ([lo](https://www.postgresql.org/docs/current/lo-implementation.html)); dumped by default, excludable with `-B` ([pg-dump](https://www.postgresql.org/docs/current/app-pgdump.html)).
- pg_dump: parallel dump only in directory format (`-j`); custom/directory formats allow parallel restore; docs state pg_dump "is generally not the right choice" for regular production backups ([pg-dump](https://www.postgresql.org/docs/current/app-pgdump.html)).
- Neon: Free plan caps storage at 0.5 GB/project; paid storage $0.35/GB-month, 500 GB egress included then $0.10/GB ([neon-pricing](https://neon.tech/pricing)). Retained WAL ("History", $0.20/GB-month) grows with every byte rewrite inside the history window ([neon-history](https://neon.com/docs/postgres/backup-restore/history-window)) - rewriting bytea rows amplifies Neon storage.
- Prices: S3 Standard $0.023/GB-month (first 50 TB), GET $0.0004/1k, 100 GB/month egress free then $0.09/GB ([s3](https://aws.amazon.com/s3/pricing/)). R2: $0.015/GB-month, Class B (GET) $0.36/M, Class A (PUT) $4.50/M, free tier 10 GB + 10M B + 1M A, zero egress ([r2](https://developers.cloudflare.com/r2/pricing/)). Bunny CDN $0.01/GB (EU/NA), $1/month minimum, no request fees ([bunny](https://bunny.net/pricing/)). Neon Object Storage (beta, S3-compatible): 5 GB free now, $0.023/GB-month with no per-op charge later ([neon-pricing](https://neon.tech/pricing)).

## Options

### 1. URL-store + lazy refresh (status quo)

Keep only CDN URLs in Postgres; refresh when stale/expired.

- Capacity: unlimited; $0.
- Backup/migration: trivial (text rows only).
- Invalidation: not ours - URL rot is the failure mode; assets 404 as tokens expire ([fivetran](https://support.fivetran.com/hc/en-us/community/posts/25748000485399-Connector-Improvement-Facebook-Ads-Creative-Ad-Images)).
- Video: excellent - redirect/embed the Meta CDN URL; their CDN handles Range.
- Ops: a refresh/repair worker plus staleness columns; degraded grids when refresh fails.
- Cost at 100k: $0 infra; extra Graph API reads per refresh cycle.
- Bun/Elysia: nothing to serve; `<img>` tags hit Meta CDN directly.

### 2. Lazy-caching proxy

API endpoint streams the Meta asset on first request and caches bytes. Where the bytes live decides everything: memory (Bun LRU; lost on restart, hot cache only), local disk (option 4 semantics), or Postgres bytea (option 3 semantics, bounded by LRU eviction).

- Capacity: tunable (top-N hot assets), independent of total corpus.
- Backup/migration: exclude the cache from dumps unless durability is wanted.
- Invalidation: version the URL (content-hash query param) or `DELETE` the row.
- Video: proxying videos through Elysia hits the Range regression ([elysia-1868](https://github.com/elysiajs/elysia/issues/1868)) - avoid for video.
- Ops: medium - cache logic, miss storms, disk growth.
- Cost: ~$0 plus host egress.
- Bun/Elysia: pipe the fetch `Response` through; watch `idleTimeout` (default 10 s) killing quiet streams ([bun-server](https://bun.com/docs/runtime/http/server)).

### 3. Postgres bytea, thumbnails/posters only

- Capacity: 1 GB/value limit; 5-20 GB corpus fits paid Neon ($1.75-$7.00/month) but exceeds the 0.5 GB Free-plan cap used in dev ([neon-pricing](https://neon.tech/pricing), [toast](https://www.postgresql.org/docs/current/storage-toast.html)).
- Backup/migration: dumps grow by the full bytes (gzip-compressed in `-Fc`/`-Fd`); parallel dump needs directory format ([pg-dump](https://www.postgresql.org/docs/current/app-pgdump.html)); bulk-loading 5-20 GB into a fresh Neon branch adds History/WAL storage while the window lasts ([neon-history](https://neon.com/docs/postgres/backup-restore/history-window)).
- Invalidation: `UPDATE`/`DELETE` the row; a changed image rewrites all its TOAST chunks (unchanged fields are preserved on update) ([toast](https://www.postgresql.org/docs/current/storage-toast.html)).
- Video: no - Range would be hand-rolled; `EXTERNAL` + `substring` is chunk-efficient but pointless here ([toast](https://www.postgresql.org/docs/current/storage-toast.html)).
- Ops: low new infra; watch bloat/vacuum on the assets table.
- Cost at 100k: $1.75-$7.00/month storage on paid Neon plus history amplification ([neon-pricing](https://neon.tech/pricing)).
- Bun/Elysia: `new Response(bytes)`; set ETag/Cache-Control manually.

### 4. Local disk on the API host + assets table (Docker volume)

- Capacity: host disk; 5-20 GB is trivial.
- Backup/migration: pg_dump does not cover the volume - restore becomes "dump + rsync", and the volume must join host backups; multi-host scaling breaks (node-local path).
- Invalidation: unlink file + delete row, or overwrite + version param.
- Video: viable - serve with `Bun.file(path)` for auto-Range/ETag ([bun-file](https://bun.com/docs/runtime/file-io), [bun-server](https://bun.com/docs/runtime/http/server)) once the Elysia rewrap regression is fixed or bypassed ([elysia-1868](https://github.com/elysiajs/elysia/issues/1868)).
- Ops: medium - volume lifecycle, orphan cleanup, disk monitoring.
- Cost: ~$0.
- Bun/Elysia: return `Bun.file(path)` directly (lazy Blob, `.stream()` available) ([bun-file](https://bun.com/docs/runtime/file-io)).

### 5. Object storage (Cloudflare R2 / S3) - escape hatch

- Capacity: effectively unbounded.
- Backup/migration: objects live outside Postgres; bucket versioning/replication replaces dump coverage; R2's Sippy/Super Slurper migrate for free ([r2](https://developers.cloudflare.com/r2/pricing/)).
- Invalidation: overwrite with versioned key or Cache-Control TTL; CDN purge if fronted.
- Video: best - S3/R2 GETs natively honor Range ([s3](https://aws.amazon.com/s3/pricing/), [r2](https://developers.cloudflare.com/r2/pricing/)); serve directly or behind a CDN.
- Ops: new external dependency: credentials, signing (presigned URLs), lifecycle rules.
- Cost at 100k: R2 ~$0-0.15/month (5-20 GB storage within/near the 10 GB free tier; ops within free tier) ([r2](https://developers.cloudflare.com/r2/pricing/)); Cloudflare's own example: 100k x 100 KB objects with 10M reads/day = $104.40/month driven by Class B ops ([r2](https://developers.cloudflare.com/r2/pricing/)). S3: $0.12-0.46 storage + $0.40/1M GETs + egress $0.09/GB beyond 100 GB free ([s3](https://aws.amazon.com/s3/pricing/)).
- Bun/Elysia: presigned GETs or public bucket; API stays metadata-only.

### 6. Others considered

- BunnyCDN + Bunny Storage: $0.01/GB EU/NA egress, $1/month min, no request fees ([bunny](https://bunny.net/pricing/)); attractive for video-heavy traffic; one more vendor.
- Neon Object Storage (beta): S3-compatible from the existing Postgres vendor - keeps the single-vendor story; 5 GB free in beta, $0.023/GB-month with no per-op charge later ([neon-pricing](https://neon.tech/pricing)); immature, beta usage limits apply.
- imgproxy-style image proxy ([imgproxy](https://github.com/imgproxy/imgproxy)): solves resizing/caching from a CDN source, not permanence; self-hosted container.
- Large objects (pg_largeobject): same dump pain as bytea plus a separate permission model and no Drizzle ergonomics ([lo](https://www.postgresql.org/docs/current/lo-implementation.html)) - dominated by bytea for KB-scale assets.

## Comparison

| Option | Capacity @100k | Backup/migration | Invalidation | Video (Range) | Ops effort | Est. $/month | Bun/Elysia notes |
|---|---|---|---|---|---|---|---|
| 1 URL-store + refresh | Unlimited | Trivial (rows) | n/a; URLs rot | Excellent (Meta CDN) | Low | ~0 | None |
| 2 Lazy proxy | Hot set only | Exclude cache | DELETE/version | Poor (Elysia bug) | Medium | ~0 | Stream; mind idleTimeout |
| 3 bytea | 5-20 GB; dev cap 0.5 GB | Dump grows GBs | UPDATE row | None | Low-Med | $1.75-7+ (Neon paid) | Manual headers/Range |
| 4 Disk volume | Host disk | Volume outside pg_dump | unlink+version | Good (Bun.file) | Medium | ~0 | Bun.file auto-Range |
| 5 R2/S3 | Unbounded | Separate from pg | Version key | Best (native) | Med-High | $0-0.15 (R2) | Presigned URLs |
| 6 Bunny / Neon OS | Vendor scale | Vendor-managed | Vendor tools | Good | Medium | $1 (Bunny) | n/a |

## Ranking against the Postgres-only preference

1. URL-store + lazy refresh - pure Postgres, zero infra; the must-have is a refresh/repair path because URLs expire ([fivetran](https://support.fivetran.com/hc/en-us/community/posts/25748000485399-Connector-Improvement-Facebook-Ads-Creative-Ad-Images)).
2. Lazy-caching proxy backed by bytea - still Postgres-only; bounds bytes to the hot set; LRU eviction; refresh = DELETE.
3. bytea full store - Postgres-only permanence; fine at 100k on paid Neon, blocked by the 0.5 GB dev-plan cap ([neon-pricing](https://neon.tech/pricing)); dump bloat is the tax.
4. Local disk + assets table - cheap and simple, but backups fork (dump + volume) and it anchors the API to one host.
5. R2 escape hatch - once permanence, video hosting, or >20 GB matters, zero egress + free tier wins ([r2](https://developers.cloudflare.com/r2/pricing/)); S3 if AWS-native is preferred; Neon Object Storage if the single-vendor story wins.

Recommended path: ship (1) now with staleness columns; add (2) with bytea for hot thumbnails when 404 rot bites; graduate to (5) for video or permanent archive. Never store videos in Postgres.

## Unverified / assumptions

- Meta's own adcreative reference page could not be fetched (scraper-blocked); URL expiry is evidenced by Fivetran/Airbyte connector docs and dev-community reports, not Meta primary text.
- S3 Standard $0.023/GB cross-checked via secondary sources against the JS-rendered official page; GET/egress figures are from the official page text.
- Bunny Stream (per-GB video) pricing not verified; only Bunny CDN rates cited.
- Whether `elysia@1.4.29` specifically carries the Range regression is untested (issue confirmed through 1.4.28; repo resolves 1.4.29). Test: `curl -H 'Range: bytes=0-1'` against a `Bun.file` route.
- Traefik assumed to pass Range headers through unmodified (no buffering by default); not verified against Traefik docs.
