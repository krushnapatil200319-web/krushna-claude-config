---
name: frontend
description: Frontend development conventions for this project. Use when creating, modifying, reviewing, or refactoring React, Next.js, TypeScript, JSX, TSX, components, hooks, pages, UI, styling, or frontend architecture.
---

This rule governs frontend code specifically: where files go, when to reuse
vs. create, and file size discipline. It does not duplicate the security
or async/concurrency rules already covered elsewhere — this is purely
about structure and consistency.

---

## 1. Match existing structure — don't invent new patterns

Before creating any new file (component, hook, util, screen, style file):

1. **Find 2–3 existing files of the same kind** already in the repo (e.g.
   if adding a new component, look at 2–3 recent components; if adding a
   hook, look at existing hooks).
2. **Match their location** — put the new file in the same folder tier
   those files live in, not a new folder you invent because it seemed
   logical.
3. **Match their naming convention** exactly — casing, suffixes, file
   extension pattern (e.g. if existing components are
   `PayoutHealthBanner.tsx` with a co-located `PayoutHealthBanner.styles.ts`,
   a new component follows that same pairing, not a different one).
4. **Match their internal shape** — export style (default vs named), prop
   typing pattern, where types live (inline vs a separate `.types.ts`),
   how the component is composed internally (hooks at top, handlers next,
   render last — or whatever the existing files actually do).

If you genuinely cannot find a precedent (this is a first-of-its-kind
file), say so explicitly and propose a location/pattern rather than
silently picking one — this is the one case worth a clarifying question,
since guessing wrong here creates a second, competing convention.

**Never introduce a new top-level folder, a new state-management approach,
a new styling method, or a new data-fetching pattern without explicit
confirmation** — even if it seems cleaner. Consistency with what already
exists outranks a locally "better" pattern; a repo with two competing
patterns for the same problem is worse than one imperfect pattern used
everywhere.

---

## 2. Reuse before creating

Before writing any new component, hook, or utility function:

1. **Search the repo first** for something that already does this or
   something close to it — by function (a date formatter, a modal
   wrapper, a form field, a loading/error state pattern), not just by
   exact name.
2. **If something close exists, extend or compose it** rather than
   duplicating its logic in a new file. A near-duplicate component with
   slightly different props is a maintenance liability, not a shortcut.
3. **If you must create something new because nothing fits,** check
   whether it's actually reusable enough to belong in the shared/common
   layer (wherever this repo keeps shared UI — buttons, inputs, layout
   primitives, hooks) versus staying local to the feature that needs it.
   Don't default to "shared" for something used once, and don't default
   to "local" for something that's obviously general-purpose (a
   generic empty-state, a generic error banner, a generic confirmation
   dialog).
4. **When two near-identical UI patterns already exist in the codebase**
   (e.g. two different loading spinners, two different empty states),
   flag it in your summary rather than adding a third — that's a
   consolidation opportunity, not something to route around.

### Before finishing any task, explicitly answer:
- Did I reuse an existing component/hook/util where one already covered
  this need?
- If I created something new, did I check it doesn't already exist under
  a different name?
- Is the new thing placed at the right layer (shared vs. feature-local)
  given how often it's likely to be reused?

---

## 3. File size — keep files under 300 lines

- Target: **no file over 300 lines** (components, hooks, utils alike).
  This excludes auto-generated files, type-only files, and test files,
  which can reasonably run longer.
- When a component is approaching the limit, that's usually a signal it's
  doing more than one job. Common splits:
  - **Extract sub-components** — a section of JSX that could stand alone
    (a card, a row, a header block) becomes its own component in the same
    folder, not a 300-line render function.
  - **Extract hooks** — data-fetching, derived state, or effect logic
    that isn't rendering anything belongs in a `use*` hook, co-located or
    in the shared hooks folder depending on reuse (see section 1 for
    where hooks already live in this repo).
  - **Extract pure logic** — formatting, calculations, validation that
    doesn't touch React at all belongs in a plain utility function, not
    inline in the component body.
- Don't split arbitrarily just to hit the number — a 260-line file that's
  genuinely one cohesive unit is better than three 90-line files with
  awkward prop-drilling between them. The goal is single responsibility;
  the line count is a signal that responsibility may have grown, not a
  hard mechanical rule to satisfy by any means.
- If a file must exceed 300 lines because splitting it would hurt
  readability more than help it (rare, but happens with some
  data-heavy or generated-shape components), say so explicitly rather
  than silently leaving it long.

---

## Self-check before finishing any frontend task

1. Does the new file's location and naming match 2–3 existing sibling
   files, or did I invent a new pattern?
2. Did I search for an existing component/hook/util before writing a new
   one?
3. If I created something new, is it placed at the right layer (shared
   vs. local) for how reusable it actually is?
4. Is every touched/new file under ~300 lines? If not, what's the
   specific reason it wasn't split?
5. Did I introduce a second competing pattern for something the repo
   already has one established way of doing (styling, data fetching,
   state management)?

Report the result of this check in your summary — pass, or specific
exceptions with a one-line reason.