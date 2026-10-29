# Turtle Lab Roadmap and Feature Specs

Forward-looking specs for agents and contributors. `SPEC.md` describes what exists; this file describes what to build. Each item is sized to be one agent task (one PR) unless marked as an epic. Gap IDs (`GAP-xx`) refer to `SPEC.md §13`.

**Status:** all items are `Proposed` until the maintainer marks them `Approved`. `Postponed` items are deliberately on hold; agents must not start them until the maintainer resumes them. Agents should only implement `Approved` items, or items the maintainer assigns directly.

**Priority:** P0 foundation (do first, unblocks others), P1 reliability, P2 learner value, P3 classroom and polish.
**Size:** S ≈ < 150 changed lines, M ≈ 150–500, L ≈ 500+ or needs a design doc first.

## Overview

| ID | Title | Pri | Size | Depends on | Gaps | Status |
| --- | --- | --- | --- | --- | --- | --- |
| F-001 | CI + browser smoke-test harness | P0 | M | — | 23 | Done |
| F-002 | Stable lesson IDs and progress migration | P0 | M | F-001 | 20 | Done |
| F-003 | Vendored Skulpt with loading state and fallback | P0 | S | — | 24 | Done |
| F-004 | Safe storage layer with validation | P0 | S | — | 02, 03 | Done |
| F-005 | Run lifecycle hardening | P1 | M | F-001 | 04–07 | Done |
| F-006 | Small-fix bundle | P1 | S | — | 09–13, 17, 18 | Done |
| F-007 | Per-lesson drafts and overwrite protection | P2 | M | F-002, F-004 | 01 | Done |
| F-008 | Deep links: lesson, example, language | P2 | S | F-002 | — | Done |
| F-009 | Editor ergonomics | P2 | M | — | 22 (part) | Done |
| F-010 | Pause / Next-step debugger | P2 | M | F-005 | 08 | Done |
| F-011 | Challenge checks (opt-in auto-feedback) | P2 | L epic | F-002, F-005 | — | Postponed |
| F-012 | My Projects (local multi-project save) | P2 | M | F-007 | 01 | Done |
| F-013 | Accessibility pass | P3 | M | — | 22 | Done |
| F-014 | Localization completeness and language sync | P3 | M | — | 16, 19 | Done |
| F-015 | Offline / installable (PWA) | P3 | M | F-003 | 24 | Postponed |
| F-016 | Progress export / import for teachers | P3 | S | F-002, F-004 | — | Postponed |
| F-017 | Content authoring tool | P3 | S | F-002 | — | Done |
| F-018 | Curriculum v2: ordering fixes and "Beyond the basics" track | P2 | L epic | F-002, F-017 | — | Done (PR 1-2; `input()` deferred) |
| F-019 | Lesson-first layout and control cleanup | P2 | M | GAP-27..31 | — | Done |
| F-020 | Lesson card and editor toolbar clarity | P2 | M | F-019 | — | Done |
| F-021 | Gallery of inspiring pieces | P2 | L | F-007, F-008, F-017 | — | Done |
| F-022 | Canvas helper tools: pointer coordinates and turtle state | P2 | M | F-010, F-013 | 15 | Done |
| F-023 | Interactive programs: `input()`, keys, clicks, timers, games level | P2 | L epic | F-005, F-010, F-017, F-018, F-021 | 04, 05, 08 | In progress (PR 1-2 done) |

Suggested order: F-003, F-004, F-006 (independent quick wins) → F-001 → F-002 → F-005 → then P2 by maintainer preference.

## Open decisions for the maintainer

These block specific items; agents must not decide them alone.

