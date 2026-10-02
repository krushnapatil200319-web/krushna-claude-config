---
name: code-review
description: Strictest code review and audit procedure for this project. Use this skill whenever code is being reviewed, audited, checked for bugs, security-scanned, refactored, or verified before merge — and whenever the user asks "review this", "find bugs", "is this safe", "check my diff/PR", or after any fix that itself needs re-review. Also use it to review Claude's own freshly written code, and to judge a finding someone else reported before acting on it.
---

# Code Review — cold, exhaustive, execution-verified

Two modes, one rubric. When **writing** code, design against Part I from the
start rather than writing first and hoping it passes. When **auditing** a diff,
first satisfy Part R (run conditions), adopt Part 0 (stance), run Part II
(coverage) to completion, discharge Part S (soundness), and report with Part V.

**Never silently ship a known violation. Never report PASS on behavior without
a run. An unverified claim is not a passing claim.**

---

# Part R — Run conditions (read before anything else)

This review's power comes from context isolation, not vigilance. A reviewer
that shares a context window with the author reads intent instead of code and
misses what the author missed. Therefore:

## R.1 The cold requirement

The intended run condition is a **fresh session** whose only inputs are this
skill, the diff (`git diff`), and the repository files. No authoring
conversation, no explanation of intent, no "here's what I built".

**Check now:** does this context contain the authoring of the code under
review — the conversation where it was written, the reasoning, prior "this
works" claims?

- **No (cold run):** proceed normally.
- **Yes (warm run):** you are structurally compromised. Declare it as the first
  line of the report, then apply ALL of §0.8's compensations mechanically. A
  warm run's verdicts are second-class: the report must end by stating that a
  cold re-run on the committed diff is still required before merge. Do not
  soften this.

## R.2 The execution requirement

Reasoning about behavior is prediction; a run is ground truth. For every
finding or passing verdict about BEHAVIOR (not style), the evidence column must
contain one of: output of a command executed in this pass, a test written and
run in this pass, or a crafted-input reproduction executed in this pass. If the
environment cannot execute code, every behavioral verdict is reported as
**Unverified — no runner**, never as PASS. A green typecheck/lint/build is
near-zero evidence about behavior (§III.13) and never substitutes for a run.

**The cheapest run beats the best argument.** Where a claim concerns a library,
compile the real module and call it; where it concerns a file format, craft the
bytes and feed them in. Most of the sharpest findings in Part IV took under a
minute to prove and would have taken a paragraph to argue wrongly.

## R.3 What "done" means

The review is complete only when: every hunk is classified and angled (Part II),
the end-to-end failure trace is finished (§II.5), the soundness verdict is
discharged for everything it applies to (Part S), and the report (Part V) is
emitted in full. Stopping early is reported as stopping early.

---

# Part 0 — Stance

Method without stance fails: the same checklist run by the author and by an
outsider produces different results. The author reads intent into the code; the
outsider reads only the code. **Every bug that reaches a PR reviewer is a bug
the author looked straight at and did not see.** Part 0 is how you become the
outsider.

## 0.1 You are not the author, even when you are

Review the code that exists, not the code that was intended. You have no
privileged knowledge of this system. Anything you "already know" about how it
works is a hypothesis to verify, not a fact to build on. This applies hardest
to code written minutes ago: authorship gives you a model of what the code
*means*, and that model papers over what it *says*. You cannot unlearn it —
you can only refuse to rely on it. → 0.8

## 0.2 What counts as evidence

| Evidence | Not evidence |
| --- | --- |
| File content opened **in this pass** | Memory of that file |
| Output of a command run **in this pass** | Expected output |
| Migration SQL, framework types, library docs | Our own `interface`, `type`, or cast |
| **The consumer library's source, opened** | The format spec, or our reading of it |
| A caller list actually grepped | Callers assumed to exist |
| A value traced end to end | A flow recalled |
| | Function, variable, and file **names** |
| | Comments and doc blocks |
| | Commit messages and PR descriptions |
| | The author's explanation of the change |
| | A reported finding's problem statement |
| | Anything established earlier in this conversation |

Names, comments, and types are **claims made by the author**. `validateInput`
is a hypothesis that input is validated. Test claims; never cite them. If you
cite a file, you opened it in this pass — recalling it is memory, and memory is
where the error lives.

## 0.3 The assumption ledger

Every belief not verified in this pass is an assumption. Write it down:

| # | Assumption | Why believed | How verified | Verdict |
| - | ---------- | ------------ | ------------ | ------- |

- Verified by opening the source → becomes evidence; cite `file:line`.
- Unverifiable → goes in **Unverified**; it never silently becomes true.
- **A finding resting on an unverified assumption is conditional; a PASSING
  verdict resting on one is not a pass.** Assumptions used to clear code are
  more dangerous than assumptions used to flag it — nobody revisits them.

## 0.4 Reconstruct the workflow before judging it

Derive the workflow from the code, bottom-up, then compare. For each entry
point the diff touches: (1) name it and who can reach it; (2) list every input
and where each ACTUALLY comes from; (3) trace each value to every use and
store — follow it, don't summarise it; (4) state the invariants the code
depends on and what enforces each; (5) write the derived workflow in your own
words, from the code alone. Divergence from intended behavior is either a bug
or a gap in your understanding — determine which. Never resolve a divergence by
assuming the code is right. An underivable workflow is itself a finding.

## 0.5 Derive the contract before reading the body

For each function under review, before reading its implementation, write what
it MUST guarantee — from its signature, types, callers, and what callers depend
on. Then read the body and compare. Reading the implementation first makes you
rationalise it; writing the contract first turns review into comparison instead
of endorsement. The function's name is a hypothesis about its contract, never
input to it.

## 0.6 Two passes, never blended

**Pass 1 — comprehension.** Build the model. Record no findings. Understand
everything, including the parts that look obvious.

**Pass 2 — adversarial.** Attack the model. Consult no intent. Make the code
fail: every construct, every angle (Part II).

Blending them produces shallow reviews — you judge before you understand, so
you only judge what you understood first. The parts skimmed in pass 1 are
exactly where the bugs are.

## 0.7 Every line must justify itself

For each line in the diff, state why it exists from the code alone. If you
cannot, it is dead or not yet understood — **both are findings**, and neither
is resolved by moving on. A check that looks redundant is either load-bearing
in a way you have not seen, or genuinely dead; deciding which requires
evidence.

