# Browser audit performance

The audit loop is optimized for repeated `look -> change -> look again` work, not one-off browser automation.

## What stays warm

The Chromium process is reused across audits and shut down after an idle period. Each audit still gets a fresh browser context so cookies, local storage, service workers, and other page state do not bleed between targets.

Do not trade that isolation away casually. A reused browser process gives most of the startup win without making one audited site influence the next.

## Readiness

The normal audit path now waits for:

1. navigation (`load` for local/raw HTML, `DOMContentLoaded` for HTTP URLs)
2. `document.fonts.ready` when available
3. the caller's explicit `settle_ms` window (350 ms by default in `audit_design`)

It does **not** wait for Playwright `networkidle` by default. Playwright discourages `networkidle` as a generic readiness signal, and polling/streaming pages can otherwise add seconds of tail latency to every audit.

If a specific application genuinely needs it, opt in:

```text
SLOP_NETWORK_IDLE_MS=1000
```

The value is clamped to 0-5000 ms. `0` disables the wait.

Prefer increasing a tool call's `settle_ms` for a known entry animation or delayed render over globally making every audited page wait for network quiet.

## Bounded console capture

A broken page can emit thousands of console warnings/errors. The report only uses the existence/count and a small sample, so retaining an unbounded list is wasted memory.

```text
SLOP_MAX_CONSOLE_ERRORS=100
```

The value is clamped to 1-1000 entries per browser session. Messages remain capped to 400 characters each.

## Browser lifecycle

```text
SLOP_BROWSER_IDLE_MS=180000
```

Controls how long the warm browser remains alive after the last session closes. The value is clamped to at most 24 hours; `0` disables idle shutdown.

## Performance rules for new browser features

- Keep the browser process warm; keep audited page state isolated.
- Prefer a deterministic readiness signal over waiting for all network activity to disappear.
- Bound user/page-controlled collections before returning them through MCP.
- Screenshots stay opt-in; verdicts and measurements are cheaper than pixels.
- Parallelism must be bounded. Several independent contexts can reduce wall time, but unbounded viewport/source fan-out just moves the bottleneck to memory and Chromium scheduling.
- Measure wall time and resource use before adding caches or clever pooling.
