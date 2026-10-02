# Company Review Rules

Rules derived from findings our company's automated PR reviewer has raised in the past.

**Workflow:** every time the company reviewer reports something on a PR, add a rule here
in the format below. Over time this file becomes the highest-signal part of the review,
because it encodes what our reviewer actually flags.

Keep this file identical across every repo in the system unless a rule is
genuinely repo-specific.

---

## Template

```
## <Short rule name>

**Reported on:** <PR / date>

**Rule:** <what to check, stated as an instruction>

**Test:** <concrete scenario that proves the fix>

**Expected:** <expected result>
```

---

## Cross-tenant resource access (example — replace once real findings arrive)

**Rule:** Whenever a resource is fetched or mutated using an ID supplied by the client,
verify that the authenticated user or tenant actually owns that resource — either via an RLS
policy with a tenant predicate, or via an explicit ownership check in code when a
service-role client is used.

**Test:** Tenant A requests Tenant B's resource ID.

**Expected:** 403 or 404, no data in the response body, no tenant information leaked in
the error message.

---

<!-- Add new rules below this line. -->
