---
description: Run relevant specialist reviews and an independent final outcome verification before declaring a non-trivial change ready to ship
argument-hint: [optional acceptance criteria or changed surface]
---

Load `agent-workflow` first and treat `$ARGUMENTS` as additional acceptance criteria/scope.

Do **not** pre-load browser/Figma/design skills merely because the repository has a frontend. For a meaningful UI change, load `browser-qa` only when acceptance claims require rendered or interactive evidence. Load `figma-handoff` only when Figma is an acceptance source.

Do not implement new scope unless verification exposes a blocker required by the existing request.

1. Recover the requested outcome and reduce it to observable acceptance claims.
2. Identify the actual diff/changed files and keep context to that surface plus direct dependencies.
3. Run authoritative build/typecheck/tests relevant to the change.
4. For meaningful UI changes, choose the smallest evidence source per claim: deterministic audits for measurable rendered quality, Playwright only for interaction/risky state, Figma only for intended design/handoff truth.
5. Dispatch only specialist gates triggered by the diff:
   - `design-reviewer` for meaningful UI/design/accessibility/layout changes;
   - `security-reviewer` for changed trust boundaries, dependencies, auth/secrets, or CI;
   - `performance-reviewer` for hot paths, concurrency, browser/network work, large data, or MCP/payload growth.
6. Return blockers to implementation, fix there, then re-run only the failed gate plus direct regressions.
7. Use `ship-verifier` as the final independent check of the requested outcome, not merely command exit codes.
8. Report evidence and ship status compactly.

If subagents are unavailable, perform the same triggered gates sequentially and say they were not independent contexts. Never fabricate subagent, Figma, or browser results.
