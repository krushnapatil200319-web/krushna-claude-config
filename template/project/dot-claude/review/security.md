# Security Review

## Authentication

Every protected route / action / API must require appropriate authentication. Check:

- missing authentication
- expired sessions
- invalid sessions
- authentication bypass
- session confusion (acting as the wrong user)

## Authorization

Enforce authorization at the point where the sensitive operation occurs. Never rely
solely on frontend checks.

Not sufficient:

```ts
if (user.isAdmin) {
  showDeleteButton()
}
```

The backend and/or the database must independently enforce authorization.

## IDOR

For every endpoint accepting an identifier — `userId`, `tenantId`, `orderId`,
`customerId`, `invoiceId`, `productId`, `documentId` — ask:

**"Can another user access this resource by changing the ID?"**

## Privilege escalation

Check whether:

- a tenant user can become an admin
- a regular user can call admin APIs
- one tenant can modify another tenant
- a user can modify protected fields (role, status, ownership, pricing, verification flags)

Be suspicious of any client-provided role / tenant / admin field.

## Secrets

Never expose service role keys, private API keys, JWT secrets, database credentials, or
internal tokens.

Never put secrets in `NEXT_PUBLIC_*` variables, browser code, client components, URLs,
or logs.

## Input validation

Validate untrusted input at server boundaries. TypeScript types are compile-time only —
runtime input can be malicious or malformed.

## Error messages

Do not expose stack traces, SQL errors, internal paths, secrets, or internal service
information to end users.

## Logging

Check whether logs contain passwords, tokens, session information, private customer
data, payment information, or full sensitive request payloads.
