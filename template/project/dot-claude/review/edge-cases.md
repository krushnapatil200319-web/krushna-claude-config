# Edge Case Review

For every changed piece of functionality, systematically work through the following.
Only report a case when the code plausibly hits it — do not list hypotheticals.

## Input boundaries

- missing input
- null / undefined
- empty string / whitespace-only
- zero, negative numbers, extremely large numbers
- invalid IDs
- invalid enum values
- unexpected types
- malformed JSON
- unexpected object structures

## Collections

- zero items
- one item
- many items
- duplicate items
- pagination boundaries: first page, last page, page beyond available results

## Database

- record does not exist
- record was deleted
- duplicate record
- foreign key failure
- unique constraint violation
- stale record
- concurrent update
- partial failure
- transaction failure / rollback behavior

## Authentication

- unauthenticated request
- expired session
- invalid session
- deleted user
- disabled user

## Authorization

- correct user
- incorrect user
- admin vs non-admin
- tenant vs a different tenant
- resource belonging to another tenant

Always ask: **"Can a user access or modify an object simply by changing its ID?"**

## Network

- timeout
- connection failure
- 400 / 401 / 403 / 404 / 409 / 429 / 500
- malformed response
- empty response

## Retry behavior

Ask: **"What happens if this request executes twice?"**

Pay particular attention to:

- payments
- orders
- invitations
- emails / OTPs
- notifications
- database writes
- status changes

Check whether the operation needs idempotency.

## Concurrency

Ask: **"What happens if two users perform this action at exactly the same time?"**

- race conditions
- lost updates
- duplicate records
- conflicting state transitions
- stale reads
- check-then-act patterns

## Time

- timezone, UTC vs local
- daylight saving changes where relevant
- midnight, start/end of day, start/end of month
- leap years
- expired timestamps
- future timestamps

## State transitions

For anything resembling a state machine:

- valid transitions
- invalid transitions
- repeated transition
- backwards transition
- transition after deletion
- transition after another user changed the state
