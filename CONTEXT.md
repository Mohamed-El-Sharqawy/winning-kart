# Winning Kart

A CRM that syncs Meta ad accounts so agencies can monitor campaign performance without opening Ads Manager.

## Language

**Ad**:
The synced Meta ad inside an ad set. The entity that carries effective status and window metrics. Canonical in code, endpoints, and API paths.

**Creative media**:
The displayable media belonging to one creative: thumbnail (grid image), poster (video still frame), source (playable video URL).

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