| # | Decision | Blocks | Recommended default |
| --- | --- | --- | --- |
| D1 | May dev-only tooling (Playwright, `package.json` with devDependencies) live in the repo? | F-001 | **Decided: yes** (with F-001), under `package.json` devDependencies only; the site never needs `npm install` to run |
| D2 | May runtime libraries live in `assets/libs/` (README already recommends it)? | F-003, F-015 | **Decided: yes** (maintainer, 2026-10-22). Both pages stay single HTML files otherwise. Implemented by F-003: `assets/libs/` is the single source, mirrored into `offline/assets/libs/` |
| D3 | Should finishing a lesson ever be automatic, or always learner-declared? | F-011 | **Decided** (maintainer, 2026-10-22): keep "I did it!" as the completion action; checks only give feedback |
| D4 | Are URL-shared programs acceptable (code visible in the link)? | F-008 | **Decided** (maintainer, 2026-10-22): lesson/example/language links yes; arbitrary code in URL deferred |
| D5 | Level of Arabic coverage for syntax help and example names | F-014 | **Decided** (maintainer, 2026-10-22): translate explanations and names; keep Python code English |

---

## F-001 CI + browser smoke-test harness

**Status: Done.** Implemented in `tests/` with `npm test`. Deviation: lessons 26 and 27 fail with a red line on the right line, but not with the specific colon/indentation guidance. That is a real app bug found by these tests (GAP-25), pinned with `test.fail()`.

**Problem.** No automated tests exist (GAP-23); every agent PR relies on manual checks.

**Scope.**
- GitHub Actions workflow running `node tools/check.mjs` on every push and PR (a starter `.github/workflows/check.yml` is included with this spec set).
- Playwright tests under `tests/` served with a static server (e.g. `npx http-server` or Python), Chromium only to start.
- Skulpt is loaded from the real CDN or from `assets/libs` once F-003 lands; tests must not mock the interpreter.

**Acceptance criteria.**
1. `npm test` runs the suite locally; the workflow runs it on PRs and fails the PR on failure.
2. Tests cover at minimum: clean first load defaults (`SPEC.md §4.1`); every lesson starter except indexes 25–26 runs with no error; lessons 26–27 produce the syntax and indentation guidance; every example runs; Step mode highlights lines and Stop re-enables Run; language switch to Arabic sets `dir="rtl"` and preserves code; completion updates stars and survives reload; landing language toggle persists.
3. Each test uses an isolated storage context.
4. Assertions are DOM/state based; no pixel-snapshot tests yet.
5. AGENTS.md §3 is updated to say `npm test` replaces most of the manual smoke list.

**Out of scope.** Firefox/Safari matrix, visual regression, performance budgets.

---

## F-002 Stable lesson IDs and progress migration

**Status: Done.** Ids `l<N>-<slug>`, frozen `V2_LESSON_IDS`, `migrateV2()`, tests in `tests/lesson-ids.spec.js`.

**Problem.** Progress, selected lesson and badge rules depend on array position (GAP-20), so lessons cannot be inserted or reordered safely.

**Scope.**
- Add a unique, never-reused string `id` to each lesson (e.g. `"l1-first-line"`), mirrored by position in `LESSON_AR` (Arabic entries do not need the id).
- Badges reference ids, not indexes.
- New keys `tl.lesson.v3` (id) and `tl.progress.v3` (array of ids). On first load, if v3 is absent and v2 is present, map v2 indexes to the baseline order (`SPEC.md §5.2`) and write v3. Keep v2 keys untouched for one release so a rollback is harmless.
- `tools/check.mjs` asserts ids are unique and badge ids exist.

**Acceptance criteria.**
1. A browser with v2 progress `[0, 11, 35]` shows the same three lessons complete and the same badges after upgrade.
2. Inserting a new lesson mid-array in a test build does not change which lessons appear complete.
3. Unknown ids in stored progress are ignored and dropped on next save, not shown.
4. `SPEC.md §5.1, §6, §9` updated; AGENTS.md golden rule 7 and "Add a lesson" recipe relaxed accordingly.

---

## F-003 Vendored Skulpt with loading state and fallback

