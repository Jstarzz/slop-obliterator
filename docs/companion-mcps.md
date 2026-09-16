# Companion MCP stack

slop-obliterator should stay narrow. More connected tools are not automatically more capable; every always-on MCP adds tool schemas before the agent has done any useful work, and verbose browser/design responses can dominate a UI loop.

The core `slop-obliterator` plugin therefore ships only its own MCP. Figma and Playwright live in the separate **`slop-visual-companions`** plugin and should be installed/enabled only when a task actually needs them.

## Default stack

| Server | Owns | Keep enabled when |
|---|---|---|
| **slop-obliterator** | deterministic rendered UI verification, design planning, tokens, component/icon discovery, ship gates | UI/design work is active |
| **Serena** | symbol-level code navigation/editing | repository structure is the unknown |
| **Context7** | current/version-aware external library docs | a moving API/version is the unknown |
| **Figma** | exact design-file variables/components/nodes | Figma is source truth |
| **Playwright MCP** | interactive browser behavior | navigation/state/focus/forms/browser behavior must be exercised |

Do not call or load every server for every task.

## Optional visual companions

The marketplace exposes `slop-visual-companions` separately. Its Playwright configuration is deliberately low-output:

```json
{
  "playwright": {
    "command": "npx",
    "args": [
      "-y",
      "@playwright/mcp@0.0.80",
      "--isolated",
      "--snapshot-mode=none",
      "--image-responses=omit",
      "--codegen=none"
    ]
  }
}
```

That means routine browser actions do not automatically pour accessibility snapshots, image parts, or generated test code into the model context. Ask for a snapshot/screenshot explicitly when it is the evidence you need.

Use Figma the same way: exact frame/node/variables first, never a whole-file dump.

## Serena

Use Serena when the question is structural:

- where a symbol is defined;
- who references it;
- which method/class should be edited;
- what code is directly related to the current change.

Prefer that over reading whole directories into context. Once the working set is known, pass only those symbols/files forward.

For shared/team setups, pin a reviewed Serena commit/tag rather than permanently following an unpinned Git URL.

## Context7

Use Context7 only after identifying the library and, when possible, the version actually installed in the project. Ask focused questions such as:

```text
Library: Playwright 1.62.x
Question: what readiness state should replace a generic networkidle wait?
```

Do not pull an entire manual because one API changed. Pin reviewed versions for team/CI-controlled configs.

## Design-resource companions

External frontend resources are routed by `design-resource-router`, not permanently attached:

- Anthropic `frontend-design` or Taste Skill for visual direction;
- UI/UX Pro Max for searchable design knowledge;
- shadcn/21st for missing component capability;
- Vercel React or React Native guidance for implementation quality;
- GSAP/Motion for motion only when the interaction requires it;
- ThreeUI Community for genuine 3D/WebGL/shader work.

ThreeUI should normally be consumed from its public Community package/repository. A remote MCP is optional; it is not a core dependency.

## Routing pattern

```text
1. local project truth -> exact components/tokens/symbols
2. design_plan -> bounded structure/craft hypothesis when needed
3. one specialist source -> only the unresolved decision
4. primary agent -> coherent implementation
5. slop audit -> cheap deterministic rendered evidence
6. Playwright/Figma -> only if behavior/design-file evidence is still required
7. ship verifier -> acceptance claims mapped to evidence
```

A one-line refactor needs none of this. A normal admin screen usually needs slop-obliterator plus the local codebase, not a parade of design MCPs.

## Context packet example

Instead of handing a worker an entire conversation:

```text
Goal: reduce audit latency on polling applications
Changed surface:
- server/src/browser/playwright.ts: PlaywrightDriver.open
- server/src/index.ts: audit_design settle_ms contract
External fact:
- Playwright version from package.json: 1.62.x
Acceptance:
- default audit no longer waits for network quiet
- explicit compatibility opt-in remains possible
- smoke/selftest behavior stays correct
```

That is enough context to make a decision without forcing the reviewer to rediscover the repository.

## Security

Every companion expands capability surface. Review executable launch commands, pin shared dependencies where practical, keep secrets out of committed config/arguments, scope filesystem/network permissions, and remove abandoned companions rather than accumulating permanent tooling.
