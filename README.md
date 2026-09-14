# slop-obliterator

A Claude Code / Cowork plugin for stopping AI-generated UI, prose, and code from collapsing into the same defaults.

The premise is simple: when a model reaches an undecided fork, it tends to choose the statistical average. In code that can be useful. In product design it produces anonymous interfaces: generic cards, fashionable gradients, arbitrary motion, shallow states, and component-library decisions nobody actually made.

slop-obliterator forces those decisions to become explicit, then verifies the result against the rendered product.

---

## Architecture

The plugin now ships a **three-MCP design stack** with deliberately separate jobs.

| MCP | Job |
|---|---|
| `slop-obliterator` | Compact deterministic audits, design planning, craft profiles, reference/pattern synthesis, tokens, component search, icon search |
| `figma` | Design-source truth: frames, variables, components, assets, Code Connect, design/code handoff |
| `playwright` | Interactive browser evidence: navigation, keyboard/focus, menus/dialogs, forms, route/state transitions, network/error reproduction |

Do not use the biggest tool by default. `audit_design` measures inside the page and returns only conclusions, so static UI QA stays cheap. Playwright MCP is for behavior the deterministic collector cannot prove. Figma MCP is for what was designed, not for pretending a static frame describes every runtime state.

The bundled Figma server is the official remote endpoint and authenticates through the MCP client. The bundled Playwright server runs in isolated mode. slop-obliterator also uses Playwright internally behind its own browser seam, but that browser is an implementation detail of the deterministic auditor rather than an exposed general-purpose browser session.

---

## Three commands, not a command zoo

There are now **three top-level workflows**:

| Command | Purpose |
|---|---|
| `/shape` | Resolve the product task, design direction, craft profile, structural references, interaction pattern, Figma context, and optional divergent concepts before implementation |
| `/deslop` | Review **or** repair UI, prose, or code; critique is simply read-only deslop instead of a duplicate command |
| `/ship` | Run authoritative tests plus only the specialist/browser/design gates triggered by the actual change, then independently verify the requested outcome |

The old `/critique`, `/grill`, and `/mockup` top-level commands were removed because they duplicated phases already owned by these workflows. Their useful reasoning survives as skills/reference material: clarification is part of shaping, mockup generation is an optional shaping mode, and critique is the read-only UI path through deslop.

---

## Skills

The plugin carries **13 focused skills**. They are intentionally narrower than the commands so an agent loads judgement only when it needs it.

| Skill | Job |
|---|---|
| `ui-design` | Main UI router: direction, tokens, component reuse, state completeness, rendered verification |
| `design-research` | Chooses the smallest useful source of design truth: project, Figma, structural refs, patterns, official systems, registries |
| `design-synthesis` | Combines non-overlapping decisions from several references without cloning any one reference |
| `design-craft` | Interaction craft + quality floor + variance/motion/density bias controls |
| `figma-handoff` | Figma -> code and code -> Figma workflows, variables/components/Code Connect reuse, design-system reconciliation |
| `browser-qa` | Routes deterministic audits vs Playwright MCP vs screenshots and defines bounded browser QA |
| `mobile-ui` | Touch-first structure, Android/iOS platform behavior, keyboard, safe areas, interruption/offline states, tablets/foldables |
| `critique` | Judgement checks a deterministic detector cannot make |
| `write-human` | Removes generated-writing tells without flattening meaning or voice |
| `code-clean` | Subtractive code cleanup and generated-code failure modes |
| `code-smells` | Focused correctness/security/concurrency/data/frontend/DB/performance diagnosis |
| `grill` | Deep clarification when a genuinely ambiguous product brief needs interrogation |
| `agent-workflow` | Narrow-context specialist review and independent outcome verification |

`design-craft` is an original synthesis informed by Emil Kowalski's design-engineering work, Impeccable, and Taste Skill. It does not vendor any of those skills. The three influences have different jobs:

- **Kowalski lens:** interaction frequency, purposeful motion, perceived performance, press/trigger relationships, and invisible detail.
- **Impeccable lens:** surface modes (`persuade`, `operate`, `read`, `experience`), refinement vs redesign, complete product states, and bounded verification.
- **Taste lens:** three explicit bias controls — design variance, motion intensity, and visual density — so the model cannot silently drift back to its default aesthetic.

Higher dial values are not better. A checkpoint console and an experimental agency landing page should not share the same settings.

---

## MCP tools

### Audit and browser-backed evidence

| Tool | What it does |
|---|---|
| `audit_design` | Renders one surface and returns deterministic quality/slop findings |
| `audit_responsive` | Runs the same evidence across breakpoints and separates responsive failures from general design failures |
| `list_rules` | Lists deterministic rules and stable IDs |
| `capture` | Writes a screenshot when pixel judgement is actually needed |

The detector has **89 registry rules** plus a separate template-signature pass for generated-copy/layout patterns. Measurements come from computed styles, real layout boxes, stylesheets, accessibility/state signals, and visible prose in the rendered page rather than regexing source CSS.

### Design planning and craft

| Tool | What it does |
|---|---|
| `design_plan` | One bounded starting call: craft profile + role-specific structural references + interaction-pattern shortlist |
| `craft_profile` | Surface mode plus design-variance, motion-intensity, visual-density, craft rules, and evidence routing |
| `reference_find` | Compact structural app-reference routes |
| `reference_rank_axes` | Scores references separately for domain, structure, interaction, components, and mobile behavior |
| `reference_expand` | Expands one shortlisted structural reference |
| `reference_contract` | Commits 2-5 non-overlapping reference roles before implementation |
| `pattern_find` | Finds interaction patterns between broad archetype and concrete component |
| `pattern_expand` | Expands one interaction-pattern decision card |

