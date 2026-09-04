# Winning Kart

A CRM that syncs Meta ad accounts so agencies can monitor campaign performance without opening Ads Manager.

## Language

**Creative media**:
The displayable media belonging to one creative: thumbnail (grid image), poster (video still frame), source (playable video URL).

**Resolve**:
Exchange a stored platform ID for a fresh, expiring Meta CDN URL.
_Avoid_: Fetch, download

**Fetch**:
Download media bytes from the platform CDN into our storage. The gallery resolves URLs; it does not fetch bytes.

**Effective status**:
The platform-reported granular state of a campaign, ad set, or ad: active, paused, campaign-paused, adset-paused, in review, disapproved, preapproved, pending billing, with issues, in process. Stored as an enum with an unknown fallback. Archived and deleted entities are outside the model: the platform never sends them and we never show them.

**Status group**:
Our derived grouping of effective statuses: Active, Inactive, or All. Active is delivering only; Inactive is every non-delivering state; All is Active plus Inactive - everything the platform's default listing returns.
