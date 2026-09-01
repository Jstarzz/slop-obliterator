# Curated design sources

This is a routing table, not a ranking. A source is useful when it matches the job.

## Accessible primitives and headless systems

| Source | Best for | Integration | Licence / note |
|---|---|---|---|
| **shadcn/ui** | Source-owned React components and registry-based composition | Built into `component_find(source: "shadcn")`; official shadcn tooling can work across registries configured in `components.json` | MIT |
| **Radix Primitives** | Accessible unstyled React interaction primitives when you own the visual system | React packages; pair with your own tokens/styles | MIT |
| **Base UI** | Unstyled accessible React primitives for a custom design system | React package + official docs | MIT |
| **Ariakit** | Complex accessible React widgets such as comboboxes, dialogs, menus and composites | React packages + official examples | Core packages are MIT; verify any separately licensed commercial surface before copying it |
| **Ark UI** | Headless state-machine primitives across React, Vue, Solid and Svelte | Framework packages backed by Zag state machines | MIT |
| **React Aria** | Deep accessibility, keyboard interaction, collections and internationalisation without adopting a visual language | `react-aria` / `react-aria-components` + current Adobe docs | Apache-2.0 |
| **Headless UI** | Accessible unstyled React/Vue primitives that fit naturally with Tailwind projects | Official React/Vue packages | MIT |

Prefer these when the product already has a visual identity and the missing problem is interaction behavior, focus management, keyboard semantics, or composability.

## Full application and design systems

| Source | Best for | Integration | Licence / note |
|---|---|---|---|
| **Primer** | GitHub-style product UI, dense developer tooling, authoritative component/a11y guidance | Official `@primer/mcp` can expose components, examples, usage guidance, accessibility guidance, tokens and icons | Use official source/docs for the project version |
| **Carbon Design System** | Enterprise/data-heavy products with an established IBM visual language | Official Carbon MCP exposes component examples/docs, tokens, icons/pictograms, charts and related Carbon packages | Carbon core is Apache-2.0; check individual packages |
| **React Spectrum** | Adobe-style accessible application UI with strong internationalisation behavior | `@adobe/react-spectrum` + current Adobe docs | Apache-2.0 |
| **Material UI** | Mature Material-based React products, forms and data-heavy application surfaces | `@mui/material`; advanced data components may come from MUI X | MUI Core is MIT; check the selected MUI X tier/licence |
| **Chakra UI** | Styled React applications built around tokens and recipes | `@chakra-ui/react` + official docs | MIT |
| **Mantine** | Batteries-included React apps needing forms, hooks, dates, overlays and broad application primitives | `@mantine/core` and focused companion packages | MIT |
| **Fluent UI** | Microsoft/Office-style enterprise products and dense application UI | `@fluentui/react-components` + official docs | MIT |
| **Ant Design** | Dense admin, forms, tables and enterprise workflows | `antd` + official docs | MIT |
| **Park UI** | Styled component system on top of Ark UI/Panda-style primitives | Package/source library; useful when its stack fits the project | MIT |

Use a full design system when adopting its language is an intentional product decision. Do not import an enterprise system for one button or mix several systems' visual defaults into the same screen.

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

Start with the project's existing primitive layer. If none exists, route by stack and complexity:

- Radix or Base UI for focused React primitives
- React Aria when accessibility, collections, keyboard behavior or internationalisation are unusually deep
- Ark UI when the interaction model must span frameworks
- Headless UI for React/Vue projects already leaning on Tailwind
- Ariakit when one of its composite/widget patterns directly matches the job

Do not rebuild focus management and keyboard semantics from a flashy demo.

### Need a coherent enterprise/application visual language

Prefer the system already present in the project. Primer, Carbon, React Spectrum, MUI, Chakra, Mantine, Fluent UI and Ant Design each bring a different visual language, component surface and dependency model. Query current official/version-specific docs before assuming APIs.

If no system is established, choose based on the product rather than popularity: developer tooling, enterprise density, Material conventions, Office conventions, accessibility/i18n depth, or how much batteries-included application surface the team actually needs.

### Need a distinctive marketing interaction

Search SmoothUI, Magic UI, KokonutUI, Motion Primitives, or React Bits with the exact interaction. Fetch at most a few candidates and compare dependencies before integrating.

React Bits is especially useful when the requested effect is genuinely unusual, but check dependency cost: its upstream project currently includes Motion, GSAP, Three.js-related packages, Lenis and other specialized libraries across the broader catalog. A single chosen component may need only a subset.

### Need a team's private design system

Point `SLOP_REGISTRY_URL` at its shadcn-schema registry when applicable. If the design system has its own MCP, prefer that for authoritative usage/a11y/token guidance and use slop-obliterator for rendered verification.

### Need current library API docs

Use `project_context` when available to identify the installed package/version, then query version-specific documentation through Context7 or another authoritative docs source. Component source and API docs solve different problems.

### Need to choose before searching components

Use `design_source_find` when available. It returns a bounded shortlist with the source's job, stack, integration route, dependency caveat and licence note. Then use `component_find` only when the selected source is one of the registries the MCP can retrieve directly.

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

Never infer "open source" means "free to proxy and redistribute." Check the actual licence for the selected package/component version before bundling or returning third-party source through the MCP.

For restricted sources, discovery can still be useful: return the upstream project/registry and let the user or agent install it directly under the upstream terms.
