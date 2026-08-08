/**
 * End-to-end smoke test. Run with `npm run build && npm run smoke`.
 *
 * It renders two pages — one deliberately built out of every machine default,
 * one built the way the skill tells you to — and asserts the auditor can tell
 * them apart. If this stops discriminating, the tool is worthless, so it is the
 * one test that must never be allowed to go stale.
 */

import { analyze } from './audits/analyze.js';
import { collectMeasurements } from './audits/collect.js';
import { PlaywrightDriver } from './browser/playwright.js';
import { resolveViewport } from './browser/driver.js';
import { generateSystem } from './color/system.js';
import { judgeSeed } from './color/oklch.js';
import { renderReport } from './format.js';
import { getIconSvg, searchIcons } from './sources/icons.js';

const SLOP_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>FlowSync</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Inter, sans-serif; margin: 0; background: #ffffff; color: #4b5563; }
  .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;
          padding: 96px 24px; text-align: center; }
  .hero h2 { font-size: 44px; font-weight: 600; margin: 0 0 16px; }
  .hero p { font-size: 18px; max-width: none; margin: 0 auto 32px; }
  .cta { background: #6366f1; color: #fff; border: none; border-radius: 8px;
         padding: 14px 28px; font-size: 16px; outline: none; }
  .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
              padding: 64px 24px; max-width: 1100px; margin: 0 auto; }
  .card { background: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 27px; text-align: center; }
  .card h3 { font-size: 20px; font-weight: 600; margin: 13px 0 8px; }
  .card p { font-size: 15px; line-height: 1.35; color: #9ca3af; }
  input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 11px; outline: none; width: 100%; }
  .tiny { width: 18px; height: 18px; border-radius: 8px; background: #6366f1; border: none; outline: none; }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style></head><body>
<section class="hero">
  <h2>Build faster. Ship smarter.</h2>
  <p>The all-in-one platform that empowers modern teams to streamline their workflow and unlock their full potential across every stage of the product lifecycle, from idea to launch and beyond.</p>
  <button class="cta">Get Started</button>
</section>
<section class="features">
  <div class="card"><svg class="spin" width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#818cf8"/></svg><h3>Fast</h3><p>Lightning quick performance that scales with your team as you grow.</p></div>
  <div class="card"><svg width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#818cf8"/></svg><h3>Secure</h3><p>Enterprise grade security built in from the very first line of code.</p></div>
  <div class="card"><svg width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#818cf8"/></svg><h3>Simple</h3><p>An intuitive interface your whole team can pick up in an afternoon.</p></div>
</section>
<section style="padding:48px 24px;text-align:center">
  <form><input type="email" placeholder="Email address"><button class="tiny"></button></form>
  <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
</section>
</body></html>`;

const CLEAN_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Ledger</title>
<style>
  :root {
    --bg: #fbf8f4; --surface: #ffffff; --border: #e6ddd1;
    --text: #241d16; --muted: #5d5046;
    --primary: #9a3412; --primary-fg: #ffffff; --accent: #14625c;
    --space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 24px; --space-6: 48px; --space-8: 80px;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
         font-family: Georgia, "Iowan Old Style", serif; font-size: 17px; line-height: 1.62; }
  h1, h2, h3, .ui { font-family: "IBM Plex Mono", ui-monospace, monospace; }
  h1 { font-size: 56px; font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 var(--space-3); }
  h2 { font-size: 15px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin: 0 0 var(--space-3); }
  h3 { font-size: 21px; font-weight: 700; margin: 0 0 var(--space-2); }
  main { max-width: 1080px; margin: 0 auto; padding: var(--space-8) var(--space-4); }
  .lede { max-width: 62ch; font-size: 20px; color: var(--muted); margin: 0 0 var(--space-6); }
  .row { display: grid; grid-template-columns: 1.6fr 1fr; gap: var(--space-6); align-items: start; }
  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: var(--space-4); }
  .chip { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: var(--space-1) var(--space-2); font-size: 13px; }
  button { font: inherit; font-family: "IBM Plex Mono", monospace; font-weight: 700; font-size: 15px;
           background: var(--primary); color: var(--primary-fg); border: 1px solid var(--primary);
           border-radius: 6px; padding: 14px var(--space-4); min-height: 44px; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  label { display: block; font-size: 14px; font-weight: 700; margin-bottom: var(--space-1); }
  input { font: inherit; width: 100%; min-height: 44px; padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--text); }
  input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  p { max-width: 62ch; }
  @media (prefers-reduced-motion: no-preference) { .panel { transition: border-color 160ms ease; } }
</style></head><body>
<header><nav aria-label="Primary" style="padding:16px 24px"><a href="#main" class="chip">Skip to content</a></nav></header>
<main id="main">
  <h2>Bookkeeping, 1904 edition</h2>
  <h1>Every entry, twice, in ink.</h1>
  <p class="lede">Double-entry accounting for people who would rather see the ledger than a dashboard.</p>
  <div class="row">
    <section class="panel">
      <h3>The ledger</h3>
      <p>Each transaction lands in two places. The books balance or they do not, and you find out in the same second you type.</p>
    </section>
    <form class="panel">
      <h3>Open an account</h3>
      <label for="email">Work email <span aria-hidden="true">*</span></label>
      <input id="email" type="email" required autocomplete="email" aria-describedby="email-error">
      <p id="email-error" role="alert" style="font-size:14px;color:#9a3412;margin:8px 0 16px">&nbsp;</p>
      <button type="submit">Open the books</button>
    </form>
  </div>
</main>
<footer style="padding:24px;color:var(--muted);font-size:14px">Ledger &middot; est. 1904</footer>
</body></html>`;

async function auditHtml(driver: PlaywrightDriver, html: string, label: string): Promise<number> {
  const session = await driver.open({ html }, { viewport: resolveViewport('desktop'), settleMs: 250 });
  try {
    const raw = await session.evaluate(collectMeasurements);
    const report = analyze(raw, 'desktop');
    console.log(`\n${'='.repeat(72)}\n${label}\n${'='.repeat(72)}`);
    console.log(renderReport(report, { verbose: true }));
    return report.score;
  } finally {
    await session.close();
  }
}

async function main(): Promise<void> {
  let failures = 0;
  const check = (ok: boolean, message: string): void => {
    console.log(`${ok ? '  ok  ' : ' FAIL '} ${message}`);
    if (!ok) failures += 1;
  };

  console.log('--- colour engine ---');
  check(judgeSeed('#6366f1').isSlop, 'indigo-500 is flagged as slop');
  check(!judgeSeed('#9a3412').isSlop, 'burnt sienna is not flagged');

  const system = generateSystem({ seed: '#6366f1', intensity: 'balanced' });
  check(system.warnings.some((w) => w.includes('Seed rejected')), 'slop seed is rejected and substituted');
  check(system.checks.every((c) => c.passes), `all ${system.checks.length} semantic pairs pass WCAG AA`);
  check(system.tailwind.includes('@theme'), 'tailwind v4 block is emitted');

  const warm = generateSystem({ seed: 'oklch(0.55 0.17 42)', intensity: 'vivid' });
  check(warm.warnings.filter((w) => w.startsWith('!')).length === 0, 'clean seed passes without substitution');
  check(warm.checks.every((c) => c.passes), `warm system: all ${warm.checks.length} pairs pass`);

  console.log('\n--- icons ---');
  const hits = await searchIcons('arrow right', { limit: 5 });
  check(hits.length > 0, `icon search returned ${hits.length} hits (top: ${hits[0]?.set}:${hits[0]?.name})`);
  if (hits[0]) {
    const svg = await getIconSvg(hits[0].name, hits[0].set, { size: 20, strokeWidth: 1.5 });
    check(svg.startsWith('<svg') && svg.includes('width="20"'), 'icon svg renders at the requested size');
  }

  console.log('\n--- browser audits ---');
  const driver = new PlaywrightDriver();
  try {
    const slopScore = await auditHtml(driver, SLOP_PAGE, 'SLOP PAGE (should score low)');
    const cleanScore = await auditHtml(driver, CLEAN_PAGE, 'DESIGNED PAGE (should score high)');

    console.log('\n--- discrimination ---');
    check(slopScore < 55, `slop page scored ${slopScore} (< 55)`);
    check(cleanScore > 80, `designed page scored ${cleanScore} (> 80)`);
    check(cleanScore - slopScore > 30, `gap is ${cleanScore - slopScore} points (> 30)`);
  } finally {
    await driver.shutdown();
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