**Status: Done.** Loader in the `<head>` of `app.html`, files in `assets/libs/` (moved from `offline/libs/`; `offline/` now mirrors `assets/libs/`), tests in `tests/loader.spec.js`.

**Problem.** The app depends on two jsDelivr scripts with no integrity check, no loading feedback, and no fallback (GAP-24). School networks often block CDNs.

**Scope.**
- Add `assets/libs/skulpt.min.js` and `assets/libs/skulpt-stdlib.js` (exactly 1.2.0) plus Skulpt's license file.
- Load local copies first; if `Sk` is undefined after load, fall back to the pinned CDN URLs with `integrity` (SRI) and `crossorigin` attributes.
- While the runtime is unavailable, show a localized "Getting Python ready…" state and keep Run disabled; on total failure show the existing localized error with a Retry button.

**Acceptance criteria.**
1. With network access to jsDelivr blocked, the app still runs code when served from the repo.
2. With `assets/libs` missing, the CDN fallback loads and runs code.
3. With both unavailable, the user sees the localized failure message and a working Retry; no uncaught console errors.
4. README "Internet Requirement" and landing `#requirements` copy (both languages) are updated to match; `SPEC.md §7.1, §12.2` updated.

---

## F-004 Safe storage layer with validation

**Status: Done.** `store` helper in `app.html`, tests in `tests/storage.spec.js`. The status text is refreshed on the next save rather than on a language switch (pre-existing behavior, unchanged).

**Problem.** `localStorage` calls can throw (private mode, quota, disabled storage) and several stored values are not validated (GAP-02, GAP-03).

**Scope.** Add `store.get(key, fallback, validate)` / `store.set(key, value)` helpers wrapping try/catch; replace direct `localStorage` calls in `app.html` (and the one in `index.html`). Validate on read: lesson index is an integer in range; progress items are valid integers (or ids after F-002), deduplicated; run mode in `{normal, step}`; speed in `{900, 500, 200}`; zoom clamped. Preserve an intentionally empty draft (store a sentinel or check `!== null` rather than truthiness).

**Acceptance criteria.**
1. With storage throwing on every call, the app loads, runs code and shows a one-time localized toast that progress will not be saved.
2. Malformed values for every key in `SPEC.md §9` fall back to defaults without errors.
3. Clearing the editor and reloading leaves it empty (not the starter).
4. `tools/check.mjs` rule updated to forbid raw `localStorage.` calls outside the helper.

---

## F-005 Run lifecycle hardening

**Status: Done.** Tests in `tests/run-lifecycle.spec.js`. Syntax Help Try it also stops a run, matching example loading. Known remainder (GAP-04): Stop is still cooperative and Skulpt state is global; no leakage was observed in testing, but isolation is not guaranteed.

**Problem.** Run can be re-entered by keyboard while running, Stop's delayed reset can clear a new run's drawing, and editing or switching lessons during a run leaves state inconsistent (GAP-04 to GAP-07).

**Scope.**
- Ctrl/Cmd+Enter is ignored while a run is active.
- Stop's 150 ms target reset checks the token it was scheduled under.
- Stop settles any pending step suspension promise (reject with a "stopped" marker) so no orphaned timers or promises remain.
- During a run, lesson switching, example loading, Reset Code and language change first stop the run, then proceed.

**Acceptance criteria.**
1. Pressing Ctrl+Enter 5 times quickly produces exactly one run.
2. Stop then Run within 50 ms: the new drawing is not erased.
3. After Stop in Step mode, no further step highlights appear and no timers remain (verified in a test via a debug hook or fake timers).
4. Switching lessons mid-run stops it, loads the lesson, and Run works immediately.
5. Tests for 1–4 added to the F-001 suite.

---

## F-006 Small-fix bundle

**Status: Done.** One commit per gap. Also includes GAP-25 (colon/indentation guidance) and GAP-26 (phone-width overflow), found by the F-001 tests and the F-003 review. Tests in `tests/fixes.spec.js`.

Independent fixes; one PR, one commit per gap.

