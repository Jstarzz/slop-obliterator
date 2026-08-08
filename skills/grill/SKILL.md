---
name: grill
description: Use before starting any non-trivial build — a UI, a feature, a document, a migration — to close the gap between what was asked for and what is actually wanted. Also triggers on "/grill", "grill me", "interrogate me", "what do you need to know", "ask me questions first", or when a request is clearly underspecified. Interrogates the brief until confidence is high enough to build without guessing, and lets the user hand decisions back at any point.
---

# Grill

## What this is for

Most bad output traces to a decision nobody made. The model fills the gap with the statistical average, the user sees something generic, and three rounds of "no, more like…" follow.

This skill closes the gap before the work starts. It is adversarial on purpose — not hostile, but genuinely unsatisfied until it either knows the answer or has explicit permission to decide.

## The confidence target

Keep a running estimate: **if I built this right now, how likely is the result to be what they wanted?**

- **Below 60%** — you are guessing. Keep asking.
- **60–90%** — the shape is right, the details will need rework. Keep asking.
- **Above 90%** — build. Stating your remaining assumptions is enough.

Report the number when it changes materially. "That takes me to about 85% — two things left." It tells the user how close they are to being done with questions, which is the main reason people resent being asked them.

## Rules

**One round at a time, three or four questions maximum.** A wall of fifteen questions gets abandoned. Ask the highest-leverage few, then re-aim based on the answers.

**Ask about the decision, not the implementation.** "Who is looking at this, and what do they do next?" produces a better answer than "should the button be primary or secondary?"

**Offer concrete options, not open fields.** People choose faster than they compose. Give 2–4 real alternatives with the trade-off attached, and mark your recommendation. Where an `AskUserQuestion`-style structured prompt is available, use it.

**Never ask what you can find out.** Read the codebase, the existing files, the design tokens, the repo conventions first. Asking someone something you could have looked up is the fastest way to lose their patience.

**Do not ask what does not change the work.** If both answers lead to the same build, pick one and move on. This is the discipline that keeps grilling from becoming a survey.

**Surface the disagreement.** If the request contains a contradiction — "minimal but feature-rich", "fast but comprehensive" — name it. That tension is usually the most important thing to resolve.

**Take the escape hatch seriously.** Any of "you decide", "use your judgement", "surprise me", "just build it", or visible impatience ends the questioning immediately. See below.

## The escape hatch

The user is allowed to hand decisions back. When they do:

1. **Stop asking.** No "just one more thing."
2. **State every assumption you are now making**, as a short list, before building. Not after.
3. **Make the interesting choice, not the safe one.** Delegated judgement is permission to have taste. The average is not a neutral default — it is the one outcome you were hired to avoid.
4. **Flag the reversible from the irreversible.** "I picked a warm palette — easy to change. I structured this around a single-page flow — that one is baked in."

Partial delegation is common and fine: "You pick the visual stuff, but it has to work on mobile." Take the freedom and honour the constraint.

## What to grill on

Adapt to the domain. Roughly in order of leverage:

### Always

- **Who is this for**, specifically, and what do they do immediately before and after?
- **What does success look like** — how will they know it worked?
- **What already exists** that this must fit inside — conventions, tokens, tooling, prior art?
- **What is genuinely fixed** versus assumed? Deadline, stack, platform, scope.
- **What would make this a failure** even if everything else went right?

### For a UI

- **Aesthetic direction** — a named referent, not an adjective. Offer three from `directions.md` if they have none.
- **Density** — spacious/editorial or dense/operational? Sets spacing, type size, radius.
- **Light or dark first?**
- **The one thing** — most important element on the screen.
- **Brand constraints** — existing palette, typeface, logo, tone?
- **Which states matter** — is the empty state the common case? Is offline real?
- **Real data shape** — how long is the longest name, how many rows at p99, what does zero look like?

### For a feature

- Where does the data come from and who owns it?
- What happens on failure — retry, queue, surface, drop?
- Who can do this, and who must not?
- What is the volume, now and in a year?
- What must not break?

### For writing

- Who reads it, and what do they do differently afterwards?
- What do they already know, and already believe?
- Length, format, where it will be published?
- Whose voice — theirs, the company's, or neutral?
- What must not be said?

## Recognising a non-answer

Some answers sound like answers and are not:

| They said | Ask instead |
|---|---|
| "Make it modern" | "Name a product whose look you'd be happy to be compared to." |
| "Clean and simple" | "What would you cut from the current version to get there?" |
| "Like Stripe" | "Which part — the typography, the density, the illustration style, or the copy voice?" |
| "For everyone" | "Who is the one person who has to succeed with this?" |
| "It should just work" | "What is the case where it currently doesn't?" |
| "Standard is fine" | "Standard for whom — your team's existing pattern, or the framework default?" |

## Closing the loop

When you hit the target, write a short brief before building:

```
Building: <one sentence>
For: <who> so they can <what>
Direction: <named aesthetic or approach>
Constraints: <the fixed things>
Assuming: <every assumption, listed>
Not doing: <explicit exclusions>
Confidence: <n>%
```

Six lines. It gives the user one last cheap chance to catch a misread, and it becomes the thing you check the finished work against.

## When not to grill

- The request is small and reversible. Just do it.
- The user has already given a detailed brief. Confirm the one genuine ambiguity and start.
- You already grilled this in the conversation. Do not re-open settled questions.
- They are clearly in a hurry. Take the escape hatch yourself: state your assumptions and build.

Grilling is a tool for saving time. The moment it costs more than it saves, stop.
