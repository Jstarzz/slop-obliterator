---
description: Shape a UI/product surface before implementation — resolve the task, design direction, reference roles, craft profile, and optional variants without duplicating separate grill/mockup commands
argument-hint: [what you want to build, redesign, or explore]
---

Shape: $ARGUMENTS

Load `design-research`, `design-synthesis`, and `design-craft`. Load `mobile-ui` for touch-first/native work. If the request contains Figma context or asks for Figma output, also load `figma-handoff`.

This is the single pre-build command. Do not bounce through separate clarification and mockup commands.

1. Inspect what already exists — product code, `DESIGN.md`, tokens, components, routes, screenshots/Figma context, and constraints. Never ask for information the project already contains.
2. Infer the primary user loop and surface mode. Ask **one** clarifying question only when two materially different products would otherwise be built. If the user says "you decide" or the context is sufficient, decide.
3. Call `design_plan` with product + task + audience + platform + hard constraints. Use its craft dials, reference roles, and interaction-pattern shortlist as hypotheses, not truth.
4. If Figma is authoritative, pull only the target frame/node, variables, components, assets, and Code Connect mappings needed for this surface.
5. Commit 2-5 non-overlapping reference roles with `reference_contract`. Choose the smallest interaction pattern that fits the repeated task.
6. Search components only for missing implementation capabilities. Existing project components win.
7. State one coherent direction: mode, hierarchy, density, typography stance, color strategy, radius/edge treatment, motion budget, icon family, and state model.
8. If the user asked for options/alternatives/mockups, produce **three structurally different directions**. They must disagree on layout logic and at least one of density/interaction/aesthetic — not one layout in three palettes. Otherwise produce one direction only.
9. Return a compact build contract with assumptions and the decisions that are intentionally left open. Do not implement unless the user explicitly asked to build as part of the same request.

The output should make implementation obvious without turning a reference into a clone.
