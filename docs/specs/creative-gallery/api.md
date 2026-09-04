# API contracts

All list endpoints consolidate under the performance module (the campaigns list moves from the ad-accounts module; paths unchanged). Auth `requireAgency` everywhere; success envelope `{ "data": ... }`; RFC 9457 errors (`docs/api-conventions.md`). Window params `days`/`from`/`to` resolve as today (`lib/window.ts`, 422 `INVALID_WINDOW`).

## Shared list semantics

- `status`: a group name (`active` | `inactive` | `all`) or one exact effective-status value, lowercase snake_case (e.g. `pending_review`, `unknown`). Default `active`. Unknown values: 422 `VALIDATION`. Groups per ADR 0002: active = `ACTIVE`; inactive = `PAUSED, CAMPAIGN_PAUSED, ADSET_PAUSED, PENDING_REVIEW, DISAPPROVED, PREAPPROVED, PENDING_BILLING_INFO, WITH_ISSUES, IN_PROCESS, UNKNOWN`; all = active + inactive.
- `sort`: `spend | roas | ctr | frequency` (default `spend`); `order`: `asc | desc` (default `desc`); nulls last everywhere. Unknown sort/order values: 422.
- `q`: ILIKE on name (campaigns, ad sets) and on name + bodyCopy (ads).
- Sizes out of range and unknown `flag`/`format` values: 422 `VALIDATION`.

## Ads (creatives gallery) - keyset, infinite scroll

`GET /api/ad-accounts/:id/ads?status&adSetId&campaignId&flag&format&q&sort&order&limit&cursor`

- `limit` default 50, max 100. `flag`: `bleeding | fatiguing | status_anomaly | scale`. `format`: `IMAGE | VIDEO | CAROUSEL`.
- `cursor`: opaque base64url `{ v, id }` bound to the full filter/window/sort/order context; cursor requests repeat every context param. Undecodable: 422 `CURSOR_INVALID`. Context mismatch: 422 `CURSOR_MISMATCH`.
- 200 `{ "data": { "items": AdItem[], "nextCursor": string | null } }`; `nextCursor: null` means exhausted; no `total`.
- AdItem: `id, name, status, format, adSetId, adSetName, campaignId, campaignName, thumbnailUrl | null, videoId | null, carouselCount | null, bodyCopy, metrics { spend, revenue, purchases, roas, cpa, ctr, frequency } | null, spendShare, trend { spend, ctr }, fatigue { flag, reason } | null`. Zero-insights ads always listed (metrics null, nulls last).
- Decoration per ADR 0003: SQL computes window sums, trend sums (`FILTER`), spendShare, per-ad-set cohort medians (`percentile_cont`, account-wide so pages are independent); `classifyAd` runs TypeScript over page rows only.
- Inline stale-thumbnail refresh before responding (data-and-sync.md).

## Ad detail (drawer)

`GET /api/ad-accounts/:id/ads/:adId` - id-addressed: 404 `NOT_FOUND` unknown id. 200 `{ "data": AdItem & { posterUrl | null, sourceUrl | null, adsManagerUrl } }`. Stale or missing thumbnail, poster, and source are re-resolved inline. `adsManagerUrl` = `https://www.facebook.com/adsmanager/manage/campaigns?act=<accountId-without-act_>&selected_ad_ids=<platformAdId>`; params are undocumented (research fact sheet) - verify against a live account before relying on selection.

## Media repair

`POST /api/ad-accounts/:id/ads/media/resolve` body `{ "ids": string[1..100], "force"?: boolean }` - 200 `{ "data": { "items": [{ adId, format, thumbnailUrl | null, videoId | null, carouselCount | null }] } }`. Unknown or out-of-account ids are dropped. `force` bypasses the TTL check. Upstream failure: 502 `UPSTREAM_ERROR`.

## Campaigns - numbered pages

`GET /api/ad-accounts/:id/campaigns?status&q&sort&order&page&pageSize` - 200 `{ "data": { "items": CampaignItem[], "page": number, "pageSize": number, "total": number } }`; `pageSize` default 25, max 100; a page beyond range returns empty items with `total` intact. Zero-metric campaigns always listed: LEFT JOIN, nulls last; the silent drop (`ad-accounts/service.ts:571`) dies and `campaignMetricsWindow` gains its missing adAccountId predicate.

`GET /api/ad-accounts/:id/campaigns/summary?status&q` - 200 `{ "data": { spend, revenue, purchases, roas, cpa, ctr, frequency } }`; same filters, no paging/sort, SQL aggregates over the filtered set.

## Ad sets - numbered pages

`GET /api/ad-accounts/:id/ad-sets?status&q&campaignId&sort&order&page&pageSize` - same envelope as campaigns.

`GET /api/ad-accounts/:id/ad-sets/summary?status&q&campaignId` - same summary shape.

## Campaign detail

`GET /api/ad-accounts/:id/campaigns/:campaignId` - one payload as today (`campaign`, `prev`, `series`, `funnel`, `adSets`, `ads`); the embedded ad sets and top-10 ads come from the shared list machinery (spend desc, status Active) so behavior cannot drift from the tabs.

## Fatigue summary

`GET /api/ad-accounts/:id/fatigue-summary` accepts the ads filter set (`status, adSetId, campaignId, flag, format, q`; no paging/sort) and aggregates over the filtered set.

## Conventions and MCP

`docs/api-conventions.md` gains the pagination envelopes, the new 422 codes `CURSOR_INVALID` and `CURSOR_MISMATCH`, and the collections note for media/resolve (unknown ids dropped, not 404). MCP metrics tools keep calling the same service methods; only signatures adapt (ADR 0003).
