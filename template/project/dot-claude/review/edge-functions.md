# Supabase Edge Function Review Rules

Applies to Deno functions under `supabase/functions/`.

## Request handling

- Is the HTTP method validated? Does the function reject unexpected methods?
- Is CORS handled, including the `OPTIONS` preflight, and is the allowed origin
  intentional rather than `*` for authenticated endpoints?
- Is the body parsed safely? `await req.json()` throws on malformed input — is that
  caught and turned into a 400 rather than a 500?
- Is every field validated at runtime? TypeScript types do not validate anything here.

## Authentication and authorization

- Is the `Authorization` header required and verified?
- Is the acting user derived from the JWT, not from the request body?
- Which Supabase client is created — anon (RLS applies) or service role (RLS bypassed)?
- If service role is used, is authorization enforced explicitly in code? Every
  service-role query must carry its own ownership/tenant predicate.

## Secrets and environment

- Are secrets read from `Deno.env.get(...)` and never returned or logged?
- Does the function fail loudly at startup if a required env var is missing, rather than
  silently sending `undefined` to a client constructor?

## Responses

- Consistent response shape and status codes across functions (every client depends on it).
- No stack traces, SQL errors, or internal identifiers in error bodies.
- Content-Type set correctly.
- Is a distinct status used for not-found vs forbidden, and does that choice avoid
  leaking whether another tenant's resource exists?

## Side effects and idempotency

Functions that send emails/OTPs, create orders, or change state must be safe to run
twice — the platform and the clients can retry. Check for:

- duplicate sends
- duplicate row creation (prefer a unique constraint or upsert)
- rate limiting on OTP/email endpoints
- OTP expiry, single-use enforcement, and attempt limits

## External calls

Every fetch to a third-party service needs a timeout, an error path, and a decision about
what happens to already-committed database state if the call fails afterwards.

## Migrations

- Forward-only, safe on existing rows.
- New columns: nullable or with a default; adding NOT NULL to a populated table breaks.
- Policy changes reviewed clause by clause, including `WITH CHECK` on UPDATE/INSERT.
- Dropping or renaming a column requires checking every client repo first.
- New tables must have RLS enabled — an RLS-less table is readable by any authenticated
  client via PostgREST.

## Deployment surface

Check `supabase/config.toml` (or per-function config) for `verify_jwt`. A function with
JWT verification disabled is publicly callable — that must be a deliberate choice, and
such functions must authenticate the caller themselves.
