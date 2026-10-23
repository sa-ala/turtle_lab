# F-020: Lesson card and editor toolbar clarity

| Field | Value |
| --- | --- |
| Status | Done |
| Priority | P2 |
| Size | M (PR A small, PR B medium) |
| Depends on | F-019 |
| Related gaps | — |
| Owner / agent | |

## Problem
After F-019 the middle column stacks the lesson card, the editor toolbar, the status banner and the Run Mode row with similar spacing and styling (maintainer review, 2026-10-24):

1. **Run and "I did it!" are two green primary pills about 30 px apart.** One runs code, the other records progress. Kids can press the wrong one.
2. **Everything has the same weight.** Hide lesson card, More about this lesson, Reset, Copy, Export and Load Example are identical white pills.
3. **Lesson and code zones blur together.** Four strips read as one list of controls.
4. **Noise:** the idle banner repeats what the Run Mode selector says, the Ctrl/⌘+Enter hint is styled like a lesson tag, and a disabled Stop looks faded red.

## Goals
- Exactly one green primary action in the middle column: Run.
- Completion looks like ticking off a task, and is suggested at the right moment.
- A clear "what to do" zone (card) and "where to code" zone (editor with its own header bar).

## Non-goals
- Automatic completion. Decision D3 stands: completion is learner-declared; the nudge only suggests it.
- Changing the Challenges tab, badges or progress storage.
- Phone-specific layout.

## User experience

### PR A — card clarity and quick fixes (done)
1. The card's completion button is "☐ Mark challenge done" (amber outline, not green). Once the lesson is complete it reads "✓ Done!", has `aria-pressed="true"`, and clicking it again does nothing.
2. After a **successful** run of a lesson that is not complete, the card shows "Nice run! Did you finish the challenge?" and highlights the button. The nudge clears when the lesson changes or is marked done. Failed runs never nudge.
3. "Hide lesson card" becomes a small chevron button (▾ / ▸) whose accessible name and tooltip are the existing Hide/Show strings. "More about this lesson" becomes a text link with an arrow (→, ← in RTL).
4. The status banner is hidden for the Normal-mode idle hint. It still shows the Step-mode hint, loading/failed states, running lines, success and errors.
5. A disabled Stop is neutral grey (including its icon), not faded red.

### PR B — editor header bar (done)
6. The toolbar becomes the editor's own header bar, visually attached to the code area and separated from the card.
7. Run and Stop form one group on the start side. Run Mode moves into a small selector attached to Run (Normal / Step-by-step); the separate Run Mode row is removed; Step speed appears only in Step mode.
8. Reset lesson code, Copy code, Export .py and Load Example become quiet secondary buttons (no shadow, smaller) on the end side.
9. The Ctrl/⌘+Enter hint moves out of the lesson tags into Run's tooltip and a small keycap next to Run.

New strings (en / ar):

| Key | en | ar |
| --- | --- | --- |
| `cardMark` | ☐ Mark challenge done | ☐ أكملت التحدي |
| `cardDone` | ✓ Done! | ✓ تم! |
| `cardNudge` | Nice run! Did you finish the challenge? | تشغيل رائع! هل أنجزت التحدي؟ |

High contrast: the completion button and nudge use yellow on black; link and chevron are white. RTL: the link arrow points left.

## Technical design (PR A)
- Markup: `lessonCardToggle` (class `lcToggle`), new `lessonCardNudge`, `lessonCardDone` (class `lcDone`), `lessonCardMore` (class `linkBtn`).
- `lessonCardUI()` renders the done state, chevron label and nudge. `cardNudge` is set after a successful run in `run()` and cleared in `loadLesson()` when the lesson changes.
- `setDebugInfo()` always unhides the banner; `idleInfo()` hides it for the Normal-mode hint.
- No storage change, no new dependencies.

## Acceptance criteria
1. On first load the only green button in the middle column is Run; the card button reads "☐ Mark challenge done" in a different style.
2. Marking done shows "✓ Done!" with `aria-pressed="true"`; a second click adds no star.
3. A successful run shows the nudge (both languages); switching lessons or marking done clears it; a failed run never shows it.
4. The banner is hidden when idle in Normal mode and visible in Step mode, during runs and on errors.
5. The chevron has the Hide/Show accessible name in both languages.
6. A disabled Stop has a neutral grey background.
7. PR B: Run Mode is part of the Run group, the separate Run Mode row is gone, and secondary actions are visually quieter; step-debugger, run-lifecycle and a11y tests stay green.
8. `check.mjs` OK and `npm test` passes.

## Test plan
- `tests/layout.spec.js`: AC1–AC5 (PR A, done).
- `tests/fixes.spec.js` GAP-27 updated for AC6.
- PR B: update step-debugger and run-lifecycle tests for the moved Run Mode selector; screenshots at 1440, 1280, 900 and 390 px, both languages, high contrast.

## Documentation updates
- [x] SPEC.md §3 control table (PR A)
- [x] SPEC.md §3 editor actions and execution controls (PR B)
- [x] docs/ROADMAP.md row

## PR B notes
Run Mode and Step speed keep their ids, so `setRun()`, `updateDebugControls()` and the step-debugger tests are unchanged. The Run Mode label is visually hidden (the select keeps it as its accessible name, plus a tooltip). A visible "Ctrl+Enter" keycap would be English-only text in Arabic, so the hint is a translated phrase (`runHint`) and the full `keyboard` string is Run's tooltip. The hint hides in Step mode, where Step speed needs the room. At 1280 px the run and file groups wrap to more rows; at 1440 px they fit in two.

## Open questions (resolved)
1. PR B: should Step speed live in the Run selector too, or stay a separate control that appears in Step mode? Resolved: separate, shown only in Step mode, inside the Run group.
