# slop-obliterator

A Claude Code / Cowork plugin for stopping AI-generated UI, prose, and code from collapsing into the same defaults.

When a model reaches an undecided fork, it tends to choose the statistical average. In product design that produces anonymous interfaces: generic cards, fashionable gradients, arbitrary motion, shallow states, and component-library decisions nobody actually made. slop-obliterator makes those decisions explicit and verifies the rendered result.

---

## Architecture: core by default, visual companions on demand

The previous plugin manifest always attached slop-obliterator, Figma, and Playwright. That was convenient but wasteful: every connected MCP adds tool schemas, and browser/design tools can return large evidence payloads even when the task never needs them.

Version 0.4 splits the stack:

| Plugin / MCP | Job | Default |
|---|---|---|
| `slop-obliterator` | Deterministic audits, design planning, craft profiles, references/patterns, tokens, component/icon search | **Core** |
| `slop-visual-companions` / Figma | Exact design-source truth: frames, variables, components, assets, Code Connect | Opt-in |
| `slop-visual-companions` / Playwright | Interactive browser behavior: navigation, focus, overlays, forms, route/state transitions | Opt-in |

The Playwright companion runs with automatic snapshots, image responses, and code generation disabled. Request those artifacts explicitly when they answer an unresolved question.

slop-obliterator still uses Playwright internally behind its deterministic browser seam. That browser is an implementation detail of the compact audit tools, not an exposed general-purpose browsing session.

---

## Three workflows, not a command zoo

| Command | Purpose |
|---|---|
| `/shape` | Resolve product task, design direction, craft profile, references, interaction pattern, and optional concepts before implementation |
| `/deslop` | Review or repair UI, prose, or code |
| `/ship` | Run authoritative tests plus only the specialist/browser/design gates triggered by the actual change |

---

## Skills

The plugin carries **14 focused skills**. They are deliberately routed instead of stacked.

| Skill | Job |
|---|---|
| `ui-design` | Main UI router: direction, tokens, component reuse, state completeness, bounded verification |
| `design-research` | Chooses the smallest useful source of design truth |
| `design-resource-router` | Routes external frontend resources such as ThreeUI, 21st, Taste, UI/UX Pro Max, Vercel React/React Native, GSAP, Figma, and Playwright without loading the whole buffet |
| `design-synthesis` | Combines non-overlapping decisions from several references without cloning any one reference |
| `design-craft` | Interaction craft + quality floor + variance/motion/density controls |
| `figma-handoff` | Exact Figma -> code and code -> Figma workflows |
| `browser-qa` | Routes deterministic audits vs Playwright vs screenshots |
| `mobile-ui` | Touch-first structure and platform behavior |
| `critique` | Judgement checks deterministic rules cannot make |
| `write-human` | Removes generated-writing tells without flattening voice |
| `code-clean` | Subtractive generated-code cleanup |
| `code-smells` | Focused correctness/security/concurrency/data/frontend/DB/performance diagnosis |
| `grill` | Deep clarification for genuinely ambiguous product briefs |
| `agent-workflow` | Narrow-context specialist review and independent outcome verification |

The default external-resource budget for a focused UI task is **1-3 sources**. More than that needs separate, non-overlapping jobs.

---

## Frontend resource routing

The resource router treats each upstream as a specialist:

| Need | Route |
|---|---|
| Distinct visual direction | Anthropic `frontend-design` |
| Searchable design knowledge | UI/UX Pro Max |
| Landing/portfolio/redesign anti-slop taste | Taste Skill |
| Normal application primitives | local components -> shadcn/ui |
| Broader component discovery | current unified 21st MCP |
| React implementation/performance | Vercel React best-practices skill |
| React Native / Expo | Vercel React Native guidance |
| Local state/micro-interaction motion | Motion / Framer Motion |
| Timeline/scroll choreography | GSAP guidance |
| 3D / shaders / WebGL | ThreeUI Community |
| Exact design-file source truth | Figma companion |
| Browser behavior | Playwright companion |

ThreeUI is intentionally not a default dashboard dependency. Use its public Community package/repository for genuine immersive/3D/shader work, then verify mobile, reduced motion, lazy loading, and fallback behavior.

The old Magic MCP is not treated as a new dependency; use the current unified 21st MCP instead.

---

## MCP tools

### Audit and rendered evidence

| Tool | What it does |
|---|---|
| `audit_design` | Renders one surface and returns deterministic quality/slop findings |
| `audit_responsive` | Audits the same surface across breakpoints |
| `list_rules` | Lists deterministic rules and stable IDs |
| `capture` | Writes a screenshot when pixel judgement is actually needed |

Static UI QA stays cheap because measurements happen inside the rendered page and the agent gets conclusions rather than raw browser snapshots.

### Design planning and craft

| Tool | What it does |
|---|---|
| `design_plan` | Bounded starting call: craft profile + role-specific references + interaction-pattern shortlist |
| `craft_profile` | Surface mode plus variance/motion/density and evidence routing |
| `reference_find` / `reference_rank_axes` / `reference_expand` | Structural reference discovery and inspection |
| `reference_contract` | Commits non-overlapping reference jobs before implementation |
| `pattern_find` / `pattern_expand` | Interaction patterns between broad archetype and concrete component |

Normal pipeline:

