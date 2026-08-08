# The eleven questions

Run this against your own work before handing it over. Answer honestly — the useful answer is usually "no" to at least one.

The auditor catches the measurable problems. This catches the ones that need judgement.

---

**1. Can I name the aesthetic direction in one sentence, and would someone be able to disagree with it?**

"Clean and modern" is the average wearing a disguise. "1970s ski lodge" is a position. If the answer is an adjective rather than a referent, no decision was made.

**2. If I removed the logo and the copy, could this be any other product?**

If yes, the design is doing none of the work of recognition. Something structural — the type, the ground colour, the grid, the rhythm — has to be specific to this thing.

**3. What is the single most important element on this screen, and is it obviously the most important?**

Point at it. If two things compete, neither wins. If nothing dominates, the layout is a list.

**4. Where did the palette come from?**

If the honest answer is "it seemed reasonable," it came from the training distribution. A palette should trace back to something real — a material, a place, a photograph.

**5. What does the empty state look like?**

Not the populated happy path with perfect fake data. What a new user sees at 9am on day one. If you have not designed it, half the product is undesigned.

**6. What happens when this fails?**

Network drops, validation fails, the API returns 500, the list has 10,000 rows, the name is 200 characters, the image never loads. Pick three and check.

**7. Can I operate every part of this with only a keyboard, and can I see where I am at all times?**

Tab through it. If focus disappears, or the order jumps around, it is broken for a real set of users.

**8. Does anything here exist because a layout slot needed filling?**

The third feature card. The icon that illustrates nothing. The stat that is not a real stat. Delete it. Content should determine layout, not the reverse.

**9. Squint at it, or shrink it to 25%. Is there still a shape?**

You should see a composition — dense here, sparse there, a clear focal point. An undifferentiated grey stripe means no hierarchy and no rhythm.

**10. What did I choose *not* to do?**

A design with no rejected options was not designed. If you cannot name a defensible alternative you turned down, you took the first thing that came out.

**11. Would I show this to someone whose taste I am afraid of?**

The honest gut check. If the answer is "I would want to explain it first," the design is not carrying itself.

---

## When the answer is no

Do not patch. Ask which of the four decisions was missing — direction, density, dominant element, or ground — and redo from there. Patching the median produces a slightly better median.

## After the questions

Run the mechanical pass too:

```
audit_design(file: "...", viewport: "desktop")
audit_responsive(file: "...", viewports: ["mobile","tablet","desktop"])
```

Fix every `BLOCK`. Fix every `MAJOR`, or state in the handover why you are not.