| Gap | Fix | Check |
| --- | --- | --- |
| GAP-09 | In `lineExplanation()`, test `print(` before the generic function-call rule | Step through lesson 4; print lines show the output explanation |
| GAP-10 | Make Debug Help copy match the current-line color (or change the color to blue) in both languages | Visual check, both languages |
| GAP-11 | Syntax Help "Try it" clears highlights and resets debug status like the example selector | Error → Try it → no red line remains |
| GAP-12 | Copy: if `navigator.clipboard` is absent, use the `execCommand` fallback; toast reflects actual success or failure | Test on http (non-secure) origin |
| GAP-13 | PNG export reports partial failure instead of success when a layer fails | Inject a failing layer in a test |
| GAP-17 | Add `.en` to English How It Works card containers on the landing page | Arabic-only view shows no empty cards |
| GAP-18 | Fix the Arabic whole-body font selector to target `body[data-view="ar"]` | Arabic view uses the Arabic font stack |

**Acceptance criteria.** Each row's check passes; `SPEC.md §13` rows are marked "Fixed in vX / PR #n" rather than deleted.

---

## F-007 Per-lesson drafts and overwrite protection

**Status: Done.** `tl.drafts.v1`, native `<dialog>` confirmation, tests in `tests/drafts.spec.js`.

**Problem.** One shared draft is silently overwritten by switching lessons, loading examples, "Try it", or Reset (GAP-01).

**Scope.**
- Store drafts per lesson: `tl.drafts.v1` = `{ [lessonId]: code }` (depends on F-002 ids). Migrate the existing `tl.code.v1` draft into the currently selected lesson.
- Switching lessons restores that lesson's draft, or its starter if none.
- Loading an example, "Try it", and Reset Code ask for confirmation when the current draft differs from the lesson starter; offer "Replace" and "Cancel" (localized, accessible dialog, not `window.confirm`).

**Acceptance criteria.**
1. Edit lesson 1, switch to lesson 2, edit, switch back: lesson 1 edits are intact.
2. A user with a v1 draft finds it in their current lesson after upgrade.
3. Unmodified starter code is replaced without a prompt.
4. Storage stays under 1 MB for 38 lessons of typical code; oversize writes fail gracefully via F-004.

---

## F-008 Deep links: lesson, example, language

**Status: Done.** `applyDeepLink()`, Share card in Teacher & Parent, tests in `tests/deep-links.spec.js`. Example numbers are 1-based.

**Problem.** The landing "Try This in Turtle Lab" button does not preload its example, and teachers cannot link a specific lesson.

**Scope.** Read the URL hash on load: `app.html#lesson=<id>`, `#example=<index-or-slug>`, `#lang=ar`. Apply after restoring stored state, then clear the hash with `history.replaceState`. Update the landing preview button to link `app.html#example=square`, and its Arabic counterpart with `&lang=ar`. Add "Copy link to this lesson" in Teacher & Parent.

**Acceptance criteria.**
1. Each parameter works alone and combined; invalid values are ignored silently.
2. A deep-linked example still triggers F-007's overwrite protection if applicable.
3. No learner code is ever placed in a URL (decision D4).

---

## F-009 Editor ergonomics

**Status: Done** (without the optional syntax-colored overlay, which still needs a decision). Tests in `tests/editor.spec.js`, run in Chromium and Firefox.

**Problem.** The editor is a plain textarea: Tab only inserts spaces, there is no outdent, auto-indent or keyboard escape (part of GAP-22).

