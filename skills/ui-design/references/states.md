# States, forms, and accessibility

This is where generated interfaces fail hardest, and it is invisible in a screenshot. A model trained on static markup has seen thousands of form structures and never once filled one out and hit an error.

## Every interactive element has six states

| State | Requirement |
|---|---|
| Rest | The default |
| Hover | Distinct, but never the only way to discover the affordance — it does not exist on touch |
| Active / pressed | Immediate, ≤100ms. This is what makes an interface feel responsive |
| `:focus-visible` | 2px ring minimum, ≥3:1 against the adjacent colour, with `outline-offset` |
| Disabled | Visually quiet, `aria-disabled`, and ideally a reason nearby. Still ≥3:1 so it can be read |
| Loading | Disabled, labelled, and preserving its own width so nothing jumps |

```css
.button:focus-visible {
  outline: 2px solid var(--app-focus-ring);
  outline-offset: 2px;
}
```

Use `:focus-visible`, not `:focus` — that gives keyboard users a ring without putting one on every mouse click. Never `outline: none` without a replacement.

## Every data surface has four states

Lists, tables, charts, search results, dashboards.

1. **Empty** — Design this first. It is what a new user actually sees. It needs: what this is, why it is empty, and the one action that fills it. "No results" is a failure.
2. **Loading** — Skeletons matching the real content's shape, not a spinner. Spinners for actions, skeletons for content. Reserve the final dimensions so nothing shifts.
3. **Error** — What broke, whether it is the user's fault, and what to do now. A retry that actually retries.
4. **Partial** — Some data loaded, some failed. Show what you have and mark what is missing. This is the state everyone forgets and users hit constantly.

Also worth designing: **too much** (pagination, virtualisation) and **exactly one** (a list of one often wants a different layout).

## Forms

The single largest quality gap between generated and designed interfaces.

### Structure

- Single column. Multi-column forms measurably increase errors and completion time.
- 400–560px wide.
- Group related fields with `<fieldset>` and `<legend>`.
- Order fields the way the user holds the information in their head, not the way the database stores it.

### Labels

```html
<label for="email">Work email <span aria-hidden="true">*</span></label>
<input id="email" type="email" required autocomplete="email"
       aria-describedby="email-hint email-error">
<p id="email-hint">We use this for your receipt.</p>
<p id="email-error" role="alert"></p>
```

- Always a real `<label for>`. A placeholder is not a label — it vanishes on input and is unreliably announced.
- Mark required fields visibly and programmatically. If nearly everything is required, mark the optional ones instead.
- Hint text goes above the field, not below, so it is read before the user types.

### Validation

- Declare constraints in HTML — `required`, `type`, `pattern`, `min`, `max`, `minlength`, `maxlength`, `step`. The browser then enforces them for free and assistive tech announces them.
- Validate on blur for format, on submit for everything. Never validate on every keystroke while the field is incomplete — it tells the user they are wrong before they have finished being right.
- Error messages: say what is wrong and how to fix it. "Invalid input" is not a message. "Enter a date after today" is.
- Put the error next to the field **and** summarise at the top of the form with links to each failing field.
- `aria-invalid="true"` on the field, `role="alert"` on the message.

### Autofill and input types

`autocomplete` on every field that has a standard value (`email`, `name`, `tel`, `street-address`, `cc-number`, `one-time-code`). Correct `type` so mobile keyboards match — `type="email"`, `inputmode="numeric"`, `type="tel"`.

### Destructive actions

Confirm, or make undoable. Undo is better than confirm almost every time: it does not interrupt the 99% of cases that were intentional. If you must confirm, the button says what will happen ("Delete 3 files"), not "OK".

## Accessibility floor

Not a phase at the end. These are correctness requirements.

**Structure**
One `h1`. No skipped levels. `main`, `nav`, `header`, `footer` landmarks. A skip link as the first focusable element.

**Keyboard**
Everything operable without a mouse. Focus order matches visual order. Focus is trapped inside modals and returned to the trigger on close. `Escape` closes. No keyboard traps.

**Contrast**
4.5:1 body, 3:1 large text and UI boundaries. Verified with `contrast_check`, not assumed.

**Targets**
≥24×24 CSS px (WCAG 2.2 SC 2.5.8). 44×44 for touch. Grow the hit area with padding, not the icon.

**Names**
Every control has an accessible name. Icon-only buttons need `aria-label`. Links say where they go — "Read the 2026 pricing changes", not "Click here".

**Images**
`alt` describing what the image conveys. `alt=""` if decorative — a missing attribute and an empty one mean different things. `width`/`height` or `aspect-ratio` so nothing shifts on load.

**Motion**
Guarded by `prefers-reduced-motion`. Nothing flashes more than 3 times per second.

**Colour**
Never the only carrier of meaning. Pair with an icon, a pattern, or a word.

**Announcements**
Live regions for anything that changes without a page load. `role="status"` for polite updates, `role="alert"` for errors.

## Reduced motion

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

Blunt but correct as a floor. Better: design the reduced variant deliberately — replace movement with a cross-fade rather than removing the transition entirely, so the change is still perceptible.

## Checklist

- [ ] Every interactive element has all six states, `:focus-visible` included
- [ ] Every data surface has empty, loading, error, and partial
- [ ] Empty states say what, why, and the next action
- [ ] Skeletons for content, spinners for actions
- [ ] Every field has a real label; placeholders are not labels
- [ ] Required fields marked visibly and programmatically
- [ ] HTML validation attributes present
- [ ] Errors are specific, inline, `role="alert"`, and summarised at the top
- [ ] `autocomplete` and correct `type` on every standard field
- [ ] Destructive actions are undoable or confirmed with a specific label
- [ ] Full keyboard operation, correct focus order, modal focus trap and return
- [ ] One `h1`, no level skips, landmarks present, skip link first
- [ ] Targets ≥24px, ≥44px on touch
- [ ] `prefers-reduced-motion` honoured