## 0.8 Reviewing your own work, and reviewing fixes

**If you wrote this code — or it was written in this context — declare it.**
The compensations are mechanical, not attitudinal:

- Re-open every file you cite. No claim from context memory. → 0.2
- Write the contract before re-reading your own implementation. → 0.5
- Weight §III.6 both directions heavily: author bias runs toward proving the
  code works, so spend the effort proving it does not.
- Review the parts you are MOST confident about FIRST, not last. → III.7
- **Review your last three fixes before the new code.** In a run of fixes, the
  defect rate is highest in the code written two rounds ago: it was written
  fast, reviewed warm, and has since been treated as settled. → III.14
- End the report with the cold re-run requirement. → R.1

**When reviewing a fix, never ask "does this fix the reported bug?"** — that
question is strictly narrower than the one that matters. Instead: (1) derive
correct behavior for the whole unit independently, from its contract and real
data domain (§III.4); (2) compare the fix against THAT, not the bug report;
(3) run the full angle matrix on the fix — a fix changes which inputs reach
which code, creating paths that have never been reviewed. A fix is new code.
It gets a full review, not a confirmation.

## 0.9 A reported finding is a hypothesis, not a work order

Findings arrive from PR bots, colleagues, and earlier sessions. They get
believed because they are specific, confident, and formatted like conclusions.
Treat each as a claim with three separately checkable parts:

1. **The problem** — does the code actually do this? Run it.
2. **The impact** — does that consequence actually follow? Often the mechanism
   is real and the stated impact is not, or vice versa.
3. **The proposed fix** — would it work, and what does it break? A fix written
   by someone who has not read the consumer can introduce a worse defect than
   the one reported.

Verdicts are **CONFIRMED / PARTLY (mechanism real, impact wrong) / REFUTED**,
each with run evidence. Report the refuted ones and why — a refutation is a
finding about the reviewer, and silently ignoring it means the next person
re-litigates it. **Never apply a fix you have not independently derived**
(§0.8): agreeing with a report is not review, it is transcription.

---

# Part I — Non-negotiable rules

## 0. Commit / change size
- Hard limit: 800 changed lines per commit (additions + deletions), excluding
  lockfiles and generated/vendored files. Larger work gets split — schema/
  migration, one endpoint per commit, shared extraction alone, tests with the
  code they cover — and the split proposed, not one giant diff.
- No padding with unrelated formatting, renames, or refactors.
- Messages say what changed and why — never "fix", "update", "wip".

## 1. Hygiene
- Never commit secrets, keys, tokens, `.env`, service-account JSON, or
  credentials, even "temporarily". Confirm `.gitignore` covers them.
- No large/binary files unless required and agreed.
- Never bypass required review, status checks, or branch protection.
- No review-session residue in comments; comments explain behavior, not editing
  history. No truncated comments — read each as prose.

## 2. Correctness
- A noticed bug is fixed or flagged explicitly — never left as "out of scope",
  never fixed silently in a way that changes behavior.
- Never swallow an error (empty `catch`, ignored non-2xx, discarded rejection).
  Every failure path logs enough context to debug.
- **A client call that returns `{ data, error }` must read `error`.** Defaulting
  `data` to `[]`/`null` and moving on converts a failure into a plausible empty
  answer. This is the single most repeated defect shape in this codebase's
  history. → §III.9
- Every external call handles the error case AND the unknown-outcome case.
  "No response" is not "failed". → §III.3

## 3. Security
- No queries, shell commands, or templates built by concatenating untrusted
  input. Parameterized queries and safe APIs only.
- Never weaken an existing authorization check to make a feature easier.
- Before adding a field to a response: has the caller PROVEN the identity that
  data belongs to? No PII to a caller who supplied only a public or guessable
  identifier; mask if it must appear pre-verification.
- Never log or return tokens, passwords, full PII, or enumerable internal IDs —
  including in new audit/telemetry events, which reach log aggregation and
  retention systems that the access-controlled audit table does not.
- A guard that cannot evaluate its input **fails closed**. A lookup error, an
  unparseable value, or a missing row is never "permitted". → §III.16

## 4. Frontend security
- No new XSS sink: `innerHTML`, `dangerouslySetInnerHTML`, `eval`,
  `new Function`, template injection with unsanitized data.
- Client-side permission checks are UX only; each needs a server-side match.
- No server secrets in the browser bundle; proxy privileged calls.
- Send the client only the fields it renders. No unvalidated redirect targets.
- A file the UI advertises must be one the picker accepts — `accept`, MIME
  list, and parser support are one claim in three places; changing one changes
  the feature only if all three agree. → §III.8

## 5. Maintainability
- No debug residue: `console.log`, commented-out code, scaffolding, hardcoded
  test values.
- Extract genuine duplication in the same change — **but §III.2: two values
  that look alike may have opposite contracts; merging them is a bug.**
- Behavior changes need test coverage: authorization paths, relied-on
  invariants, dependency-failure handling, rollback and concurrent-update
  paths. **If no test runner exists, state the change is unverified rather than
  staying silent** — and write the throwaway harness anyway (§R.2).
- Search for an existing helper before writing a new one. → §III.5

## 6. Performance & architecture (see also Part S)
- No query per item in a loop — one query/RPC, or bounded concurrent chunks.
- No slow/variable-latency work in the synchronous write path — persist,
  return, background job with explicit status field.
- No unbounded operations: unpaginated fetches, unbounded loops/recursion,
  attacker-controlled counts.
- **Bytes are not a bound on objects.** Any input a library expands into a
  model needs a bound on the model, not on the input. → §III.15
- Every new query pattern needs a supporting index — check, don't assume; a
  leading-wildcard `ILIKE '%x%'` cannot use a btree index at all.
- Release everything you open, on every path including errors.
- Never block the request/UI thread on synchronous heavy work.
- Respect layer boundaries.
- Dual writes are distributed transactions: partial-failure behavior defined up
  front. Watch for snapshots read before the row lock and in-memory
  compensation flags that don't survive a crash.

---

# Part II — The systematic pass

Coverage comes from method, not vigilance. Spot-checking finds the bugs you
happen to think of; this finds the ones you don't.

