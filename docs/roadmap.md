# Winning Kart Roadmap & Navigation Status

This document is the plan of record for what is built, what is coming, and what the
disabled sidebar items mean. It records the captain's V1 re-prioritization of Aug 2026.

## What "Ships in V1" means on a disabled sidebar item

The MVP (milestones M0–M5) is complete and production-ready. A dimmed sidebar item with
a "Ships in V1" tooltip means exactly one thing: **that standalone page has not been
built yet, and building it is scheduled for the V1 release phase.** It is not broken,
not permission-gated, and not hidden from your role — it simply does not exist as a
surface today. Items are dimmed rather than removed so the map of the finished product
stays visible.

Two important distinctions:

- **Not built ≠ not possible.** Some V1 surfaces already have working pieces living
  elsewhere. Example: revenue attribution work (Attribution & Revenue tab) exists today
  inside each client's workspace; the standalone Analytics/Reports pages arrive in V1.
- **Role visibility is separate.** Today all agency roles see the same navigation and
  access control gates *actions* on the server (an analyst cannot pass a write gate no
  matter what they can click). Per-role navigation hiding ships with V1's permission
  matrix. Client-role users already see a completely separate, reduced portal.

## Shipped — MVP (M0–M5, complete)

| Area | What exists today |
|---|---|
| Foundation | Login, JWT + PAT auth (Hermes-ready), 7-role RBAC discriminators, AES-256-GCM secrets, Night Volt design system, CI |
| Clients & connections | Client roster + workspaces, ad-account add/sync/reconnect/remove, token-type choice (system-user or 60-day with expiry warnings), hourly sync cron |
| Performance surfaces | Campaigns ledger + campaign detail (charts, funnel), ad-sets comparison (≤4), creatives gallery with fatigue engine (F1/F2/F4/F5/F6), winner/loser tints |
| Signals | Detection engine (8 rules), alerts feed with anti-noise, tasks queue, recommendations, notification bell, Overview insights region |
| Portal & revenue | Client portal v1 (trust dashboard, read-only campaigns/creatives), **custom-backend revenue ingest with match tiers A/B/C** (live since M4), audit log, retention + full data export |
| Operator hardening | MCP tool surface (7 tools), PAT scopes, scheduler view, Coolify/Traefik deploy + Neon migration runbook |

## A clarification the captain asked for (recorded here permanently)

**Custom-backend revenue integration is already live.** Any client running a custom
stack (their own Next.js site, custom backend, anything that can POST JSON) can send
revenue into Winning Kart today: generate a per-client ingest key in the workspace
Revenue tab and post orders to `/api/revenue/ingest`. Match quality A/B/C is computed
per event. This was deliberately built in the MVP so the platform is commerce-agnostic
from day one — it does not depend on Shopify or WooCommerce shipping.

What is *not* built yet are the turnkey **connectors** for specific commerce platforms
(Shopify, WooCommerce) — where Winning Kart polls the platform for you automatically
instead of you pushing events. Those are V1/V2 items below.

## V1 — captain's direction (Aug 2026)

The captain has re-prioritized V1 to lead with **platform breadth and commerce
connectors**. This differs from the original spec (docs put Google Ads in V1 and
TikTok/Snapchat/LinkedIn in V2; the captain's call moves platforms forward and the
reports/attribution depth moves to V2). Deltas noted inline.

| Item | What it adds | Note |
|---|---|---|
| TikTok Ads adapter | Campaigns, insights, ttclid identity behind the existing AdPlatform seam | Moved up from V2 per captain |
| Snapchat Ads adapter | Campaigns, insights, scclid identity | Moved up from V2 per captain |
| Pinterest Ads adapter | Campaigns, insights behind the same seam | **New platform — not in the original spec; added by captain's direction** |
| More platforms (as prioritized) | LinkedIn, Google Ads, etc. behind the same seam | Google Ads was originally V1; slot per captain |
| WooCommerce connector | Automatic order polling (turnkey, no webhook setup required by the store) | Moved up from V2 per captain |
| Shopify connector | OAuth app + webhook + nightly reconciliation | Originally V1; sequencing per captain |
| CRM ingestion (HubSpot/custom) | Deal-level revenue events | V2 per spec unless re-prioritized |

Sequencing within V1 is chosen by the captain at kickoff of each milestone.

## V2 — depth (re-prioritized from original V1)

| Item | What it adds |
|---|---|
| Reports system | Builder, blocks, schedules, white-label PDFs, portal delivery |
| Honest attribution suite | 5 WK-computed attribution models, model comparison, Limitations tab |
| Marketing plans | Goals → KPIs → budget → campaigns, Plan-vs-Actual |
| Budget & pacing | Caps, projections, pacing alerts |
| Analytics pivots | Saved views, breakdown dimensions |
| MFA + inline write rails | Dashboard pause/budget-edit with confirmation + audit (MCP writes already work) |

## Enterprise

SSO (SAML/OIDC), IP allow-list, warehouse export (BigQuery/Snowflake), brand-accent
white-label.

## Adding a new ad platform — how it works

Every platform lands as an adapter behind the `AdPlatformAdapter` seam
(`apps/api/src/platforms/`). One adapter + one enum value + one connector row; no
schema change, no navigation change, no fork. The platform switcher and every surface
(Campaigns, Ad Sets, Creatives, detection rules) work against any adapter
automatically — this is why platform breadth is cheap to add in V1.
