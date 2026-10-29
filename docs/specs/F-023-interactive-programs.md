# F-023: Interactive programs (input, keys, clicks, timers)

| Field | Value |
| --- | --- |
| Status | In progress (PR 1-2 done) |
| Priority | P2 |
| Size | L (epic, 3 PRs) |
| Depends on | F-005 (run lifecycle), F-010 (step debugger), F-017 (content tool), F-018 (deferred `input()` lesson), F-021 (Gallery) |
| Related gaps | GAP-04 (global Skulpt state), GAP-05, GAP-08 (step instrumentation) |
| Owner / agent | |

## Problem
Every program in Turtle Lab today runs from top to bottom and ends. Kids aged 10–18 are most motivated by things they can *play*, but the app cannot run a program that reacts to them:
- `input()` is not taught. The app sets no `inputfun`, so Skulpt falls back to a blocking browser `prompt()` dialog (SPEC §5.2 note, F-018 deferral).
- `screen.onkey`, `onclick`, `onscreenclick`, `ontimer` and `listen` exist in the vendored Skulpt 1.2.0 (`assets/libs/skulpt-stdlib.js`), but the run lifecycle (SPEC §7.2) treats the end of the main body as the end of the run. Handlers then fire outside any run: Stop is disabled, and nothing removes them when the next run starts (GAP-04).

## Goals
- `input()` asks inline in the Output panel without blocking the page, in Normal and Step mode.
- Programs that register key, click or timer handlers stay "listening" until Stop. The lifecycle stays as safe as F-005: one run at a time, and Stop or any context change removes every handler and timer.
- A new level "Make it interactive" teaches this, and 1–2 Gallery game pieces show it off.

## Non-goals
- No `textinput()` / `numinput()`, which are absent in Skulpt 1.2.0.
- No Skulpt upgrade, worker isolation, or Pyodide.
- No sound, gamepad, or multi-key chords beyond what Skulpt provides.
- No scoring or leaderboards that persist or leave the device.
- Completion stays learner-declared (D3).

## User experience

**PR 1, `input()`.** When the program calls `input("What is your name? ")`, the Output tab activates and shows the prompt text, followed by a labelled text field and an "Enter" button. The status banner reads "Waiting for your answer…". Enter or the button submits. The typed text is echoed into the output, and the program continues. Stop cancels the input, removes the field and stops the run. In Step mode the highlighted line stays on the `input()` line while it waits. Pause and Next are disabled while waiting.

**PR 2, event programs.** When the main body finishes and at least one handler is registered, the run does not end. Instead:
- The status banner reads "Listening for keys and clicks… press Stop to end." Stop stays enabled, and Run stays disabled.
- If `listen()` was called, keyboard focus moves to the stage. The stage gets a visible focus ring and the accessible name "Drawing area, listening for keys". Clicking the stage also focuses it. Keys go to the program only while the stage has focus, so typing in the editor never moves the turtle. The browser's own handling of arrow keys and space is suppressed only while the stage has focus.
- Handler errors are shown like normal run errors, and the run ends.
- Stop, a new run, choosing a lesson, example or Gallery piece, Reset lesson code, Try it, and a language change all end the listening state first. The F-005 rules are extended to listeners.
- Step mode: the main body is stepped as usual. Handlers then run unstepped, at normal speed, with a tip in the status banner: "Step mode steps through your main program; key and click handlers run at normal speed."

**PR 3, content.** A new level (13) "Make it interactive", with 4 lessons:
1. Ask and draw: `input()` sets a size and color.
2. Arrow keys: `onkey` moves the turtle.
3. Click to draw: `onscreenclick(t.goto)`.
4. Timer animation and mini game: `ontimer` plus a catch-the-dot game.

The level also adds Gallery pieces such as `g-etch-a-sketch` and `g-catch-the-dot`.

| Key | en | ar |
| --- | --- | --- |
| `inputWaiting` | Waiting for your answer… | في انتظار إجابتك… |
| `inputLabel` | Your answer | إجابتك |
| `inputSubmit` | Enter | إدخال |
| `listening` | Listening for keys and clicks… press Stop to end. | في انتظار المفاتيح والنقرات… اضغط إيقاف للإنهاء. |
| `stageListening` | Drawing area, listening for keys | منطقة الرسم، في انتظار المفاتيح |
| `stepHandlersTip` | Step mode steps through your main program; key and click handlers run at normal speed. | وضع الخطوات يمر على برنامجك الرئيسي؛ أما معالجات المفاتيح والنقرات فتعمل بالسرعة العادية. |

The level name goes in `LEVEL_AR` as "اجعلها تفاعلية". Each lesson has an index-aligned `LESSON_AR` entry.

RTL: the input field is `dir="auto"`, so Arabic answers display correctly, and the echoed text is plain `textContent`. High contrast: the input field and the stage focus ring use `body.hc` tokens. Below 860 px the input field is full width.