## II.1 How to get coverage

Work the diff **hunk by hunk, not file by file**. For each hunk:

1. **Classify every changed line** into one or more constructs (§II.2).
2. For each construct, walk **its full angle list** (§II.3).
3. Record a verdict per angle. Skipping an angle requires a stated reason
   ("no user-supplied value reaches this").

Also review what the diff does NOT show:

- **Removed lines** — deletion is a change. Every removed check held an
  invariant; name it and prove it still held elsewhere, or genuinely dead.
- **Unchanged callers** — a changed function's behavior reaches code the diff
  never touched. Find every caller.
- **Untouched siblings** — a bug of class X here means grep the parallel files
  (`*-url.ts`, `*-action.ts`, `*-query.ts`) for the same shape. → §III.8
- **The other half of a two-sided claim** — a parser that gained a format, a
  picker that filters it, a template that documents it, a writer that emits it.
  Changing one side and not the others ships a feature that does not work.

## II.2 Construct taxonomy

| # | Construct | Recognise it by |
|---|---|---|
| C1 | Value from outside | params, body, URL, env, headers, file, third-party response, **a database row** |
| C2 | Type or schema declaration | `interface`, `type`, zod schema, cast, `as` |
| C3 | Read | select, fetch, getter, cache read |
| C4 | Write | insert/update/delete/upsert, publish, file write, external POST |
| C5 | Branch or guard | `if`, ternary, `??`, `&&`, filter, validation, early return |
| C6 | Loop or iteration | `for`, `map`, `reduce`, recursion, batch |
| C7 | Async / concurrency | `await`, promise, effect, transition, event handler |
| C8 | State | component state, module scope, cache, cookie, singleton |
| C9 | Render or output | JSX, user message, log line, response body |
| C10 | Resource | connection, listener, subscription, timer, stream |
| C11 | Call / signature | a function you call, or whose signature you changed |
| C12 | Removal | deleted code, deleted check, loosened constraint |
| C13 | Synchronicity change | a call that became `await`ed or stopped being; two calls merged; a lazy `import()` added |
| C14 | **Third-party parse or expansion** | a library that turns bytes/text into a model: `xlsx.load`, `JSON.parse`, a zip reader, a SAX/XML parser, an ORM hydrate |
| C15 | **Quantity with a basis** | money, a date bucket, a duration, a count — anything whose meaning depends on a currency, timezone, or unit |

## II.3 The angle matrix

**C1 — Value from outside**
- Authority: what GUARANTEES its shape? Not our own type. → §III.1
- Shape: scalar vs **array** vs object vs null vs undefined vs missing key.
- Emptiness: `""`, `"   "`, `[]`, `{}`, `0`, `false` — and which the truthiness
  check silently treats as absent.
- Size: min, max, **one past max**, far beyond max.
- Numbers: `0`, negative, float where int expected, `NaN`, `Infinity`, leading
  zeros, `0x`, exponent notation, precision loss, past int range.
- Text: unicode, combining marks, zero-width, control chars, newlines/tabs in
  "single-line" values, RTL overrides, homoglyphs, case-folding collisions,
  NFC vs NFD.
- **Representation**: do you inspect the same form the consumer acts on? Raw
  bytes vs decoded text, entity-escaped vs resolved, quoted vs unquoted,
  comment-interrupted vs joined. A check on one representation of a value that
  is consumed in another is a bypass, not a check. → §III.14
- Injection context: SQL, `LIKE`/`ILIKE` pattern, regex, HTML, shell, URL,
  header, filename, log — each sink needs its own escaping.
- Trust: who supplies it, can they forge it, re-validated server-side?
- Metadata: is the number that governs the work (declared size, count, length
  prefix) written by the supplier of the data? Then it bounds nothing. → §III.12
- **Legacy**: what does the store ALREADY contain that today's validation would
  reject? → §III.4

**C2 — Type or schema declaration**
- Claim vs guarantee: enforced at runtime, or just asserted?
- Transformation: does it trim/coerce/default? Is that WANTED at this call
  site, or does it corrupt the value? → §III.2
- Applicability: does it describe values that already exist, or only new ones?
- Reuse: is this schema used for a second purpose with a different contract?
- Casts: does `as` hide a lie? What proves the cast sound?
- **Third-party types are the vendor's claim, not the vendor's behavior**: a
  `.d.ts` can omit options the runtime reads, or declare a type the runtime
  never sees. Read the implementation before concluding either way. → §III.1

**C3 — Read**
- Cardinality: zero rows, exactly one, many, duplicates.
- Missing: absent, soft-deleted, or RLS-filtered — RLS returns EMPTY, not an
  error, so "not found" and "not allowed" look alike.
- **Error vs empty**: is `error` read at all? An ignored error plus a defaulted
  `data` is indistinguishable from a genuine empty result. → §III.9
- Staleness: re-read later? Can it change in between?
- Ordering: ties, unstable sort, missing tiebreaker, pagination drift.
- Pagination: page 0, page past the end, size past the whitelist, result set
  shrinking under the current page.
- **Snapshot consistency**: does a multi-page walk aggregate a set that can
  change between pages? Offsets shift when rows are inserted or deleted
  mid-walk, so rows are skipped or double-counted. An aggregate over a mutating
  set belongs in one server-side query, not a client page loop.
- **Limit without order**: a `LIMIT`/`.range()` with no `ORDER BY` lets the
  database pick an arbitrary subset. If which rows survive matters, order first.
- Cost: index support, N+1, over-selecting.

**C4 — Write**
- Authorization, at the server, independent of client gating.
- Precondition carried into the write's own predicate? → §III.3
- Constraints: unique, FK, check, not-null — and what the user is told when one
  fires.
- Zero rows affected: success, conflict, or missing row? All three are
  distinguishable and must be distinguished.
- **Was the update's own error read?** A cleanup, cancellation, or
  mark-as-done write whose error is discarded leaves the row in the state the
  caller just reported it was moved out of.
- Unknown outcome: lost response, timeout, 5xx. → §III.3
- Repetition: executed twice? Idempotency needed? Is the idempotency key
  derived from something that can change between attempts (a rotating time
  bucket, a requested amount) without an atomic claim on the row? → Part S.2
- Partial: multi-statement/multi-system — state if it stops halfway? Who
  reconciles? → Part S.3
