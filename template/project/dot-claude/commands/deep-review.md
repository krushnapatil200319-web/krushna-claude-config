---
description: Comprehensive pre-PR review of the current changes
---

# Deep Code Review

Perform a comprehensive pre-PR review of the current changes. The goal is to find real
bugs before the code reaches the company's PR reviewer.

Do NOT simply summarize the diff.
Do NOT assume the implementation is correct.
Do NOT report generic or hypothetical concerns without evidence.

If `$ARGUMENTS` is provided, scope the review to it (a path, a branch, or a PR number).
Otherwise review the uncommitted changes plus the current branch's commits vs the base
branch.

---

## Phase 1 — Understand the change

Read the diff, the surrounding implementation, tests, types and configuration. Determine:

1. What behavior changed?
2. Why was it changed?
3. Which components/services are affected?
4. Which external systems are involved?

## Phase 2 — Trace dependencies

For every important changed function/API: find callers, consumers, related types,
database tables, Supabase queries, relevant RLS policies, and tests. Do not review
changed files in isolation.

## Phase 3 — Happy path

Verify that the intended behavior actually works.

## Phase 4 — Edge cases

Use `.claude/review/edge-cases.md`.

## Phase 5 — Security

Use `.claude/review/security.md`. Check authentication, authorization, IDOR, tenant
isolation, privilege escalation, secrets, input validation, sensitive data exposure.

## Phase 6 — Supabase

Use `.claude/review/supabase.md`. Check RLS, policies, service-role usage, database
constraints, race conditions, duplicate writes, transactions, generated types,
migrations, storage.

## Phase 7 — Framework specifics

Use `.claude/review/nextjs.md` if it exists in this repo (Next.js apps), otherwise
`.claude/review/edge-functions.md` (backend).

## Phase 8 — Company rules

Use `.claude/review/company-rules.md`. These encode findings our company's automated PR
reviewer has raised before — check every one that could apply.

## Phase 9 — Regression

Search the repository for existing behavior that may be affected:

- Could an existing caller break?
- Could an existing API consumer in another repo break?
- Could existing database rows behave differently?
- Could this change alter permissions?
- Could this change alter caching?
- Could this change break another workflow?

## Phase 10 — Tests and checks

Inspect existing tests and identify important missing ones. Run the appropriate unit /
integration tests, type checking and linting. Do not skip them because the code looks
simple.

## Phase 11 — Final pass

After making fixes, re-read the final diff and check whether a fix introduced a new
issue.

---

# Output

Only report actionable findings, in this format:

## [CRITICAL/HIGH/MEDIUM/LOW] Finding title

**File:** path/to/file.ts
**Location:** function or line

**Problem:** exactly what is wrong.

**Scenario:** a realistic sequence that triggers the bug.

**Why this happens:** the underlying cause.

**Recommended fix:** a concrete fix.

**Test:** a concrete test case that proves the fix.

---

End with:

## Review Summary

- Critical: X
- High: X
- Medium: X
- Low: X

## Missing Tests

List important missing tests.

## Review Confidence

High / Medium / Low — and state explicitly what could not be verified (e.g. RLS policies
not readable locally, consumers living in another repo, no test runner configured).
