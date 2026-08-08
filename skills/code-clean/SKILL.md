---
name: code-clean
description: Use when writing, reviewing, or refactoring production code, and when a codebase has accumulated AI-generated bloat. Triggers on "review this code", "clean this up", "refactor", "why is this so complicated", "/deslop" applied to code, and on any substantial implementation task. Prevents the specific failure modes of generated code — bloat, premature abstraction, comment noise, defensive padding, and silent error swallowing.
---

# Code that doesn't read as generated

## The failure mode

Generated code is usually correct at every individual call site and wrong at the system level. It compiles, it passes the test, and it quietly adds coupling, dead paths, and abstraction layers for problems that do not exist. Reviewers approve it because each line looks fine.

Left to iterate without review, this compounds. Each pass adds a small deviation from the codebase's own conventions until the result is technically functional and semantically hollow — a codebase nobody can hold in their head.

The root cause is the same as everywhere else: **the model produces the average solution, and the average is the most generic one.** Generic code is code that does not fit this problem.

## The one rule

> Write only what is needed for the requirement in front of you.

Ask for a login screen, get a login screen. Not a login screen plus a session abstraction plus a pluggable auth-provider interface plus a migration for a table nobody asked about.

Every line has to justify its existence. The most common correct edit to generated code is deletion.

## Tells

### Bloat and scope creep

Files, helpers, config options, and abstractions that nothing in the requirement asked for. Before adding a file, say what breaks without it. If the answer is nothing, do not add it.

### Premature abstraction

A base class with one subclass. An interface with one implementor. A `utils/` module of single-use functions. A strategy pattern for two cases.

Abstraction should follow the third occurrence, not the first. Duplication is cheaper than the wrong abstraction — duplication is visible and local; a bad abstraction is invisible and global.

### Comment noise

```ts
// Increment the counter
counter += 1;

// Loop through the users
for (const user of users) { … }
```

These add characters and no information. Delete them.

Comments should explain **why**, never **what**:

```ts
// Retry twice: the upstream returns 503 for ~200ms after a deploy.
// Three retries pushed us past the gateway's 5s timeout.
```

That comment cannot be derived from the code and will save someone an hour.

Also delete: `// TODO: implement` on implemented code, section-divider comment banners, and doc comments that restate the signature (`@param userId The user ID`).

### Defensive padding

```ts
function total(items?: Item[] | null): number {
  if (!items) return 0;
  if (!Array.isArray(items)) return 0;
  if (items.length === 0) return 0;
  try {
    return items.reduce((sum, i) => sum + (i?.price ?? 0), 0);
  } catch {
    return 0;
  }
}
```

Four guards and a swallowed exception, for a function whose caller always passes an array. Every one of them is a place a real bug can hide, because the function now returns `0` for "empty", "malformed", and "crashed" alike.

Validate at the boundary — where data enters the system. Inside the boundary, trust the types.

### Silent failure

`catch {}`, `catch (e) { console.log(e) }`, `?? 0` papering over a missing value, `as any` to silence the compiler.

Catch only what you can handle. Let the rest propagate. An unhandled exception with a stack trace is far more useful than a wrong answer.

### Duplication

The same logic pasted into four handlers because each was generated independently. Generated code violates DRY in a specific way — near-identical blocks that drifted slightly, so a fix applied to one silently misses the others.

### Deep nesting and parameter sprawl

Generated code tends to accumulate local depth and pass context down as ever-longer argument lists, where a person would have extracted a method or introduced a small data class. Four levels of indentation, or five-plus positional parameters, is a signal to restructure.

### Convention drift

`camelCase` next to `snake_case`. Promises next to `async/await`. Two HTTP clients. Two date libraries. A new folder layout beside the existing one.

**Read the codebase before adding to it.** Match what is there, even where you would have chosen differently. Consistency is worth more than any individual preference.

### Dependencies added without cause

A library for something the standard library does. `lodash` for `Array.prototype.at`. A date library for one format call. Every dependency is a permanent obligation.

### Tests that assert nothing

```ts
it('works', () => { expect(doThing()).toBeDefined(); });
```

Tests that mirror the implementation, that mock everything so nothing real is exercised, or that assert on shape rather than behaviour. A test should fail when the behaviour is wrong and only then.

## Writing production code

**Types.** Make illegal states unrepresentable. A discriminated union beats a bag of optional fields. Parse at the boundary into a validated type; do not validate the same thing at four call sites. No `any`; `unknown` plus a narrowing function is nearly always better.

**Errors.** Distinguish expected failures (return a result, an error union, a nullable) from bugs (throw). Error messages say what happened, what was expected, and what to do. Include the identifier. Never swallow.

**Naming.** Names carry the domain. `retryAfterDeploy` beats `helper2`. Booleans read as assertions (`isExpired`, `hasAccess`). Functions are verbs, values are nouns. If you cannot name it, you do not yet know what it does.

**Structure.** Functions do one thing at one level of abstraction. Early returns over nested conditionals. Keep the happy path at the leftmost indentation. Pure logic separated from I/O — that separation is what makes tests possible without a mock framework.

**Concurrency.** Name the failure mode before writing it. What happens on partial failure, on retry, on two callers at once? `Promise.all` fails fast; `Promise.allSettled` does not — pick deliberately. Every network call gets a timeout.

**Performance.** Measure before optimising. But know the difference between a micro-optimisation and an algorithmic one — an O(n²) loop over a list that will be 100k rows is a design bug, not a tuning opportunity.

**Security.** Never interpolate user input into SQL, shell, or HTML. Never log secrets, tokens, or PII. Validate on the server regardless of what the client checked. Least privilege by default.

## Reviewing generated code

Read for what should not be there, in this order:

1. **Delete first.** What can be removed with nothing breaking? Usually 20–30% of a generated diff.
2. **Collapse abstractions** with fewer than three users.
3. **Strip comments** that restate code; keep and improve the ones explaining why.
4. **Remove defensive guards** for conditions the types already exclude.
5. **Find swallowed errors** and either handle or propagate them.
6. **Find duplication** and check whether the copies have already drifted.
7. **Check convention** against the rest of the repo.
8. **Check the unhappy path** — empty, null, huge, concurrent, offline, malformed.
9. **Read the tests.** Would they fail if the behaviour were wrong?

## Token efficiency

Relevant when an agent is doing the work, because context is a budget and a bloated codebase spends it.

- **Smaller diffs beat rewrites.** Change the lines that need changing.
- **Read the file before editing it**, not the whole directory.
- **Delete rather than deprecate.** Dead code is read on every pass forever.
- **One clear abstraction beats three layers**, both for humans and for the context window.
- **Keep an accurate `CLAUDE.md`.** Conventions written down once are cheaper than being re-derived from source every session.
- **Prefer tools that return verdicts over tools that return dumps.** A test runner reporting three failures costs a fraction of a full log.

## Checklist

- [ ] Nothing here that the requirement did not ask for
- [ ] No abstraction with fewer than three users
- [ ] Comments explain why; none restate the code
- [ ] Validation at the boundary, not scattered through the internals
- [ ] No swallowed exceptions, no `as any`
- [ ] No duplicated logic that will drift
- [ ] Nesting under four levels; no five-parameter functions
- [ ] Matches the existing conventions of this codebase
- [ ] No dependency added for something the platform already does
- [ ] Errors name what happened and what to do
- [ ] Tests would fail if the behaviour were wrong
- [ ] Unhappy paths handled: empty, null, huge, concurrent, offline