- **One-shot flags**: is a "already notified / already handled" marker written
  before the effect succeeded? A swallowed send failure then consumes the only
  attempt permanently. → §III.9
- Aftermath: cache invalidation, revalidation, what the screen shows next.

**C5 — Branch or guard**
- **Both directions**: fires when it should AND silent when it should. → §III.6
- The else path: written, or silent fall-through?
- Truthiness traps: `0`, `""`, `NaN`, `[]`, `"false"`.
- Nullish vs falsy: `??` vs `||` — legitimate `0`/`""` replaced by a default?
- Fail open or closed on error? On **unparseable input**? Skipping what you
  cannot measure is fail-open. → §III.16
- Order: does an earlier guard shadow a later one? Does an expensive or
  consuming step (an OTP check, a payment) run before a cheap authorization
  step that could have refused the request?
- **Whitelist or blacklist?** A guard listing what to reject is a list of what
  its author thought of. Prefer listing what to accept. → §III.16

**C6 — Loop or iteration**
- Zero, one, many; duplicates in input.
- Bounded? By what? Attacker-controlled?
- I/O inside the loop. Mutation during iteration.
- Failure mid-way: partial application; do earlier items roll back?

**C7 — Async / concurrency**
- Two actors at once: lost update, double-spend, duplicate row.
- Check-then-act gaps. → §III.3
- Out-of-order completion: stale response overwriting newer. → §III.11
- **Session/generation identity**: does a settling request identify the editor
  session it belongs to, or only the entity id? An entity can be closed and
  reopened before the first request returns.
- Double submit: rapid clicks, Enter, retries.
- Missing `await`, floating promises, unhandled rejection.
- Cleanup: abort on unmount, cancel on re-run, stale closures.
- Reentrancy: handler running again before the first finishes.

**C8 — State**
- Initial value; after external change; on reopen.
- Reset between uses — yesterday's edit in today's dialog?
- **Server module scope is shared across all users** — never per-request state.
- Derived vs stored: two sources of truth drifting.
- **A shared observer reports one subject**: a mutation/query hook shared by
  several rows reports only the latest; per-row flags derived from it are wrong
  whenever two overlap.
- Sync with URL, cache, server after mutation.

**C9 — Render or output**
- Escaping for the sink. All states: loading, empty, error, partial,
  unauthorized. Extreme content: long strings, zero-width, RTL, overflow.
- Disclosure: does this message tell an unauthorized caller something?
- **Does the control show what will actually be saved?** A select bound to a
  value absent from its option list renders its placeholder while the value is
  still what persists. → §III.9
- Accessibility: label, role, focus, keyboard path.

**C10 — Resource**
- Released on every path, including throw. Unsubscribed on unmount; no
  duplicate listeners on re-render. Timers cleared.

**C11 — Call / signature**
- Every caller found and checked — including other repos.
- Added parameter: what do existing callers pass? Default masking a bug?
- Changed behavior: which callers relied on the old behavior?
- Return shape change: all consumers updated?

**C12 — Removal**
- What invariant did the removed code hold? Who relied on it? Dead, or only
  LOOKS dead?

**C13 — Synchronicity change**
- **Every guard around the changed call**: positioned relative to an `await`
  that moved, appeared, or vanished? Stale-response checks, locks, dirty flags,
  loading flags are POSITIONAL — correct because of what can interleave where
  they sit. Making a call async creates an interleaving point that did not
  exist; making one sync removes one something relied on.
- Guards now on the wrong side: a check BEFORE an `await` written to discard a
  late result is not weaker — it is **inert**.
- New race windows: what else can the user do during the new await?
- Window width: an `await` that got slower widens every race it is in.
- Merged calls: two statements collapsed into one hide whatever sat between
  them. Recover the old ordering; ask what it held apart.

**C14 — Third-party parse or expansion**
- **What does it build?** Open the library and find where input becomes
  objects. One object per row? Per cell? Per element of a declared range?
- **What bounds the count?** If the only bound is input size, measure the
  expansion factor and multiply — then say whether the result is survivable.
- **Can it be switched off?** Most parsers accept options that skip whole
  subtrees. Not parsing a construct is a stronger guarantee than any count of
  it, and it covers the constructs nobody has enumerated yet. → §III.15
- **Does your pre-check parse the way it parses?** Same delimiter set, same
  escape handling, same choice among ambiguous candidates. Any divergence is a
  bypass or a false rejection. → §III.14
- **What does it silently ignore?** A construct the library drops costs
  nothing — metering it produces false rejections; a construct it resolves that
  you skip is a bypass. Both directions need evidence.
- Errors: does it throw, return a partial model, or produce a plausible empty
  one?

**C15 — Quantity with a basis**
- **Currency/unit**: are two amounts ever added, compared, or summed without
  proving the same denomination? A total that mixes units is wrong at every
  reader.
- **Where is the basis recorded?** On the row, or read from the entity's
  *current* setting? A historical row read through today's currency/timezone
  changes its meaning when the entity changes.
- **Timezone basis**: is a bucket, period boundary, or "today" computed on the
  same clock by the writer and by every reader? UTC-truncating one side and
  local-truncating the other misfiles everything near the boundary.
- **Conversion failure**: what happens when a rate or offset is missing? A
  `?? 1` fallback silently treats a foreign amount as domestic.
- Rounding, minor units, and precision at each hop.

## II.4 Escalation

When a construct touches **authentication, authorization, money, personal
data, data integrity, destructive operations, or anything irreversible**, the
full angle list is mandatory and discharged explicitly. "Probably fine" is not
available here, and §R.2's execution requirement is strict: behavioral verdicts
in this zone need a run.

## II.5 Enforcement floor and end-to-end completion

A change lives in one repo; the behavior lives across the whole system.
Reviewing only the diff produces two failures: a check that exists HERE gets
mistaken for a check that holds ANYWHERE, and everything the value touches
outside this repo goes unexamined.

Do not solve this with a fixed list of layers — **a fixed list becomes a
ceiling**. Derive the path instead, per change:

### Derive the path
Take each value the change touches. Follow it from entry to rest, and from
storage back out to every read. Record every distinct thing it actually passes
through **in this system, found by looking**. That trace is the layer list for
this change, re-derived every time. Anything not found by following the value
is not covered — say so rather than assume it was nothing.