## Technical design
- **PR 1 (done):** in `run()`, pass `inputfun` to `Sk.configure`. As implemented, `inputfunTakesPrompt` stays off, so Skulpt prints the prompt through `sys.stdout` like `print`. The time spent waiting is added to `Sk.execStart`, so it does not count toward `execLimit`. The `input()` lesson moves to PR 3 with the rest of Level 13. The function captures `token`, renders the field with DOM APIs (no `innerHTML` of the prompt text) and returns a Promise. Submit resolves it. Stop or a stale token rejects it, using the same pattern as `activeStepReject`. Its reject handle is stored as `activeInputReject` and cleared on every exit path. Extend `setRun()` with a "waiting for input" sub-state that disables Pause/Next.
- **PR 2 (done; as built, see SPEC.md §7.6):** instead of `Sk.TurtleGraphics.reset()`, which would also cancel animations, `clearTurtleEvents()` removes only the event sources, and a guard around `Sk.misceval.applyAsync` runs only the current run's handlers (matched by `func_globals`). `execLimit` does apply to callbacks, counted from the start of the run, so each handler now starts its own limit while listening. Original plan: after `Sk.misceval.asyncToPromise` resolves for the current token, check whether the turtle screen has key, mouse or timer listeners. Prefer Skulpt's own bookkeeping: `_keyListeners`, `getManager(...)` and the timer ids seen in the stdlib. If any exist, enter `runState = "listening"` instead of finishing. `stop()` and every F-005 stop-first entry point call `endListening()`. It clears key and mouse managers, cancels the timers, removes the stage key-forwarding listeners, and restores the controls, guarded by `runToken`. Before each new run, call `Sk.TurtleGraphics.reset()` (or the equivalent) so no listener survives into it (GAP-04). Handler invocations go through the existing `interruptHandler`, so Stop also ends a long handler. In Step mode, handlers bypass the step builtin: either the generated handler code is not instrumented, or it short-circuits when `runState === "listening"`. Verify this against GAP-08 during implementation.
- **Stage focus:** `#stage` gets `tabindex="-1"`, which becomes `0` while listening, plus a localized `aria-label`. Key events on the stage are forwarded to Skulpt's listeners only while it has focus.
- **PR 3:** lessons are added with `tools/content.mjs`, using the next unused ids (`l48-…` onward), `LESSON_AR`, `LEVEL_AR`, and possibly a badge (open question). Gallery pieces are added through the F-021 recipe. Starter code must work in Normal and Step mode. The `input()` lesson must not block the automated "every starter runs" test: the test answers the field.
- **Storage:** none.
- **Dependencies:** none.

## Acceptance criteria
1. `name = input("Name? ")` then `print("Hi", name)` shows an inline field. Typing "Sara" and pressing Enter prints `Hi Sara`. No `window.prompt` is ever called.
2. Stop while waiting for input ends the run, removes the field, and a following Run works normally. The same holds in Step mode.
3. A program with `screen.onkey(f, "Up")` and `screen.listen()` stays running after its body. Pressing Up with the stage focused calls `f`. Pressing Up in the editor does not call it.
4. Stop while listening re-enables Run. After Stop, the old handlers do not respond to keys, clicks or timers, which is checked over at least 2 s.
5. Running program B after a listening program A: A's handlers never fire.
6. Choosing a lesson, an example or a Gallery piece, Reset lesson code, Try it, or switching language while listening all stop the run first.
7. An exception inside a handler shows a friendly error on the right line and ends the run.
8. In Arabic, all new strings are Arabic, Arabic answers to `input()` display correctly, and code stays LTR.
9. Every new lesson starter and Gallery piece runs in Normal and Step mode (with scripted input and keys), and the offline bundle runs them with no network requests.
10. axe reports no serious or critical issues in the input-waiting and listening states, in both languages.

## Test plan
- `tests/input.spec.js`: answer, Stop while waiting, Step mode, Arabic text, `window.prompt` spy never called.
- `tests/events.spec.js`: onkey with focus vs editor focus, onscreenclick at a computed point, ontimer stops after Stop (wait and assert no new output), A→B handler isolation, handler error, and stop-first on every context change.
- `tests/run-lifecycle.spec.js`: listening and input states added to the stop-then-run cases.
- `tests/app.spec.js` / `tests/gallery.spec.js`: updated counts, plus scripted interaction for the new starters.
- `tests/a11y.spec.js`: the new states.
- Manual: phone width (< 860 px) input field, high contrast, keyboard-only play.

## Documentation updates
- [ ] SPEC.md §7.1–7.3 (input, listening state, Step-mode handlers), §5.2 catalog and counts (47 → 51), §5.5 Gallery, §6 badges if changed, §13 GAP-04 note, baseline
- [ ] README and landing copy (both languages): "make interactive programs and games"
- [ ] docs/ROADMAP.md status, and the F-018 note about the deferred `input()` lesson

## Open questions
All settled by the maintainer (2026-10-29):
1. Event programs in Step mode: **handlers run unstepped, with a tip.**
2. The new level awards a badge: **yes, "Game Maker", following the existing badge rules** (PR 3).
3. No idle auto-stop. `execLimit` does apply to callbacks (counted from the start of the run), so each handler starts its own limit while listening.
