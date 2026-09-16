---
description: Shape a UI/product surface before implementation — resolve the task, design direction, reference roles, craft profile, and optional variants without pre-loading the whole design stack
argument-hint: [what you want to build, redesign, or explore]
---

Shape: $ARGUMENTS

Load `design-research` first. It owns source selection and tells you when another specialist is worth its context cost.

Load only as needed:

- `design-synthesis` when multiple references need explicit non-overlapping roles;
- `design-craft` when craft/motion/density decisions need deeper treatment than `design_plan` provides;
- `design-resource-router` when an external skill/library/MCP such as ThreeUI, 21st, Taste, UI/UX Pro Max, Vercel guidance, GSAP, Figma, or Playwright is under consideration;
- `mobile-ui` for touch-first/native work;
- `figma-handoff` only when Figma is source truth or an explicit output target.

This is the single pre-build command. Do not bounce through separate clarification and mockup commands.

1. Inspect what already exists — product code, `DESIGN.md`, tokens, components, routes, screenshots/Figma context, and constraints. Never ask for information the project already contains.
2. Infer the primary user loop and surface mode. Ask one clarifying question only when two materially different products would otherwise be built. If context is sufficient, decide.
3. Call `design_plan` with product + task + audience + platform + hard constraints. Use craft dials, reference roles, and interaction-pattern shortlist as hypotheses.
4. If Figma is authoritative, pull only the exact node/frame and required variables/components/assets/Code Connect mappings.
5. Commit reference roles only when multiple references actually contribute different jobs; otherwise do not pay for synthesis ceremony.
6. Choose the smallest interaction pattern that fits the repeated task.
7. Search components only for missing capability. Existing project components win.
8. State one coherent direction: mode, hierarchy, density, typography stance, color strategy, edge/radius language, motion budget, icon family, and state model.
9. If the user asked for options/alternatives/mockups, produce three structurally different directions. Otherwise produce one.
10. Return a compact build contract with assumptions and intentionally open decisions. Do not implement unless the same request asked you to build.

The output should make implementation obvious without turning a reference into a clone or a context window into a design-library landfill.