### Find the enforcement floor
For each invariant: **what is the lowest point at which it still holds?**
Everything above that point is advisory. Find it with the bypass question —
*"what could write this data without passing through this check?"* If a route
exists, the check is UX, not enforcement. Descend until no route exists. When
the floor sits above the storage itself: any other writer can violate the
invariant, and **data that already exists may violate it right now**. → §III.4

A client-side precheck plus a non-atomic RPC has its floor **above** storage:
two callers pass the check and both write. Say so explicitly rather than
treating the precheck as the limit.

### Enumerate the actors by searching, not recalling
Who can write or read this data? Search this repo, sibling repos, and the
schema itself — including non-application writers: triggers, scheduled jobs,
imports, seeds, migrations, direct console access, services you do not own.
For each actor found, state whether the invariant holds. State WHERE you
searched; everywhere else is unexamined, not clear.

### Reverse the direction
For every rule the storage layer enforces, does every consumer handle its
violation as something actionable? Enforcement below with no handling above is
a broken experience; a check above with no enforcement below is bypassable.

### The catch-all
Anything unclassifiable in the trace, or any actor you cannot inspect, is a
finding — record it in Unverified with what it would take to resolve. Never
conclude an invariant holds because no counterexample appeared where you
happened to look.

### Completion
Trace **one complete success and one complete failure** through the derived
path, naming what each hop does and on what evidence. **Trace the failure
FIRST**, while you have no answer you are attached to — the success trace only
confirms the path you already believed in. Then check the feature as a whole:

- Every state has an exit, including error and partial states.
- Every view has loading, empty, error, and unauthorized states.
- Every failure the system can produce reaches the user as something
  actionable.
- **Every discard reaches the user as something other than success** (§III.9).
  Walk the `catch`es, filters over parse results, substituted defaults,
  destructured-away fields, ignored `error` fields; name what is shown for each.
- Anything newly reachable is reversible, or stated as one-way.
- Anything created can be found, changed, and retired — or the omission is
  deliberate and stated.

Where behavior is the question, the answer is a run: a script, a fixture, a
crafted input — written before declaring done, not after someone asks (§R.2).

---

# Part S — The soundness verdict (is it built RIGHT)

Correctness passing does not end the review. Run this second, separate pass
wherever the diff touches: **multiple writes that must agree, shared state,
concurrency, unbounded work, a hot path, money, personal data, or destructive/
irreversible operations.** If it touches none of these, working is right —
record "S: N-A" and stop. Where it does, discharge four questions explicitly:

## S.1 Load — what happens at a thousand
Query/RPC/IO in a loop → one call or bounded chunks; a query per item is a
defect even when it passes on 3 rows. Unbounded anything → hard bound. Slow
work in the synchronous write path → persist, return, background job with
status field. New query patterns → verified index. Input that a library
expands → a bound on the expansion, not on the input (§III.15).

## S.2 Concurrency — what happens when two run at once
Check-then-act gaps carry the checked value into the write's predicate. Stale
responses never overwrite newer ones: **order on commit, never on claim** — a
failed request must leave ordering untouched, or failure gains the power to
cancel success. A cap enforced by a client precheck is not enforced. An
idempotency key must be derived from a claim that is itself atomic — a key
including a mutable input (amount, time bucket) lets two attempts produce two
different keys and two real effects. More than one flag describing one concept
→ write the state table (rows = states, columns = what each observer does)
before judging. → §III.11

## S.3 Partial failure — what happens when it stops halfway
**Two or more writes that must agree = a transaction.** Either one atomic unit
(a DB transaction, an RPC/server action wrapping both on the server), or
explicitly defined and reconciled partial-failure behavior. "They usually both
succeed" is not a design — a dual write with no defined partial state is a
FAIL, not a note. Snapshots read before the row lock and in-memory compensation
flags that don't survive a crash are named and flagged. Where money has already
moved and the recording failed, a durable reconciliation record is mandatory:
"the client is told not to retry" is not a plan.

## S.4 The better-way check
Could the same result be reached by a sounder structure — an RPC that makes it
atomic, a DB constraint holding against EVERY writer instead of this code path,
a server action keeping the transaction server-side, one set-based query
instead of a loop, **a parser option that removes the construct instead of a
counter that measures it**? Push every guarantee as close to the storage — or
as close to "cannot happen" — as it will go. When a sounder structure exists
but costs more, do not silently pick — report "sound version X (cost …) vs
current Y (risk …)" so it is a decision, not an accident.

---

# Part III — Method rules

Not bug entries — the reasoning failures that produce bugs.

