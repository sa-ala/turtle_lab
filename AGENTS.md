# AGENTS.md — Working on Turtle Lab

This file is the entry point for any AI coding agent (Claude Code, Codex, Copilot, Cursor, etc.) and for human contributors. Read it fully before changing anything.

Turtle Lab is a bilingual (English/Arabic) web app that teaches kids aged roughly 10–18 Python through Turtle graphics. Python runs in the browser via **Skulpt 1.2.0**. There is no backend, no build step and no framework.

## 1. Document map

| File | Role | When to read |
| --- | --- | --- |
| `AGENTS.md` (this file) | **How** to work in this repo: rules, recipes, verification, definition of done | Always, first |
| `SPEC.md` | **What exists today**: implementation-derived business and technical spec (behavior, data contracts, storage keys, known gaps `GAP-xx`, test map) | Before touching any behavior; cite its section numbers in your plan |
| `docs/ROADMAP.md` | **What to build next**: prioritized feature specs `F-xxx` with acceptance criteria | When picking up work |
| `docs/specs/TEMPLATE.md` | Template for writing a new feature spec | Before starting any feature not already in the roadmap |
| `tools/check.mjs` | Zero-dependency invariant checker | After every change |
| `tools/build-offline.mjs` | Regenerates the offline bundle `offline/` from `app.html` | After every change to `app.html` |
| `assets/libs/` | Vendored Skulpt 1.2.0 (the app loads it first; pinned CDN with SRI is the fallback). SHA-256 verified; never edit | When upgrading Skulpt |
| `offline/` | **Generated** copy of `app.html` plus `assets/libs/` for use without internet. Never edit by hand | When shipping or testing offline use |
| `tests/`, `playwright.config.js`, `package.json` | Dev-only Playwright browser smoke tests (`npm test`). The site never needs `npm install` | After every behavior change; add tests for new behavior |
| `README.md` | Public-facing project description | When product claims change |

Precedence when documents disagree: **source code > SPEC.md > ROADMAP.md > README.md**. If you find SPEC.md is wrong about current behavior, fix SPEC.md in the same PR and say so.

## 2. Golden rules (non-negotiable)

1. **Two standalone static pages.** `index.html` (landing) and `app.html` (the app) each contain their own inline CSS and JS. Do not introduce a bundler, npm runtime dependencies, a framework, TypeScript, or a server. Dev-only tooling (tests, scripts) is fine if it never becomes required to run the site.
2. **Bilingual parity.** Every new user-visible string needs both `en` and `ar` entries (in `I18N` or `DEBUG_I18N`), and every new lesson needs an index-aligned `LESSON_AR` entry. Arabic UI is RTL; code, output and `<pre>` stay LTR.
3. **Python source stays English.** Starter code, examples and syntax samples are not translated.
4. **Safe rendering.** Any text interpolated into `innerHTML` goes through `esc()`. Program output uses `textContent`. Never render learner code or output as HTML.
5. **Children's privacy.** No analytics, trackers, ads, fingerprinting, accounts, remote logging, or new third-party network requests. Any new external script must be pinned to an exact version and justified in the PR.
6. **Storage discipline.** All `localStorage` keys live in the `K` map in `app.html` and are versioned (`tl.<name>.vN`). Read and write only through `store.get(key, fallback, validate)` / `store.set(key, value)`; never call `localStorage` directly (`check.mjs` enforces this). Changing the meaning or shape of a stored value requires a new version suffix plus a migration from the old key. Never silently wipe learner progress or code.
7. **Lesson ids are permanent.** Saved lesson selection, completion progress and badge rules use each lesson's `id` (F-002). Never change, reuse or recycle an id. Never edit `V2_LESSON_IDS`, which decodes pre-F-002 progress. Lessons may be inserted or reordered; `LESSON_AR` must be reordered with them, since it is index-aligned.
8. **Intentional failures stay failing.** Lessons 26 and 27 (`l26-debug-the-turtle-missing-colon`, `l27-debug-the-turtle-indentation`) ship deliberately broken code (missing colon, bad indentation). Do not "fix" them.
9. **Scope discipline.** Implement exactly the spec you were given. Known gaps in `SPEC.md §13` are not permission to fix unrelated things in the same PR; file or reference them separately.
10. **Keep SPEC.md true.** If you change behavior, update the relevant `SPEC.md` sections, inventories (counts of lessons/examples/docs), and its baseline table in the same PR.

## 3. Run, check, verify

