---
name: code-smells
description: Use when reviewing a codebase or diff specifically for architectural and implementation smells, especially generated-code bloat, concurrency mistakes, frontend state duplication, weak tests, database transaction/race issues, needless abstraction, and performance waste. Complements code-clean with a broader diagnostic catalogue.
---

# Find smells before they fossilize

This is a diagnostic pass, not permission for a rewrite.

1. Load `../code-clean/references/code-smells.md`.
2. Inspect the smallest relevant surface: changed files first, then direct callers/dependencies only where needed.
3. Report smells with concrete evidence and impact.
4. Rank by correctness/risk first, maintainability second, aesthetics last.
5. Fix only smells whose simpler replacement is clear and in scope.
6. Load `code-clean` for the actual subtraction/refactor pass.

## Priority order

Look for these first because they produce bugs or operational cost, not merely ugly code:

- swallowed errors / catch-and-continue
- transaction boundaries split across one business invariant
- read-modify-write races
- retries without idempotency
- unbounded async fan-out
- accidental fire-and-forget work
- N+1 I/O hidden behind mapping/abstractions
- duplicated sources of truth in frontend state
- client-only authorization/invariants
- caches with no bound/freshness policy

Then inspect structural bloat:

- wrapper ladders
- one-use interfaces/factories/base classes
- boolean mode explosion
- optional-field soup
- generic frameworks built for one feature
- configuration whose value never varies
- exports created only for tests
- memoization/caching without evidence of a hot path

## Output contract

For each smell return:

`smell | evidence | consequence | smallest fix`

Do not dump a catalogue of theoretical issues. If a smell is not present, say nothing about it.