### III.1 The authority is never our own type
A value's guarantee comes from the system that produces it. Citing `interface
Foo` as the authority for `Foo` is circular. Real authorities: **database** →
the migration SQL (a UI constant is not a column constraint; `TEXT` has no
length cap regardless of the form; `CHECK (LENGTH(TRIM(x)) > 0)` still permits
surrounding whitespace). **Framework** → its own types and docs. **Library** →
its *source*, not its `.d.ts` and not the format it claims to implement — a
declaration file can omit options the runtime honours, and a parser can accept
input the specification forbids. **Driver** → its documented return contract,
including what it returns when a request is never answered. **Network** → a
rejected promise means *unknown*, not *did not happen*. Fill this ledger for
every boundary-crossing value; unfillable rows go to **Unverified**, never
assumed passing:

| Value | Boundary | Authority (file:line or doc) | Real guarantee | Matches? |
| ----- | -------- | ---------------------------- | -------------- | -------- |

### III.2 A guard value is not an input value
A concurrency guard, version token, or identity match must match the stored
value **byte for byte**: no trimming, case folding, length cap, or schema
shared with the form field it resembles. This is where DRY misleads: two values
with the same name and type can have opposite contracts — one normalised on the
way in, one that must never be touched. Merging them locks every row whose
stored value the form would reject.

### III.3 Distinguish refused, conflicted, and unknown
- **Refused** — the system answered no. Report the reason.
- **Conflicted** — the precondition no longer holds (zero rows). Report a
  conflict and reconcile the screen.
- **Unknown** — no answer (status 0/undefined/≥500, rejected promise, timeout).
  The write **may have committed**. Report "could not confirm", tell the user
  to reload and check, refresh the view, never leave a form primed to blindly
  resubmit.

Any check-then-act carries the checked value into the write's own predicate,
and the guard value comes from what the **user was actually shown** — a re-read
inside the handler agrees with itself and proves nothing.

### III.4 Test the data the system already holds
Hostile keyboard input is the easy half. The other half is rows that predate
today's constraints: written before a limit existed, bulk-imported, inserted by
another service, seeded, migrated. Read the migration to learn what they can
look like; check the code against THOSE. A migration that seeds a new column
from an old one is making a claim about every historical row — check it against
the rows that were written under different rules.

### III.5 Search for precedent before writing
Before adding a guard or error path, grep for the existing helper and use it or
state none exists. If you find yourself inventing a mechanism, assume it exists
and you haven't found it yet.

### III.6 Prove guards in both directions
Every guard needs two verdicts: (1) it fires when it should — no false
negatives; (2) it stays silent when it should — **no false positives**.
Proving only (1) is how a fix becomes worse than the bug: a guard that blocks a
rare race but permanently locks legitimate rows. You are biased toward showing
your own guard works; spend the effort proving it wrong. **A new guard is more
dangerous than the bug it fixes until (2) is demonstrated — by a run where
possible (§R.2).**

### III.7 "It's just a refactor" is a claim, not a category
The most dangerous edit is the one classified as behavior-preserving, because
the classification excuses reviewing it. **A refactor is reviewed as a change,
at full angle coverage.** If it were truly behavior-preserving you could prove
it — and proving it IS the review. Put old and new lines side by side and ask
what the old arrangement held that the new one does not: guards, locks, flags,
and early returns are correct because of WHERE they sit, and a refactor moves
things. This compounds with §0.8 — review the parts you are most confident
about FIRST, not last.

### III.8 Bugs travel in families
A confirmed bug in one file is a hypothesis about every similar file. Grep the
siblings immediately and report the sweep — found elsewhere, or confirmed
absent. Never fix one instance and leave the family unexamined.

**A capability is a family too.** When a feature is added — a new file format,
a new column, a new status — list every place that must agree: the parser, the
picker's `accept`, the template, the writer, the validator, the docs. Changing
the half you were looking at ships a feature that works only in the path you
tested.

### III.9 Every discard needs a witness
Find each place the code drops something — a `catch` returning a default, a
`filter` over parse results, a rejecting validator, a destructured-away field,
an **unread `error` beside a defaulted `data`**, a fallback for a failed read —
and ask the only question that matters:

> **If this drops something, what does the user see?**

If the answer is "success", it is a bug. Not a risk, not a smell — a bug.
Nothing throws, nothing logs, so no amount of re-reading the happy path reveals
it. This is the single highest-yield sweep in this document. Watch especially
for **a legitimate value doubling as a failure signal** — empty array, zero,
empty string, `null`: if a real read can return the same value, failure is now
indistinguishable from an answer, and every downstream consumer treats it as
one.

Two shapes that hide from this question and must be sought by name:

- **The retained value with the cleared warning.** The record still holds the
  bad link; only the annotation that said so was recomputed away. The queue
  that surfaces it goes quiet while the data stays wrong.
- **The claimed one-shot.** A flag saying "already handled" written before the
  handling succeeded, with the failure swallowed. Nothing shows an error and
  the only attempt is spent.

### III.10 Your own comment is a hypothesis, not evidence
A comment explaining why code is correct is a claim awaiting verification. Two
failure modes: the **unverified justification** (reasoning written in place of
the check, standing in for it on every re-read) and the **documented trap** (a
hazard described in detail directly above code that walks into it). Dense
rationale works against review — it reads as already-considered. **Heavily
commented code deserves more scrutiny, not less.** A comment asserting
something about a library, protocol, or runtime is a citation: open the source
and confirm it. A comment that states a measured number — "16× expansion",
"loads in 37 ms" — is the *best* kind, and still a citation: re-measure it when
the surrounding code changes.

### III.11 Enumerate the states before patching one
When a fix produces a bug that produces a fix, nobody wrote down the states.
**When more than one flag describes one concept, write the state table before
touching the code** — rows are states, columns are what each observer does.
The contradictions become obvious in the table, not in the patches. Corollary
for async: **order on commit, never on claim** — a failed request must leave
ordering untouched, or failure gains the power to cancel success.

### III.12 Metadata is input too — ask who writes the number
For every number that governs how much work is done — declared size, length
prefix, count, `Content-Length`, reported total — ask **who writes it**. If the
same party that supplies the data, it bounds nothing. A check on declared size
is an **early rejection**, never a safety boundary; the boundary is enforced
against what actually happens — bytes as produced, running total, hard stop.
Label which of the two each check is, in the code. The same lens catches
INCOMPLETE input: an all-or-nothing match ("every required column present")
fails on a file missing one column, then reports every column as missing.

### III.13 Prefer the invariant a compiler can hold
When a review finds a rule maintained by discipline, ask what would make it
structural: a narrowed type, an omitted field, a branded value, a single
constructor. The bug exists exactly as long as the rule is a convention. Note
the tooling implication: typecheck, lint, and build passing is close to no
evidence for this class — of fourteen real bugs, those three caught one, the
one whose invariant had just been made structural.

### III.14 Agree with the consumer, do not be independently correct

When code inspects input **on behalf of** something else that will parse it —
a preflight before a library load, a validator before a downstream service, a
sanitiser before a renderer — the authority is **the consumer's parser**, not
the format specification and not your reading of it.

Any divergence is a defect in one of two directions, and both are real:

- **You are more lenient** → the consumer acts on something you did not
  measure. That is the bypass.
- **You are stricter** → you refuse input the consumer handles safely. That is
  the false rejection, and it is indistinguishable from a broken feature.

Three ways the divergence appears, all observed here:

1. **Different representation.** You read raw bytes; the consumer reads decoded
   text. Character references, escapes, comments the parser drops and joins
   across, quoting — each turns a string you measured as harmless into one it
   acts on.
2. **Different grammar.** Your pattern recognises the tidy form; the consumer's
   decoder accepts far more and normalises it. A reference your regex scores as
   one cell can decode to the entire grid.
3. **Different choice among candidates.** Where a format allows several
   readings, you take one and the consumer takes another. Being "more correct"
   than the consumer creates a differential: you measure archive A while it
   loads archive B.

**Method:** open the consumer's parsing code and cite it. Mirror its selection
rule exactly, including its bugs. Where mirroring is impractical, fail closed
on everything not provably identical — never approximate in the lenient
direction. And when the consumer *ignores* a construct, do not charge for it:
excluding it needs the same citation as bounding it.

### III.15 Bound what gets built, not what arrives — and prefer not building it

Input size is not a bound on the model a parser constructs from it. Measure the
expansion factor before claiming a byte cap protects anything: here, ExcelJS
built roughly 250 bytes of objects per XML element, so a 1.5 MB file inside
every declared limit produced 382 MB — a 16× expansion on the XML, and far more
on the compressed input.

Worse, expansion is not proportional at all when a format lets a short
declaration describe a large region. A forty-byte `<mergeCell ref="A1:XFD…">`,
a `<col max="1000000000">`, a defined name over the whole grid — each names
billions of objects while contributing nothing to any byte or row count.

**The escalation ladder, in order of strength:**

1. **Don't parse it.** Most parsers accept an ignore/skip option. A construct
   that is never parsed cannot expand, and this covers constructs nobody has
   enumerated — including the ones added by the next library version.
2. **Let the consumer enforce the bound.** Many parsers take their own limits
   and fail during the parse rather than after it.
3. **Bound the universal quantity.** If you must count, count the thing that
   does not require knowing which constructs are expensive — total elements,
   total objects — rather than a list of specific ones.
4. **Count specific constructs.** Weakest, and the one that needs a new round
   every time someone finds another construct. If you land here, say so and
   name what makes the list complete.

When step 1 is taken, record the coupling: an ignore-list copied from a
library's internals is a snapshot, and an upgrade that adds a construct
silently restores the hole. That coupling belongs in a comment beside the list
and in whatever gates dependency bumps.

### III.16 Fail closed, and whitelist rather than blacklist

Two habits that produce the same class of hole.

**Skipping is not neutral.** A meter that cannot parse an input and moves on
has decided the input is free. A guard whose lookup fails and returns "not
restricted" has decided the caller is allowed. In both cases the safe answer is
refusal: `null` means *unknown*, and unknown is not permission. Write the
refusal path first, then the success path.

**A blacklist is a list of what its author thought of.** A terminator check
that refuses `<!` but not `<?`; an escape filter naming three dangerous
characters; a set of "reserved" prefixes. Each is complete only until the next
form is found. Where the accepted set can be described — a closing tag, a
canonical grammar, an enumerated list of names — accept exactly that and refuse
the rest. Then adding a case is a *false rejection* (visible, reported, cheap)
instead of a *bypass* (silent, exploitable).

Corollary for patterns: **a bounded quantifier in a security-relevant regex is
a silent truncation.** `\d{1,7}` matched the first seven digits of an
eight-digit row and scored an eighty-nine-million-cell range as two cells.
Anchor the pattern, consume the whole token, and reject what does not fit — a
partial match that satisfies a meter is a bypass.

### III.17 When the same class returns, stop patching instances

One finding is a bug. The same *class* twice is a design defect, and the third
round of it is a signal that the approach cannot converge. Enumerating hostile
cases loses to whoever is enumerating; the fix has to move.

At the second occurrence, stop and ask: what single change makes this whole
class unreachable? Turning the capability off, whitelisting the accepted form,
moving the check to the consumer, pushing the invariant into a type or a
constraint. Then say plainly what the new approach costs — usually a coupling
or a false-rejection rate — so the trade is recorded rather than discovered
later.

The tell that you are in this loop: each fix is in the same file as the last,
each is a new special case beside the previous one, and each review round
produces a finding on code written in the round before.

---

# Part IV — Worked examples

Real findings from past reviews — **illustrations, not the checklist** (the
checklist is Part II).

| What shipped | Construct | Angle that would have caught it | Rule |
|---|---|---|---|
| `.trim()` on a URL param that can be an array | C1 | Shape: scalar vs array | III.1 |
| Rename matched on `id` alone; concurrent renames lost | C4, C7 | Precondition in the predicate; two actors | III.3 |
| Rejected action promise reported as confirmed failure | C4, C7 | Unknown outcome | III.3 |
| Guard token run through the trimming/length input schema, locking rows with whitespace or long names | C2 | Transformation wanted here?; legacy values | III.2, III.4, III.6 |
| Server action reachable without an admin check | C4 | Authorization at the server | II.4 |
| Verification flag carried onto a new value | C2 | Applicability of the claim | III.1 |
| Page past the end: empty table still reporting rows | C3 | Result set shrinking | II.3/C3 |
| `*` escaped for `ILIKE`, rewritten to `%` by PostgREST | C1 | Escaping for the right sink | III.1 |
| Two lines merged into one `await`; stale-response guard left before it, inert | C13, C7 | Guards on the wrong side; window width | III.7 |
| 2 MB workbook fully decompressed on the UI thread before the 300-row cap applied | C1, C6 | Cost vs size; where the limit sits | II.3/C1 |
| Over-cap warning rejected, then dropped by the collecting transform — row imported clean, minus a field | C2 | What does the user see when this drops? | III.9 |
| Failed lookup fetch stored as an empty option set — indistinguishable from none configured | C3 | Legitimate value doubling as failure signal | III.9 |
| Zip entry sizes read from the archive's own central directory, treated as a memory bound | C1, C6 | Who writes this number? | III.12 |
| Schema kept two sheet-only fields; every parse emitted them as null; RPC refused; all manual saves broken | C2 | Rule held by convention, not type | III.13 |
| Ordering claimed at request start; failed read invalidated an in-flight success | C7 | State table; order on commit | III.11 |
| Header check required EVERY required column; a file missing one reported all missing | C1 | Incomplete input, not just hostile | III.12 |
| Lookup folding without Unicode normalisation: decomposed "Café" matched nothing | C1 | Equivalent encodings | III.1 |
| A select bound to an id absent from its ACTIVE-only options: placeholder shown, retired id still saved | C9 | Does the control show what will be saved? | III.9 |
| Two parsers for one cell — commas resolved by dictionary, pipes hard-coded — so each fix exposed the other's gap | C1 | Same class returning; one reader or two? | III.17 |
| Byte and row caps passed; ExcelJS built 382 MB of model from a 1.5 MB file (16× the XML) | C14 | What does it build, and what bounds the count? | III.15 |
| Merge/col/`sqref`/defined-name expansions each found in a separate round, each metered separately | C14 | Escalation ladder: don't parse it | III.15, III.17 |
| Preflight "corrected" to find the real EOCD; JSZip still took the last signature — meter and loader read different archives | C14 | Agree with the consumer, don't be more correct | III.14 |
| Defined-name meter read raw bytes; saxes resolved `&#36;`/`&#x24;` and joined text across `<!--…-->` and `<?…?>` | C14, C1 | Representation: same form the consumer acts on? | III.14 |
| `\d{1,7}` matched seven of eight digits; an 89-million-cell range metered as two cells | C1 | Bounded quantifier = silent truncation | III.16 |
| Unparseable range `continue`d instead of refusing — the one case that must not be free | C5 | Skipping is fail-open | III.16 |
| `_xlnm.Print_Area` charged for cells ExcelJS never expands — valid workbooks refused | C14 | Consumer *ignores* it: excluding needs a citation too | III.14 |
| Reported "type-check/build fails" on a call that builds clean; exceljs ships its own module-scoped `Buffer extends ArrayBuffer` | — | Verify the finding's premise before fixing | 0.9, III.1 |
| Reported fix "use `cell.text`, it applies `numFmt`" — measured: `.text` is `_value.toString()`, no formatter exists | — | The proposed fix is a claim too | 0.9 |
| Reported "spaces not collapsed"; `[^\p{L}\p{N}\p{M}]+` already collapses runs — the fix would have been dead code | — | Run it before believing it | 0.9, R.2 |

