# PRODUCT.md — Winning Kart

## What it is

Winning Kart is a **self-hosted performance-marketing platform for agencies** and their
clients. The operator holds the database, the encrypted platform tokens, the refresh
schedule, and the full history. Meta Ads is the first adapter; Google, TikTok, Snapchat,
and LinkedIn are adapters behind the same seam. Commerce is equally agnostic: Shopify (V1),
WooCommerce (V2), and a custom-backend revenue ingest API from day one.

## Users

- **Agency users** (Owner, Admin, Account Manager, Marketer, Analyst) — run the book all
  day: connect accounts, read performance, act on insights, report to clients.
- **Client users** (Client Admin, Client Viewer) — read-mostly portal, a few times a
  week: "is my money working, and is it getting better or worse?"
- **Automation (Hermes)** — the operator's agent, issued a **personal access token**,
  logs in as a normal user and performs scheduled tasks via REST/MCP. The product ships
  no speculative automation beyond data sync.

## Entity chain (binding)

Agency → Client → Ad Account → Campaign → Ad Set → Ad / Creative. Revenue is not a node —
it arrives from commerce/CRM sources and is **attributed back** onto the chain with
match-quality tiers (A deterministic … D unmatched), never fabricated.

## Operating context

- Defaults: **UAE / AED / Asia/Dubai**; period math runs in the ad account's timezone.
- Deployment: generic VPS (Hostinger / AWS EC2 / DigitalOcean) under **Coolify** with
  Traefik (auto SSL). Neon Postgres for dev; self-hosted Postgres in production.
- Secrets: AES-256-GCM envelope, operator-held `ENCRYPTION_KEY`. Plaintext never persisted.
- **Every integration is optional** — the platform runs fully with zero connector
  credentials configured. Missing credentials mean "not configured", never an error.
- Meta identity: **CAPI** is the attribution-identity solution (server-side conversions).

## Principles

1. **DATA → INSIGHT → DECISION → ACTION** — every screen climbs the ladder; Overview and
   Alerts & Tasks must reach ACTION.
2. **One question per surface** — no surface duplicates another's question.
3. **Honesty over fabrication** — "unattributed" and "not reliably available" are
   acceptable values; estimates are labeled; every number carries its source.
4. **Ownership** — operator-owned data, tokens, history; residency in the operator's hands.

Full page-level specification: the 19-document `spec/` set in the originating workspace;
this repo's README.md is the condensed PRD.
