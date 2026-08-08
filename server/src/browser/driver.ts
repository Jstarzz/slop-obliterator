/**
 * The seam between "we need to look at a page" and "Playwright is how we do it".
 *
 * Nothing above this file imports Playwright. If Playwright is replaced by CDP,
 * agent-browser, or whatever ships next year, only the implementing module changes
 * and every audit keeps working.
 */

export interface Viewport {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
}

/** Named viewports covering the breakpoints that actually break. */
export const VIEWPORTS: Record<string, Viewport> = {
  mobile: { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
  'mobile-small': { name: 'mobile-small', width: 320, height: 568, deviceScaleFactor: 2, isMobile: true },
  tablet: { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2, isMobile: false },
  laptop: { name: 'laptop', width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false },
  desktop: { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
  wide: { name: 'wide', width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
};

export interface OpenTarget {
  /** http(s) URL, or a file path, or raw HTML — exactly one. */
  url?: string;
  file?: string;
  html?: string;
}

export interface OpenOptions {
  viewport: Viewport;
  colorScheme?: 'light' | 'dark';
  /** Extra settle time after load, in ms. Fonts and entry animations need it. */
  settleMs?: number;
  reducedMotion?: boolean;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  selector?: string;
}

export interface ConsoleEntry {
  type: string;
  text: string;
}

export interface Session {
  /** Run a function in the page. `fn` is serialised, so it may not close over anything. */
  evaluate<Result, Arg = undefined>(fn: (arg: Arg) => Result, arg?: Arg): Promise<Result>;
  screenshot(options?: ScreenshotOptions): Promise<Buffer>;
  consoleErrors(): ConsoleEntry[];
  /** The URL the page actually settled on, after redirects. */
  url(): string;
  close(): Promise<void>;
}

export interface BrowserDriver {
  readonly name: string;
  open(target: OpenTarget, options: OpenOptions): Promise<Session>;
  /** Release the underlying browser. Safe to call when nothing is open. */
  shutdown(): Promise<void>;
}

export function resolveViewport(input: string | Viewport | undefined): Viewport {
  if (!input) return VIEWPORTS.desktop!;
  if (typeof input !== 'string') return input;

  const known = VIEWPORTS[input];
  if (known) return known;

  const match = /^(\d{2,5})\s*[x×]\s*(\d{2,5})$/i.exec(input.trim());
  if (match) {
    return {
      name: input,
      width: Number(match[1]),
      height: Number(match[2]),
      deviceScaleFactor: 1,
      isMobile: Number(match[1]) < 640,
    };
  }

  throw new Error(
    `Unknown viewport "${input}". Use one of ${Object.keys(VIEWPORTS).join(', ')} or an explicit "1280x800".`,
  );
}

export class BrowserUnavailableError extends Error {
  constructor(cause: string) {
    super(
      `Could not start a browser: ${cause}\n\n` +
        `Fix: run \`npx playwright install chromium\` inside the slop-obliterator server directory. ` +
        `Alternatively, set SLOP_CDP_URL to an already-running Chrome started with --remote-debugging-port.`,
    );
    this.name = 'BrowserUnavailableError';
  }
}
