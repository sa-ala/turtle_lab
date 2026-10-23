# F-019: Lesson-first layout and control cleanup

| Field | Value |
| --- | --- |
| Status | In progress (PR A done) |
| Priority | P2 |
| Size | M (split into PR A and PR B below) |
| Depends on | GAP-27..31 fixes (merged first) |
| Related gaps | — |
| Owner / agent | |

## Problem
Based on a UI review of `app.html` at 1440, 1280, 900 and 390 px, in English, Arabic and high contrast:

1. **The lesson is not visible while coding.** Goal, Steps, Hint and Challenge live in the Learning Area *below* the drawing. At 1440×900 they need a scroll, and on a phone about three screens. Learners see code and an empty canvas, but not what to do. "I did it!" is in the Challenges tab, further away.
2. **Duplicate controls.** Run is both in the header and the editor toolbar. "Clear Drawing" (header) and "Clear" (canvas) do the same thing, as do "Reset Code" (header) and "Reset lesson code" (editor). At 1280 px the editor toolbar wraps, leaving "Export .py" alone on a second row.
3. **`print()` output is below the fold on desktop.** Lessons 4, 16 and 45 depend on it.
4. **The lesson list is long.** 47 lessons in 12 levels, all expanded, and a destructive "Reset progress" button sits directly under "Choose a lesson" (it also exists under Teacher & Parent).
5. **The turtle is a small pink circle**, so its heading is invisible, which matters in lessons 1–2.

## Goals
- The current lesson's goal, current task and "I did it!" are visible above the fold at ≥ 1180 px without scrolling.
- Each action has one button in one obvious place.
- New output is noticeable without scrolling.
- Long lesson lists are easy to scan.

## Non-goals
- Phone-specific tabbed layout (Lesson / Code / Drawing). That is a later spec.
- New editor features, themes or a new design system.
- Any change to storage shape for existing keys, lesson content or run semantics.

## User experience

### PR A — Lesson card and control cleanup
1. **Lesson card** at the top of the middle column, above the toolbar: lesson title (already there), the goal, the challenge text, and an "I did it!" button. A "More" link scrolls to and opens the Lesson tab in the Learning Area. The card is collapsible; its state is remembered.
2. **One button per action:**
   - The header keeps only the brand, language and high contrast.
   - Run and Stop live in the editor toolbar (Stop is next to Run, visible only during a run, or dimmed per GAP-27).
   - Clear stays on the canvas header only. Reset lesson code stays in the editor toolbar only.
   - Ctrl/Cmd+Enter is unchanged.
3. **Output notice:** when a run prints output and the run-results tabs are off screen, the Output tab gets a dot badge and a small "New output ↓" chip appears under the canvas. Clicking the chip scrolls to the output.

### PR B — Lesson list and turtle
4. **Collapsible levels** in the sidebar: each level heading is a button with `aria-expanded`, showing "3/6" completed. Only the current level is open by default; open/closed state is not persisted (derived from the current lesson).
5. **Remove "Reset progress" from the sidebar**; it remains under Teacher & Parent with its confirmation.
6. **Turtle shape:** the default turtle shape becomes `"classic"` arrow at a size visible on the default canvas, so heading is visible before the first run. (Implementation must check Skulpt 1.2.0 supports setting the default shape without changing learner programs.)

New strings (en / ar):

| Key | en | ar |
| --- | --- | --- |
| `lessonCardTitle` | This lesson | هذا الدرس |
| `lessonCardMore` | More about this lesson | المزيد عن هذا الدرس |
| `lessonCardHide` | Hide lesson card | إخفاء بطاقة الدرس |
| `lessonCardShow` | Show lesson card | إظهار بطاقة الدرس |
| `newOutput` | New output ↓ | مخرجات جديدة ↓ |
| `levelProgress` | (done, total) => `${done}/${total}` | (done, total) => `${done}/${total}` |

RTL: the card mirrors like other cards; code stays LTR. High contrast: card uses the existing `body.hc .card` treatment. Below 860 px the card sits above the editor in the single column.

## Technical design
- Markup: new `<section id="lessonCard">` inside the editor card; `lessonCardGoal`, `lessonCardChallenge`, `lessonCardDone`, `lessonCardMore`, `lessonCardToggle`. Remove `runTop`, `clearTop`, `resetTop` from the header; `stopTop` moves into the editor toolbar (keep the id so tests and `setRun()` keep working, or rename and update all references).
- `loadLesson()` fills the card; the existing `#done` handler (`complete(i)`) is reused by `lessonCardDone`.
- `setRun()` and `applyLang()` updated for removed/moved ids. `check.mjs` already fails on any `$("id")` without an element.
- Storage: new key `K.lessonCard = "tl.lessonCard.v1"` (`"open"`/`"closed"`), validated on read, default open. Add a malformed-value case to `tests/storage.spec.js`.
- Output notice: set a flag in the `output` function passed to `Sk.configure`; show the chip if `#out` is not in the viewport (`IntersectionObserver`); clear it on scroll or tab click.
- Levels: `buildLessons()` wraps each level's buttons in a group with a heading button; counts come from `progress`.
- No new dependencies, no network requests.

## Acceptance criteria
1. At 1440×900 and 1280×720, in both languages, the lesson goal, challenge and "I did it!" are visible without scrolling on first load.
2. Clicking the card's "I did it!" marks the lesson complete exactly like the Challenges tab button (same stars, badges, persistence).
3. Each of Run, Stop, Clear and Reset lesson code exists exactly once in the DOM; Ctrl/Cmd+Enter still runs.
4. After running lesson 4 at 1440×900, the Output tab shows a badge or the "New output" chip is visible; clicking the chip brings `#out` into view.
5. On first load only Level 1 is expanded; selecting lesson 30 expands Level 8; each heading shows done/total and has correct `aria-expanded`.
6. "Reset progress" is absent from the sidebar and still works from Teacher & Parent.
7. axe (a11y spec) reports no serious or critical issues in both languages; no English-only text in Arabic mode.
8. `check.mjs` OK, `npm test` passes; existing tests that click `#runTop`, `#clearTop` or `#resetTop` are updated.

## Test plan
- New `tests/layout.spec.js`: AC1 (bounding boxes within the viewport), AC2, AC3, AC4, AC5, AC6.
- `tests/storage.spec.js`: malformed `tl.lessonCard.v1`.
- Update `a11y.spec.js`, `localization.spec.js`, `run-lifecycle.spec.js` and others for moved ids.
- Manual: high contrast both languages, < 860 px, 1180 px breakpoint, print.

## Documentation updates
- [ ] SPEC.md §4 (layout and first load), §7 (controls), §11 (CSS), §12.1 symbol map, storage key table
- [ ] README screenshots/claims if they mention the header buttons
- [ ] docs/ROADMAP.md status

## Decisions (2026-10-23)
Taken with the recommended defaults: Stop is always visible next to Run and dimmed when idle; Load Example stays in the editor toolbar, in the file group; the lesson card shows goal and challenge only. Stop keeps its id `stopTop` so `setRun()` and the tests are unchanged. The toolbar is split into a run group and a file group so it wraps to two rows at most.

## Open questions (resolved above)
1. Should Stop always be visible (dimmed) or appear only during a run? Recommended: always visible next to Run, dimmed when idle, so the button does not jump.
2. Keep "Load Example" in the editor toolbar or move it to the Learning Area? Recommended: keep it, but as a compact select after Export.
3. Should the lesson card show the step list too? Recommended: no, keep it to goal + challenge so it stays short; "More" opens the full lesson.
