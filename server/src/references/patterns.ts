import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export interface InteractionPattern {
  id: string;
  name: string;
  aliases: string[];
  useWhen: string[];
  shape: string[];
  interactions: string[];
  avoidWhen: string[];
  mobile?: string[];
}

export const INTERACTION_PATTERNS: readonly InteractionPattern[] = [
  {
    id: 'master-detail',
    name: 'Master-detail',
    aliases: ['split view', 'list detail', 'inbox layout'],
    useWhen: ['users scan many objects then inspect one', 'selection context should survive drill-down'],
    shape: ['persistent list or table', 'selected detail pane', 'stable filtering/search context'],
    interactions: ['select without losing position', 'keyboard next/previous', 'deep-link selected item'],
    avoidWhen: ['detail work needs the full viewport', 'objects are rarely compared or scanned'],
    mobile: ['list first then full-screen detail', 'preserve list scroll/filter state on back'],
  },
  {
    id: 'exception-queue',
    name: 'Exception queue',
    aliases: ['triage queue', 'work queue', 'incident queue', 'review queue'],
    useWhen: ['many items exist but only a subset needs action', 'operators process work repeatedly'],
    shape: ['priority/status ordered queue', 'compact evidence', 'selected work context'],
    interactions: ['claim/assign', 'acknowledge', 'resolve/escalate', 'next actionable item'],
    avoidWhen: ['all items deserve equal inspection', 'work has no meaningful lifecycle'],
    mobile: ['one actionable item or short queue first', 'large repeated action targets'],
  },
  {
    id: 'data-table',
    name: 'Data table',
    aliases: ['table', 'grid', 'records'],
    useWhen: ['users compare the same fields across many records', 'sorting/filtering is central'],
    shape: ['stable columns', 'high information density', 'filters near the dataset'],
    interactions: ['sort', 'filter', 'select', 'bulk action', 'column-aware scanning'],
    avoidWhen: ['each item has unique narrative content', 'there are too few records to compare'],
    mobile: ['prefer prioritized row summaries or drill-down', 'do not shrink desktop columns until unreadable'],
  },
  {
    id: 'search-results',
    name: 'Search + results',
    aliases: ['search', 'finder', 'catalog search'],
    useWhen: ['the user knows or can describe the target', 'the corpus is too large to browse linearly'],
    shape: ['prominent query input', 'result count/context', 'ranked results with useful facets'],
    interactions: ['typeahead where valuable', 'faceted filtering', 'query persistence', 'keyboard result navigation'],
    avoidWhen: ['the corpus is tiny', 'the user cannot know what vocabulary exists'],
    mobile: ['full-width search', 'filters in a compact dedicated surface', 'retain query on back'],
  },
  {
    id: 'filter-bar',
    name: 'Persistent filter bar',
    aliases: ['filters', 'facets', 'query controls'],
    useWhen: ['users repeatedly change slices of the same dataset', 'current scope must remain visible'],
    shape: ['few high-value filters always visible', 'secondary filters progressively disclosed'],
    interactions: ['immediate apply when cheap', 'clear individual/all', 'shareable filter state where useful'],
    avoidWhen: ['filters are used once in a long setup flow', 'dozens of fields would become permanent chrome'],
    mobile: ['show active-filter summary', 'open secondary controls in a dedicated sheet/screen'],
  },
  {
    id: 'command-palette',
    name: 'Command palette',
    aliases: ['cmd k', 'command menu', 'launcher', 'quick actions'],
    useWhen: ['expert users repeat navigation/actions', 'the product has many addressable commands'],
    shape: ['searchable command list', 'grouped actions', 'shortcut hints'],
    interactions: ['fuzzy search', 'keyboard navigation', 'recent/contextual commands'],
    avoidWhen: ['it would hide the only path to a core action', 'the product is simple enough that visible navigation is faster'],
    mobile: ['usually secondary, not primary navigation', 'use a searchable action surface with touch-sized rows'],
  },
  {
    id: 'timeline',
    name: 'Chronological timeline',
    aliases: ['history', 'activity', 'event log', 'audit trail'],
    useWhen: ['sequence and provenance matter', 'users need to reconstruct what happened'],
    shape: ['ordered events', 'time/actor/state attached to each event', 'meaningful grouping'],
    interactions: ['filter event types', 'expand evidence', 'jump to related object'],
    avoidWhen: ['ordering is irrelevant', 'events are homogeneous enough for a compact table'],
    mobile: ['single-column chronology', 'collapse verbose metadata until requested'],
  },
  {
    id: 'map-detail-dock',
    name: 'Map + contextual dock',
    aliases: ['map panel', 'map sidebar', 'spatial detail'],
    useWhen: ['location is part of the task', 'users select spatial entities then act on them'],
    shape: ['map remains primary spatial context', 'selected entity dock/panel', 'non-spatial queue when exceptions matter'],
    interactions: ['select marker or list item', 'keep selection synchronized', 'pan/zoom without destroying task state'],
    avoidWhen: ['map is decorative', 'location does not affect decisions'],
    mobile: ['map as task surface', 'short bottom sheet for transient selection or full screen for deep work'],
  },
  {
    id: 'inline-edit',
    name: 'Inline edit',
    aliases: ['editable table', 'quick edit', 'in-place edit'],
    useWhen: ['users make small frequent changes while retaining surrounding context'],
    shape: ['read state looks like data', 'edit affordance appears predictably', 'validation stays local'],
    interactions: ['enter edit', 'save/cancel', 'keyboard commit/navigation'],
    avoidWhen: ['changes require substantial explanation/review', 'editing has dangerous side effects'],
    mobile: ['prefer focused edit surfaces when fields become cramped', 'never rely on hover to reveal editability'],
  },
  {
    id: 'form-sections',
    name: 'Sectioned form',
    aliases: ['settings form', 'profile form', 'long form'],
    useWhen: ['many related fields belong to one object', 'users may edit non-linearly'],
    shape: ['semantic sections', 'local descriptions/errors', 'stable save semantics'],
    interactions: ['validate near field', 'save intentionally', 'warn about unsaved changes when material'],
    avoidWhen: ['the task is truly sequential and dependencies require a wizard'],
    mobile: ['one readable column', 'correct keyboards/autofill', 'sticky action only when it does not obscure fields'],
  },
  {
    id: 'wizard',
    name: 'Sequential wizard',
    aliases: ['stepper', 'multi step form', 'guided flow'],
    useWhen: ['later choices depend on earlier ones', 'the task is infrequent and benefits from guidance'],
    shape: ['few meaningful steps', 'clear progress', 'review before irreversible submit'],
    interactions: ['next/back', 'preserve completed input', 'resume where appropriate'],
    avoidWhen: ['users frequently jump among fields', 'steps exist only to make a simple form feel elaborate'],
    mobile: ['full-screen steps', 'keyboard-safe primary action', 'back semantics must not destroy progress'],
  },
  {
    id: 'bottom-navigation',
    name: 'Bottom navigation',
    aliases: ['tab bar', 'bottom tabs', 'mobile nav'],
    useWhen: ['mobile has a small set of peer top-level destinations used frequently'],
    shape: ['3-5 stable destinations', 'icon plus label when meaning is not universal'],
    interactions: ['switch destination without nesting', 'preserve destination state when useful'],
    avoidWhen: ['there are more than five unrelated destinations', 'items are actions rather than destinations'],
    mobile: ['respect safe area', 'do not hide essential content behind it'],
  },
  {
    id: 'tabs',
    name: 'Tabs',
    aliases: ['segmented sections', 'tabbed detail'],
    useWhen: ['a few peer views share the same object/context', 'switching should be cheap'],
    shape: ['stable context above tabs', 'short labels', 'one active panel'],
    interactions: ['direct switching', 'keyboard arrow navigation on web', 'deep-link tab when useful'],
    avoidWhen: ['sections must be read together', 'there are so many tabs they become horizontal navigation debt'],
    mobile: ['avoid tiny horizontally squeezed tabs', 'scrollable tabs only when labels remain discoverable'],
  },
  {
    id: 'contextual-sheet',
    name: 'Contextual sheet',
    aliases: ['bottom sheet', 'drawer', 'side sheet'],
    useWhen: ['temporary context/action should overlay without abandoning the parent task'],
    shape: ['bounded secondary surface', 'clear relationship to underlying selection'],
    interactions: ['open from explicit context', 'dismiss predictably', 'promote to full screen for deep work'],
    avoidWhen: ['the content is a destination', 'the task requires multiple nested sheets', 'long forms need full focus'],
    mobile: ['bottom sheet for short transient context', 'full screen for keyboard-heavy or deep workflows'],
  },
  {
    id: 'kanban',
    name: 'Kanban board',
    aliases: ['board', 'columns', 'pipeline board'],
    useWhen: ['stage is the dominant organizing attribute', 'movement between a few stages is meaningful'],
    shape: ['columns represent real states', 'cards contain only scan-critical fields'],
    interactions: ['move stage with accessible alternative to drag', 'open detail without losing board context'],
    avoidWhen: ['there are many stages', 'comparison across numeric fields matters more than stage'],
    mobile: ['often replace with grouped list plus explicit stage control', 'do not require horizontal drag as the only workflow'],
  },
  {
    id: 'tree-navigation',
    name: 'Hierarchical tree',
    aliases: ['resource tree', 'file tree', 'nested navigation'],
    useWhen: ['objects have a meaningful hierarchy', 'users navigate parent/child relationships repeatedly'],
    shape: ['expandable hierarchy', 'selected node context', 'depth remains legible'],
    interactions: ['expand/collapse', 'keyboard navigation', 'search or jump for large trees'],
    avoidWhen: ['hierarchy is artificial', 'most users only need one or two levels'],
    mobile: ['prefer drill-in navigation for deep trees', 'retain breadcrumb/back context'],
  },
  {
    id: 'metrics-overview',
    name: 'Metrics overview',
    aliases: ['dashboard', 'kpi summary', 'scorecard'],
    useWhen: ['a small set of metrics answers a recurring monitoring question', 'users need trend/context before drill-down'],
    shape: ['few metrics with timeframe/comparison', 'evidence or drill-down close by'],
    interactions: ['change timeframe/segment', 'drill into causes'],
    avoidWhen: ['the real task is processing records', 'metric cards become a decorative home screen'],
    mobile: ['prioritize the few actionable metrics', 'avoid endless stacked KPI cards'],
  },
  {
    id: 'activity-composer',
    name: 'Conversation + composer',
    aliases: ['chat', 'thread', 'messages', 'comments'],
    useWhen: ['chronological human exchange is the primary object', 'users respond while reading context'],
    shape: ['thread dominates', 'composer anchored to active context', 'identity/time attached to messages'],
    interactions: ['reply', 'mention', 'attach', 'send state/error recovery'],
    avoidWhen: ['messages are actually structured workflow events better represented as a timeline'],
    mobile: ['composer must survive keyboard opening', 'return to conversation list quickly'],
  },
  {
    id: 'checklist-flow',
    name: 'Checklist / field flow',
    aliases: ['checklist', 'inspection', 'steps', 'field task'],
    useWhen: ['completion requires a known set of verifiable actions', 'progress/resume matters'],
    shape: ['current task and progress', 'step evidence close to each requirement'],
    interactions: ['complete/undo', 'capture evidence', 'resume interrupted work'],
    avoidWhen: ['work is exploratory and cannot be decomposed into meaningful checks'],
    mobile: ['large controls', 'offline drafts', 'minimal typing', 'explicit sync state'],
  },
  {
    id: 'empty-state',
    name: 'Functional empty state',
    aliases: ['empty', 'zero state', 'first run'],
    useWhen: ['a collection genuinely has no content', 'the next useful action is known'],
    shape: ['plain explanation', 'one relevant next action', 'optional compact guidance'],
    interactions: ['create/import/connect only when those are real next steps'],
    avoidWhen: ['the state is loading/error/permission denied', 'illustration would overpower the task'],
    mobile: ['keep it compact enough that the action remains visible without ceremonial scrolling'],
  },
] as const;