```bash
# Serve (preferred over file:// — clipboard, storage and downloads behave better)
python -m http.server 8000      # then open http://localhost:8000

# After ANY change to app.html: regenerate the offline bundle (offline/app.html)
node tools/build-offline.mjs

# Invariant check (no install needed, Node 18+)
node tools/check.mjs

# Browser smoke tests (dev-only; first time: npm ci && npm run test:install)
npm test
```

`tools/check.mjs` verifies: content arrays parse and have required fields; `LESSON_AR` is aligned with `lessons`; every level has a `LEVEL_AR` translation; `I18N`/`DEBUG_I18N` have identical `en`/`ar` key sets; lesson ids are well-formed and unique, `V2_LESSON_IDS` is unchanged, and badge rules reference existing lesson ids; every `$("id")` lookup has a matching element; storage keys go through `K`; external scripts are version-pinned; the landing page still links to `app.html`; `offline/` is up to date with `app.html`; `assets/libs/` and `offline/assets/libs/` match the pinned SHA-256 hashes in `tools/build-offline.mjs`; the Skulpt loader CDN URLs are pinned and their SRI hashes match the local files. It must print `OK` before you open a PR.

`npm test` runs the Playwright suite in Chromium, plus the editor tests in Firefox (F-009 requires both; first time locally: `npx playwright install chromium firefox`). CI runs it as the `e2e` job inside the official Playwright container, on every push to `main` and on every PR that touches `app.html`, `index.html`, `offline/`, `tests/`, `tools/`, package or Playwright config, or workflows. Docs-only PRs skip it, and a skipped job counts as passed. To upgrade Playwright, change `package.json`, `package-lock.json` and the container image tag in `.github/workflows/check.yml` together; `check.mjs` fails if they differ. Each test gets isolated storage. The real Skulpt interpreter runs, loaded from the hash-verified `offline/libs/` copies instead of the CDN. **A test fails if the page makes any other network request, throws an uncaught error, or logs a `console.error`.** It covers:

- landing language toggle and persistence, and "Start Coding"
- clean first-load defaults and content counts
- every lesson starter and every example runs (except the deliberately broken lessons 26 and 27)
- lessons 26 and 27 fail with a red line on the right line, and the corrected code runs
- Step mode highlighting order, Stop, and Run again
- Arabic RTL with LTR code, and code/language preserved across reload
- "I did it!" progress, stars and badges, and their persistence
- storage blocked or full, malformed stored values, and an empty draft (`tests/storage.spec.js`)
- per-lesson drafts, `tl.code.v1` migration, and the Replace / Keep my code dialog (`tests/drafts.spec.js`)
- deep links `#lesson=`, `#example=`, `#lang=`, Copy link to this lesson, and the landing Try This link (`tests/deep-links.spec.js`)
- Step-mode Pause / Next step / Continue, Stop from every state, keyboard focus, and the Variables panel (`tests/step-debugger.spec.js`)
- editor keys: Enter auto-indent, Tab / Shift+Tab on lines and selections, Esc then Tab, undo, in Chromium and Firefox (`tests/editor.spec.js`)
- My Projects: create, open, rename, duplicate, Save here, delete, import/export `.py`, storage failure, Arabic and keyboard (`tests/projects.spec.js`)
- accessibility: axe-core (no serious or critical issues) on the landing page and app in both languages and main states, plus ARIA tabs, progressbar, announcements, labels and reduced motion (`tests/a11y.spec.js`). New UI must keep this file green
- run lifecycle: one run at a time, Stop then Run keeps the new drawing, Step-mode Stop settles the run, and lesson, example, reset, language or Try it changes stop a run first (`tests/run-lifecycle.spec.js`)
- the offline bundle running with no external requests
- Python loading: local files only, CDN fallback with a real SRI check, tampered CDN file rejected, loading state, failure and Retry (`tests/loader.spec.js`)

Known bugs are pinned with `test.fail()` and a `GAP-xx` reference (none at the moment). Regression tests for fixed gaps live in `tests/fixes.spec.js`, one block per gap. When you fix one, Playwright reports "expected to fail, but passed"; remove the `test.fail()` line.

Still **manual**: run these in a clean browser profile when your change touches them, and report the results in your PR:

1. Zoom in/out/reset, toggle XY coordinates, Save PNG, Export .py, Copy code.
2. Resize to < 860 px width → single-column layout still usable.
3. High contrast on, in both languages, for any UI you touched.
4. Printing (Teacher & Parent → Print syntax sheet).

## 4. How the code is laid out (and how to edit it safely)

**`app.html`** (~1,350 lines, ~150 KB): CSS lines 8–1248 (later blocks override earlier ones), markup ~1250–1260, one inline `<script>` from ~1261. **`index.html`**: CSS, semantic sections with `.en` / `.ar` blocks, and a short script (`setLanguageView`).

