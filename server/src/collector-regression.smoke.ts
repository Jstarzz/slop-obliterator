import { analyze } from './audits/analyze.js';
import { collectMeasurements } from './audits/collect.js';
import { resolveViewport } from './browser/driver.js';
import { PlaywrightDriver } from './browser/playwright.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const driver = new PlaywrightDriver();

async function measure(html: string) {
  const session = await driver.open(
    { html },
    {
      viewport: resolveViewport('desktop'),
      colorScheme: 'light',
      reducedMotion: false,
      settleMs: 0,
    },
  );
  try {
    return await session.evaluate(collectMeasurements);
  } finally {
    await session.close();
  }
}

try {
  const defaults = await measure(`<!doctype html><html><body style="margin:0">
    <button style="background:#0d5c53;color:#fff;padding:12px 18px;border:0">Save changes</button>
    <p style="background:#ffe76a;color:#000;padding:12px">Black on pale yellow</p>
  </body></html>`);

  assert(
    defaults.motion.transitionAllCount === 0,
    `CSS's computed transition-property default must not count as a real transition: ${defaults.motion.transitionAllCount}`,
  );
  assert(
    defaults.signals.greyOnColored.count === 0,
    `white/black text on coloured surfaces must not be classified as mid-grey: ${defaults.signals.greyOnColored.count}`,
  );

  const actualTransition = await measure(`<!doctype html><html><body>
    <button style="transition: all 150ms ease">Real broad transition</button>
  </body></html>`);
  assert(
    actualTransition.motion.transitionAllCount === 1,
    `a real non-zero transition: all should still be detected: ${actualTransition.motion.transitionAllCount}`,
  );

  const actualGrey = await measure(`<!doctype html><html><body>
    <p style="background:#0d5c53;color:rgb(128,128,128);padding:16px">Muted grey over brand colour</p>
  </body></html>`);
  assert(
    actualGrey.signals.greyOnColored.count === 1,
    `mid-grey text on a coloured surface should still be detected: ${actualGrey.signals.greyOnColored.count}`,
  );

  const templatePage = await measure(`<!doctype html><html><head><style>
    body { margin: 0; font-family: Georgia, serif; color: #17201d; }
    .hero { text-align: center; padding: 72px 24px; }
    .badge { display: inline-block; font-size: 13px; line-height: 20px; padding: 4px 10px; border: 1px solid #8ba49c; border-radius: 999px; }
    h1 { margin: 14px 0 24px; font-size: 56px; line-height: 1.05; }
    .actions { display: flex; justify-content: center; gap: 12px; }
    .actions a { display: inline-flex; align-items: center; justify-content: center; min-width: 112px; height: 44px; padding: 0 16px; border: 1px solid #315c50; text-decoration: none; color: #17352d; }
    .proof { margin-top: 28px; }
  </style></head><body>
    <main><section class="hero">
      <span class="badge">New release</span>
      <h1>Ship products with clarity</h1>
      <div class="actions"><a href="#start">Start now</a><a href="#demo">See demo</a></div>
      <p class="proof">Trusted by 5,000+ teams worldwide.</p>
    </section></main>
  </body></html>`);
  const templateReport = analyze(templatePage, 'desktop');
  const templateIds = new Set(templateReport.findings.map((finding) => finding.id));
  assert(templateIds.has('type.hero-pill-badge'), 'pill badge above a large hero heading should get its own finding');
  assert(templateIds.has('layout.paired-hero-ctas'), 'centered hero with exactly two peer CTAs should get its own finding');
  assert(templateIds.has('copy.canned-social-proof'), 'generic quantified social proof should be detected');
  assert(!templateIds.has('type.eyebrow-label'), 'pill-only hero signal must not be double-scored as an eyebrow label');
  assert(!templateIds.has('type.oversized-hero-headline'), 'paired-CTA-only hero signal must not be double-scored as an oversized headline');

  const suppressed = analyze(templatePage, 'desktop', {
    disabled: new Set(['type.hero-pill-badge', 'layout.paired-hero-ctas', 'copy.canned-social-proof']),
  });
  const suppressedIds = new Set(suppressed.findings.map((finding) => finding.id));
  assert(!suppressedIds.has('type.hero-pill-badge'), 'hero pill signature should respect ignore_rules');
  assert(!suppressedIds.has('layout.paired-hero-ctas'), 'paired CTA signature should respect ignore_rules');
  assert(!suppressedIds.has('copy.canned-social-proof'), 'social proof signature should respect ignore_rules');
  assert(!suppressedIds.has('type.eyebrow-label'), 'disabling hero pill must not reveal the legacy eyebrow alias');
  assert(!suppressedIds.has('type.oversized-hero-headline'), 'disabling paired CTA must not reveal the legacy oversized-headline alias');

  const nearMissPage = await measure(`<!doctype html><html><head><style>
    body { margin: 0; font-family: Georgia, serif; }
    .hero { text-align: center; padding: 72px 24px; }
    .prelude { font-size: 15px; }
    h1 { margin: 14px 0 24px; font-size: 56px; }
    .actions { display: flex; justify-content: center; gap: 12px; }
    .actions a { display: inline-flex; align-items: center; justify-content: center; width: 104px; height: 44px; border: 1px solid #555; }
  </style></head><body>
    <main><section class="hero">
      <p class="prelude">Release notes</p>
      <h1>A deliberate product page</h1>
      <div class="actions"><a href="#one">One</a><a href="#two">Two</a><a href="#three">Three</a></div>
      <p>Trusted by teams around the world.</p>
    </section></main>
  </body></html>`);
  const nearMissIds = new Set(analyze(nearMissPage, 'desktop').findings.map((finding) => finding.id));
  assert(!nearMissIds.has('type.hero-pill-badge'), 'plain pre-heading text must not count as a pill badge');
  assert(!nearMissIds.has('layout.paired-hero-ctas'), 'three hero actions must not match the exact paired-CTA signature');
  assert(!nearMissIds.has('copy.canned-social-proof'), 'unquantified customer language must not match quantified social proof');

  console.log('collector regression smoke passed');
} finally {
  await driver.shutdown();
}