The normal decision pipeline is:

```text
product task
  -> design_plan
      -> craft profile
      -> reference roles
      -> interaction-pattern shortlist
  -> reference_contract
  -> project/Figma truth
  -> component search
  -> implementation
  -> deterministic audit
  -> Playwright behavior check when needed
  -> /ship
```

`reference_contract` is intentionally still explicit even though `design_plan` can propose roles. The planner may suggest; it does not get to turn one high-scoring reference into the whole product.

### Tokens, components, and icons

| Tool | What it does |
|---|---|
| `design_system` | Generates OKLCH semantic ramps/tokens with contrast-aware pairs |
| `contrast_check` | Checks contrast and proposes passing nearby shades |
| `judge_color` | Flags signature/default color behavior and weak accent decisions |
| `component_find` / `component_fetch` | Searches curated component sources and shadcn-schema registries |
| `icon_find` | Offline semantic search across bundled icon indexes |

Registry catalogues are cached by source/root and normalized once per TTL. Search candidates from all registries are globally ranked **before** the caller limit is applied, so registry order cannot win over relevance.

For shadcn-managed projects, honor the project's configured icon family and existing components. The MCP's icon index is discovery, not permission to mix visual systems.

---

## Figma workflow

When a Figma design is authoritative:

1. Inspect the existing code route/components/tokens first.
2. Pull only the target frame/node and the variables, components, assets, and Code Connect mappings required for that surface.
3. Map Figma components to existing semantic code components before creating replacements.
4. Map variables to project tokens instead of hard-coding frame values.
5. Implement runtime states the static frame cannot show: keyboard/focus, loading, error, empty, disabled, permission, long content, responsive behavior, reduced motion.
6. Run deterministic rendered audits.
7. Use Playwright MCP for the interaction path represented by the design.

Figma answers **what was designed**. Playwright answers **what the browser does**. slop-obliterator answers **what the rendered surface measurably violates**.

---

## Browser QA without token waste

Use the smallest evidence source that can prove the claim.

Use `audit_design` / `audit_responsive` for measurable facts such as overflow, contrast, targets, focus styling, typography, spacing, layout, design-system drift, motion guards, and known slop signatures.

Use Playwright MCP when you need to operate the product: keyboard traversal, menus/dialogs, forms, route transitions, browser history, loading/error states, network behavior, permissions, storage, or a reported interaction bug.

Take screenshots only when the unresolved question is actually visual. A full accessibility snapshot or ten screenshots should not be the default interface to facts the deterministic collector can return in a few hundred tokens.

Verification is bounded: inspect/fix one coherent batch, confirm once, then stop unless a real acceptance claim still fails.

---

## Install

### Claude Code plugin

```text
/plugin marketplace add /absolute/path/to/slop-obliterator
/plugin install slop-obliterator
```

The plugin manifest supplies all three MCP servers. Figma authentication is handled by the MCP client when first required. Playwright MCP is launched through `npx`, so Node/npm must be available.

### Windows setup helper

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

The helper builds/tests the local slop-obliterator server, installs its Chromium dependency, and can register the local server with Claude Desktop/Claude Code. Plugin installation is the path that also carries the bundled Figma and Playwright MCP definitions.

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
| `SLOP_REGISTRY_URL` | `https://ui.shadcn.com/r` | Replace the built-in shadcn registry root with a custom registry |

---

## Testing

`npm test` runs the deterministic rule selftest plus component-source, design-reference, axis-ranking, craft-profile, synthesis-contract, interaction-pattern, design-plan, intelligence, and polish selftests.

`npm run smoke` renders real pages with Playwright and proves that collector signals and template-signature cases actually survive the browser boundary.

CI runs the server on Node 20 and Node 22, typechecks it, runs selftests, then runs browser smoke coverage. Dependency auditing is a separate strict security workflow; it is not weakened to make a PR green.

---

## Design principles

**Structure before components.** Choose the user loop, information shape, and interaction pattern before searching for JSX.

**References have roles.** One reference may teach structure, another interaction, another mobile behavior. No reference owns the final composition.

**Existing product truth wins.** The user's brief, runtime behavior, project components/tokens, and authoritative Figma context outrank generic taste advice.

**Craft follows frequency.** Frequently repeated operator/keyboard actions should not inherit the same motion budget as rare onboarding or marketing moments.

**Rendered evidence beats source confidence.** A CSS declaration is not proof of what the browser rendered, and a Figma frame is not proof of what the implemented interaction does.

**Specialists review; they do not co-own implementation.** Security, performance, design, and ship verification stay independent without turning ordinary work into a swarm.

---

## Upstream influences and licenses

slop-obliterator contains its own implementations and synthesis. Relevant upstream/reference projects include:

| Project | Use here | License |
|---|---|---|
| Emil Kowalski `emilkowalski/skills` | Design-engineering / interaction-craft influence | MIT |
| Impeccable `pbakaus/impeccable` | Anti-slop taxonomy and quality-workflow influence | Apache-2.0 |
| Taste Skill `Leonxlnx/taste-skill` | Variance/motion/density bias-control influence | MIT |
| Microsoft Playwright MCP | Bundled interactive browser MCP | Apache-2.0 |
| Figma MCP | Bundled official remote design-context MCP | Figma service/tooling terms |
| Tabler Icons | Bundled icon index | MIT |
| Lucide | Bundled icon index | ISC |
| Uiverse.io elements | Component reference source | MIT; upstream attribution requested |
| shadcn/ui registry | Component reference source | MIT |

The plugin itself is MIT.
