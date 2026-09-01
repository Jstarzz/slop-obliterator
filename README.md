# slop-obliterator

A Claude Code / Cowork plugin that stops AI from shipping generic interfaces, hollow prose, and bloated code.

The premise: **an LLM predicts the most probable next token, and the most probable design choice is the average of everything it has seen.** For code that averaging is a strength. For design it produces the recognisable 2026 fingerprint — Inter, an indigo-to-purple gradient, three rounded cards in a row, and a hero that could belong to any product. Not ugly. Anonymous, which is worse.

Every default in this plugin exists to force a decision at a fork where a model would otherwise fill the gap.

---

## What's in it

**An MCP server** that renders pages in a real browser and measures them against **89 deterministic rules**, generates colour systems, and searches icon and component libraries.

**Six skills** carrying the judgement and workflow the server can't:

| Skill | Job |
|---|---|
| `ui-design` | Aesthetic direction, colour, type, layout, motion, states, mockups |
| `critique` | Full review: 89 rules plus the 11 judgements no detector can make |
| `grill` | Interrogates a brief until it's specific enough to build without guessing |
| `write-human` | Strips the measurable tells of generated prose |
| `code-clean` | Prevents the specific failure modes of generated code |
| `agent-workflow` | Narrow-context implementation, specialist review gates, and independent outcome verification |

**Four specialist agents** for independent review rather than implementer self-certification:

| Agent | Gate |
|---|---|
| `design-reviewer` | Rendered UI, accessibility, responsive behavior, design-system adherence |
| `security-reviewer` | Trust boundaries, dependencies, CI, secrets, network/filesystem/shell risk |
| `performance-reviewer` | Hot paths, browser/network cost, concurrency, bounds, MCP token footprint |
| `ship-verifier` | Final acceptance criteria and outcome evidence |

**Five commands:** `/critique`, `/grill`, `/deslop`, `/mockup`, `/ship`.

### Where the patterns come from

