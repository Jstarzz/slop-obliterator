import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { resolve } from 'node:path';

import { analyze } from './audits/analyze.js';
import { collectMeasurements } from './audits/collect.js';
import { loadDesignContract } from './audits/rules/design-contract.js';
import type { DesignContract } from './audits/rules/types.js';
import { resolveViewport, type OpenTarget } from './browser/driver.js';
import type { PlaywrightDriver } from './browser/playwright.js';
import {
  registerIntelligenceTools,
  type RuntimeAuditRequest,
  type RuntimeAuditResult,
} from './intelligence.js';

function toTarget(request: RuntimeAuditRequest): OpenTarget {
  const provided = [request.url, request.file, request.html].filter((value) => value !== undefined);
  if (provided.length !== 1) throw new Error('Provide exactly one of: url, file, html.');
  return { url: request.url, file: request.file, html: request.html };
}

async function designContract(path: string | undefined): Promise<DesignContract | null> {
  if (!path) return null;
  return loadDesignContract(resolve(path));
}

async function runAudit(driver: PlaywrightDriver, request: RuntimeAuditRequest): Promise<RuntimeAuditResult> {
  const session = await driver.open(toTarget(request), {
    viewport: resolveViewport(request.viewport),
    colorScheme: request.colorScheme,
    reducedMotion: request.reducedMotion,
    settleMs: 350,
  });

  try {
    const raw = await session.evaluate(collectMeasurements);
    raw.consoleErrors = session.consoleErrors().filter((entry) => entry.type === 'error' || entry.type === 'pageerror').length;
    const report = analyze(raw, request.viewport, {
      design: await designContract(request.designMd),
      disabled: new Set(request.ignoreRules ?? []),
    });
    return {
      score: report.score,
      slopScore: report.slopScore,
      counts: report.counts,
      findings: report.findings.map((finding) => ({
        id: finding.id,
        severity: finding.severity,
        title: finding.title,
      })),
    };
  } finally {
    await session.close();
  }
}

export function registerIntelligenceRuntimeTools(server: McpServer, driver: PlaywrightDriver): void {
  registerIntelligenceTools(server, {
    runAudit: (request) => runAudit(driver, request),
  });
}