Three patterns. Most rows: an optimistic assumption about a system we do not
control, where the authoritative source was available and never opened. A
second group: **the code reported success while losing something** — no
exception, no log, no failing check; only III.9's question finds them. The
newest group: **a check written against the wrong model of its consumer** —
right in the abstract, wrong about what the library beside it actually does.

The last three rows are a category of their own and the reason for §0.9: a
confident, well-formatted, wrong finding costs more than a missed one, because
acting on it adds code that is dead at best and a differential at worst.

## Where evidence tends to live

Starting points for §II.5's search — **where to begin looking, not what to
check off**; the derived trace is authoritative:

- Schema, constraints, RLS policies, triggers, functions, and indexes live in a
  **separate repository**. A rule enforced there is invisible in this diff; a
  rule enforced only here is invisible to every other writer.
- Generated database types in this repo are a **snapshot**, not the schema —
  possibly stale, and our claim rather than the authority. → §0.2
- **`node_modules` is a primary source.** When behavior depends on a library,
  the answer is in its source, not its README, its types, or the format it
  implements. Reading it is usually faster than arguing about it.
- Sibling front-ends hold their own copy of shared assumptions — enum values,
  status strings, message codes, column names.
- Writers that are not application code: triggers, migrations, seeds, bulk
  imports, scheduled jobs, direct console access.

