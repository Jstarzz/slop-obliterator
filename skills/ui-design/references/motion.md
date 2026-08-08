# Motion

## The principle

**One well-orchestrated moment beats a dozen scattered micro-interactions.**

A page where every element fades in independently reads as noise. A page with one staggered entrance and otherwise instant, crisp feedback reads as designed. Spend the motion budget in one place.

Motion should do one of three jobs. If it does none of them, delete it.

1. **Explain a relationship** — this panel came from that button; this row moved there.
2. **Confirm an action** — the press registered, the item was saved.
3. **Direct attention** — something changed and you need to notice.

Decoration is not on the list.

## Timing

| Interaction | Duration |
|---|---|
| Hover, focus, small colour change | 100–150ms |
| Button press feedback | ≤100ms — this is what "responsive" means |
| Dropdown, tooltip, small reveal | 150–200ms |
| Modal, drawer, page transition | 250–350ms |
| Large layout change | 350–500ms |
| Anything longer | Almost always wrong |

Larger distance needs more time. Exits are faster than entrances (roughly 0.8×) — the user has already decided.

## Easing

```css
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);      /* entering — most common */
--ease-in:     cubic-bezier(0.7, 0, 0.84, 0);      /* exiting */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);     /* moving between two on-screen states */
--ease-spring: linear(0, 0.4 12%, 0.9 26%, 1.06 40%, 0.99 62%, 1);  /* playful overshoot */
```

`linear` only for continuous motion — spinners, marquees, progress. `ease` (the CSS default) is weak; override it.

Physical properties — position, scale — read better with spring physics. Non-physical ones — opacity, colour — read better with duration-based easing.

## What to animate

Only `transform` and `opacity` run on the compositor. Everything else can trigger layout or paint on every frame.

```css
/* good */
transition: transform 200ms var(--ease-out), opacity 200ms var(--ease-out);

/* bad — animates layout, janky, and surprises you with reflows */
transition: all 200ms;
```

`transition: all` is a bug waiting to happen. Name the properties.

For layout changes, use the FLIP technique or the View Transitions API rather than animating `width`/`height`/`top`.

## Staggered entrance

The one high-impact moment, in CSS only:

```css
@media (prefers-reduced-motion: no-preference) {
  .stagger > * {
    opacity: 0;
    transform: translateY(12px);
    animation: rise 500ms var(--ease-out) forwards;
  }
  .stagger > *:nth-child(1) { animation-delay:  0ms; }
  .stagger > *:nth-child(2) { animation-delay: 60ms; }
  .stagger > *:nth-child(3) { animation-delay: 120ms; }
  .stagger > *:nth-child(4) { animation-delay: 180ms; }
}
@keyframes rise { to { opacity: 1; transform: none; } }
```

Keep the stagger interval at 50–80ms. Under 40ms it reads as simultaneous; over 100ms it reads as slow. Cap the total sequence at ~600ms.

## Scroll-driven, without JavaScript

```css
@media (prefers-reduced-motion: no-preference) {
  .reveal {
    animation: rise linear both;
    animation-timeline: view();
    animation-range: entry 10% cover 30%;
  }
}
```

Supported in current Chromium and Safari; degrades to no animation elsewhere, which is fine.

## Motion for React (`motion`, v13)

Formerly Framer Motion. Hybrid engine: native Web Animations API where possible, JS fallback for spring physics.

```tsx
import { motion, useReducedMotion } from 'motion/react';

export function Panel({ items }: { items: string[] }) {
  const reduce = useReducedMotion();

  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
      }}
    >
      {items.map((item) => (
        <motion.li
          key={item}
          variants={{
            hidden: { opacity: 0, y: reduce ? 0 : 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

Notes that matter:

- `useReducedMotion()` is the hook. Use it — do not rely on the CSS media query alone, since JS-driven animation ignores it.
- Spring config: `stiffness` 200–400 and `damping` 25–40 covers almost every UI case. Higher damping = less bounce.
- `layout` and `<AnimatePresence>` handle enter/exit and layout shifts that CSS cannot.
- `whileHover` / `whileTap` for gesture states.

## anime.js v4

Better than Motion for SVG path work, morphing, and complex independent timelines. v4 is a rewrite with named exports.

```js
import { animate, createTimeline, stagger } from 'animejs';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduce) {
  createTimeline({ defaults: { ease: 'out(3)', duration: 600 } })
    .add('.logo',  { opacity: [0, 1], scale: [0.94, 1] })
    .add('.nav a', { opacity: [0, 1], y: [-8, 0], delay: stagger(60) }, '-=300')
    .add('.hero h1', { opacity: [0, 1], y: [16, 0] }, '-=400');
}

// SVG line drawing — the thing anime.js is genuinely best at
animate('.path', {
  strokeDashoffset: [anime.setDashoffset, 0],
  ease: 'inOut(3)',
  duration: 1400,
});
```

## Choosing

| Need | Reach for |
|---|---|
| Hover, focus, press feedback | CSS transitions. Always |
| One-shot entrance | CSS `@keyframes` with `animation-delay` |
| Scroll reveal | CSS `animation-timeline: view()` |
| React enter/exit, layout shift, gestures | Motion |
| SVG path drawing, morphing, complex timelines | anime.js |
| Anything a `<video>` or Lottie would do better | Not JavaScript |

Do not add an animation library for what a CSS transition does.

## Always guard

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

For JS-driven motion, check `useReducedMotion()` or `matchMedia` — the CSS rule does not reach it.

Better than removing motion outright: design the reduced variant. A cross-fade instead of a slide keeps the change perceptible without the movement that causes nausea.

## Checklist

- [ ] Every animation explains, confirms, or directs — nothing decorative
- [ ] One orchestrated moment, not scattered effects
- [ ] Durations within the table above
- [ ] Only `transform` and `opacity` animated; no `transition: all`
- [ ] Named easing tokens, not bare `ease`
- [ ] Stagger interval 50–80ms, sequence under 600ms
- [ ] `prefers-reduced-motion` honoured in CSS **and** in JS
- [ ] Nothing loops forever unless it reports progress
- [ ] Nothing flashes more than 3×/second
