# API Conventions

This document is binding for every contributor and agent working on `apps/api`. All routes follow the rules below. When existing code and this document disagree, this document wins.

## Success envelope

Every successful (`2xx`) response body is a JSON object with a `data` key:

```json
{ "data": <payload> }
```

- A single resource: `{ "data": { ... } }`.
- A collection: `{ "data": [ ... ] }`.
- An empty collection is `{ "data": [] }` with HTTP 200. Collections are never 404.
- A `meta` key may be added alongside `data` only when it carries applicable metadata (for example future pagination). No endpoint uses `meta` today.

Examples:

```json
POST /api/auth/login   -> 200 { "data": { "role": "admin" } }
GET  /api/clients      -> 200 { "data": [ { "id": "...", "name": "...", "slug": "..." } ] }
GET  /api/overview     -> 200 { "data": { "spend": 1234.5, "...": "..." } }
POST /api/users        -> 201 { "data": { "id": "...", "email": "..." } }
```

## Error format

Every error response is an RFC 9457 Problem Details object with `Content-Type: application/problem+json`. Error responses are never plain text and never free-form `{ "error": "..." }` bodies.

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "No ad account with id 999",
  "instance": "/api/ad-accounts/999",
  "code": "RESOURCE_NOT_FOUND",
  "errorClass": "invalid_token"
}
```

Fields:

- `type`: always `about:blank` for now (no hosted vocabulary yet).
- `title`: the standard reason phrase for the status code.
- `status`: the HTTP status code.
- `detail`: a concise human-readable explanation. For unknown resource ids it names the resource and the id.
- `instance`: the request path.
- `code`: the stable machine-readable key (see table below). Clients branch on `code`, never on `detail`.
- `errorClass`: present only when a Meta error class applies. Existing values: `invalid_token`, `permission_denied`, `rate_limited`, `not_found`, `server_error`, `network_error`.
- Body validation failures (`code: "VALIDATION"`) additionally carry an `errors` array of `{ "path": string, "message": string }` when the framework's validation error provides them.

Implementation: handlers and services throw `ProblemError` from `apps/api/src/lib/problem.ts`; the single `app.onError` hook in `apps/api/src/index.ts` renders every error (including framework 404s, validation errors, and malformed JSON bodies) as a problem document. Controllers never hand-build error responses.

## Code table

| Condition | Status | `code` | `errorClass` |
| --- | --- | --- | --- |
| Unknown route/path | 404 | `NOT_FOUND` | - |
| Unknown resource id | 404 | `RESOURCE_NOT_FOUND` | - |
| Unauthenticated | 401 | `UNAUTHENTICATED` | - |
| Wrong role | 403 | `FORBIDDEN` | - |
| Bad login credentials | 401 | `INVALID_CREDENTIALS` | - |
| Body validation failure | 422 | `VALIDATION` | - |
| Malformed JSON body | 400 | `VALIDATION` | - |
| Duplicate user email | 409 | `EMAIL_TAKEN` | - |
| Duplicate slug (client, ad account) | 409 | `SLUG_TAKEN` | - |
| Remove-account slug mismatch | 422 | `SLUG_MISMATCH` | - |
| Meta rejects token | 422 | `INVALID_TOKEN` | `invalid_token` |
| Meta denies permission | 422 | `PERMISSION_DENIED` | `permission_denied` |
| Meta ad account not found | 422 | `ACCOUNT_NOT_FOUND` | `not_found` |
| Meta rate limit | 429 | `RATE_LIMITED` | `rate_limited` |
| Meta upstream failure | 502 | `UPSTREAM_ERROR` | `server_error` or `network_error` |
| Unexpected server error | 500 | `INTERNAL` | - |

Notes:

- The 404 for unknown routes uses `detail: "Route not found"`; the 404 for unknown resource ids uses a detail naming the resource and id, for example `No ad account with id 999`.
- The 500 `detail` is generic (`Unexpected server error`) in production; the underlying error message is included only outside production.
- An ad account sync of an existing account reports per-stage results in a `200` envelope body (`data.ok` false with failed stage details); only a nonexistent ad account id produces a 404 problem.

## Collections and emptiness

List endpoints return `200` with `data: []` when there is nothing to return. An unknown parent id on a list endpoint also returns an empty list, not a 404. Only detail-style endpoints addressed by a resource id return `RESOURCE_NOT_FOUND` for unknown ids.

`POST /ad-accounts/:id/ads/media/resolve` applies the same principle to its body id collection: ids that match no ad in the account (unknown or out-of-account) are dropped from the returned `data.items` rather than rejected with a 404 or 422. The empty case is `{ "data": { "items": [] } }` with HTTP 200.

## Token lifetime

Ad accounts carry `tokenType` (`system_user` or `user_60d`, default `system_user`) and `tokenExpiresAt` (null for `system_user`, creation/reconnection time plus 60 days for `user_60d`). Create and reconnect accept an optional `tokenType`. When a `user_60d` token is within 7 days of expiry the account enters `warning` health state; past expiry it enters `error`. Overview issue entries override their `errorHint` with `Token expires in N day(s) — reconnect` or `Token expired — reconnect` accordingly.
