# Generated-code smell catalog

Use this after the first deletion pass. It is a catalogue of smells, not a mandate to rewrite code that is already clear.

## Structural smells

### One-use architecture

Interfaces with one implementation, factories that create one concrete type, repositories that wrap one ORM call, adapters around APIs that are not expected to vary, and abstract base classes with one subclass.

**Question:** what second implementation exists or is credibly imminent? If none, collapse it.

### Wrapper ladders

`handler -> service -> manager -> provider -> client` where each layer forwards arguments and changes no policy.

Keep layers that own a boundary: transaction, authorization, domain rule, retry policy, serialization, external protocol. Delete layers that only rename calls.

### Configuration for constants

A setting, env var, feature flag, or generic option for behavior that has one valid value in the product.

Configuration is a public API. Do not create one casually.

### Generic core, specific edges

A generic framework invented to support the one feature being built, while the real domain logic is pushed into awkward callbacks and option bags.

Reverse it: keep domain code direct; extract generic machinery only after several real uses reveal the common shape.

### Boolean mode explosion

Functions like `render(data, compact, admin, mobile, includeMeta, legacy)` encode multiple behaviors in a positional minefield.

Split materially different operations or use a named options type when the modes genuinely belong together.

## Control-flow smells

### Catch-and-continue

Catching an error, logging it, and continuing with partial state when the caller assumes success.

Handle expected failure explicitly or propagate. Logging is not handling.

### Boolean success channels

Returning `true/false` from operations that can fail for several reasons, forcing callers to guess what happened.

Use a domain result/error type when the distinction changes behavior.

### Nested happy path

The normal case lives five indent levels deep under guards and `else` branches.

Invert conditions and return early. The main path should be visually obvious.

### Retry without idempotency

Generated networking code often adds retries reflexively. Retrying a non-idempotent payment, create, or mutation can duplicate work.

Name the idempotency mechanism before adding retry logic.

### Timeout theatre

A timeout value exists, but cancellation does not propagate or the operation continues in the background anyway.

Timeouts should stop useful work, release resources, and produce an actionable error.

## Data smells

### Stringly typed domain

Statuses, roles, units, currencies, event names, or IDs are plain strings everywhere despite having a closed domain.

Use enums/unions/value types where they prevent invalid states rather than merely adding ceremony.

### Optional-field soup

One mega-object has fifteen optional fields because it represents several distinct states.

Use discriminated unions or separate types when combinations have meaning.

### Parse everywhere

The same input validation or normalization appears at many call sites.

Parse once at the boundary into a trusted internal representation.

### Unit blindness

`number` means milliseconds here, seconds there, bytes elsewhere, money in another place.

Use naming or value types that make units explicit at high-risk boundaries.

### Fake immutability

Objects are spread/cloned repeatedly but nested mutable references still leak, producing extra allocation without a clear ownership model.

Choose mutation or immutability deliberately; do not cargo-cult either.

## API smells

### CRUD-shaped domain

Every behavior is forced into generic `create/update/delete` service methods even when the domain action is `approve`, `settle`, `assign`, `publish`, or `revoke`.

Name behavior after the business operation. It makes authorization, auditing, and invariants clearer.

### Parameter mirror

A function accepts ten arguments because it mirrors an upstream SDK call exactly, then every caller reconstructs those ten values.

Create the domain-level operation callers actually need.

### Leaky transport types

HTTP request DTOs, ORM entities, or vendor SDK objects flow through the whole application.

Translate at boundaries when the external representation would otherwise dictate domain structure.

### Accidental public API

Helpers are exported merely because tests want access to them.

Test observable behavior or move pure logic to a legitimate module; do not widen production API for test convenience.

## Async and concurrency smells

### Sequential independent awaits

Independent I/O is awaited one call at a time because generated code narrates operations sequentially.

Run concurrently when ordering is not required and load is bounded.

### Unbounded fan-out

`Promise.all(items.map(callRemote))` over an unbounded list.

Concurrency needs a bound when input size is user/data driven or the downstream is finite.

