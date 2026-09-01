/**
 * Playwright implementation of BrowserDriver.
 *
 * The browser is launched once and kept warm behind an idle timer, because the
 * audit loop is "look, change, look again" and paying ~800ms of cold start on
 * every look makes agents stop looking.
 */

import { pathToFileURL } from 'node:url';
import { access } from 'node:fs/promises';
import {
  BrowserUnavailableError,
  type BrowserDriver,
  type ConsoleEntry,
  type OpenOptions,
  type OpenTarget,
  type ScreenshotOptions,
  type Session,
} from './driver.js';

type PlaywrightModule = typeof import('playwright');
type Browser = import('playwright').Browser;
type BrowserContext = import('playwright').BrowserContext;
type Page = import('playwright').Page;

const IDLE_SHUTDOWN_MS = envNumber('SLOP_BROWSER_IDLE_MS', 180_000, 0, 24 * 60 * 60 * 1000);
const NETWORK_IDLE_MS = envNumber('SLOP_NETWORK_IDLE_MS', 0, 0, 5_000);
const MAX_CONSOLE_ERRORS = envNumber('SLOP_MAX_CONSOLE_ERRORS', 100, 1, 1_000);

export class PlaywrightDriver implements BrowserDriver {
  readonly name = 'playwright';

  #playwright: PlaywrightModule | null = null;
  #browser: Browser | null = null;
  #launching: Promise<Browser> | null = null;
  #idleTimer: NodeJS.Timeout | null = null;
  #openSessions = 0;

  async open(target: OpenTarget, options: OpenOptions): Promise<Session> {
    const browser = await this.#getBrowser();

    const context: BrowserContext = await browser.newContext({
      viewport: { width: options.viewport.width, height: options.viewport.height },
      deviceScaleFactor: options.viewport.deviceScaleFactor ?? 1,
      isMobile: options.viewport.isMobile ?? false,
      hasTouch: options.viewport.isMobile ?? false,
      colorScheme: options.colorScheme ?? 'light',
      reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
    });

    const page = await context.newPage();
    const consoleErrors: ConsoleEntry[] = [];
    const recordConsoleError = (entry: ConsoleEntry) => {
      // The audit report only needs to know that errors happened and show a
      // small sample. A page spamming thousands of console errors should not
      // turn one MCP call into an unbounded memory sink.
      if (consoleErrors.length < MAX_CONSOLE_ERRORS) consoleErrors.push(entry);
    };

    page.on('console', (message) => {
      const type = message.type();
      if (type === 'error' || type === 'warning') {
        recordConsoleError({ type, text: message.text().slice(0, 400) });
      }
    });
    page.on('pageerror', (error) => {
      recordConsoleError({ type: 'pageerror', text: String(error?.message ?? error).slice(0, 400) });
    });

    this.#openSessions += 1;
    this.#cancelIdleTimer();

    try {
      await navigate(page, target);

      // Playwright explicitly discourages networkidle as a generic readiness
      // signal. It also creates a nasty tail on apps with polling/streaming.
      // The default audit path waits for DOM navigation, fonts, and the
      // caller-controlled settle window instead. Keep networkidle as an opt-in
      // compatibility knob for a page that genuinely needs it.
      if (NETWORK_IDLE_MS > 0) {
        await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => undefined);
      }

      await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
      if (options.settleMs && options.settleMs > 0) {
        await page.waitForTimeout(Math.min(options.settleMs, 10_000));
      }
    } catch (error) {
      this.#openSessions -= 1;
      await context.close().catch(() => undefined);
      this.#scheduleIdleShutdown();
      throw error;
    }

