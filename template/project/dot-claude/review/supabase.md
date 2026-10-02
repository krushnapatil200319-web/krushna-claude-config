# Supabase Review Rules

## Authentication vs authorization

For every protected operation verify:

1. Is the user authenticated?
2. Is the session valid?
3. Is the user authorized for this operation?
4. Is the user allowed to access this **specific** resource?

Authentication alone is not authorization.

---

## Row Level Security

For every table touched by a change:

1. Check whether RLS is enabled.
2. Read the relevant policies in `supabase/migrations/`.
3. Verify SELECT, INSERT, UPDATE and DELETE policies separately.

Do not assume RLS is correct without inspecting the policy text. A missing `WITH CHECK`
clause on an UPDATE policy is a common way rows get moved between tenants.

---

## Tenant isolation

In a multi-tenant system, always verify:

- tenant A cannot read tenant B data
- tenant A cannot update tenant B data
- tenant A cannot delete tenant B data
- tenant A cannot infer sensitive information about tenant B (counts, errors, timing, 404 vs 403)
- changing an ID in the request cannot bypass authorization

Never trust a tenant ID supplied by the client. Derive identity from the
authenticated session (JWT claims / `auth.uid()`) wherever possible.

---

## Service role

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It must never reach:

- browser code
- client components
- public (`NEXT_PUBLIC_*`) environment variables
- API responses
- logs

When a service-role client is used server-side, authorization must be enforced
explicitly in code, because the database will no longer do it.

---

## Database writes

For INSERT / UPDATE / DELETE check:

- authorization
- validation
- duplicate records
- foreign keys
- unique constraints
- race conditions
- partial failure
- transaction requirements
- idempotency

---

## Check-then-act

Be suspicious of this shape:

1. SELECT record
2. check a condition in application code
3. UPDATE record

Two concurrent requests can both pass step 2. Consider making it atomic — a conditional
`UPDATE ... WHERE status = 'pending'`, a unique constraint, or an RPC/transaction.

---

## Query safety

Check filters, joins, pagination, ordering, limits, accidental full-table queries, and
N+1 query patterns.

---

## Sensitive data

Check whether queries return more than needed: password hashes, tokens, internal
identifiers, private customer information, payment information, internal metadata.
Prefer explicit column selection over `select('*')` for sensitive tables.

---

## Schema changes

When the schema changes:

- regenerate and check generated types
- check application types
- check API consumers in all three repos
- check the migration is forward-only and safe on existing data
- check nullable vs non-nullable changes
- check default values
- check backwards compatibility

---

## Storage

For Supabase Storage changes check bucket public/private setting, storage RLS policies,
signed URL expiry, path traversal in object keys, and whether the object path leaks
tenant information.
