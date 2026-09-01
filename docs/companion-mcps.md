# Companion MCP stack

slop-obliterator should stay narrow. It does not need to become a code indexer, documentation mirror, browser automation framework, and design auditor in one process.

For larger coding sessions, pair it with specialists and route work by responsibility:

| Server | Owns | Do not use it for |
|---|---|---|
| **slop-obliterator** | rendered UI verification, deterministic design/a11y/slop checks, design tokens, component discovery, ship gates | dumping source trees or generic docs retrieval |
| **Serena** | semantic/symbol-level code navigation and editing through language servers | visual judgement or external library documentation |
| **Context7** | current/version-aware library documentation and examples | repository understanding or rendered-page verification |

The value is not having more tools. It is keeping each context source precise.

## Serena

Current upstream quick start uses `uvx` directly from the Serena repository:

```bash
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --help
```

For Claude Code, Serena's current docs show a project-scoped setup like:

```bash
claude mcp add serena -- \
  uvx --from git+https://github.com/oraios/serena \
  serena start-mcp-server \
  --context ide-assistant \
  --project "$(pwd)"
```

Use Serena when the question is structural:

- where a symbol is defined
- who references it
- which method/class should be edited
- what code is directly related to the current change

Prefer that over reading whole directories into context. Once the relevant symbols/files are identified, give the specialist or implementer only that working set.

For a reproducible team setup, pin Serena to a reviewed commit/tag rather than permanently running an unpinned Git URL.

## Context7

Context7's current MCP package can be launched with:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

Its newer setup flow can also configure the appropriate client with:

```bash
npx ctx7 setup
```

Use Context7 only after identifying the library and, when possible, the version actually installed in the project. Ask focused questions such as:

```text
Library: Playwright 1.62.x
Question: what readiness state should replace a generic networkidle wait?
```

Do not pull an entire manual into the agent context because one API changed.

For team/CI-controlled configuration, replace `@latest` with a reviewed version. Convenience commands are fine for interactive setup; reproducibility wants a pin.

## Routing pattern

A productive implementation loop looks like this:

```text
1. Serena -> locate exact symbols/files affected by the requirement
2. Context7 -> resolve only moving external API behavior that the change depends on
3. Primary agent -> implement the coherent diff
4. slop-obliterator -> audit rendered UI / design system when relevant
5. specialist reviewer(s) -> security, performance, design as triggered by the surface
6. ship-verifier -> map original acceptance claims to direct evidence
```

Do not call every server on every task. A one-line local refactor does not need three MCPs and four reviewers.

## Context packet example

Instead of handing a worker an entire conversation:

```text
Goal: reduce audit latency on polling applications
Changed surface:
- server/src/browser/playwright.ts: PlaywrightDriver.open
- server/src/index.ts: audit_design settle_ms contract
External fact:
- Playwright version from package.json: 1.62.x
- current docs discourage networkidle as a generic readiness signal
Acceptance:
- default audit no longer waits for network quiet
- explicit compatibility opt-in remains possible
- smoke/selftest behavior stays correct
```

That is enough context to make a decision without making the reviewer rediscover the repository.

## Security note

Every companion MCP expands the agent's capability surface. Treat MCP launch commands like executable dependencies:

- install only servers you actually use
- review the upstream project and permissions
- pin versions/commits for shared or production-controlled setups
- keep secrets out of command arguments and committed config
- give filesystem/network access only where the server needs it
- remove abandoned companions instead of accumulating permanent tooling
