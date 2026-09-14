# Component and icon retrieval without context spam

The goal is not to browse a library. The goal is to identify the smallest useful set of candidate parts for the current screen.

## Retrieval budget

Default budget per decision:

- one archetype from `app-archetypes.md`
- one component family query
- 3-5 component summaries
- fetch source for at most 1-2 finalists
- 3-6 icon candidates, not 30

Do not fetch source code for every search hit. Search is for ranking; fetch is for implementation.

## Search in two passes

### Pass 1: structural noun

Query the thing the screen needs, not its styling:

- `data table`
- `command palette`
- `date range`
- `activity feed`
- `bottom sheet`
- `combobox`
- `file upload`
- `timeline`

Avoid queries like `beautiful modern card` or `cool dashboard widget`; those encode aesthetic slop before the results arrive.

### Pass 2: interaction modifier

Only if pass 1 is weak, add one modifier:

- `virtualized`
- `mobile`
- `async`
- `sortable`
- `editable`
- `multi select`
- `drag drop`

Do not concatenate every requirement into one giant query. It lowers recall and usually retrieves a giant block instead of a useful primitive.

## Prefer primitives before blocks

Search `registry:ui` / `registry:component` first when the design already has structure. Search `registry:block` or `registry:page` when the problem is genuinely compositional and you need examples of how several primitives work together.

A block is reference material, not a drop-in answer. Rebuild it into the project's tokens and information hierarchy.

## shadcn is a schema, not a look

Treat shadcn as a code-distribution format. Current registries can publish primitives, components, blocks, pages, hooks, styles, themes, and entire design-system bases. Do not assume a shadcn result must look like the default demo site.

When a project already has `components.json`, inspect and respect:

- `style`
- `baseColor`
- `iconLibrary`
- aliases
- whether it is using Base UI or Radix-backed components

Do not install a second implementation of an existing primitive merely because another registry result looks prettier.

## Icon policy

Pick one icon family per product surface unless there is a deliberate reason to mix.

For shadcn-managed projects, honor the configured `iconLibrary`. Current shadcn supports several libraries including Lucide, Tabler, Hugeicons, Phosphor, Remix Icon, and legacy Radix icons. If the repo already chose one, search that family first.

The MCP's offline `icon_find` currently indexes Tabler and Lucide because both are cheap to search locally and share compatible outline geometry. Use it for semantic discovery even when the final project uses another family: find the semantic name first, then map it into the configured library rather than importing a second set.

Good icon query: `shield check`, `route`, `receipt`, `scan`, `history`.
Bad icon query: `security dashboard icon blue`.

Do not fetch/render an icon merely to decide whether its name is plausible. Names and tags are enough until the final choice.

## Ranking rules

Prefer in this order:

1. existing project component
2. existing project primitive composed differently
3. core shadcn-schema primitive
4. a registry component whose interaction model solves a real problem
5. custom implementation

Do not add a dependency for visual novelty alone.

When two results solve the same problem, prefer the one with:

- fewer dependencies
- fewer files
- accessible interaction already handled
- API shape matching the existing codebase
- less styling to delete

## Context compression

When reporting search results back to the model, keep only:

`id | source | category | why it matches`

Do not return descriptions, dependency lists, source code, author metadata, URLs, and installation instructions unless they affect the decision.

After the model chooses a result, fetch only that item. If it fails, fetch the runner-up. This turns component retrieval from a catalogue dump into a branch-and-bound search.

## Cache behavior

Registry indexes and icon indexes are effectively reference data during one design session. Reuse them. A query changing from `table` to `sortable table` should not require another network download of the same registry index.

Runtime adapters should cache registry indexes by registry root, then rank/filter locally. Cache individual fetched component items separately. Query strings should not become cache keys for full indexes.

## Stop condition

Stop searching when one candidate:

- satisfies the interaction requirement
- fits the existing stack
- has acceptable accessibility behavior
- can be restyled without importing another design system

A sixth candidate rarely improves the implementation. It mostly spends tokens.
