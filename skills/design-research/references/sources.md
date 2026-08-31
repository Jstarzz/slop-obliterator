# Curated design sources

This is a routing table, not a ranking. A source is useful when it matches the job.

## Authoritative design systems and primitives

| Source | Best for | Integration | Licence / note |
|---|---|---|---|
| **Primer** | GitHub-style product UI, dense developer tooling, authoritative component/a11y guidance | Official `@primer/mcp` can expose components, examples, usage guidance, accessibility guidance, tokens and icons | Use official source/docs for the project version |
| **Carbon Design System** | Enterprise/data-heavy products with an established IBM visual language | Official Carbon MCP exposes component examples/docs, tokens, icons/pictograms, charts and related Carbon packages | Carbon core is Apache-2.0; check individual packages |
| **shadcn/ui** | Source-owned React components and registry-based composition | Built into `component_find(source: "shadcn")`; official shadcn MCP can work across registries configured in `components.json` | MIT |
| **Radix Primitives** | Accessible unstyled interaction primitives when you own the visual system | React packages; pair with your own tokens/styles | MIT |
| **Park UI** | Styled component system on top of Ark UI/Panda-style primitives | Package/source library; useful when its stack fits the project | MIT |

Use these when correctness, consistency, and documented behavior matter more than novelty.

## Expressive React component sources

| Source | Best for | slop-obliterator path | Licence / dependency note |
|---|---|---|---|
| **Magic UI** | Marketing moments, animated effects, visual polish that still fits shadcn-style projects | Searched inside `source: "shadcn"`; source can be fetched | MIT; many items use Motion |
| **KokonutUI** | More opinionated React/Tailwind/Motion components and useful interaction ideas | Searched inside `source: "shadcn"`; source can be fetched | MIT; often builds on shadcn + Motion |
| **React Bits** | Text animation, backgrounds, 3D/interactive showpieces, unusual effects | Searched inside `source: "shadcn"`; source proxy intentionally blocked | MIT + Commons Clause currently restricts redistribution of the components themselves. Direct-install from upstream. Dependency weight varies widely: Motion, GSAP, Three.js and others appear in the catalog. |
| **SmoothUI** | Motion-led React interaction patterns | `component_find(source: "smoothui")` | MIT; Motion-oriented |
| **Motion Primitives** | Focused animation primitives without adopting a whole design language | External reference/source library | MIT; Motion + Tailwind-oriented |
| **Uiverse** | Small CSS/Tailwind details: controls, loaders, toggles, tooltips, cards | `component_find(source: "uiverse")` | MIT; attribution requested by source project |

These are raw material. Pull one interaction into the current design system; do not let the page become a component-library sampler.

## Choosing by problem

### Need an accessible dialog/menu/popover/combobox

Start with the project's existing primitive layer. If none exists, prefer an accessible primitive system such as Radix rather than rebuilding focus management and keyboard semantics from a flashy demo.

### Need a coherent enterprise/application visual language

If the product already uses Primer or Carbon, query the official design-system source. Do not substitute Magic UI because a button animation looked fun.

### Need a distinctive marketing interaction

Search SmoothUI, Magic UI, KokonutUI, Motion Primitives, or React Bits with the exact interaction. Fetch at most a few candidates and compare dependencies before integrating.

React Bits is especially useful when the requested effect is genuinely unusual, but check dependency cost: its upstream project currently includes Motion, GSAP, Three.js-related packages, Lenis and other specialized libraries across the broader catalog. A single chosen component may need only a subset.

### Need a team's private design system

Point `SLOP_REGISTRY_URL` at its shadcn-schema registry when applicable. If the design system has its own MCP, prefer that for authoritative usage/a11y/token guidance and use slop-obliterator for rendered verification.

### Need current library API docs

Use the project's installed version and query version-specific documentation through Context7 or another authoritative docs source. Component source and API docs solve different problems.

## Registry behavior

The built-in `shadcn` source searches several registries concurrently, but returns one bounded merged result list. Each registry is cached for 15 minutes.

IDs preserve source identity:

```text
shadcn:button
shadcn:magicui:magic-card
shadcn:kokonutui:card-flip
shadcn:reactbits:TiltedCard-TS-TW
```

The canonical/default registry keeps the old short `shadcn:<name>` id for compatibility. A custom `SLOP_REGISTRY_URL` also keeps the old short id shape because only one registry is active.

## Licence discipline

Never infer "open source" means "free to proxy and redistribute." Check the actual licence before bundling or returning third-party source through the MCP.

For restricted sources, discovery can still be useful: return the upstream project/registry and let the user or agent install it directly under the upstream terms.
