---
description: Find and fix everything that reads as machine-generated — UI, prose, or code
argument-hint: [file, URL, or directory]
---

Target: $ARGUMENTS

Work out what kind of thing this is, then apply the matching skill. If it is more than one kind, do all of them.

**A rendered interface** (URL, `.html`, a running dev server) — load the `ui-design` skill.

1. Run `audit_design` at desktop, then `audit_responsive` across mobile/tablet/desktop.
2. Report the score and every finding before changing anything.
3. Fix every `BLOCK`. Fix every `MAJOR` or say why not.
4. Re-run until clean, then answer the eleven questions in `references/critique.md`.

**Prose** (`.md`, `.txt`, docs, copy) — load the `write-human` skill.

1. Run the restatement test on every paragraph first and report which ones fail.
2. Fix substance before style. Then specificity, structure, vocabulary — in that order.
3. Show me the diff, not a rewritten file, so I can see what changed.

**Code** (source files, a directory) — load the `code-clean` skill.

1. Start with what can be deleted. Report the count.
2. Then collapse single-use abstractions, strip comment noise, remove defensive padding, find swallowed errors and drifted duplication.
3. Check it against the conventions already in this repo.
4. Do not add features. This is subtraction.

In every case: report what you found before you change it, and tell me the things you decided not to touch.
