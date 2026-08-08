---
name: write-human
description: Use when writing or editing any prose a person will read — documentation, README files, blog posts, emails, marketing copy, release notes, commit messages, UI microcopy, reports. Also triggers on "this sounds like AI", "make it less generic", "de-slop this", or "/deslop" applied to text. Strips the measurable tells of generated writing and forces substance in their place.
---

# Writing that doesn't read as generated

## The actual problem

Generated prose is fluent, grammatically spotless, confident, and empty. That is not a stylistic accident — it is the mechanism. A model predicts the most probable next token, and averaged across everything ever published, the most probable next token is the blandest one. The result reads like the statistical centre of all text: smooth, featureless, nobody's.

Which means **the punctuation tells are a symptom, not the disease.** You can strip every em dash, every "delve," and every rule-of-three from a hollow paragraph and it stays hollow. Fix substance first.

## The one test

> Read a paragraph. Name one concrete thing you now know — a number, a name, a date, a cause, a trade-off, a consequence.

If you cannot, the paragraph is filler regardless of how well written it is.

**Filler:** "Nutrition plays a crucial role in overall wellness. By making mindful choices and understanding your body's needs, you can unlock a healthier lifestyle."

**Not filler:** "Swapping the 6pm soda for water cuts roughly 40,000 calories a year — about 11 pounds. That did more for my blood sugar than any app I tried."

The second one cannot be deleted without losing something. That is the whole standard.

## Measurable tells, with thresholds

These come from published corpus analysis. Each has a number you can check. No single one convicts — **convergence is the fingerprint.** Three or four in the same short passage is the signal.

### Substance

**Uncited authority.** "Studies have shown." "Experts agree." "Research suggests." Count authority claims carrying no name, number, link, or date. Above ~50% uncited is the tell. Either cite it or drop the claim.

**Pseudo-wisdom.** "The key is finding balance." "True growth comes from within." Apply the deletion test: remove the sentence; if the paragraph loses nothing, it was filler. More than a third of sentences surviving deletion means the piece is running on air.

### Vocabulary

**Style words.** A cluster of words that were rare before late 2022 and then exploded. *Delve* runs at roughly 25× its pre-2023 frequency in academic abstracts; *showcasing* and *underscores* at about 9×.

> delve · tapestry · underscore · showcase · realm · landscape (figurative) · navigate (figurative) · foster · leverage (verb) · robust · seamless · pivotal · crucial · vital · comprehensive · meticulous · testament · beacon · myriad · plethora · nuanced · multifaceted · intricate · profound · unlock · elevate · empower · harness · embark · resonate · align (figurative)

Threshold: more than ~3 flagged words per 500, clustered. One is nothing.

**Corporate verb inflation.** *Utilize* for *use*, *facilitate* for *help*, *leverage* for *use*, *commence* for *start*, *endeavour* for *try*. More than once per 300 words is inflation.

### Cliché

**Empty openers.** "In today's fast-paced world." "In the digital age." "In an era where." "Picture this." One is a yellow flag; two in 500 words is a strong signal. A human editor deletes the first one on sight.

**"It's worth noting that."** "It's important to remember." Throat-clearing. Delete and start at the noun.

### Structure

**Negative parallelism.** "It's not just X — it's Y." "This isn't about A, it's about B." "No fluff, no filler, just results." Three or more of the same frame in one piece is a template, not a train of thought.

**Rule of three on autopilot.** "Efficient, scalable, and reliable." "Plan, execute, optimise." More than one polished triplet per 200 words. Break some into two items or four — real lists are rarely three.

**Em dash density.** Human published prose runs 3.7–10 dash constructions per 1,000 words; Twain hits 10.1. GPT-4.1 measures 10.62 against a matched human baseline of 3.23. **The threshold that matters is ~20 per 1,000 words** — roughly double the most dash-happy human novel. Below that, the em dash is a keystroke, not evidence. Do not strip dashes reflexively; strip them when they are doing a comma's job three times a paragraph.

**Transition stacking.** "Furthermore." "Moreover." "Additionally." "Ultimately." More than half of paragraphs opening with a formal connector is stacking. Vary how ideas join, or just let them sit next to each other.

**Section-header reflex.** Bolding a phrase and colon-ing it in front of every paragraph. Fine in reference docs. In prose it is scaffolding left up after the building is finished.

### Rhythm

**Burstiness.** Standard deviation of sentence length ÷ mean. Human prose runs 0.6–1.2. Generated prose clusters at 0.2–0.4. Compute it if you want; the shortcut is to read aloud and listen for a metronome.

Fix by varying deliberately. A long sentence that carries a full thought through several clauses, then one that lands. Like that. Technical documentation and legal text are legitimately uniform — judge against the genre.

**Vocabulary range.** Generated text keeps reaching for the same words. It sounds fluent but the actual range is thin. Noisy as a single signal; use it as support.

## How to fix it

Fix in this order. Reversing it produces polished emptiness.

1. **Substance.** Every paragraph earns its place with a fact, a number, a name, a consequence, or a genuine opinion. Delete the ones that cannot.
2. **Specificity.** Replace every category with an instance. Not "several major companies" — name two. Not "significantly faster" — 40% faster, measured how.
3. **Structure.** Break the templates. Vary sentence length. Cut the openers.
4. **Vocabulary.** Now strip the style words. Prefer the plain verb.
5. **Read aloud.** The passage where you run out of breath is too long. The passage where you get bored is filler you missed.

## Voice

Generated prose has no voice because averaging removes it. Voice comes from:

- **Willingness to be wrong.** "I think X, though the counterargument is decent" beats "there are compelling arguments on both sides."
- **Specific reference.** The particular book, tool, incident, number, person.
- **Asymmetric emphasis.** Real writers care disproportionately about one part and let others go.
- **Admitting limits.** "I have not tested this above 10k rows."
- **Sentences that could not be recombined.** If a paragraph could be swapped into a different article on a different topic, it says nothing.

## Formatting

Bullet lists are the default because they are safe. They are also how you avoid making an argument — a list of five items asserts no relationship between them. Prose forces you to say *because*, *therefore*, *but*.

Use lists for genuinely parallel items, steps, and reference material. Use prose for reasoning.

## Register

Match the form. A commit message is not a blog post.

| Form | Length | Voice |
|---|---|---|
| Commit message | One line under 72 chars, imperative | "Fix off-by-one in pagination" |
| README intro | 2–3 sentences | What it is, who it is for, why it exists |
| API docs | Terse, complete, example-first | Second person, present tense |
| Error message | One sentence | What happened, what to do now |
| UI microcopy | As few words as carry the meaning | Verb-first for actions |
| Release notes | One line per change, grouped | User-visible impact, not the diff |
| Blog post | As long as the argument needs | First person, has a position |

## Checklist

- [ ] Every paragraph survives the restatement test
- [ ] Authority claims are cited or cut
- [ ] No empty openers
- [ ] Negative parallelism used at most once
- [ ] Not every list is three items
- [ ] Style words under ~3 per 500
- [ ] Plain verbs over inflated ones
- [ ] Sentence lengths vary audibly when read aloud
- [ ] Under half of paragraphs open with a formal transition
- [ ] Em dashes doing real work, not standing in for commas
- [ ] Prose where there is an argument; lists where there are parallel items
- [ ] At least one sentence only this writer, about this subject, could have written
