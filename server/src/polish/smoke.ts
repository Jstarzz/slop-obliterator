import assert from 'node:assert/strict';

import { PlaywrightDriver } from '../browser/playwright.js';
import { resolveViewport } from '../browser/driver.js';
import { analyzePolish } from './analyze.js';
import { collectPolishMeasurements } from './collect.js';

const SLOPPY = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box} body{margin:0;font-family:Arial,sans-serif} main>section{padding:96px 24px;text-align:center}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:auto}.card{background:#fff;border:1px solid #ddd;border-radius:16px}
.card:nth-child(1){padding:16px}.card:nth-child(2){padding:28px}.card:nth-child(3){padding:40px}
.tile{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:12px;background:#eef2ff;margin:0 auto 16px}
h3{margin:0 0 60px}.controls{display:flex;gap:12px;justify-content:center}.controls button:nth-child(1){height:36px}.controls button:nth-child(2){height:48px}
.pills{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.pill{display:inline-block;padding:4px 12px;border:1px solid #ddd;border-radius:999px;height:28px}
</style></head><body><main>
<section><h2>Features</h2><p>Everything you need.</p><div>✨</div>
<div class="grid">
<div class="card"><div class="tile"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 12h16"/></svg></div><h3>One</h3><p>First.</p></div>
<div class="card"><div class="tile"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg></div><h3>Two</h3><p>Second.</p></div>
<div class="card"><div class="tile"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 4v16"/></svg></div><h3>Three</h3><p>Third.</p></div>
</div></section>
<section><h2>Actions</h2><p>Do things.</p><div class="controls"><button>Save</button><button>Cancel</button><button aria-label="Settings"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/></svg></button><button><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 12h16"/></svg></button><button>🔥</button><button><img width="20" height="20" src="data:image/png;base64,iVBORw0KGgo=" alt=""></button></div></section>
<section><h2>Status</h2><p>Labels.</p><div class="pills">${Array.from({ length: 10 }, (_, i) => `<span class="pill">Tag ${i + 1}</span>`).join('')}</div></section>
<section><h2>Proof</h2><p>More proof.</p></section>
<section><h2>Close</h2><p>Call to action.</p></section>
</main></body></html>`;

const CLEAN = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;font-family:Georgia,serif;background:#f5f7f8;color:#172126}main{max-width:900px;margin:auto;padding:64px 24px}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.card{background:white;border:1px solid #c9d1d4;border-radius:8px;padding:24px}.label{display:flex;align-items:center;gap:8px}svg{width:20px;height:20px;fill:none;stroke:currentColor}h2{margin:0 0 16px}h3{margin:0 0 12px}p{margin:0;line-height:1.6}button{height:44px;padding:0 18px;border-radius:6px;border:1px solid #173f3a;background:#173f3a;color:white}
</style></head><body><main><h2>Ledger controls</h2><div class="row">
<div class="card"><div class="label"><svg viewBox="0 0 24 24"><path d="M4 12h16"/></svg><h3>Import</h3></div><p>Bring in a statement.</p></div>
<div class="card"><div class="label"><svg viewBox="0 0 24 24"><path d="M12 4v16"/></svg><h3>Match</h3></div><p>Pair both sides.</p></div>
<div class="card"><div class="label"><svg viewBox="0 0 24 24"><path d="M5 5l14 14"/></svg><h3>Close</h3></div><p>Finish the period.</p></div>
</div><p style="margin-top:32px"><button>Reconcile now</button></p></main></body></html>`;

async function audit(driver: PlaywrightDriver, html: string) {
  const session = await driver.open({ html }, { viewport: resolveViewport('desktop'), settleMs: 100, reducedMotion: true });
  try {
    return analyzePolish(await session.evaluate(collectPolishMeasurements));
  } finally {
    await session.close();
  }
}

async function main(): Promise<void> {
  const driver = new PlaywrightDriver();
  try {
    const sloppy = await audit(driver, SLOPPY);
    const ids = new Set(sloppy.findings.map((finding) => finding.id));
    for (const id of [
      'icon.emoji-control',
      'icon.raster-ui-icon',
      'icon.unlabeled-button',
      'icon.oversized-control-icon',
      'icon.sibling-size-drift',
      'icon.mixed-sibling-styles',
      'icon.repeated-boxed-feature-icons',
      'space.cookie-cutter-sections',
      'space.card-padding-drift',
      'layout.control-height-drift',
      'layout.pill-soup',
      'layout.centered-section-repeat',
    ]) {
      assert.ok(ids.has(id), `sloppy fixture should fire ${id}`);
    }

    const clean = await audit(driver, CLEAN);
    assert.deepEqual(clean.findings, [], `clean fixture should have zero polish findings, got ${clean.findings.map((f) => f.id).join(', ')}`);
    console.log(`POLISH SMOKE PASSED (${sloppy.findings.length} sloppy findings, clean=0)`);
  } finally {
    await driver.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
