# Working with this user (every project)

## How to talk and hand over work
- Replies are SHORT and in plain, everyday language. No essays, no big tables
  unless asked. Managers read these.
- Every reply that reports work uses these five headings, a line or two each:
  **Change** (what I did) · **Why** (the reason) · **Break** (what could break, or
  "nothing") · **Impact** (who/what it affects) · **Objective achieved** (yes/no,
  and what is left).
- Plans and docs hold only what the implementer needs: the conclusion, not how I
  searched. No ruled-out grep hits, no "verified, not assumed" headings, no
  occurrence counts as evidence. Schema goes in markdown tables
  (`Column | Type | Notes`), not prose.
- Guides for other developers are ADHD-friendly: a TL;DR box, a "do this now"
  checklist, short API cards (why, numbered steps, code sketch where the flow is
  non-obvious, "never do"). Steps come from the function source, not the happy
  path. No dev-environment notes in them (test accounts, "try it on dev",
  backfill talk) — that goes in chat.
- Code comments describe the working flow — what the screen does, in order, and
  what the user is doing at each step. Not a list of arbitrary inputs a field
  might get. An edge case earns a comment only when it is load-bearing, in a
  clause.

## Git — the user owns it
- Never run state-changing git: `commit`, `add`, `stash`, `rm`, `checkout`,
  `branch`, `reset`, `rebase`, `push`. Not as part of a larger task, not to
  "finish" pending work.
- NEVER merge (`gh pr merge`, `git merge`, the GitHub UI) unless the user says
  "merge it" in that moment. A green PR is not permission.
- The only exception is an explicit, in-the-moment instruction naming the
  operation ("commit this"). "Complete pending items" is not that.
- Read-only git/gh is fine without asking: `status`, `log`, `diff`, `show`,
  `gh pr list/view`, `gh api .../pulls/N/comments`.
- Finish the code, verify it, then report what is uncommitted, how it groups into
  commits, and the commit messages as text.

## Agents
- Don't fan out parallel subagents for reviews or audits. Do the work directly
  with my own Grep/Read/git calls. Spawn an agent only when the user asks.

## Engineering lessons learned the hard way
- **Silent discards are bugs.** At every `catch` returning a default, filter
  over parse results, rejected row, or fallback value, ask what the user sees.
  If it's "success", fix it. Watch for a real value (`[]`, `0`, `""`, `null`)
  doubling as the failure signal.
- **Verify, don't justify.** A comment explaining why code is right is a claim.
  Open the library/protocol source before writing the sentence. Heavily
  commented code deserves more scrutiny, not less.
- **Unverified is not missing.** If I can't check something (an RLS policy, a
  trigger, table contents), it goes in an "Unverified" note with the exact query
  that would settle it — never a defensive migration or guard. "Adding it to be
  safe" silently duplicates policies and constraints.
- **Enumerate states before patching.** When a fix causes the next bug, or more
  than one flag describes one concept, write the state table first (rows =
  states, columns = what each observer does). Async ordering: order on commit,
  never on claim.
- **Structure over convention.** Make a rule uncompilable (narrowed type,
  omitted field, branded value, single constructor). Green typecheck/lint/build
  is close to no evidence about behaviour — write the run.
- **Metadata is attacker input.** For any number that controls how much work is
  done (declared size, count, length prefix, Content-Length), ask who writes it.
  If it's the data's supplier, it bounds nothing; enforce the real bound on
  actual bytes/rows.
- **Display server values, never recompute.** If an RPC/API returns a figure,
  show it as-is. No client-side sums of figures the server already reports — two
  numbers for one fact will disagree. Coercion, picking a max for an axis, and
  zero-filling empty buckets are fine. If a figure is missing, ask for it
  server-side.
- **Refactors change no behaviour, and that is proven by a run:** feed the same
  inputs through the old and new code and diff the outputs, plus a
  planted-change control that must make the check fail.

## This Windows machine (Git Bash + PowerShell)
- **Never pipe a check before `&&`.** `yarn build | tail && echo OK` prints OK on
  failure — a pipeline's exit status is the last command's. Use
  `cmd > log 2>&1; echo "EXIT=$?"` and read the log, or `set -o pipefail`.
- **Bash heredocs drop backslashes** (`\\d` arrives as `\d`). Any script with a
  backslash goes through the Write tool. In JS template literals `\w` is just
  `w`; use character classes like `[A-Za-z0-9_]`.
- **Write/Edit decode backslash-u escapes** into the real (often invisible)
  character. After writing a file that must hold such an escape, swap the
  characters back with a script (build the backslash with
  `String.fromCharCode(92)`) and check with `grep ... | cat -A`.
- **`jq` is not installed.** Use `gh ... --json X --jq '...'`. Before arming any
  watcher/poller, run its body once by hand and confirm it prints the current
  state — a watcher that prints nothing is not proof nothing happened.
- Generate files from `cmd`, never with PowerShell `>` (Windows PowerShell 5.1
  writes UTF-16).

## Supabase + Next.js
- **Never use the service role key** for queries, diagnostics, or verification.
  It bypasses RLS, so what it sees isn't what the app sees. Read the migration
  SQL / function source instead, or ask the user to run it from a real session.
- **Never edit generated `supabase.ts` types.** Regenerate them; fix mismatches
  at the call site.
- **Probe an RPC's real signature with curl** using the publishable/anon key
  before trusting the migration file OR the generated types (a teammate may have
  changed it):
  `curl -s -X POST "$URL/rest/v1/rpc/<fn>" -H "apikey: $ANON" -H "Content-Type: application/json" -d '{...exact keys...}'`
  - `42501` or an error the function raises = the signature resolved.
  - `PGRST202` / 404 = no match; `hint` names the real signature.
  - PostgREST matches by JSON keys: an extra key, or an omitted key with no
    DEFAULT, is a 404. Probe every optional-key combination you send.
- **`REVOKE ... FROM PUBLIC` alone does not lock a function.** Supabase's default
  privileges grant EXECUTE to anon/authenticated/service_role. Internal
  SECURITY DEFINER functions revoke
  `FROM PUBLIC, anon, authenticated, service_role`. Confirm with the curl probe.
- **`.order("any_string")` and `.select("id, nope")` are not typechecked.** Only
  `.from()`, result row properties, and `.eq()` values are. Guard column names
  another way.
- **A PostgREST query builder is thenable but has no `.catch()`.** Helper names
  don't tell you whether it's a Promise or a builder. Wrap the `await` in
  try/catch; never chain `.catch()`.
- **Test SQL with `@electric-sql/pglite`** in a scratch folder: stub what the
  migration touches but doesn't own, load the live function version, seed legacy
  rows, run the migration, drive the RPC. Always add a planted-change control.
  Gotchas: zone-less timestamps come back in local time (print with `to_char`);
  `clock_timestamp()` is millisecond-resolution, so space seeded timestamps.
- **Next server actions strip a leading BOM** from returned strings. Add the BOM
  bytes client-side when building a CSV Blob. Check with `arrayBuffer()` bytes
  (`239,187,191`), not `Blob.text()` (which also strips it).
- **Stop the dev server before `rm -rf .next`.** Wiping it under running
  Turbopack prints "Unable to write SST file" / "Compaction failed" errors that
  look like a DB fault but aren't. Restarting the dev server clears them.
- **A git worktree needs its own real `yarn install`** — a `node_modules`
  junction breaks Turbopack. Copy `.env` and build once (for `next-env.d.ts`).
