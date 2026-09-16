---
name: design-resource-router
description: Use when a UI task may benefit from external design skills, component registries, motion libraries, React guidance, React Native guidance, or Three.js/WebGL components. Routes to the smallest useful 1-3 sources instead of loading every frontend skill/MCP into context.
---

# Design resource router

The resource stack is a toolbox, not a prompt buffet. Pick sources by the unresolved decision and stop once that decision has evidence.

## Hard token budget

Default to **1-3 external resources total** for a focused UI task. A broad redesign may use 4 only when each owns a different job. Never load several overlapping design/taste skills at once just because they exist.

Use this order:

1. existing project components/tokens and `DESIGN.md`;
2. one design-direction/taste source when direction is unresolved;
3. one implementation/component source when capability is missing;
4. one verification source when runtime evidence is required.

Search summaries first. Fetch full component/source material only for the finalist you intend to use. Do not dump registries, Figma files, browser snapshots, or skill collections into context.

## Route by job

| Need | Preferred source | Use when | Avoid when |
|---|---|---|---|
| General visual direction | Anthropic `frontend-design` | A new surface needs a distinct point of view | Existing product design is already authoritative |
| Searchable UI/UX design knowledge | `ui-ux-pro-max` | Palette/type/style/UX guidance is genuinely unresolved | You already have tokens + clear product language |
| Anti-slop landing/portfolio/redesign taste | Taste Skill `design-taste-frontend` | Marketing/portfolio/visual redesign work | Dense dashboards, data tables, multi-step product UI |
| App primitives | shadcn/ui | Dialogs, forms, tables, popovers, normal application UI | You need a bespoke immersive visual effect |
| Component discovery/generation | 21st MCP | You need a component candidate beyond the local project | A local primitive already solves it |
| React implementation/performance | Vercel React best-practices skill | React/Next implementation quality or performance matters | Pure visual ideation before stack decisions |
| React Native / Expo | Vercel React Native guidelines | Native/mobile app UI and performance | Web-only work |
| Component-state motion | Motion / Framer Motion | State transitions and local micro-interactions | A static or expert-dense workflow where motion adds latency |
| Choreographed motion | GSAP guidance | Timeline/scroll/sequence choreography is central | Ordinary buttons, menus, forms, dashboard transitions |
| 3D / shaders / WebGL | ThreeUI Community | Immersive hero, 3D scene, shader/background, product visualization | Dashboards/admin/forms where GPU effects are decoration |
| Convex backend component architecture | Convex create-component skill | The project actually uses Convex | Frontend-only work or non-Convex backends |
| Design-file source truth | Figma MCP | Exact frame/variables/components/Code Connect matter | No authoritative Figma artifact exists |
| Runtime behavior | Playwright MCP | Navigation, focus, overlays, forms, browser state, interaction bugs | Static layout/color facts covered by deterministic audits |

## Canonical upstreams

- Anthropic frontend design: `https://github.com/anthropics/skills/tree/main/skills/frontend-design`
- UI/UX Pro Max: `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`
- Taste Skill: `https://github.com/Leonxlnx/taste-skill`
- shadcn/ui: use the existing `component_find(source="shadcn")` path first.
- 21st MCP: use the current unified 21st MCP. The old Magic MCP package is compatibility-only; do not build a new workflow around the retired Magic tool names.
- Vercel React / React Native agent skills: `https://github.com/vercel-labs/agent-skills`
- ThreeUI Community: `https://github.com/MengTo/threeui`, package `@designcodeio/threeui`.

Do not vendor upstream skills into this repository. Reference them and load/install them only when the task calls for them. That keeps updates independent and context bounded.

## ThreeUI policy

ThreeUI is a specialist, not a default component library.

Use it for:

- immersive landing/hero experiences;
- real 3D or shader-driven storytelling;
- interactive visualizations where WebGL is part of the product experience;
- a deliberate premium visual moment that survives the performance budget.

Prefer the public Community npm package or Community repository for normal use. Use component subpath imports when available so the import graph stays narrow. Treat the hosted MCP/Pro path as optional rather than a hard dependency.

Before shipping a ThreeUI effect, verify:

- it is not competing with the primary task;
- reduced-motion behavior exists;
- mobile/low-end rendering remains acceptable;
- lazy loading/code splitting keeps first-load cost bounded;
- the design still works if the effect fails or is disabled.

## Figma + Playwright policy

They are opt-in companions. Do not keep them permanently attached just because a UI project exists.

For Playwright, prefer targeted behavior calls. The companion configuration disables automatic snapshots, image responses, and generated code. Request a snapshot or screenshot explicitly only when that evidence answers an unresolved question.

For Figma, pull the exact node/frame/variables needed, never the whole file.

## Example compositions

```text
Dense admin dashboard
  local components -> shadcn -> Vercel React -> deterministic audit

Landing page redesign
  frontend-design OR Taste -> 21st/shadcn only if capability is missing -> audit

Immersive product hero
  frontend-design -> ThreeUI -> GSAP only if choreography is actually required -> performance/audit

React Native operations app
  React Native guidelines -> local platform primitives -> runtime verification

Figma-authored application screen
  exact Figma node -> local components -> Playwright only for behavior -> audit
```

The correct answer is often fewer tools. If two sources solve the same decision, choose one.
