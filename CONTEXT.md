# Winning Kart

A CRM that syncs Meta ad accounts so agencies can monitor campaign performance without opening Ads Manager.

## Language

**Ad**:
The synced Meta ad inside an ad set. The entity that carries effective status and window metrics. Canonical in code, endpoints, and API paths.

**Creative media**:
The displayable media belonging to one creative: thumbnail (grid image, capped at 512x640), image (full-resolution creative image for the large drawer view), poster (video still frame), embed (public Facebook player iframe built from the stored video id; playback for video ads since Graph v21.0 no longer returns a raw playable video URL).

**Creative**:
The gallery UI's display name for an ad. Every creative row, card, or filter in the gallery is an ad; "creative" never denotes a separate entity.

**Resolve**:
Exchange a stored platform ID for a fresh, expiring Meta CDN URL.
_Avoid_: Fetch, download

**Fetch**:
Download media bytes from the platform CDN into our storage. The gallery resolves URLs; it does not fetch bytes.

**Effective status**:
The platform-reported granular state of a campaign, ad set, or ad: active, paused, campaign-paused, adset-paused, in review, disapproved, preapproved, pending billing, with issues, in process. Stored as an enum with an unknown fallback. Archived and deleted entities are outside the model: the platform never sends them and we never show them.

**Status group**:
Our derived grouping of effective statuses: Active, Inactive, or All. Active is delivering only; Inactive is every non-delivering state; All is Active plus Inactive - everything the platform's default listing returns.

**Connector**:
One wired connection to a single external system - an ad platform, a store, a CRM - holding the encrypted credential and the sync contract. One row per connected instance.
_Avoid_: Integration, connection

**Adapter**:
The code module that normalizes one platform behind the shared platform seam. One adapter per platform; every connector of that platform shares it.

**Revenue source**:
A per-client origin of revenue events - a Shopify store, a WooCommerce store, or a custom backend on the ingest API. Binds to the Client, never to an ad account. A role a Connector plays, never a separate connection entity.
_Avoid_: Store connection, integration

**Integrations center**:
The agency-global back-office surface that wires, diagnoses, and disconnects every Connector. Answers one question - "Is everything wired and syncing?" - and carries no performance metrics.
_Avoid_: Integrations, connections page

**Webhook ingress**:
The public, signature-verified receive surface for platform events. It validates and enqueues; it processes nothing.
_Avoid_: Webhook receiver

**Reconciliation**:
A scheduled pull that heals events webhook ingress may have missed. Every webhook-primary Connector carries one; Woo's hourly poll and Shopify's nightly pass are instances.
_Avoid_: Catch-up sync

**Attribution**:
Assigning credit for a Revenue event to the marketing entity that drove it - a campaign, ad set, or ad - by matching identity signals (click ids, UTM, hashed contact). Connectors carry revenue in; they never receive credit.
_Avoid_: "How much each connector contributed"
