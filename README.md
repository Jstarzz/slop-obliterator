# slop-obliterator

A Claude Code / Cowork plugin that stops AI from shipping generic interfaces, hollow prose, and bloated code.

The premise: **an LLM predicts the most probable next token, and the most probable design choice is the average of everything it has seen.** For code that averaging is a strength. For design it produces the recognisable 2026 fingerprint — Inter, an indigo-to-purple gradient, three rounded cards in a row, and a hero that could belong to any product. Not ugly. Anonymous, which is worse.

Every default in this plugin exists to force a decision at a fork where a model would otherwise fill the gap.

---

## What's in it

**An MCP server** that renders pages in a real browser and measures them, generates colour systems, and searches icon and component libraries.

**Four skills** carrying the judgement the server can't:

| Skill | Job |
|---|---|
| `ui-design` | Aesthetic direction, colour, type, layout, motion, states, mockups, self-critique |
| `grill` | Interrogates a brief until it's specific enough to build without guessing |
| `write-human` | Strips the measurable tells of generated prose |
| `code-clean` | Prevents the specific failure modes of generated code |

**Three commands:** `/grill`, `/deslop`, `/mockup`.

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

Then wire it up. For the full plugin — skills, slash commands, and the server:

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
| `audit_design` | Renders a page and returns a score plus named findings with fixes |
| `audit_responsive` | Same across breakpoints; separates breakpoint bugs from design bugs |
| `capture` | Screenshot to disk. Inline image is opt-in |
| `design_system` | OKLCH ramps + semantic tokens, WCAG-verified, as CSS and Tailwind v4 `@theme` |
| `contrast_check` | Ratio + OKLCH ΔL per pair, and the nearest passing shade when one fails |
| `judge_color` | Flags signature hexes, the indigo/violet band, and chroma too low to be an accent |
| `icon_find` | ~7000 Tabler + Lucide icons, offline, ranked |
| `component_find` / `component_fetch` | Uiverse (MIT, ~3000 CSS/Tailwind elements) and any shadcn-schema registry |

### What the auditor actually measures

Not vibes. Computed styles and real layout boxes, in the rendered page:

- **Colour** — every painted colour converted to OKLCH; signature hexes, indigo/violet accents, blue→purple gradients, palettes with no colour above 0.075 chroma, six unrelated hue families, untinted greys, WCAG AA failures per text/background pair
- **Type** — default typefaces, single-face hierarchy, weight range under 300, size range under 3×, more than nine sizes, measure over 85 characters, leading under 1.4
- **Layout** — three equal cards with icons and headings, over 60% centred text, one radius on twelve-plus elements, the 10%-black shadow, horizontal overflow
- **Space** — proportion of padding/margin/gap values off a 4px grid, total distinct steps
- **State** — targets under 24px, unlabelled fields, unmarked required fields, no error region, no validation attributes, focus outlines removed with no replacement
- **Motion** — animation with no `prefers-reduced-motion` rule, perpetual loops, `transition: all`
- **A11y** — heading count and order, missing alt, missing intrinsic size, landmarks

Each finding has a stable id (`color.slop-hue`, `layout.three-card-row`) so you can grep for them, suppress them, or track them over time.

### Token cost

Published benchmarks put a naive browser MCP at ~114k tokens for a ten-step task, almost all of it raw page snapshots. This server measures in the page and judges in Node, so the model only sees the conclusion — an audit is a few hundred tokens. Screenshots are opt-in for the same reason.

---

## Design notes

**The browser is behind a seam.** `src/browser/driver.ts` defines the interface; `playwright.ts` implements it. Nothing else in the server imports Playwright. Swapping to CDP, `agent-browser`, or whatever ships next year touches one file.

**Component sources are adapters.** Each is one object implementing `ComponentSource`. Adding a registry or fixing one whose API moved is a local change.

**Icons resolve from local packages, not a CDN.** No network round-trip mid-loop, no outage taking the tool down, and the version is pinned in the lockfile.

**Contrast uses WCAG 2.2 plus OKLCH ΔL, not APCA.** APCA is the better perceptual model, but its reference implementation ships under a restricted "Limited W3 License" with patents pending, which cannot be vendored into an MIT tool. The pairing catches most of what WCAG 2 gets wrong — the tools warn when a pair passes the ratio but has a lightness delta under 0.28.

**Icon search ranks the literal name above tags.** "arrow right" returns `arrow-right`, not `arrow-merge-alt-right`. Tag matches are capped so discovery never outranks the exact hit.

---

## Testing

`npm test` runs `selftest.js`: colour primitives, twelve seed × intensity combinations of the design system (24 contrast pairs each), the analyser against a slop fixture and a designed fixture, and icon search. No browser required, so it runs in CI.

The discrimination assertion is the important one — the slop fixture must score under 40 and the designed fixture over 90. If that gap closes, the auditor has stopped being useful.

`npm run smoke` renders two real pages through Playwright and asserts the same thing end to end.

---

## Licences of bundled sources

| Source | Licence |
|---|---|
| Tabler Icons | MIT |
| Lucide | ISC |
| Uiverse.io elements | MIT — attribution to the author and Uiverse.io requested |
| shadcn/ui registry | MIT |

The plugin itself is MIT.
