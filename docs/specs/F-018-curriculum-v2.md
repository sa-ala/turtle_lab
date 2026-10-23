# F-018: Curriculum v2 — ordering fixes and a "Beyond the basics" track

| Field | Value |
| --- | --- |
| Status | Approved (maintainer, 2026-10-23) |
| Priority | P2 |
| Size | L epic (split into the three PRs below) |
| Depends on | F-002, F-017 |
| Related gaps | — |
| Owner / agent | |

## Problem
A review of the 38-lesson catalog (SPEC.md §5.2) found:

1. **Debugging comes late.** Missing-colon and indentation errors first happen in Level 4 (lessons 12–15) but are taught in lessons 26–27 (Level 7).
2. **Prerequisites are skipped.** `%` and `len()` first appear in lesson 32 and get one sentence. `speed()` first appears in lesson 29 and `circle()` in lesson 35 with no introduction. Lesson 15 uses parameter-like variables before functions exist (lesson 28).
3. **Overlap and thin lessons.** Lesson 6's exercise asks for the color and pen variables that lesson 7 teaches. Lessons 8 and 9 are very small.
4. **Boilerplate teacher notes carry wrong numbers.** For example lesson 29's `teacherNote` says "Lesson 19 focuses on …" and lesson 32's says "Lesson 21", so the numbers do not match the lesson. This looks like a content bug rather than a design choice.
5. **Missing topics for ages 14–18.** No `input()`/type conversion, `random`, `return`, nested loops, `for item in list`, `range(start, stop, step)`, `write`/`bgcolor`/`stamp`/`hideturtle`, f-strings, or recursion.

## Goals
- Move the two debug lessons so they directly follow the first loop lessons.
- Introduce `speed()`, `circle()`, `%` and `len()` before first use.
- Fix teacher-note lesson numbers (derive from content, not hard-code).
- Add an optional Level 11+ track covering the missing topics, ending in a capstone.
- Keep every existing lesson id, saved progress and badge working.

## Non-goals
- No changes to Skulpt, UI, storage keys or `V2_LESSON_IDS`.
- No auto-grading or challenge checks (F-011 is postponed).
- No renumbering of ids: display numbers follow position, ids stay `l<N>-<slug>`.

## Proposed changes

### PR 1 — Reorder and fix (content only)
| Change | Detail |
| --- | --- |
| Move `l26-debug-the-turtle-missing-colon` and `l27-debug-the-turtle-indentation` | Directly after `l13-triangle-with-a-loop` (Level 4). Level headings are per-lesson strings, so move the lessons into Level 4 and rename Level 7 to e.g. "While Loops and Safe Stopping". |
| Fold `speed()` into an early lesson | Add a line and a tryThis to lesson 12 or 13; add a `circle()` introduction to an early lesson (e.g. lesson 10, Fill a Shape) rather than first use in 35. |
| Strengthen lesson 32 text | Explain `len()` and `%` (remainder) with a small `print` example in `steps`. |
| De-duplicate lessons 6 and 7 | Lesson 6 exercise stays on `size`; color/pen variables live only in lesson 7. |
| Teacher notes | Replace the boilerplate with a real note per lesson (en + ar), and correct the numbers. |

Constraints: AGENTS.md rules 7 and 8 (ids permanent; lessons 26/27 stay broken), `LESSON_AR` reordered in step, and tests that select by position (`tests/app.spec.js` lessons 12, 26, 27) updated. Check `badges()` rules (they reference ids, so they should be unaffected).

### PR 2 — "Beyond the basics" lessons
Appended after the Final Project as new levels (ids continue at `l39-…`; do not reuse any number).

| # | Title (working) | Concept | Skulpt check |
| --- | --- | --- | --- |
| 39 | Ask the Player | `input()`, `int()`, `str()` | Does `input()` work in the output panel? |
| 40 | Random Colors | `import random`, `random.choice`, `random.randint` | |
| 41 | A Grid of Shapes | nested loops | |
| 42 | Loop Through a List | `for color in colors` | |
| 43 | Counting by Steps | `range(start, stop, step)` | |
| 44 | Functions That Give Back | `return`, default arguments | |
| 45 | Words on the Canvas | `write`, `bgcolor`, `hideturtle`, `stamp` | |
| 46 | f-strings and `+=` | formatted output, running totals | |
| 47 | Recursion: Fractal Tree | recursion | stack depth in Skulpt |
| 48 | Capstone: Interactive Art | combines input/random/functions | |

Each lesson needs all 13 fields (SPEC §5.1), an index-aligned `LESSON_AR` entry, real teacher notes, and new level names in `LEVEL_AR`.

### PR 3 — Docs, badges and tests
- SPEC.md §5.2 catalog and counts (38 → N) everywhere; §6 if badges change.
- Optional badge for the new track (decide in Open questions).
- Update `tests/app.spec.js` content counts and position-based tests; every new starter must run in Normal and Step mode.

## Acceptance criteria
1. Lessons 26/27 (by id) appear in Level 4, still fail on the right line, and the corrected code runs.
2. For each of `speed`, `circle`, `len`, `%`: the first lesson that uses it also teaches it.
3. No two lessons teach the same concept as their main point.
4. Every `teacherNote` mentions its own lesson, not a wrong number, in both languages.
5. A browser profile with progress saved before this change keeps the same completed lessons, stars and badges after it.
6. All new lessons have en and ar content; Arabic UI is RTL with LTR code.
7. `node tools/check.mjs` prints OK and `npm test` passes.

## Test plan
- `node tools/content.mjs check` after every edit; `inject` only when valid.
- Playwright: update counts and position-based tests; add a progress-migration test that seeds old completed ids and checks stars after reordering.
- Manual (AGENTS.md §3): Arabic RTL, high contrast and < 860 px for the new level headings.

## Documentation updates
- [ ] SPEC.md §5.1–5.2, §6, §14 counts and baseline
- [ ] README / landing lesson count claims (both languages)
- [ ] docs/ROADMAP.md status

## Decisions
Delegated by the maintainer (2026-10-23) and decided with these defaults:
1. **No gating.** The new track is always visible; there is no lock mechanism to build or test, and curious learners are not blocked.
2. **No new badge** in this epic (scope). A badge can be a later small spec.
3. **Prototype first.** Before lessons 39 and 47 are written, check in the real Skulpt build that `input()` and recursion depth work. Drop or reshape a lesson if not.
4. **Level names change with the lessons.** Renaming Level 7 means updating `LEVEL_AR` in the same change.