    return this.#makeSession(page, context, consoleErrors);
  }

  #makeSession(page: Page, context: BrowserContext, consoleErrors: ConsoleEntry[]): Session {
    let closed = false;
    const release = () => {
      if (closed) return;
      closed = true;
      this.#openSessions = Math.max(0, this.#openSessions - 1);
      this.#scheduleIdleShutdown();
    };

    return {
      evaluate: async <Result, Arg>(fn: (arg: Arg) => Result, arg?: Arg): Promise<Result> => {
        return page.evaluate(fn as (a: unknown) => Result, arg as unknown) as Promise<Result>;
      },
      screenshot: async (options: ScreenshotOptions = {}): Promise<Buffer> => {
        // Resolution is controlled by the context's deviceScaleFactor, set at
        // open() time. Scaling here with CSS zoom would reflow the page and
        // change what is captured, not just how many pixels it costs.
        if (options.selector) {
          const locator = page.locator(options.selector).first();
          const count = await locator.count();
          if (count === 0) throw new Error(`No element matched selector "${options.selector}".`);
          return await locator.screenshot({ type: 'png' });
        }
        return await page.screenshot({ type: 'png', fullPage: options.fullPage ?? false });
      },
      consoleErrors: () => [...consoleErrors],
      url: () => page.url(),
      close: async () => {
        await context.close().catch(() => undefined);
        release();
      },
    };
  }

  async shutdown(): Promise<void> {
    this.#cancelIdleTimer();
    const browser = this.#browser;
    this.#browser = null;
    this.#launching = null;
    if (browser) await browser.close().catch(() => undefined);
  }

  async #getBrowser(): Promise<Browser> {
    if (this.#browser?.isConnected()) return this.#browser;
    if (this.#launching) return this.#launching;

    this.#launching = this.#launch().finally(() => {
      this.#launching = null;
    });
    return this.#launching;
  }

  async #launch(): Promise<Browser> {
    if (!this.#playwright) {
      try {
        this.#playwright = await import('playwright');
      } catch (error) {
        throw new BrowserUnavailableError(`the "playwright" package failed to load (${describe(error)})`);
      }
    }

    const cdpUrl = process.env.SLOP_CDP_URL;
    try {
      const browser = cdpUrl
        ? await this.#playwright.chromium.connectOverCDP(cdpUrl)
        : await this.#playwright.chromium.launch({
            headless: process.env.SLOP_HEADFUL !== '1',
            args: ['--font-render-hinting=none', '--disable-lcd-text'],
          });
      this.#browser = browser;
      browser.on('disconnected', () => {
        if (this.#browser === browser) this.#browser = null;
      });
      return browser;
    } catch (error) {
      throw new BrowserUnavailableError(describe(error));
    }
  }

  #scheduleIdleShutdown(): void {
    this.#cancelIdleTimer();
    if (this.#openSessions > 0 || IDLE_SHUTDOWN_MS <= 0) return;
    this.#idleTimer = setTimeout(() => {
      void this.shutdown();
    }, IDLE_SHUTDOWN_MS);
    this.#idleTimer.unref?.();
  }

  #cancelIdleTimer(): void {
    if (this.#idleTimer) {
      clearTimeout(this.#idleTimer);
      this.#idleTimer = null;
    }
  }
}

async function navigate(page: Page, target: OpenTarget): Promise<void> {
  const provided = [target.url, target.file, target.html].filter(Boolean);
  if (provided.length !== 1) {
    throw new Error('Provide exactly one of: url, file, html.');
  }

  if (target.html !== undefined) {
    await page.setContent(target.html, { waitUntil: 'load', timeout: 20_000 });
    return;
  }

  if (target.file !== undefined) {
    await access(target.file).catch(() => {
      throw new Error(`File not found: ${target.file}`);
    });
    await page.goto(pathToFileURL(target.file).href, { waitUntil: 'load', timeout: 30_000 });
    return;
  }

  const url = target.url!;
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`Refusing to navigate to "${url}". Only http and https URLs are allowed; use "file" for local paths.`);
  }
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
}

function envNumber(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message.split('\n')[0] ?? error.message;
  return String(error);
}