The taxonomy draws on [Impeccable's published catalog](https://impeccable.style/slop) (Apache-2.0), [UIZZE's anti-ui-slop skill](https://uizze.com), and [Anthropic's frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design). Detection here is an independent implementation against rendered pages — no rule code was copied.

Impeccable is a mature tool in its own right with 23 commands and a CLI; if you want a second opinion in CI, `npx impeccable detect` is worth running alongside this.

The agent workflow follows the same constraint as the MCP tools: **return the smallest useful context, then verify the real outcome.** Specialist reviewers get compact context packets rather than the full conversation, and `/ship` only invokes the gates relevant to the changed surface.

---

## Install

### One command (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

Builds the server, runs the tests, installs Chromium, registers the server with
Claude Desktop and Claude Code, and publishes the repo to GitHub as private.
Idempotent — re-run it any time. It backs up the Claude Desktop config before
touching it and preserves any MCP servers already in there.

Skip any stage: `-SkipInstall`, `-SkipBrowser`, `-SkipDesktop`, `-SkipClaudeCode`, `-SkipGitHub`.

### By hand

```bash
cd server
npm install              # the prepare script compiles the server
npx playwright install chromium
npm test                 # browser-free self test — should print ALL CHECKS PASSED
npm run smoke            # end-to-end, needs the browser
```

Then wire it up. For the full plugin — skills, slash commands, agents, and the server:

```
/plugin marketplace add /absolute/path/to/slop-obliterator
/plugin install slop-obliterator
```

For the server alone, in `claude_desktop_config.json` or `.mcp.json`:

```json
{
  "mcpServers": {
    "slop-obliterator": {
      "command": "node",
      "args": ["/absolute/path/to/slop-obliterator/server/dist/index.js"]
    }
  }
}
```

Claude Desktop reads its config from one of:

- `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json` (Store/MSIX install)
- `%APPDATA%\Claude\claude_desktop_config.json` (classic install)

Restart the app after editing.

**Requires** Node 20+. Chromium adds ~150MB on first install.

### Environment

| Variable | Default | Effect |
|---|---|---|
| `SLOP_ARTIFACT_DIR` | `.slop-artifacts` | Where screenshots are written |
| `SLOP_CDP_URL` | — | Attach to an existing Chrome over CDP instead of launching one |
| `SLOP_HEADFUL` | — | `1` to watch the browser work |
| `SLOP_BROWSER_IDLE_MS` | `180000` | Idle time before the browser shuts down |
| `SLOP_REGISTRY_URL` | `https://ui.shadcn.com/r` | Point `component_find` at your own shadcn-schema registry |

---

## Tools

| Tool | What it does |
|---|---|
| `audit_design` | Renders a page, runs 89 rules, returns two scores plus named findings with fixes |
| `audit_responsive` | Same across breakpoints; separates breakpoint bugs from design bugs |
| `list_rules` | The full catalogue with ids, class, severity, dimension |
| `capture` | Screenshot to disk. Inline image is opt-in |
| `design_system` | OKLCH ramps + semantic tokens, WCAG-verified, as CSS and Tailwind v4 `@theme` |
| `contrast_check` | Ratio + OKLCH ΔL per pair, and the nearest passing shade when one fails |
| `judge_color` | Flags signature hexes, the indigo/violet band, and chroma too low to be an accent |
| `icon_find` | ~7000 Tabler + Lucide icons, offline, ranked |
| `component_find` / `component_fetch` | Uiverse, SmoothUI, and any shadcn-schema registry |

### What the auditor actually measures

Not vibes. Computed styles, real layout boxes, and parsed stylesheets, in the rendered page. 89 rules across ten dimensions:

- **Colour** (12) — signature hexes, indigo/violet accents, blue→purple gradients, gradient text, radial glow halos, neon-on-dark, cream-by-reflex, grey on colour, timid chroma, hue sprawl, untinted greys, WCAG AA per pair
- **Type** (17) — overused faces across all three waves, single-family hierarchy, compressed scale, icon tiles above headings, eyebrow labels, oversized hero headlines, italic serif display, crushed and wide tracking, all-caps body, justified text, measure, leading, undersized text
- **Visual detail & layout** (25) — side-tab accent borders, thick borders on rounded corners, hairline-plus-shadow, glassmorphism, decorative grids, repeating stripes, over-rounded cards, nested cards, three-equal-cards, identical card grids, centred-everything, numbered labels, monotonous and off-grid spacing, cramped padding, text at the viewport edge, crowded headings, horizontal overflow, occluded text, clipped popovers, lopsided columns
- **Motion** (9) — pulsing status dots, blinking carets, marquees, bounce easing, image hover transforms, layout-property animation, missing reduced-motion guard, perpetual loops, `transition: all`
- **Copy** (6) — marketing buzzwords, em-dash density above the human range, manufactured-contrast cadence, theater framing, weightless headlines, repeated labels
- **Imagery** (2) — shape-assembled illustrations, broken or placeholder sources
- **State & a11y** (14) — focus indicators, 24px targets, form labels, required markers, error regions, validation attributes, content shipped at opacity 0, uncaught script errors, heading order, alt text, intrinsic sizes, landmarks
- **Design-system drift** (4) — fonts, colours, radii, and type sizes outside your own `DESIGN.md`

Plus **11 judgement checks** with no detector, covered by `/critique`.

Each finding has a stable id (`visual.side-tab-border`, `type.icon-tile-above-heading`) so you can grep for them, suppress them with `ignore_rules`, or track them over time.

### What it deliberately cannot catch

Generated design in 2026 converges on three looks, and **two of them pass every rule**: near-black with one acid accent, and broadsheet-with-hairlines. Only cream-and-terracotta is detectable. That is why `/critique` exists and why the skill leads with naming a direction rather than with the rule list.

### Token cost

Published benchmarks put a naive browser MCP at ~114k tokens for a ten-step task, almost all of it raw page snapshots. This server measures in the page and judges in Node, so the model only sees the conclusion — an audit is a few hundred tokens. Screenshots are opt-in for the same reason.

The agent workflow follows the same rule: reviewers receive changed symbols/files and acceptance criteria, not whole-repository or whole-conversation dumps.

---

## Design notes

**The browser is behind a seam.** `src/browser/driver.ts` defines the interface; `playwright.ts` implements it. Nothing else in the server imports Playwright. Swapping to CDP, `agent-browser`, or whatever ships next year touches one file.

**Component sources are adapters.** Each is one object implementing `ComponentSource`. Adding a registry or fixing one whose API moved is a local change.

**Icons resolve from local packages, not a CDN.** No network round-trip mid-loop, no outage taking the tool down, and the version is pinned in the lockfile.

**Contrast uses WCAG 2.2 plus OKLCH ΔL, not APCA.** APCA is the better perceptual model, but its reference implementation ships under a restricted "Limited W3 License" with patents pending, which cannot be vendored into an MIT tool. The pairing catches most of what WCAG 2 gets wrong — the tools warn when a pair passes the ratio but has a lightness delta under 0.28.

**Icon search ranks the literal name above tags.** "arrow right" returns `arrow-right`, not `arrow-merge-alt-right`. Tag matches are capped so discovery never outranks the exact hit.

**Specialists review; they do not co-own implementation.** The primary context remains coherent, while independent agents handle design, security, performance, and final verification. This avoids reviewer capture without turning every task into a swarm.

---

## Testing

`npm test` runs `selftest.js`. Three things matter in it:

1. **A clean baseline that produces zero findings.** Every rule has to stay silent on a page where nothing is wrong, or the per-rule assertions mean nothing.
2. **A fixture per rule, proving it fires.** All 89.
3. **A coverage gate.** The run fails if a rule exists without a fixture, so the suite cannot silently fall behind the registry.

No browser required, so it runs in CI on Node 20 and 22.

`npm run smoke` renders two real pages through Playwright and asserts the collector actually produces those signals from rendered CSS — which fixtures cannot prove. It checks 26 specific rule ids fire on the slop page and stay silent on the designed one.

The designed page in that test deliberately avoids all three current defaults. Using cream-and-terracotta there would have made the test lie.

Agent prompts are intentionally separated from implementation logic: they are production workflow components, not new runtime dependencies. `/ship` is the explicit entry point for the independent verification loop.

---

## Licences of bundled sources

| Source | Licence |
|---|---|
| Tabler Icons | MIT |
| Lucide | ISC |
| Uiverse.io elements | MIT — attribution to the author and Uiverse.io requested |
| shadcn/ui registry | MIT |

The plugin itself is MIT.
