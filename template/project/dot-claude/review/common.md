# Common Review Rules

Shared across every repo in the system. Repo-specific priorities live in
that repo's `CLAUDE.md`.

## Do not make assumptions

Before changing behavior, search the repository for:

- callers
- consumers
- related types
- related API routes / edge functions
- database queries
- database tables
- validation schemas
- tests
- configuration
- feature flags

If changing a shared function, determine all important callers before editing it.

Do not review a changed file in isolation.

---

## Error handling

For every external operation (network, database, storage, third-party API) consider:

- What happens if it fails?
- What happens if it times out?
- What happens if it returns no data?
- What happens if it returns malformed data?
- What happens if the request succeeds but the client never receives the response?
- What happens if the operation is retried?

Avoid silently swallowing errors. Do not expose internal implementation details or
sensitive information in user-facing errors.

---

## API contracts

When changing an API:

1. Find all consumers.
2. Check request shape.
3. Check response shape.
4. Check error responses.
5. Check optional vs required fields.
6. Check backwards compatibility.
7. Check validation.
8. Check authentication.
9. Check authorization.

Never change an API contract without checking its consumers. A backend change can
break every client that calls it.

---

## Testing

When adding or modifying behavior:

- inspect existing tests
- identify missing cases
- add tests for important edge cases
- test failure paths
- test authorization
- test empty/null cases
- test duplicate operations when relevant
- test concurrent behavior when relevant

Do not add meaningless tests just to increase coverage. Tests must verify actual
behavior, not restate the implementation.

---

## Finding quality

Prioritize findings as CRITICAL / HIGH / MEDIUM / LOW.

Only report a finding when there is concrete evidence in the code or a strong
architectural reason. Every finding must include:

- severity
- file
- line/function
- problem
- realistic reproduction scenario
- why the existing implementation fails
- recommended fix
- suggested test

Avoid generic statements such as "Consider handling errors." Explain the actual
failure scenario instead.