function tokens(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function score(pattern: InteractionPattern, queryTokens: readonly string[], platform: 'web' | 'mobile' | 'any'): number {
  const identity = `${pattern.name} ${pattern.aliases.join(' ')}`.toLowerCase();
  const use = pattern.useWhen.join(' ').toLowerCase();
  const shape = pattern.shape.join(' ').toLowerCase();
  const interactions = pattern.interactions.join(' ').toLowerCase();
  const mobile = pattern.mobile?.join(' ').toLowerCase() ?? '';
  let total = 0;

  for (const token of queryTokens) {
    const identityTokens = tokens(identity);
    if (identityTokens.includes(token)) total += 24;
    else if (identity.includes(token)) total += 14;
    if (use.includes(token)) total += 9;
    if (shape.includes(token)) total += 6;
    if (interactions.includes(token)) total += 5;
    if (platform === 'mobile' && mobile.includes(token)) total += 5;
  }
  if (platform === 'mobile' && pattern.mobile?.length) total += 1;
  return total;
}

export function findInteractionPatterns(
  query: string,
  platform: 'web' | 'mobile' | 'any' = 'any',
  limit = 5,
): InteractionPattern[] {
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return [];
  return INTERACTION_PATTERNS
    .map((pattern) => ({ pattern, score: score(pattern, queryTokens, platform) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.pattern.name.localeCompare(b.pattern.name))
    .slice(0, Math.min(Math.max(limit, 1), 8))
    .map((entry) => entry.pattern);
}

function compact(pattern: InteractionPattern, platform: 'web' | 'mobile' | 'any'): string {
  const lines = [
    `${pattern.id} — ${pattern.name}`,
    `  use when: ${pattern.useWhen.slice(0, 2).join('; ')}`,
    `  shape: ${pattern.shape.slice(0, 2).join('; ')}`,
    `  interactions: ${pattern.interactions.slice(0, 3).join(', ')}`,
    `  avoid when: ${pattern.avoidWhen.slice(0, 2).join('; ')}`,
  ];
  if (platform === 'mobile' && pattern.mobile?.length) lines.push(`  mobile: ${pattern.mobile.slice(0, 2).join('; ')}`);
  return lines.join('\n');
}

export function registerInteractionPatternTools(server: McpServer): void {
  server.registerTool(
    'pattern_find',
    {
      title: 'Find interaction patterns for a product task',
      description:
        'Returns a compact shortlist of structural interaction patterns between app archetype and concrete component. ' +
        'Use after reference_find/reference_rank_axes and before component_find. Results explain when each pattern works, ' +
        'when it does not, and how it adapts to mobile so the model does not default to cards, modals, or dashboards.',
      inputSchema: {
        query: z.string().describe('Task/shape, e.g. "operators triage incidents and inspect one without losing queue context".'),
        platform: z.enum(['web', 'mobile', 'any']).default('any'),
        limit: z.number().int().min(1).max(8).default(5),
      },
    },
    async (args) => {
      const matches = findInteractionPatterns(args.query, args.platform, args.limit);
      if (matches.length === 0) {
        return { content: [{ type: 'text' as const, text: `No interaction pattern matched "${args.query}". Describe the user's repeated action and information shape.` }] };
      }
      return {
        content: [{
          type: 'text' as const,
          text: [
            `${matches.length} candidate patterns. Choose the smallest pattern that fits the task; combining everything is slop too.`,
            '',
            ...matches.map((pattern) => compact(pattern, args.platform)),
          ].join('\n\n'),
        }],
      };
    },
  );

  server.registerTool(
    'pattern_expand',
    {
      title: 'Expand one interaction pattern',
      description: 'Returns the full decision card for one id from pattern_find. Expand only finalists.',
      inputSchema: { id: z.string() },
    },
    async (args) => {
      const pattern = INTERACTION_PATTERNS.find((item) => item.id === args.id);
      if (!pattern) {
        return {
          content: [{ type: 'text' as const, text: `Unknown pattern "${args.id}". Use pattern_find first.` }],
          isError: true,
        };
      }
      const body = [
        `# ${pattern.name}`,
        `Use when: ${pattern.useWhen.join('; ')}`,
        `Shape: ${pattern.shape.join('; ')}`,
        `Interactions: ${pattern.interactions.join('; ')}`,
        `Avoid when: ${pattern.avoidWhen.join('; ')}`,
        pattern.mobile?.length ? `Mobile: ${pattern.mobile.join('; ')}` : '',
      ].filter(Boolean).join('\n');
      return { content: [{ type: 'text' as const, text: body }] };
    },
  );
}
