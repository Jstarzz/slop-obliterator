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

  console.log('collector regression smoke passed');
} finally {
  await driver.shutdown();
}
