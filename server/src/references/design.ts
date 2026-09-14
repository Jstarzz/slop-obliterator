import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export interface DesignReference {
  id: string;
  name: string;
  aliases: string[];
  tasks: string[];
  structure: string[];
  interactions: string[];
  components: string[];
  avoid: string[];
  mobile?: string[];
}

export const DESIGN_REFERENCES: readonly DesignReference[] = [
  {
    id: 'operations-console',
    name: 'Operations console',
    aliases: ['ops', 'control room', 'noc', 'command center', 'monitoring'],
    tasks: ['monitor many entities', 'spot exceptions', 'acknowledge incidents', 'take rapid action'],
    structure: ['dense overview with exception-first hierarchy', 'persistent filters and status context', 'detail pane without losing the queue'],
    interactions: ['acknowledge/assign/resolve transitions', 'bulk actions', 'keyboard-friendly triage'],
    components: ['status table', 'event timeline', 'filter bar', 'detail drawer', 'command palette'],
    avoid: ['decorative KPI card wall', 'equal emphasis for healthy and unhealthy states', 'modal for every drill-down'],
    mobile: ['exception queue first', 'details as full screen or contextual sheet', 'large repeat-action targets'],
  },
  {
    id: 'crm',
    name: 'CRM / relationship workspace',
    aliases: ['sales', 'pipeline', 'customer relationship', 'deals', 'leads'],
    tasks: ['scan pipeline', 'open account context', 'record activity', 'move work through stages'],
    structure: ['pipeline/list as primary surface', 'account detail with timeline and related objects', 'persistent next-action context'],
    interactions: ['inline status changes', 'quick note/activity capture', 'bulk ownership and stage changes'],
    components: ['pipeline board', 'account header', 'activity timeline', 'task list', 'people/company relation list'],
    avoid: ['dashboard before actual work surface', 'card for every field', 'stage colour as the only state cue'],
  },
  {
    id: 'admin-backoffice',
    name: 'Admin / back-office',
    aliases: ['admin', 'back office', 'management portal', 'internal tool', 'settings'],
    tasks: ['find records', 'inspect details', 'edit safely', 'perform privileged actions'],
    structure: ['navigation by domain object', 'table/list plus detail/edit screen', 'dangerous actions separated from routine edits'],
    interactions: ['search/filter/sort', 'inline validation', 'audit trail', 'explicit destructive confirmation'],
    components: ['data table', 'filters', 'form sections', 'audit log', 'permission matrix'],
    avoid: ['marketing-style hero', 'oversized cards', 'hiding destructive actions inside generic kebab menus'],
  },
  {
    id: 'finance-payments',
    name: 'Finance / payments',
    aliases: ['banking', 'payments', 'billing', 'wallet', 'transactions', 'accounting'],
    tasks: ['understand balances', 'review transactions', 'initiate money movement', 'reconcile exceptions'],
    structure: ['account/balance context first', 'chronological transaction surface', 'high-friction confirmation for irreversible actions'],
    interactions: ['amount entry with immediate validation', 'review-before-submit', 'receipt/reference persistence', 'clear pending/settled/failed states'],
    components: ['balance summary', 'transaction table/list', 'payment form', 'receipt', 'status history'],
    avoid: ['gamified money motion', 'ambiguous success animation before settlement', 'colour-only debit/credit semantics'],
    mobile: ['one primary money task per screen', 'numeric keyboard aware forms', 'receipt easy to revisit/share'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare / clinical',
    aliases: ['medical', 'clinical', 'patient', 'ehr', 'emr', 'hospital'],
    tasks: ['find patient context', 'review chronology', 'record observations', 'act without losing provenance'],
    structure: ['patient identity always visible', 'chronology dominates', 'critical alerts distinguished from routine metadata'],
    interactions: ['structured entry plus free text where necessary', 'clear author/time provenance', 'explicit review/sign workflow'],
    components: ['patient banner', 'clinical timeline', 'results table', 'medication/problem list', 'order/action panel'],
    avoid: ['consumer wellness styling for clinical work', 'cards that hide chronology', 'using colour alone for criticality'],
  },
  {
    id: 'logistics-dispatch',
    name: 'Logistics / dispatch',
    aliases: ['dispatch', 'fleet', 'ambulance', 'vehicle tracking', 'delivery', 'routing', 'map'],
    tasks: ['locate moving entities', 'spot exceptions', 'assign resources', 'communicate and resolve'],
    structure: ['map or queue dominates based on task', 'selected entity stays contextual', 'event/history panel supports the spatial view'],
    interactions: ['select on map or queue', 'assign/reassign', 'contact crew', 'status progression', 'route/context inspection'],
    components: ['map', 'vehicle/resource list', 'status chips', 'detail dock', 'event timeline', 'communication action'],
    avoid: ['map surrounded by decorative cards', 'hiding status history', 'forcing every action through a modal'],
    mobile: ['task queue or selected unit first', 'map as task surface not wallpaper', 'bottom sheet only for transient context'],
  },
  {
    id: 'security-access',
    name: 'Security / access control',
    aliases: ['security', 'access control', 'badge', 'checkpoint', 'nfc', 'guard', 'port access'],
    tasks: ['verify identity/access', 'process entry/exit', 'handle exceptions', 'preserve audit evidence'],
    structure: ['verification result dominates', 'person/credential/vehicle context nearby', 'recent checkpoint events visible'],
    interactions: ['scan -> verdict -> action', 'fast override with reason', 'credential lifecycle actions', 'audit log review'],
    components: ['scan/verdict panel', 'identity summary', 'credential status', 'checkpoint event list', 'override form'],
    avoid: ['dashboard-first checkpoint workflow', 'small subtle denial states', 'buried override provenance'],
    mobile: ['one-handed scan flow', 'large success/deny feedback', 'offline queue with explicit sync state'],
  },
  {
    id: 'developer-infrastructure',
    name: 'Developer / infrastructure tool',
    aliases: ['developer tool', 'devtools', 'infrastructure', 'server', 'cloud', 'kubernetes', 'observability'],
    tasks: ['inspect state', 'search logs/resources', 'compare changes', 'execute precise actions'],
    structure: ['dense navigation by resource', 'logs/data as first-class surfaces', 'contextual detail rather than decorative overview'],
    interactions: ['command/search first', 'copyable identifiers', 'diffs', 'keyboard navigation', 'progressive disclosure for advanced settings'],
    components: ['resource tree', 'log viewer', 'terminal/code block', 'diff', 'metrics chart', 'command palette'],
    avoid: ['giant metric tiles as the home screen', 'hiding exact values behind charts', 'excess whitespace that reduces scanability'],
  },
  {
    id: 'analytics-bi',
    name: 'Analytics / BI',
    aliases: ['analytics', 'business intelligence', 'bi', 'metrics', 'reporting', 'dashboard'],
    tasks: ['answer a question', 'compare segments/time', 'find drivers', 'drill into evidence'],
    structure: ['question/filter context precedes charts', 'few high-information visuals', 'drill-down data remains reachable'],
    interactions: ['cross-filtering', 'range/segment changes', 'hover details with keyboard alternative', 'export/share'],
    components: ['filter bar', 'chart', 'comparison table', 'annotation', 'metric with context'],
    avoid: ['12 unrelated KPI cards', 'chart variety for decoration', 'metrics without denominator/timeframe'],
  },
  {
    id: 'task-project',
    name: 'Task / project management',
    aliases: ['project management', 'tasks', 'kanban', 'work management', 'planning'],
    tasks: ['capture work', 'prioritize', 'assign', 'track progress', 'review blockers'],
    structure: ['work items dominate', 'views are alternate lenses over the same data', 'detail preserves surrounding project context'],
    interactions: ['quick add', 'inline edit', 'drag only where it adds real value', 'bulk select', 'command shortcuts'],
    components: ['task list', 'board', 'detail pane', 'assignee/status controls', 'activity history'],
    avoid: ['separate cards for every metadata field', 'drag-and-drop as the only interaction', 'dashboard before actionable work'],
  },
  {
    id: 'cms-publishing',
    name: 'CMS / publishing',
    aliases: ['cms', 'publishing', 'editorial', 'content management', 'blog editor'],
    tasks: ['draft content', 'manage media', 'review changes', 'publish safely'],
    structure: ['editor is primary', 'metadata/settings secondary', 'preview and publication state always understandable'],
    interactions: ['autosave with visible state', 'preview', 'revision history', 'schedule/publish workflow'],
    components: ['editor', 'media picker', 'revision history', 'status bar', 'metadata panel'],
    avoid: ['settings overwhelming the editor', 'mystery autosave', 'publish action visually equivalent to save draft'],
  },
  {
    id: 'commerce',
    name: 'Commerce / shopping',
    aliases: ['ecommerce', 'shopping', 'store', 'catalog', 'checkout'],
    tasks: ['discover products', 'compare', 'select variants', 'purchase with confidence'],
    structure: ['catalog/search tuned for comparison', 'product page prioritizes decision information', 'checkout narrows distractions'],
    interactions: ['filter/sort', 'variant selection', 'cart editing', 'clear checkout progression'],
    components: ['search/filter', 'product list', 'product detail', 'variant picker', 'cart', 'checkout'],
    avoid: ['oversized promotional chrome around every item', 'hidden fees', 'forcing account creation before intent is clear'],
    mobile: ['sticky purchase action only when useful', 'thumb-friendly variants', 'checkout fields optimized for keyboards/autofill'],
  },
  {
    id: 'social-community',
    name: 'Social / community',
    aliases: ['social', 'community', 'feed', 'forum', 'creator'],
    tasks: ['consume updates', 'create/respond', 'follow relationships', 'manage attention'],
    structure: ['content stream or conversation dominates', 'identity/context attached to content', 'creation path close to consumption'],
    interactions: ['compose', 'reply', 'react', 'save/follow', 'moderation/report'],
    components: ['feed', 'composer', 'thread', 'profile summary', 'notification list'],
    avoid: ['card nesting around every post', 'reaction clutter', 'engagement controls overpowering content'],
  },
  {
    id: 'support-messaging',
    name: 'Support / messaging',
    aliases: ['support', 'helpdesk', 'messaging', 'chat', 'inbox', 'ticket'],
    tasks: ['triage conversations', 'understand context', 'respond', 'resolve or escalate'],
    structure: ['inbox/master list + conversation detail', 'customer/context side information', 'composer anchored to the active thread'],
    interactions: ['assign', 'tag', 'reply', 'internal note', 'resolve/escalate', 'template insertion'],
    components: ['inbox', 'thread', 'composer', 'customer context', 'assignment/status controls'],
    avoid: ['separate page load for every thread', 'customer metadata above conversation content', 'status actions hidden from the response flow'],
    mobile: ['thread-first after selection', 'composer survives keyboard', 'fast return to queue'],
  },
  {
    id: 'field-work',
    name: 'Field-work / inspection',
    aliases: ['field service', 'inspection', 'technician', 'survey', 'inventory scan', 'offline app'],
    tasks: ['receive assignment', 'navigate/capture evidence', 'complete checklist', 'sync later'],
    structure: ['current job dominates', 'progress/checklist visible', 'evidence capture integrated into the task'],
    interactions: ['scan/photo/signature', 'offline edits', 'resume interrupted work', 'explicit sync/retry'],
    components: ['job card/list', 'step checklist', 'capture control', 'map/directions', 'sync status'],
    avoid: ['desktop form shrunk to phone', 'requiring connectivity for every step', 'small controls used with gloves/on the move'],
    mobile: ['offline-first state machine', 'large targets', 'minimal typing', 'preserve drafts across interruption'],
  },
] as const;

function terms(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function scoreReference(reference: DesignReference, queryTerms: readonly string[], platform?: string): number {
  const name = `${reference.name} ${reference.aliases.join(' ')}`.toLowerCase();
  const tasks = reference.tasks.join(' ').toLowerCase();
  const structure = reference.structure.join(' ').toLowerCase();
  const components = reference.components.join(' ').toLowerCase();
  let score = 0;

  for (const term of queryTerms) {
    if (name.split(/[^a-z0-9]+/).includes(term)) score += 30;
    else if (name.includes(term)) score += 18;
    if (tasks.includes(term)) score += 10;
    if (structure.includes(term)) score += 5;
    if (components.includes(term)) score += 4;
  }
  if (platform === 'mobile' && reference.mobile?.length) score += 2;
  return score;
}

export function findDesignReferences(query: string, platform: 'web' | 'mobile' | 'any' = 'any', limit = 4): DesignReference[] {
  const queryTerms = terms(query);
  if (queryTerms.length === 0) return [];
  return DESIGN_REFERENCES
    .map((reference) => ({ reference, score: scoreReference(reference, queryTerms, platform) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.reference.name.localeCompare(b.reference.name))
    .slice(0, Math.min(Math.max(limit, 1), 8))
    .map(({ reference }) => reference);
}

function summary(reference: DesignReference, platform: 'web' | 'mobile' | 'any'): string {
  const lines = [
    `${reference.id} — ${reference.name}`,
    `  structure: ${reference.structure.slice(0, 2).join('; ')}`,
    `  interactions: ${reference.interactions.slice(0, 2).join('; ')}`,
    `  components: ${reference.components.slice(0, 5).join(', ')}`,
    `  avoid: ${reference.avoid.slice(0, 2).join('; ')}`,
  ];
  if (platform === 'mobile' && reference.mobile?.length) lines.push(`  mobile: ${reference.mobile.slice(0, 2).join('; ')}`);
  return lines.join('\n');
}

export function registerDesignReferenceTools(server: McpServer): void {
  server.registerTool(
    'reference_find',
    {
      title: 'Find compact app-structure references',
      description:
        'Returns a few structural reference routes for a product/task without screenshots or giant docs. ' +
        'Use it before component search. Compare several routes, assign each a job (structure, interaction, density), ' +
        'then synthesize rather than cloning one template.',
      inputSchema: {
        query: z.string().describe('Product and task, e.g. "ambulance dispatch exception handling" or "mobile field inspection offline".'),
        platform: z.enum(['web', 'mobile', 'any']).default('any'),
        limit: z.number().int().min(1).max(8).default(4),
      },
    },
    async (args) => {
      const hits = findDesignReferences(args.query, args.platform, args.limit);
      if (hits.length === 0) {
        return { content: [{ type: 'text' as const, text: `No structural reference matched "${args.query}". Try the domain noun plus the primary task.` }] };
      }
      const body = [
        `${hits.length} structural routes. Pick 2-4 for different jobs; do not clone one end-to-end.`,
        '',
        ...hits.map((reference) => summary(reference, args.platform)),
      ].join('\n\n');
      return { content: [{ type: 'text' as const, text: body }] };
    },
  );

  server.registerTool(
    'reference_expand',
    {
      title: 'Expand one app-structure reference',
      description: 'Returns the full compact decision set for one id from reference_find. Use only after shortlisting.',
      inputSchema: { id: z.string() },
    },
    async (args) => {
      const reference = DESIGN_REFERENCES.find((item) => item.id === args.id);
      if (!reference) {
        return { content: [{ type: 'text' as const, text: `Unknown reference "${args.id}". Use reference_find first.` }], isError: true };
      }
      const body = [
        `# ${reference.name}`,
        `Tasks: ${reference.tasks.join('; ')}`,
        `Structure: ${reference.structure.join('; ')}`,
        `Interactions: ${reference.interactions.join('; ')}`,
        `Components: ${reference.components.join(', ')}`,
        `Avoid: ${reference.avoid.join('; ')}`,
        reference.mobile?.length ? `Mobile: ${reference.mobile.join('; ')}` : '',
      ].filter(Boolean).join('\n');
      return { content: [{ type: 'text' as const, text: body }] };
    },
  );
}