The script is written in a **dense style: roughly one function or constant per line**, minified-looking but hand-maintained. Line numbers drift; **locate code by symbol** (`grep -n "function run(" app.html`), not by line number. `SPEC.md §12.1` maps every area to its symbols.

Key symbols: `lessons`, `LESSON_AR`, `LEVEL_AR`, `docs`, `extraDocs`, `examples`, `DEFAULT_CODE` (content); `K` (storage keys); `I18N`, `DEBUG_I18N`, `T()` (strings); `E` (cached DOM elements), `$()` (getElementById); `applyLang`, `buildLessons`, `buildExamples`, `buildDocs`, `loadLesson` (UI); `run`, `stop`, `setRun`, `friendly`, `instrumentCode`, `installStepBuiltin`, `extractErrorLine` (execution); `applyZoom`, `drawCoordinateOverlay`, `png`, `py`, `copyCode` (drawing/export); `bind`, `init` (startup).

**Editing rules:**

- **Content arrays are single-line JSON literals** (`const lessons=[...];` is one ~34 KB line). Do not hand-edit them with string replacement. Edit them programmatically so the JSON stays valid:

  ```js
  // edit-content.mjs — run with: node edit-content.mjs   (delete the script afterwards)
  import fs from "node:fs";
  let s = fs.readFileSync("app.html", "utf8");
  const edit = (name, fn) => {
    const re = new RegExp(`(\\nconst ${name}=)(.*)(;\\n)`);
    if (!re.test(s)) throw new Error(`${name} not found`);
    s = s.replace(re, (_, a, body, c) => a + JSON.stringify(fn(JSON.parse(body))) + c);
  };
  edit("examples", (arr) => [...arr, { name: "Hexagon", code: "import turtle\n\nt = turtle.Turtle()\n\nfor i in range(6):\n    t.forward(80)\n    t.right(60)\n\nturtle.done()" }]);
  fs.writeFileSync("app.html", s);
  ```

  The whole line will show as changed in the diff; that is expected. In `docs`/`extraDocs`, the `command` field uses a **literal backslash-n** (`\\n` in the file) for line breaks, which `docCommand()` converts; `example` and `starterCode` use real newlines (`\n`).
- **New JS** should match the surrounding compact style closely enough to read as one codebase, but clarity wins over terseness: a multi-line function is acceptable for anything non-trivial.
- **New CSS**: read the full cascade first (`SPEC.md §11.2`). Prefer appending a clearly commented block near the end of the `<style>` element over editing early rules that are already overridden. Provide high-contrast (`body.hc`) and RTL (`[dir="rtl"]`) variants where relevant, and respect the 860 px and 1180 px breakpoints.
- **Do not restructure** (split files, rename symbols, reformat whole sections) unless the spec you are implementing says to.

## 5. Recipes

### Add a lesson
1. Insert the lesson wherever it fits pedagogically. Give it a new, never-used `id`: use `l<next number>-<slug of the title>`, where the number is one more than the highest id number ever used, not its position.
2. Add the lesson object to `lessons` with all 13 fields (`SPEC.md §5.1`), add the Arabic object to `LESSON_AR` at the **same index**, and add any new level name to `LEVEL_AR`.
3. Run the starter code in both Normal and Step mode. It must succeed (unless it is a deliberate debugging lesson, documented as such).
4. Decide whether a badge rule in `badges()` should include the new lesson's id. Tests that select lessons by position (for example `tests/app.spec.js` for lessons 12, 26 and 27) may need their position updated.
5. Update `SPEC.md` §5.2 catalog, counts (38 → N) everywhere, and §6 if badges changed.

### Add an example or a syntax-help entry
Append to `examples` (`{name, code}`) or `extraDocs` (`{category, command, explanation, example}`) using the edit script above. The example must run in Skulpt. Update counts in `SPEC.md` §5.3/§5.4 and §14.

### Add a user-facing control
1. Markup with a stable `id`, a real `<button>`/`<select>`/`<input>`, and an accessible name.
2. Add it to `E` if it is used often; bind it in `bind()`.
3. Add label strings to both `en` and `ar` in `I18N` (or `DEBUG_I18N`) and set them in `applyLang()`.
4. Style for normal, `body.hc`, RTL, and both breakpoints.
5. If it persists state: add a versioned key to `K`, read it with `store.get(K.x, fallback, validator)` in `init()`, write it with `store.set`, and add a malformed-value case to `tests/storage.spec.js`.

