---
name: design-craft
description: Use when an interface already has the right broad structure but still feels generic, sluggish, over-animated, under-detailed, or visually anonymous. Also use before a serious redesign to set design variance, motion intensity, visual density, interaction craft, and a bounded quality floor. Synthesizes original guidance informed by Emil Kowalski's design-engineering principles, Impeccable's surface/craft discipline, and Taste Skill's bias-control dials without copying any one source as a template.
---

# Design craft

This skill is the craft layer between **what the product should structurally be** and **what components happen to exist**.

Do not use it to replace `design-synthesis`. Structure comes first. Craft decides how that structure should feel, how much visual variance it can tolerate, how motion behaves, and which invisible details must be correct.

## Start with the MCP profile

Call `craft_profile` with the surface, audience, repeated task, platform, and constraints. If this is a new surface, `design_plan` already includes the same compact craft profile alongside structural references and interaction patterns.

Treat the three dials as bias controls, not aesthetic scores:

- **design variance** — how far composition may depart from predictable symmetry and standard component arrangements.
- **motion intensity** — how much animation/physics the interface can justify.
- **visual density** — how much useful information belongs in one viewport.

User requirements and existing product truth override inferred values.

## Three lenses, three jobs

### Interaction craft

Inspired by Emil Kowalski's design-engineering work. Use this lens for the details people feel before they can name them.

- Ask whether an interaction should animate at all before tuning its easing.
- Repeated expert actions should be instant or extremely restrained. Do not make keyboard-first workflows wait for decoration.
- Motion should explain state, spatial continuity, feedback, or a rare moment. "It looks cool" is not enough for a frequently repeated action.
- Prefer transform/opacity motion over layout thrash unless the layout change itself is the interaction.
- Entrances should feel immediately responsive; on-screen movement should have natural acceleration/deceleration; constant motion is rare.
- Press states, popover origins, tooltip timing, focus transitions, loading perception, and interruption behavior compound into product feel.
- A gesture that users can reverse mid-flight should not restart awkwardly from zero.

Do not cargo-cult exact durations or spring constants. The interaction frequency and surrounding system decide the value.

### Quality floor

Informed by Impeccable's distinction between surface mode, refinement, redesign, and bounded verification.

Classify the surface:

- **persuade** — marketing, pricing, campaign, landing. Attention and action matter.
- **operate** — product UI, admin, dashboards, tools. Task completion and scanability matter.
- **read** — docs, articles, guides. Comprehension matters.
- **experience** — portfolio, gallery, showcase. The artifact itself should lead.

A product can contain several modes. Classify the surface, not the company.

Then enforce:

- the brief wins over your taste;
- refinement preserves identity and behavior outside scope;
- redesign deliberately replaces the visual world instead of half-polishing the old one;
- loading, empty, error, partial, disabled, focus, hover, active, long-content, localization and responsive states are design work;
- one batched verification/fix pass plus at most one confirmation pass. Endless self-polish is waste.

### Bias controls

Informed by Taste Skill's variance/motion/density model.

The dials exist to stop the model from silently returning to its training-set average. They do **not** mean "higher is better."

- A security checkpoint may want 3/2/8.
- A calm documentation surface may want 4/2/3.
- An experimental agency landing page may justify 9/8/3.
- A dense infrastructure console may want 4/2/9.

Keep the values coherent across the page. Do not make one section 2/2/3 and the next 10/9/8 because you found a flashy component.

## Source truth hierarchy

Use evidence in this order when it exists:

1. Existing product behavior and requirements.
2. Existing code components/tokens and `DESIGN.md`.
3. Connected Figma context: variables, components, layout, assets, Code Connect.
4. Structural reference contract and interaction pattern.
5. External visual references.
6. Your inferred craft profile.

The craft profile fills gaps. It does not overrule explicit truth.

## Verification route

Use the smallest tool that answers the question:

- `audit_design` / `audit_responsive`: deterministic rendered measurements and slop checks.
- Playwright MCP: interaction flows, keyboard/focus order, dialogs, menus, state transitions, network/error reproduction, exploratory browser behavior.
- Figma MCP: design context, variables, components, assets, Code Connect, and design/code handoff.
- screenshots: only for visual judgement that structured evidence cannot answer.

Never dump an entire accessibility tree or Figma file into context when one state/frame answers the question.

## Final craft check

Before shipping meaningful UI, be able to answer:

- What is the surface mode?
- What are the three dials, and why?
- Which interaction is most frequent, and is its motion budget appropriate?
- Which detail would feel wrong even if the user could not explain why?
- Which project/Figma tokens and components were reused instead of reinvented?
- Which state was verified with Playwright rather than assumed from source?
- Did the rendered audit pass after the last meaningful edit?

## Provenance

This is an original synthesis, not a vendored upstream skill. It is informed by:

- Emil Kowalski's `emilkowalski/skills` design-engineering work (MIT).
- Impeccable by `pbakaus/impeccable` (Apache-2.0).
- Taste Skill by `Leonxlnx/taste-skill` (MIT).

Use upstream sources for deeper source-specific guidance; keep this skill compact and product-oriented.