```text
product task
  -> local project truth
  -> design_plan when structure is unresolved
  -> reference/pattern finalist only
  -> design-resource-router only for an external gap
  -> implementation
  -> deterministic audit
  -> Figma/Playwright only if their evidence is actually required
  -> /ship
```

### Tokens, components, and icons

| Tool | What it does |
|---|---|
| `design_system` | Generates OKLCH semantic ramps/tokens with contrast-aware pairs |
| `contrast_check` | Checks contrast and proposes passing nearby shades |
| `judge_color` | Flags signature/default color behavior and weak accent decisions |
| `component_find` / `component_fetch` | Searches curated component sources and shadcn-schema registries |
| `icon_find` | Offline semantic search across bundled icon indexes |

Search summaries first and fetch full component source only for finalists. Existing project components always outrank another registry hit.

---

## Browser QA without token waste

Use the smallest evidence source that can prove the claim.

Use `audit_design` / `audit_responsive` for measurable facts such as overflow, contrast, targets, focus styling, typography, spacing, layout, design-system drift, motion guards, and known slop signatures.

Enable Playwright only when you need to operate the product: keyboard traversal, menus/dialogs, forms, route transitions, history, loading/error states, network behavior, permissions, storage, or a reported interaction bug.

Take screenshots only when the unresolved question is actually visual. Inspect/fix one coherent batch, confirm once, then stop unless a real acceptance claim still fails.

---

## Figma workflow

When Figma is authoritative:

1. Enable the optional visual companion.
2. Inspect existing code route/components/tokens first.
3. Pull only the target frame/node and required variables/components/assets/Code Connect mappings.
4. Map to existing semantic code components before creating replacements.
5. Implement runtime states the static frame cannot show.
6. Run deterministic rendered audits.
7. Use Playwright only for the interaction path that needs behavior evidence.

Figma answers **what was designed**. Playwright answers **what the browser does**. slop-obliterator answers **what the rendered surface measurably violates**.

---

## Install

### Core Claude Code plugin

```text
/plugin marketplace add /absolute/path/to/slop-obliterator
/plugin install slop-obliterator
```

This installs only the low-context core.

### Optional visual companions

Install `slop-visual-companions` from the same marketplace only for sessions that need Figma or general Playwright behavior testing.

The companion uses the official Figma remote endpoint and launches Playwright MCP through `npx` in isolated, low-output mode.

### Windows setup helper

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

### Server only

```bash
cd server
npm install
npx playwright install chromium
npm test
npm run smoke
```

Requires Node 20+.

Environment variables:

| Variable | Default | Effect |
|---|---|---|
| `SLOP_ARTIFACT_DIR` | `.slop-artifacts` | Screenshot/artifact directory |
| `SLOP_CDP_URL` | — | Attach the deterministic auditor to an existing Chrome CDP endpoint |
| `SLOP_HEADFUL` | — | `1` to watch the auditor browser |
| `SLOP_BROWSER_IDLE_MS` | `180000` | Idle shutdown delay |
| `SLOP_REGISTRY_URL` | built-in registry directory | Replace built-in shadcn-schema sources with a custom registry root |

---

## Testing

`npm test` runs deterministic rule selftests plus component-source, design-reference, axis-ranking, craft-profile, synthesis-contract, interaction-pattern, design-plan, intelligence, and polish selftests.

`npm run smoke` renders real pages with Playwright and proves collector signals survive the browser boundary.

CI runs typechecking, selftests, and browser smoke coverage. Dependency auditing remains a separate strict security workflow.

---

## Design principles

**Structure before components.** Choose the user loop, information shape, and interaction pattern before searching for JSX.

**References have roles.** One may teach structure, another interaction, another mobile behavior. No reference owns the final composition.

**Existing product truth wins.** User requirements, runtime behavior, project components/tokens, and authoritative Figma context outrank generic taste advice.

**The smallest sufficient source wins.** Do not pay Figma, Playwright, ThreeUI, 21st, or multiple taste skills for a decision the local project already answers.

**Craft follows frequency.** Frequent operator actions should not inherit the motion budget of rare onboarding or marketing moments.

**Rendered evidence beats source confidence.** CSS declarations and static frames are not proof of runtime output.

---

## Upstream influences and licenses

slop-obliterator contains its own implementations and synthesis. Relevant upstream/reference projects include:

| Project | Use here | License / terms |
|---|---|---|
| Emil Kowalski design-engineering work | Interaction-craft influence | Upstream terms |
| Impeccable | Anti-slop taxonomy and quality-workflow influence | Apache-2.0 |
| Taste Skill | Variance/motion/density and anti-slop influence | MIT |
| Anthropic frontend-design | Optional design-direction specialist | Upstream skill terms |
| UI/UX Pro Max | Optional searchable design-intelligence specialist | MIT |
| Vercel agent skills | Optional React / React Native implementation guidance | Upstream terms |
| 21st MCP | Optional component discovery/generation | Service/tool terms |
| ThreeUI Community | Optional 3D/WebGL/shader component source | MIT for Community repository/package |
| Microsoft Playwright MCP | Optional interactive browser MCP | Apache-2.0 |
| Figma MCP | Optional remote design-context MCP | Figma service/tooling terms |
| Tabler Icons | Bundled icon index | MIT |
| Lucide | Bundled icon index | ISC |
| Uiverse.io elements | Component reference source | MIT; upstream attribution requested |
| shadcn/ui registry | Component reference source | MIT |

The plugin itself is MIT.