### Add a translatable string
Add the same key to `en` and `ar`; read it through `T(key)`. Values may be functions (see `progress`, `stars`) when they need arguments. Never concatenate English fragments into Arabic sentences.

### Change run / step-debugger behavior
Read `SPEC.md §7` and gaps `GAP-04…GAP-09` first. Preserve: the `runToken` stale-result guard, `setRun()` control states, Normal/Step parity of program semantics, generated-to-original line mapping, and cleanup of `activeStepTimer` on every exit path. Test stop-then-immediately-run.

### Keep the offline bundle in sync
`offline/` is a self-contained copy (open `offline/app.html` by double-click, no internet). It is generated, never hand-edited:
1. After any change to `app.html`, run `node tools/build-offline.mjs` and commit `offline/app.html` together with `app.html`. `check.mjs` (and CI) fails if you forget.
2. `offline/app.html` is `app.html` plus a banner; `offline/assets/libs/` is a copy of `assets/libs/`. Hard-coded external `<script src>` tags are rejected: runtime libraries go through the local-first loader (`SKULPT_FILES` in the `<head>` of `app.html`).
3. Upgrading Skulpt: update `SKULPT_FILES` (CDN URL and `sri`) in `app.html` and `url`/`sha256` in `LIBS` in `tools/build-offline.mjs`, delete `assets/libs/*.js`, and rerun the build, which downloads and verifies the files. Then run `check.mjs`, which verifies the SRI against the local files, and `npm test`.
4. Do not modify files in `assets/libs/` or `offline/assets/libs/`; they are verified byte-for-byte.

### Change the landing page
Content comes in paired `.en` / `.ar` blocks. Keep both, keep `href="app.html"` relative, and keep claims consistent with README and SPEC.md (technologies, requirements, privacy).

## 6. Invariants

Automated by `tools/check.mjs`: listed in §3.

Automated by `npm test` (see §3): no console errors, Run → Stop → Run, persistence across reload, lessons 26/27 fail and all other starters and all examples run, Arabic RTL with LTR code, no unexpected network requests.

Manual:

- High-contrast mode is legible; < 860 px layout is usable.
- Printing (Teacher & Parent → Print syntax sheet) shows all syntax entries.
- Drawing and output do not survive reload (by design).

## 7. Workflow for an agent task

1. **Pick or write a spec.** Use an `F-xxx` from `docs/ROADMAP.md`, or create `docs/specs/F-xxx-short-name.md` from the template. Do not start coding a feature with no acceptance criteria.
2. **Plan in writing** (in the PR description or your first message): which `SPEC.md` sections, rules and gaps are affected; which symbols you will touch; any storage-key or migration change; how you will verify.
3. **Implement** the smallest change that meets the acceptance criteria.
4. **Verify:** `node tools/check.mjs`, `npm test`, the remaining manual checks (§3), plus the feature's own acceptance criteria in both languages. New behavior gets new tests in `tests/`.
5. **Document:** update `SPEC.md` (behavior, inventories, baseline revision/date), README if claims changed, and tick the roadmap item.
6. **Open a PR** using the checklist below.

Branches: `feat/F-xxx-short-name`, `fix/GAP-xx-short-name`, `docs/...`. Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), referencing the `F-xxx`/`GAP-xx` ID.

### Definition of done / PR checklist

- [ ] Linked spec (`F-xxx`) or gap (`GAP-xx`); all acceptance criteria met
- [ ] `node tools/build-offline.mjs` run if `app.html` changed; `offline/app.html` committed with it
- [ ] `node tools/check.mjs` prints OK
- [ ] `npm test` passes; tests added or updated for changed behavior
- [ ] Remaining manual checks (§3) done for touched UI; results summarized (browser + width used)
- [ ] English **and** Arabic strings added; RTL checked
- [ ] High contrast and < 860 px layout checked for touched UI
- [ ] No new network requests, trackers, or unpinned scripts
- [ ] Storage changes versioned with migration; existing user data preserved
- [ ] `SPEC.md` updated (sections, counts, baseline); README updated if claims changed
- [ ] Diff limited to the spec's scope

## 8. Don'ts

- Don't convert the app to React/Vue/Svelte, add a bundler, or split it into modules "for maintainability" without an approved spec.
- Don't add Pyodide or another runtime alongside Skulpt without an approved spec (size, offline and behavior implications).
- Don't add auto-grading claims to the UI or docs unless a checker actually exists.
- Don't rely on `SPEC.md` line numbers; they are a baseline snapshot.
- Don't remove the non-affiliation notice or third-party credits.
- Don't commit generated scratch scripts, screenshots, or `node_modules`.
