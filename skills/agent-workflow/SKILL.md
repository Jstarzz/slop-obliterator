---
name: agent-workflow
description: Use for non-trivial implementation work that benefits from planning, specialist review, subagents, or a final production-readiness gate. Triggers on feature builds, substantial refactors, security-sensitive changes, performance work, production hardening, and requests to "ship", "verify", "use subagents", or "review before done". Keeps subagents narrow and independent instead of cloning the whole conversation into each worker.
---

# Context-efficient agent workflow

The goal is not to spawn the most agents. The goal is to make independent judgement cheap enough that it actually happens.

Use the main agent as coordinator and implementer by default. Dispatch specialists only where a separate context improves correctness. Small edits should stay small.

## The workflow

### 1. Define the observable outcome

Before implementation, reduce the request to a short set of claims that can later be verified. Examples:

- the new MCP tool returns ranked design-system sources for a React animation query
- a URL input cannot silently select two target types at once
- a rendered page has no BLOCK design findings at mobile or desktop
- CI rejects a new high-severity vulnerable dependency

Do not turn this into a giant requirements ceremony. Three to seven observable claims are usually enough.

### 2. Retrieve context narrowly

Treat context as a working-set problem.

- Prefer a symbol, exact file, relevant range, or diff over a whole repository dump.
- Follow references outward only when a concrete dependency requires it.
- For external libraries/APIs, establish the installed version first and retrieve documentation for that version when possible.
- Do not paste the full parent conversation into a subagent. Give it a compact context packet.
- Large generated files, build output, lockfiles, and vendored code stay out of context unless directly relevant.

A good context packet contains:

```text
Goal: what this specialist must decide
Changed surface: exact files/symbols/diff
Constraints: project conventions and non-negotiables
Evidence available: tests/audits/benchmarks already run
Question: the one decision this specialist owns
```

This borrows the useful principle from semantic code tools: retrieve by meaning and structure, not by filesystem panic.

### 3. Implement in the primary context

Keep implementation ownership coherent. Do not have several agents edit overlapping files unless the work is explicitly partitioned.

For independent tasks, parallel subagents are fine. For coupled tasks, sequence them.

Prefer:

- one implementer
- independent reviewers
- one final verifier

over four agents all trying to design and edit the same thing.

### 4. Trigger only relevant specialist gates

After implementation, dispatch specialists based on the changed surface:

| Change | Specialist |
|---|---|
| UI/layout/design system/accessibility | `design-reviewer` |
| auth, secrets, network, filesystem, shell, dependency/CI trust boundaries | `security-reviewer` |
| hot paths, browser/network latency, large data, concurrency, token-heavy MCP output | `performance-reviewer` |

A change can trigger more than one gate. Do not dispatch a specialist merely to make the workflow look sophisticated.

Each specialist is independent: it reviews the current artifact and returns findings. It should not restart planning, inherit the entire controller workflow, or quietly fix its own findings.

### 5. Fix blockers in the implementation context

The parent/implementer owns fixes. After a material fix, re-run the specialist whose blocker was addressed.

Do not accept "probably fixed". Re-check the thing that failed.

### 6. Final outcome verification

For non-trivial work, use `ship-verifier` after specialist blockers are clear.

The verifier maps each original acceptance claim to evidence. Successful commands are not enough when the requested behavior is richer than the command:

- HTTP 200 does not prove the configured provider handled the request.
- a build does not prove the UI works at 390px.
- an audit command running does not prove it scanned the intended target.
- a benchmark number does not prove behavior stayed correct.

Completion requires outcome evidence.

## Production gate

A change is ready when all of these that apply are true:

1. **Functional** - authoritative tests/build/typecheck pass and the requested behavior is directly exercised.
2. **Design** - rendered result passes the design reviewer for meaningful UI work.
3. **Security** - no unresolved blocker on changed trust boundaries.
4. **Performance** - no unbounded or obviously dominant cost introduced; measured hot-path regressions are addressed.
5. **Context** - MCP/tool output is bounded and defaults to useful conclusions rather than raw dumps.

This is the useful lesson from one-shot builders: "generated" is not a completion state. Production constraints are part of generation.

## Subagent rules

- Fresh context for independent review is a feature.
- Give subagents the minimum sufficient context packet.
- Do not inject coordinator instructions into workers that already have an atomic task.
- Do not let a reviewer edit the thing it is certifying.
- Do not use a stronger/more expensive agent merely because it exists; task complexity should justify it when the client supports model selection.
- Parallelize independent reviews, not dependent implementation steps.
- If subagents are unavailable, run the same gates sequentially in the primary context rather than pretending they ran.

## External documentation

When code depends on a library or framework whose behavior changes by version:

1. identify the actual dependency/version from the project
2. retrieve current docs targeted to that version (Context7 or equivalent when available)
3. ask one focused question per concept rather than loading an entire manual
4. cite/record the version when the answer affects implementation

Memory is a fallback, not a source of truth for moving APIs.

## Failure modes to reject

- **Context flooding:** "read everything first" for a local change.
- **Recursive orchestration:** a worker receives an atomic task and starts its own full planning/approval cycle.
- **Reviewer capture:** the implementer reviews its own assumptions and calls that independent verification.
- **Tool-success substitution:** exit code 0 is treated as proof of the user-visible outcome.
- **Agent theater:** many subagents with overlapping responsibilities and no unique decision rights.
- **Production-last:** security/performance/accessibility are postponed until after the feature is declared done.

## Handoff format

At completion, report:

```text
Outcome: what changed
Evidence: authoritative checks that passed
Specialist gates: design/security/performance and verdicts that applied
Residual notes: only real non-blocking uncertainty
```
