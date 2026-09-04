# Dashboard

## Gallery (workspace creatives tab)

Variant B (ticket #24): dense media table, inline 4:5 thumbnails, sortable metric columns; right-side detail drawer. Infinite scroll over the cursor pages: every fetch repeats the full filter/window/sort/order context; duplicate or skipped rows at page boundaries during a sync are accepted (ADR 0003).

- Video rows: black placeholder + play button; click loads poster/source (the detail fetch) and plays in place with controls. No hover preview, no colorful poster.
- Carousel rows: lead-card thumbnail + "1/N" count chip.
- Status dropdown: All / Active / Inactive plus an "Exact status" optgroup (the ten values + Unknown); default Active; drives the `status` param. No Scheduled state - dropped (ticket #29).
- Filters: fatigue flag, format, `q`. Sort headers: spend / roas / ctr / frequency.
- Thumbnails: the server refreshes stale URLs inline; a client image-error triggers `POST media/resolve { ids, force: true }` and re-renders.

Drawer: URL-driven - `creative=<id>` search param on the workspace and campaign-detail routes; open = param present, Back/close removes it; deep links work regardless of scroll position. The drawer shows large media, full metrics, fatigue, and "Open in Ads Manager" (`adsManagerUrl`, new tab).

## Scope and navigation

- The workspace ad-account selector initializes from `search.account` (validated at `routes/router.tsx:173` today, never read).
- Router `validateSearch` gains `campaign`, `campaignName`, and `creative` params on the workspace route, `creative` on campaign detail.
- Scope chips: existing "Ad set: X" plus new "Campaign: Y", each with a clear button; a "< campaign" back link renders when the campaign param is present, returning to campaign detail with account and range preserved.
- Crafted links never pin `status`; the Active default applies on arrival.
- Empty states distinguish "No Active creatives in this scope" (hint: switch the status filter) from "No creatives yet - sync the ad account" (ticket #26).

## Campaign detail

- Ad-set rows gain a ghost "Creatives" action (the workspace pattern, `client-workspace/components/AdSetsTable.tsx:119`) linking to `?tab=creatives` with `adSet`/`adSetName`/`campaign`/`campaignName`/`account`/`accountName`/`from`/`to`.
- TopCreatives rows open the drawer in place (`creative=<id>` on the campaign-detail route).
- TopCreatives footer: "See all creatives" links to the creatives tab scoped by campaign only.
- The breadcrumb preserves `account`/`accountName`/`from`/`to` when linking to the campaigns tab.

## Campaigns and ad sets tabs

- Numbered pages wired to the server: TablePager drives `page`/`pageSize`; `total` comes from the response.
- KPI cards on both tabs come from the summary endpoints, mirroring their tab's filters; the campaigns tab gains the same KPI card row the ad-sets tab has (ADR 0003: window chrome follows the list).
- The ad-sets compare drawer is unchanged: client-side over selected rows; selection persists across visited pages.

## Revenue ledger

Campaign rows deleted by absence cleanup can leave `revenue_events.resolvedEntityId` dangling; totals are unaffected (README, verified preconditions). The ledger renders a fallback label for unresolvable campaign references.

## Walker (e2e)

No new routes. Walker fixtures update to the new envelopes (`{ data: { items, ... } }` for ads, campaigns, ad sets) and stub the new summary GETs per `docs/qa-gate.md`.