**Scope.** Without adding an editor library: Enter keeps the current indent and adds 4 spaces after a line ending in `:`; Shift+Tab outdents the current or selected lines; Tab on a multi-line selection indents all lines; Esc then Tab moves focus out of the editor (announced via the editor's help text). Optional, behind a decision: lightweight syntax-colored overlay using the existing highlight layer.

**Acceptance criteria.**
1. Behaviors above work in Chrome and Firefox, LTR and RTL UI.
2. Undo (Ctrl+Z) still works after each operation (use `setRangeText` or `execCommand("insertText")`, not raw `value` assignment).
3. Gutter, highlights, cursor display and autosave stay correct.

---

## F-010 Pause / Next-step debugger

**Status: Done.** Including the optional Variables panel. Tests in `tests/step-debugger.spec.js`. Also changed: stepping no longer moves keyboard focus into the editor, which made the controls unusable from the keyboard.

**Problem.** Step mode is automatic delayed execution only; learners cannot pause and advance at their own pace.

**Scope.** Add Pause, Next and Continue controls visible only in Step mode while running. `__tl_step__` awaits a promise resolved by Next/Continue/timer. Optional "Variables" panel listing simple global `int/float/str/bool/list` values read from Skulpt globals after each step.

**Acceptance criteria.**
1. Pause halts at the next instrumented line; Next advances exactly one callback; Continue resumes timed stepping; Stop works from every state.
2. Keyboard accessible with visible labels in both languages; state announced via a live region.
3. Normal mode behavior and performance are unchanged.

---

## F-011 Challenge checks (epic, design first)

**Status: Postponed** (maintainer decision, 2026-10-22). The design doc `docs/specs/F-011-challenge-checks.md` is kept for when it resumes; its open questions are still unanswered.

**Problem.** Learners get no feedback on whether their drawing meets the goal (`SPEC.md` BR-10).

**Scope.** Write a design doc in `docs/specs/F-011-challenge-checks.md` before any code. Proposed approach: an optional per-lesson `check` object (for example `{ minSegments: 4, closedShape: true, usesLoop: true, colors: ["red"] }`), evaluated after a successful run from (a) a lightweight trace of turtle moves captured by wrapping turtle methods in Skulpt and (b) static code checks. Results appear as friendly bilingual feedback ("Great square! Try making it red."). Completion stays learner-declared (decision D3).

**Acceptance criteria (for the design doc).** Defines the check schema, how turtle state is captured without changing program behavior, false-positive policy (feedback must never call correct creative work wrong), bilingual messages, and a test plan covering at least 10 lessons.

---

## F-012 My Projects (local multi-project save)

**Status: Done.** Learning tab `projects`, `tl.projects.v1`, tests in `tests/projects.spec.js`. Adds **Save here** (overwrite a project with the editor code), so later edits can be kept.

**Problem.** Creative work in the final-project lessons has nowhere to live beyond one draft.

**Scope.** A "My Projects" panel: create, rename, open, duplicate, delete (with confirmation) named projects stored locally (`tl.projects.v1`), each with code, timestamps and an optional small PNG thumbnail. Import/export a project as `.py`. No cloud, no accounts.

**Acceptance criteria.** CRUD works across reloads; deleting asks for confirmation; storage limits handled via F-004; fully bilingual and keyboard accessible.

---

## F-013 Accessibility pass

**Status: Done.** axe-core checks in `tests/a11y.spec.js`. Beyond the scope list, axe found and this PR fixed low contrast on danger buttons, unreadable tags in high contrast, and invalid list markup in the F-010 Variables panel.

**Problem.** Tabs, progress and status messages are not exposed correctly to assistive tech (GAP-22).

**Scope.** ARIA tablist/tab/tabpanel with arrow-key navigation for learning and result tabs; `role="progressbar"` with `aria-valuenow/min/max`; `aria-live="polite"` for toast and debug status; respect `prefers-reduced-motion` in the app (turtle speed hint, transitions); avoid repeated focus-stealing during Step mode; localized `aria-label`s.

**Acceptance criteria.** axe-core reports no serious or critical issues on app and landing in both languages (add to F-001 suite); every control reachable and operable by keyboard; screen reader announces run start, success, error and stop.

---

## F-014 Localization completeness and language sync

**Status: Done.** `DOCS_AR`, `EXAMPLE_NAMES_AR`, landing labels per view, first-visit sync, tests in `tests/localization.spec.js`. Intentionally left English: "XY", the "English" language option, and proper names in credits.

**Problem.** Syntax help, example names, cursor text, `Running...`, print heading and several aria labels are English-only, and landing and app languages are independent (GAP-16, GAP-19).

**Scope.** Add Arabic for syntax categories/explanations (`DOCS_AR`, index-aligned), example names (`EXAMPLE_NAMES_AR`), cursor and status strings, print title, aria labels. Syntax search matches both languages. When the landing language is `en` or `ar`, opening the app the first time (no `tl.lang.v1`) adopts it; landing `both` maps to English.

**Acceptance criteria.** With Arabic selected, no visible English UI text remains except Python code, product name and attribution; `tools/check.mjs` extended to assert alignment of the new arrays.

---

## F-015 Offline / installable (PWA)

**Status: Postponed** (maintainer decision, 2026-10-22). The generated `offline/` bundle covers use without internet in the meantime.

**Depends on** F-003. Add `manifest.webmanifest`, icons, and a service worker caching both pages and `assets/libs` with versioned cache names. Show a small "Works offline" indicator once cached.

**Acceptance criteria.** After one online visit, the app loads and runs code in airplane mode; a new deploy updates the cache on next visit without manual clearing; Lighthouse PWA installability passes.

---

## F-016 Progress export / import for teachers

**Status: Postponed** (maintainer decision, 2026-10-22).

Teacher & Parent gets "Export progress" (downloads `turtle-lab-progress.json` with lesson ids, completion dates, and app version; no names or personal data) and "Import progress" (validated, previews the change, asks to merge or replace).

**Acceptance criteria.** Round trip between two browsers reproduces stars and badges; malformed or foreign files are rejected with a localized message; nothing personal is collected.

---

## F-017 Content authoring tool

**Status: Done.** `tools/content.mjs` with `extract`, `check` and `inject`; tests in `tests/content-tool.spec.js`. No normalizing run was needed: every array already used the format `inject` writes, so the first round trip is byte-identical.

Promote the AGENTS.md edit recipe into `tools/content.mjs` with commands `extract` (writes `content/lessons.json`, `content/lessons.ar.json`, etc. for review) and `inject` (writes them back into `app.html` as single-line literals). The runtime stays a single file; `content/` is optional and git-ignored unless the maintainer decides otherwise.

**Acceptance criteria.** After one normalizing run, `extract` then `inject` with no edits yields a byte-identical `app.html` (the first run may only change JSON whitespace); invalid JSON or misaligned Arabic arrays abort `inject` with a clear error.

---

## F-018 Curriculum v2: ordering fixes and "Beyond the basics" track

**Status: Done** (maintainer approved 2026-10-23). Lessons 39-47 added; the `input()` lesson is deferred until the app has a non-blocking input UI. Full spec: [docs/specs/F-018-curriculum-v2.md](specs/F-018-curriculum-v2.md).

Move the two debug lessons next to the first loop lessons, introduce `speed()`, `circle()`, `len()` and `%` before first use, fix mismatched teacher-note lesson numbers, and add an optional advanced track (`input`, `random`, nested loops, `return`, recursion).

**Acceptance criteria.** Existing lesson ids and saved progress keep working; each concept is taught before it is used; new lessons are fully bilingual; `check.mjs` and `npm test` pass.

---

## F-019 Lesson-first layout and control cleanup

**Status: Done.** PR A: lesson card, one button per action, new-output notice. PR B: collapsible levels with done/total, Reset progress only under Teacher & Parent, start arrow on the canvas. Full spec: [docs/specs/F-019-layout-focus.md](specs/F-019-layout-focus.md).

Put the lesson goal, challenge and "I did it!" above the fold in a lesson card, remove duplicate Run/Clear/Reset buttons, flag new `print()` output, make sidebar levels collapsible, and move Reset progress out of the sidebar.

**Acceptance criteria.** Lesson goal and "I did it!" visible without scrolling at 1440×900 and 1280×720 in both languages; one button per action; axe and localization tests stay green.

---

## F-020 Lesson card and editor toolbar clarity

**Status: Done.** Full spec: [docs/specs/F-020-card-toolbar-clarity.md](specs/F-020-card-toolbar-clarity.md). PR A done: "Mark challenge done" (amber, not green) with "Done!" state, a nudge after a successful run, chevron toggle and text link in the card, idle banner hidden in Normal mode, grey disabled Stop. PR B done: editor header bar with Run Mode (and Step speed in Step mode) in the Run group, the step bar only during Step runs, quieter file actions, and the shortcut hint on Run.

**Acceptance criteria.** Run is the only green action in the middle column; completion stays learner-declared (D3); a11y and localization tests stay green.

---

## F-021 Gallery of inspiring pieces

**Status: Done.** Full spec: [docs/specs/F-021-gallery.md](specs/F-021-gallery.md). Open questions settled on the recommended options (2026-10-24): run in the selected mode with a Step-mode tip, Open and run runs at once, code replaces the lesson draft like examples, no landing-page strip.

A Gallery tab in the learning area with 10 curated pieces (rainbow spiral, mandala, starry night, city at night, blossom tree, Koch snowflake, Sierpinski triangle, golden galaxy, and more). Each card shows a thumbnail, the level that makes it reachable, links to the lessons that teach its concepts, Open and run, and remix ideas. All pieces are verified in Skulpt 1.2.0 and finish in 5 s or less.

**Acceptance criteria.** Every piece runs; opening a piece uses the F-007 overwrite dialog; lesson links work; `#gallery=<id>` deep link; works offline; a11y and localization tests stay green in both languages.

---

## F-022 Canvas helper tools

**Status: Done.** Full spec: [docs/specs/F-022-canvas-helpers.md](specs/F-022-canvas-helpers.md). Open questions settled on the recommended options (2026-10-29): Pointer off by default; the Turtle panel is a collapsible section below the stage, updated after every run and at every step. Tests in `tests/canvas-helpers.spec.js`.

A "Pointer" toggle shows the turtle coordinates `(x, y)` under the mouse or finger on the stage (zoom aware, LTR in Arabic). A "Turtle" panel next to the Variables panel shows each turtle's position, heading, pen state and colors after a run and at every step.

**Acceptance criteria.** Pointer readout is correct within ±1 unit at 50/100/200% zoom; the toggle persists (`tl.pointer.v1`); the turtle panel matches the program state in Normal and Step mode and never shows a stale run; a11y and localization tests stay green. Open questions: default off; panel also after Normal runs.

---

## F-023 Interactive programs

**Status: In progress.** PR 1 (inline `input()`) done, tests in `tests/input.spec.js`. PR 2 (listening state for key, click and timer programs) done, tests in `tests/events.spec.js`. Open questions settled (2026-10-29): handlers run at normal speed in Step mode with a tip; the level awards a "Game Maker" badge; no idle auto-stop. Full spec: [docs/specs/F-023-interactive-programs.md](specs/F-023-interactive-programs.md). Three PRs: (1) non-blocking inline `input()`, which unblocks the `input()` lesson deferred by F-018; (2) a "listening" run state for `onkey` / `onscreenclick` / `ontimer` programs, with every handler and timer removed on Stop or any context change; (3) Level 13 "Make it interactive" (4 lessons) and 1–2 Gallery game pieces.

All of these APIs exist in the vendored Skulpt 1.2.0 (`textinput`/`numinput` do not). **Acceptance criteria.** `window.prompt` is never used; handlers from a stopped or earlier run never fire (GAP-04); keys reach the program only while the stage has focus; new starters and pieces run in both modes and offline; a11y and localization tests stay green. Open questions: handlers in Step mode, a badge for the level, idle auto-stop.