### Fire-and-forget by accident

A promise/task is created without awaiting, tracking, cancellation, or failure reporting.

If background execution is intended, give it ownership and observability.

### Shared mutable cache with no policy

A process-level map appears as an optimization with no eviction, freshness, memory bound, or concurrency semantics.

Every cache needs ownership, key cardinality, TTL/invalidations, and failure behavior.

## Database smells

### N+1 hidden in mapping

A loop maps records and performs a query per record.

Generated abstractions often hide the query several layers down. Inspect call counts, not just syntax.

### Transaction split

State-changing operations that form one business invariant are committed separately because they live in separate repository methods.

Put the transaction boundary around the invariant, not around each table call.

### Read-modify-write race

Fetch state, check it, then update without a lock/version/atomic predicate even though concurrent callers are possible.

Use database-enforced constraints, compare-and-set, row locking, or an atomic update appropriate to the domain.

### ORM escape hatch everywhere

Raw SQL is sprinkled through service code because the ORM became inconvenient, or ORM abstractions are tortured to avoid one clear query.

Keep query ownership coherent. Raw SQL is fine when deliberate and localized.

## Frontend smells

### State duplication

The same fact lives in props, local state, URL state, a store, and derived memoized state.

Choose one source of truth. Derive the rest.

### Effect as event handler

A `useEffect` watches state solely to perform work that could happen directly in the event/action that changed the state.

Effects synchronize with external systems; they are not a generic control-flow primitive.

### Premature memoization

`useMemo`, `useCallback`, memo wrappers, selectors, or caches around trivial work with no measured rendering problem.

Memoization adds dependency correctness and cognitive cost. Earn it.

### Component fragmentation

Tiny components exist only to move five lines of JSX into another file and are used once.

Extract around a reusable concept, independent state/behavior, or a meaningful readability boundary.

### Prop plumbing as architecture

Large prop chains appear because state ownership was never decided.

Move state to the narrowest common owner; use context/store only when the sharing topology warrants it.

## Testing smells

### Mock topology test

The test asserts that service A called repository B with exactly the arguments implementation C currently uses, but never verifies the user-visible/domain outcome.

Prefer behavior contracts. Mock only boundaries whose real implementation is unsuitable in that test layer.

### Snapshot landfill

Large snapshots are updated reflexively and reviewers cannot tell what behavior changed.

Snapshot stable, intentionally reviewed structures; assert critical behavior explicitly.

### Branchless happy-path suite

Every test uses valid input and successful dependencies.

Target invariant boundaries, failure classes, concurrency, retries, and malformed external data where the system can actually break.

## Security smells

### Authorization after fetch/change

The operation performs expensive or stateful work before verifying the actor may do it.

Authorize before mutation and as close to the protected resource/action as practical.

### Client-enforced invariant

The UI hides an action and the backend assumes that means it cannot be invoked.

Client checks are UX. Server checks are policy.

### Secret-shaped logging

Objects from auth/payment/config SDKs are dumped wholesale during debugging.

Log allowlisted fields, not entire external objects.

## Performance smells

### Recompute stable reference data

Parsing schemas, compiling regexes, loading icon metadata, or downloading registry indexes per query/request when the data changes rarely.

Build/index once, cache by the real resource identity, and rank/filter locally.

### Cache keyed by query instead of resource

If ten search terms all download the same remote catalogue, caching the URL including `?q=` creates ten copies of the same expensive fetch.

Cache the catalogue by source/root; query the cached in-memory index.

### Return-the-world tools

Developer/agent tooling returns huge source blobs or page snapshots when the caller only needs ranking metadata or a verdict.

Return compact summaries first. Fetch details on demand.

## Review heuristic

For each smell, ask three questions before changing code:

1. Is it causing complexity, risk, or measurable cost here?
2. Is the simpler alternative clearer in this codebase's conventions?
3. Can the change be made without widening scope?

If the answer is not yes to all three, leave it alone and report it rather than performing a speculative refactor.
