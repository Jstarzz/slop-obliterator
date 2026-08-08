---
name: critique
description: Use for a full design review of a rendered interface — when the user says "critique this", "review this design", "is this any good", "does this look AI-generated", "/critique", or asks for a pre-ship design pass. Runs the 89-rule deterministic detector across breakpoints, then the eleven judgements no detector can make, and returns one ranked list with a fix for each.
---

# Critique

A design review has two halves and they fail differently.

**What can be measured.** Contrast ratios, tap targets, letter spacing, whether a card has a thick coloured stripe down one side. A machine does this better than a person, exhaustively, in a second. That is `audit_design`.

**What has to be judged.** Whether the hero says anything, whether the layout could belong to another product, whether the illustration is embarrassing. No detector will ever answer these. That is you, and it is the part that decides whether the work is good.

Run both. Report one list.

## Procedure

### 1. Measure

```
audit_design(url|file|html, viewport: "desktop", design_md: "<path if one exists>", verbose: true)
audit_responsive(url|file|html, viewports: ["mobile","tablet","desktop"])
```

Pass `design_md` whenever the project has a design contract — it turns on the four drift rules, which catch the more insidious failure: a page that is fine in the abstract but does not belong to *this* product.

Two scores come back. **Quality** is whether it is well built. **Slop-free** is whether it reads as designed rather than defaulted. They move independently, and a page can score 95 on one and 30 on the other. Report both, because they mean different things to the person reading.

If a rule is wrong for this project, note it and pass `ignore_rules: ["<id>"]` on the next run rather than arguing with it every time. `list_rules` shows all 89 with their ids.

### 2. Judge

Answer each of these against what you can actually see. Take a screenshot if you need one — `capture(scale: 0.5)` keeps it cheap.

1. **With the logo and copy removed, could this be any other product?** If yes, the design does none of the work of recognition.
2. **Is the hero a thesis, or the template answer?** Big number, small label, three supporting stats, gradient accent. Used everywhere, trusted nowhere.
3. **Does every blur, glow, and glass surface solve a real layering problem?** Backdrop blur earns its place when something genuinely floats over scrolling content. Otherwise it is a costume.
4. **Would you ship these illustrations to a paying customer?** Hand-coded SVG scenes read as amateur doodles. No illustration beats a sketchy one.
5. **What is the single most important element, and is it obviously the most important?** If two things compete, neither wins.
6. **What does the empty state look like at 9am on day one?** Not the happy path with perfect fake data.
7. **Does anything exist because a layout slot needed filling?** The third feature card, the icon that illustrates nothing, the stat that is not a real stat.
8. **Could the headline run unchanged on a competitor's site?** Grammatically perfect copy that says nothing specific is the verbal half of the same problem.
9. **Can you name the aesthetic direction in one sentence, and would someone disagree with it?** An adjective is not a direction. A referent is.
10. **What did the designer decide not to do?** A design with no rejected options was not designed.
11. **Shrink it to 25%. Is there still a shape?** An undifferentiated grey stripe means no hierarchy, whatever the individual measurements say.

Passing the detector and failing these is the common case. It is also the more serious failure — a page can be flawlessly built and completely anonymous.

### 3. Watch for the new defaults

The tells move. Anthropic's own design guidance names the three looks generated design currently converges on, and **two of them will pass every rule in the detector**:

- Warm cream ground (near `#F4F1EA`), high-contrast serif display, terracotta accent
- Near-black ground with one bright acid-green or vermilion accent
- Broadsheet layout: hairline rules, zero radius, dense newspaper columns

All three are legitimate for some briefs. None of them is a *choice* when it appears regardless of subject. If the page is one of these and the brief did not ask for it, say so — the detector only catches the cream one.

### 4. Report

One ranked list, blockers first, in this shape:

```
Quality 72/100 · Slop-free 41/100
2 blockers, 9 major, 14 minor across 89 rules

BLOCKERS
  [color.contrast] 4 pairs below AA — .card p is 2.5:1, needs 4.5:1
    -> Darken to #4a4a52; contrast_check has the nearest passing shade

READS AS GENERATED
  [visual.side-tab-border] 6 cards with a 4px indigo stripe on the left edge
    -> Remove it. This is the single most recognisable tell there is.
  [judgement] The hero is the template: big number, three stats, gradient accent
    -> The subject is payroll reconciliation. Open with a reconciled ledger, not a metric.

QUALITY
  ...

NOT FLAGGED BUT WORTH SAYING
  The page is cream + serif + terracotta, which is the 2026 default. It reads as
  tasteful because it is the average of tasteful. Was warmth actually the brief?
```

Rules for the report:

- **Lead with the measurement, then the judgement.** The measured findings are not arguable; spending credibility on them first makes the judgements land.
- **Every item names the thing and the fix.** No "consider improving hierarchy".
- **Say what is working.** A review that is only negative gets discounted wholesale.
- **Separate "wrong" from "not a choice".** A contrast failure is a defect. A cream background is a decision that may not have been made. They deserve different language.

### 5. Offer the fix, do not perform it

End by asking whether to fix, and in what order. A critique that silently rewrites the page removes the person's chance to disagree with it — which, on the judgement half, they often should.

## When the target is a mockup or a comp

Same process, lower stakes on the quality half. A mockup with no error states is fine; a mockup with no point of view is not. Weight the judgement questions accordingly.

## Related

- `ui-design` — building or rebuilding, including how to pick a direction
- `references/slop-tells.md` inside `ui-design` — the full catalogue with detection notes
- `list_rules` — every deterministic rule with its id
