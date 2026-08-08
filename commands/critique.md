---
description: Full design review — 89 deterministic rules plus the eleven judgements no detector can make
argument-hint: [URL, file, or "the checkout page"]
---

Critique: $ARGUMENTS

Load the `critique` skill and follow it.

1. Run `audit_design` at desktop with `verbose: true`, and pass `design_md` if this project has a design contract. Then `audit_responsive` across mobile, tablet, and desktop.
2. Answer all eleven judgement questions against what you can actually see. Take one downscaled screenshot if you need it.
3. Check whether the page is one of the three current defaults — cream/serif/terracotta, near-black with an acid accent, or broadsheet-with-hairlines. Two of those pass every rule in the detector, so the detector will not tell you.
4. Report both scores, then one ranked list: blockers, then what reads as generated, then quality defects, then what you noticed that no rule covers.
5. Name what is working, not just what is broken.
6. Stop there and ask what I want fixed and in what order. Do not start rewriting.