Anything found beyond these is part of the system too — add it to the trace.

---

# Part V — Output contract

Report every item as **PASS / FAIL / N-A / UNVERIFIED** with `file:line`
evidence — and for behavioral verdicts, run evidence (§R.2). Prose like "looks
fine" is not a verdict. Findings carry: severity, file, location, the problem,
a concrete failure scenario, why the code allows it, and the fix.

**Run conditions (first, before everything)** — cold or warm (§R.1); if warm,
which §0.8 compensations were applied and the closing cold re-run requirement.
Whether a runner was available; if not, which verdicts became Unverified.

**Reconstruction** — before any finding:
1. The workflow **as derived from the code** (§0.4): entry points, inputs and
   their real origins, traced values, invariants and enforcers.
2. Divergences from intended behavior — bug, or gap in your understanding?
   Which, and why.
3. The contract written for each function **before** reading its body (§0.5),
   and whether the body meets it.
4. Authorship declaration (§0.8) and compensations applied.

**Inherited findings** (§0.9) — every finding reported by someone else, each
as CONFIRMED / PARTLY / REFUTED with the run that decided it, and for the
confirmed ones whether the proposed fix was adopted or independently derived.
Refutations are reported, not dropped.

**Assumption ledger** (§0.3) — every unverified belief, what it would take to
verify, and which findings AND passing verdicts depend on each. A pass resting
on an unverified assumption is reported as unverified, not as a pass.

**Coverage report:**
1. Hunks reviewed / total hunks.
2. Constructs found, by type (§II.2).
3. Angles skipped, each with reason.
4. Removed lines: invariants held, and where held now.
5. Callers checked for every changed signature.
6. Sibling sweep (§III.8): where searched, result — including the capability
   sweep where a feature was added.
7. Boundary ledger (§III.1), Unverified rows called out — with the consumer's
   parser cited for anything checked on its behalf (§III.14).
8. Lines that could not be justified (§0.7): dead or not understood.
9. The derived path (§II.5) per value, the enforcement floor per invariant,
   with the bypass route named where the floor sits above storage.
10. Actors found by searching; whether the invariant holds for each; **where
    you searched** — everywhere else is unexamined, not clear.
11. End-to-end success AND failure traces, with what each hop does and on what
    evidence. Unnameable hops go to Unverified.

**Rule check** — Part I, items 0–6, each with a verdict.

**Soundness verdict** — Part S: N-A with the reason, or S.1–S.4 each
discharged, including the better-way statement where one exists.

**Guard check** — every guard the diff adds, with **both** verdicts (§III.6),
and the run that demonstrated direction (2) where a runner existed.

**Expansion check** (§III.15) — for any C14 construct: what the library builds,
what bounds it, which rung of the ladder the code sits on, and the coupling
recorded if rung 1 was taken.

**Unverified** — everything that could not be confirmed, and why. Never empty
by default: if empty, state what made full verification possible.

**Escalation** — for any §II.4 construct, an explicit statement that the full
angle list was discharged.

Finally: if this review found a new failure **class** not covered by Part II,
add the angle to the matrix in the same change. Part IV grows by example;
Part II grows by class — and Part II is the one that catches what nobody has
seen yet. **If the same class appears in Part IV three times, that is not more
examples — it is §III.17 telling you the approach in that area has to change.**
