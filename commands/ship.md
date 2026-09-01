---
description: Run the relevant specialist reviews and an independent final outcome verification before declaring a non-trivial change ready to ship.
argument-hint: [optional acceptance criteria or changed surface]
---

Load the `agent-workflow` skill and treat `$ARGUMENTS` as additional acceptance criteria or scope.

Do not implement new scope unless verification exposes a blocker that must be fixed to satisfy the existing request.

1. Recover the original requested outcome and reduce it to observable acceptance claims.
2. Identify the actual changed files/diff and keep context limited to that surface plus direct dependencies.
3. Run the project's authoritative build/typecheck/tests relevant to the change.
4. Dispatch only the specialist agents whose gates are triggered by the changed surface:
   - `design-reviewer` for meaningful UI/design/accessibility/layout changes
   - `security-reviewer` for changed trust boundaries, dependencies, or CI
   - `performance-reviewer` for hot paths, concurrency, browser/network work, large data, or MCP payload growth
5. Return blockers to the implementation context, fix them there, and re-run the failed gate.
6. Use `ship-verifier` as the final independent check. It must verify the requested outcome, not merely report that commands exited successfully.
7. Report the evidence and final ship verdict compactly.

If subagents are not available in the current client, perform the same gates sequentially and say that the checks were not independent contexts. Never fabricate subagent results.
