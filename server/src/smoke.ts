/**
 * End-to-end smoke test. Run with `npm run build && npm run smoke`.
 *
 * Renders two real pages through a real browser and asserts the detector can
 * tell them apart. `selftest.ts` proves each rule fires against a fixture; this
 * proves the collector actually produces those signals from rendered CSS, which
 * fixtures cannot.
 *
 * Note on the clean page: it deliberately avoids cream-serif-terracotta,
 * near-black-with-acid-accent, and broadsheet-with-hairlines. Those are the
 * three looks generated design currently converges on, and two of them pass
 * every rule, so using one here would have made the test lie.
 */

import { analyze } from './audits/analyze.js';
import { collectMeasurements } from './audits/collect.js';
import { PlaywrightDriver } from './browser/playwright.js';
import { resolveViewport } from './browser/driver.js';
import { renderReport } from './format.js';

const SLOP_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>FlowSync</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Inter, sans-serif; margin: 0; background: #ffffff; color: #4b5563; }
  .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;
          padding: 96px 24px; text-align: center; position: relative; }
  .eyebrow { font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 12px; }
  .hero h2 { font-size: 52px; font-weight: 600; margin: 0 0 16px; letter-spacing: -0.06em; }
  .hero p { font-size: 18px; max-width: none; margin: 0 auto 32px; line-height: 1.3; }
  .grad-text { background: linear-gradient(90deg, #6366f1, #a855f7); -webkit-background-clip: text;
               background-clip: text; -webkit-text-fill-color: transparent; font-size: 40px; font-weight: 700; }
  .cta { background: #6366f1; color: #fff; border: none; border-radius: 8px;
         padding: 14px 28px; font-size: 16px; outline: none; }
  .glass { backdrop-filter: blur(16px); background: rgba(255,255,255,0.18); border-radius: 44px;
           padding: 27px; margin: 24px auto; max-width: 420px; }
  .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
              padding: 64px 24px; max-width: 1100px; margin: 0 auto;
              background-image: linear-gradient(#eef 1px, transparent 1px); background-size: 32px 32px; }
  .card { background: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 27px; text-align: center; border-left: 4px solid #6366f1; }
  .inner { background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 13px; }
  .deepest { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 11px; }
  .tile { width: 48px; height: 48px; border-radius: 8px; background: #eef2ff; margin: 0 auto 13px;
          display: flex; align-items: center; justify-content: center; }
  .card h3 { font-size: 20px; font-weight: 600; margin: 13px 0 8px; }
  .card p { font-size: 15px; line-height: 1.25; color: #9ca3af; }
  .num { font-size: 13px; color: #9ca3af; }
  input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 2px; outline: none; width: 100%; }
  .tiny { width: 18px; height: 18px; border-radius: 8px; background: #6366f1; border: none; outline: none; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #22c55e; animation: pulse 1.6s infinite; }
  .ticker { white-space: nowrap; animation: marquee 12s linear infinite; width: 600px; }
  .springy { transition: transform 300ms cubic-bezier(.68,-0.55,.27,1.55), width 300ms ease; }
  img:hover { transform: scale(1.06); }
  @keyframes pulse { 50% { opacity: 0.3; } }
  @keyframes marquee { to { transform: translateX(-50%); } }
</style></head><body>
<section class="hero">
  <p class="eyebrow">Introducing FlowSync</p>
  <h2>Everything your whole team needs to ship faster than ever before</h2>
  <p>The all-in-one platform that empowers modern teams to streamline their workflow and unlock their full potential across every stage of the product lifecycle.</p>
  <div class="grad-text">10M+ builders</div>
  <button class="cta springy">Get Started</button>
  <div class="glass">Not a feature. A platform. This isn't just about speed — it's about certainty.</div>
</section>
<section class="features">
  <div class="card"><div class="tile"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#818cf8"/></svg></div><span class="num">01</span><h3>Fast</h3><p>World-class performance that scales — seamlessly — with your enterprise-grade team.</p><div class="inner"><div class="deepest">Nested detail</div></div></div>
  <div class="card"><div class="tile"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#818cf8"/></svg></div><span class="num">02</span><h3>Secure</h3><p>Enterprise-grade security built in — from the very first line — of code.</p></div>
  <div class="card"><div class="tile"><svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#818cf8"/></svg></div><span class="num">03</span><h3>Simple</h3><p>An intuitive interface — that empowers — your whole team to move faster.</p></div>
</section>
<section style="padding:48px 24px;text-align:center">
  <div class="dot"></div>
  <div class="ticker">NORTHWIND HALCYON MERIDIAN FIELDNOTE NORTHWIND HALCYON MERIDIAN FIELDNOTE</div>
  <form><input type="email" placeholder="Email address"><button class="tiny"></button></form>
  <img src="">
  <svg width="240" height="240" viewBox="0 0 100 100"><circle cx="20" cy="20" r="10" fill="#c7d2fe"/><circle cx="50" cy="20" r="10" fill="#a5b4fc"/><rect x="10" y="40" width="30" height="20" fill="#818cf8"/><rect x="50" y="40" width="30" height="20" fill="#6366f1"/><ellipse cx="50" cy="80" rx="30" ry="10" fill="#e0e7ff"/><line x1="0" y1="95" x2="100" y2="95" stroke="#c7d2fe"/></svg>
</section>
</body></html>`;

const CLEAN_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Reconcile</title>
<style>
  :root {
    --bg: #f3f4f7; --surface: #ffffff; --sunken: #e8eaef;
    --border: #cdd0da; --border-strong: #6f7484;
    --text: #1b1c22; --muted: #4e5162;
    --primary: #0d5c53; --primary-fg: #ffffff; --accent: #8a3d12;
    --s1: 4px; --s2: 8px; --s3: 16px; --s4: 24px; --s6: 48px; --s8: 80px;
    --r-sm: 3px; --r-md: 6px; --r-lg: 10px;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
         font-family: "Public Sans", system-ui, sans-serif; font-size: 17px; line-height: 1.62; }
  h1, h2, h3, .mono { font-family: "IBM Plex Mono", ui-monospace, monospace; }
  h1 { font-size: 54px; font-weight: 800; line-height: 1.06; letter-spacing: -0.02em; margin: 0 0 var(--s3); }
  h2 { font-size: 15px; font-weight: 500; letter-spacing: 0.02em; color: var(--muted); margin: 0 0 var(--s3); }
  h3 { font-size: 21px; font-weight: 700; margin: var(--s4) 0 var(--s2); }
  main { max-width: 1080px; margin: 0 auto; padding: var(--s8) var(--s4); }
  .lede { max-width: 62ch; font-size: 20px; color: var(--muted); margin: 0 0 var(--s6); }
  .row { display: grid; grid-template-columns: 1.7fr 1fr; gap: var(--s6); align-items: start; }
  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: var(--s4); }
  .well { background: var(--sunken); border-radius: var(--r-sm); padding: var(--s2) var(--s3); font-size: 15px; }
  button { font: inherit; font-family: "IBM Plex Mono", monospace; font-weight: 700; font-size: 15px;
           background: var(--primary); color: var(--primary-fg); border: 1px solid var(--primary);
           border-radius: var(--r-md); padding: 14px var(--s4); min-height: 44px; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  label { display: block; font-size: 14px; font-weight: 700; margin-bottom: var(--s1); }
  input { font: inherit; width: 100%; min-height: 44px; padding: var(--s2) var(--s3);
          border: 1px solid var(--border-strong); border-radius: var(--r-md);
          background: var(--surface); color: var(--text); }
  input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  p { max-width: 62ch; }
  table { border-collapse: collapse; width: 100%; font-size: 15px; }
  td, th { text-align: left; padding: var(--s2) var(--s3); border-bottom: 1px solid var(--border); }
  td.num { text-align: right; font-family: "IBM Plex Mono", monospace; font-variant-numeric: tabular-nums; }
  @media (prefers-reduced-motion: no-preference) { .panel { transition: border-color 160ms ease; } }
</style></head><body>
<header><nav aria-label="Primary" style="padding:16px 24px"><a href="#main" class="well">Skip to content</a></nav></header>
<main id="main">
  <h2>Reconcile</h2>
  <h1>Every entry, twice, in ink.</h1>
  <p class="lede">Double-entry bookkeeping for people who would rather read the ledger than a dashboard.</p>
  <div class="row">
    <section class="panel">
      <h3>March ledger</h3>
      <p>Each transaction lands in two places. The books balance or they do not, and you find out in the same second you type.</p>
      <table>
        <caption class="well">Unreconciled entries, 3 remaining</caption>
        <thead><tr><th scope="col">Date</th><th scope="col">Counterparty</th><th scope="col">Amount</th></tr></thead>
        <tbody>
          <tr><td>03 Mar</td><td>Ostergaard Timber</td><td class="num">1,204.00</td></tr>
          <tr><td>11 Mar</td><td>Bell &amp; Sons Haulage</td><td class="num">318.40</td></tr>
          <tr><td>27 Mar</td><td>Kettleby Mill</td><td class="num">-92.15</td></tr>
        </tbody>
      </table>
    </section>
    <form class="panel">
      <h3>Open an account</h3>
      <label for="email">Work email <span aria-hidden="true">*</span></label>
      <input id="email" type="email" required autocomplete="email" aria-describedby="email-error">
      <p id="email-error" role="alert" style="font-size:14px;color:#8a3d12;margin:8px 0 16px">&nbsp;</p>
      <button type="submit">Open the books</button>
    </form>
  </div>
</main>
<footer style="padding:24px;color:var(--muted);font-size:14px">Reconcile, in continuous use since 1904.</footer>
</body></html>`;

async function auditHtml(
  driver: PlaywrightDriver,
  html: string,
  label: string,
): Promise<ReturnType<typeof analyze>> {
  const session = await driver.open({ html }, { viewport: resolveViewport('desktop'), settleMs: 300 });
  try {
    const raw = await session.evaluate(collectMeasurements);
    raw.consoleErrors = session.consoleErrors().filter((e) => e.type === 'pageerror').length;
    const report = analyze(raw, 'desktop');
    console.log(`\n${'='.repeat(72)}\n${label}\n${'='.repeat(72)}`);
    console.log(renderReport(report, { verbose: true }));
    return report;
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

  const driver = new PlaywrightDriver();
  try {
    const slop = await auditHtml(driver, SLOP_PAGE, 'SLOP PAGE (should score low)');
    const clean = await auditHtml(driver, CLEAN_PAGE, 'DESIGNED PAGE (should score high)');

    console.log('\n--- discrimination ---');
    check(slop.slopScore < 20, `slop page slop-free score is ${slop.slopScore} (< 20)`);
    check(clean.slopScore >= 85, `designed page slop-free score is ${clean.slopScore} (>= 85)`);
    check(clean.score >= 80, `designed page quality score is ${clean.score} (>= 80)`);
    check(clean.score - slop.score > 40, `quality gap is ${clean.score - slop.score} points (> 40)`);

    console.log('\n--- the collector actually produced these from rendered CSS ---');
    const fired = new Set(slop.findings.map((f) => f.id));
    // Only signals that need real layout or parsed stylesheets; the fixture
    // suite already proves the rule logic, so this checks the collector.
    const mustDetect = [
      'visual.side-tab-border',
      'visual.glassmorphism',
      'visual.extreme-radius',
      'visual.decorative-grid',
      'color.gradient-text',
      'color.slop-gradient',
      'color.signature-hex',
      'type.overused-font',
      'type.icon-tile-above-heading',
      'type.eyebrow-label',
      'type.crushed-tracking',
      'layout.three-card-row',
      'layout.nested-cards',
      'layout.numbered-labels',
      'motion.pulsing-dot',
      'motion.marquee',
      'motion.bounce-easing',
      'motion.image-hover-transform',
      'motion.no-reduced-motion',
      'copy.marketing-buzzword',
      'copy.aphoristic-cadence',
      'imagery.shape-assembled',
      'imagery.broken-src',
      'state.unlabeled-fields',
      'state.small-targets',
      'a11y.no-h1',
    ];
    for (const id of mustDetect) check(fired.has(id), `collector produced ${id}`);

    console.log('\n--- and stayed quiet on the designed page ---');
    const cleanFired = new Set(clean.findings.map((f) => f.id));
    for (const id of mustDetect) {
      check(!cleanFired.has(id), `${id} silent on the designed page`);
    }
    check(
      !cleanFired.has('color.cream-default'),
      'designed page is not the cream/serif/terracotta default',
    );
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
