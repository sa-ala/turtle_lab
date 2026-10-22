# F-011: Challenge checks (optional auto-feedback)

| Field | Value |
| --- | --- |
| Status | Proposed (design for maintainer review; no code yet) |
| Priority | P2 |
| Size | L (epic) |
| Depends on | F-002 (lesson ids), F-005 (run lifecycle) — both done |
| Related gaps | BR-10 (SPEC.md §2.3) |
| Owner / agent | Claude Code (design) |

## Problem
After **Run**, the app says "Great job! Your code ran successfully." (SPEC.md §7.2) whether or not the drawing matches the lesson goal. A learner who draws a triangle in the "square" lesson gets the same message as one who draws the square. Children aged 10–18 often can't tell on their own whether they met the goal. Teachers have no lightweight signal either. SPEC.md BR-10 records that no goal checking exists.

## Goals
- After a **successful** run of a lesson that defines a `check`, show short, friendly, bilingual **Turtle notes**: what the turtle did well, plus at most one optional suggestion toward the lesson goal.
- Capture what the turtle drew **without changing program behavior**: same output, same drawing, same timing, same error lines, in Normal and Step mode.
- Make checks **data**: an optional `check` object per lesson, validated by `tools/check.mjs`.
- **Never call correct or creative work wrong** (false-positive policy below).

## Non-goals
- No grading, scores, pass/fail badges or locks. Completion stays learner-declared with **I did it!** (decision D3). Notes never change stars, badges or progress.
- No pixel or image comparison of drawings.
- No checks for examples, Syntax Help samples or free code outside a lesson.
- No teacher dashboard or reporting (see F-016 for progress export).
- No new runtime dependency.

## User experience
1. The learner runs code in a lesson that has a `check`.
2. On success, the Output tab shows the usual success line, then a **🐢 Turtle notes** box with:
   - 1–3 **observations** (✅), e.g. "Your turtle drew 4 lines." and "The shape is closed: the turtle finished where it started."
   - at most **one suggestion** (💡), phrased as an invitation: "Want to match the goal? This lesson's square has 4 equal sides." It appears only if a goal check is unmet *and* the creative-work rule allows it (see policy).
3. If the run fails or is stopped, no notes appear (the existing error guidance applies).
4. The box sits in the LTR Output panel. Its text follows the UI language and direction (`dir="rtl"` on the box in Arabic), its colors come from existing tokens with a `body.hc` variant, and it wraps at < 860 px.
5. A one-line footer: "Notes are hints, not grades. You decide when you're done." This repeats D3 for learners and parents.

| Key | en | ar |
| --- | --- | --- |
| `notesTitle` | 🐢 Turtle notes | 🐢 ملاحظات السلحفاة |
| `notesFooter` | Notes are hints, not grades. You decide when you're done. | الملاحظات تلميحات وليست درجات. أنت من يقرر متى تنتهي. |
| `noteSegments` | (n) => Your turtle drew ${n} lines. | (n) => رسمت السلحفاة ${n} خطوط. |
| `noteClosed` | The shape is closed: the turtle finished where it started. | الشكل مغلق: انتهت السلحفاة حيث بدأت. |
| `noteLoop` | You used a loop to repeat steps. Nice and short! | استخدمت حلقة لتكرار الخطوات. كود قصير ورائع! |
| `noteFunction` | You made your own function. | أنشأت دالة خاصة بك. |
| `noteColors` | (n) => You used ${n} colors. | (n) => استخدمت ${n} ألوان. |
| `noteFilled` | Your shape is filled with color. | شكلك ممتلئ باللون. |
| `noteTurtles` | (n) => ${n} turtles drew together. | (n) => رسمت ${n} سلاحف معًا. |
| `noteMovedPenUp` | You moved without drawing, using penup(). | تحركت دون رسم باستخدام penup(). |
| `tryGoal` | (goal) => Want to match the goal? ${goal} | (goal) => هل تريد مطابقة الهدف؟ ${goal} |

Suggestion texts (`goal` above) come from the lesson's `check.goalHint`, a new optional lesson field with an index-aligned Arabic copy in `LESSON_AR` (`goalHint`). This keeps hints written by humans, with no generated grammar. Arabic number agreement ("4 خطوط" vs "11 خطًا") is handled by a small `arCount()` helper or by rewording ("عدد الخطوط: 4"). Open question 3.

## Technical design

### 1. Check schema (lesson data)
A new optional `check` field on lesson objects. All properties are optional; unknown properties make `tools/check.mjs` fail.

```json
"check": {
  "segments":     { "min": 4, "max": 4 },
  "closed":       true,
  "equalSides":   true,
  "turnAngle":    90,
  "usesLoop":     true,
  "usesFunction": true,
  "colors":       { "min": 2 },
  "filled":       true,
  "penUpMove":    true,
  "turtles":      { "min": 2 }
}
```

| Property | Meaning | Source |
| --- | --- | --- |
| `segments.min/max` | Number of drawn (pen-down) straight segments, after merging collinear consecutive ones | trace |
| `closed` | Some drawn path ends within the tolerance of its own start | trace |
| `equalSides` | The drawn segments of the closed path have equal length (±2%) | trace |
| `turnAngle` | Exterior turns between consecutive segments are this many degrees (±2°) | trace |
| `usesLoop` / `usesFunction` | Source contains a `for`/`while` loop / a `def` (comments and strings stripped) | static |
| `colors.min` | Distinct pen/fill colors used while drawing | trace |
| `filled` | At least one `begin_fill` … `end_fill` pair enclosed a drawn path | trace |
| `penUpMove` | At least one move happened with the pen up | trace |
| `turtles.min` | Number of distinct turtles that drew | trace |

`circle()` and `dot()` are recorded as their own primitives (not segments), so the counts stay meaningful. A segment-only check on a lesson that uses circles is a schema error caught by review.

### 2. Capturing turtle state without changing behavior
Probed in Skulpt 1.2.0 for this design: every Python `Turtle` wraps a JavaScript object (`pyTurtle.instance`) whose prototype has the methods `$forward`, `$goto_$rw$`, `$right`, `$left`, `$setheading`, `$home`, `$circle`, `$penup`, `$pendown`, `$pencolor`, `$fillcolor`, `$color`, `$begin_fill`, `$end_fill`, `$dot`, `$stamp`, `$write` and others. Its state is in plain fields `_x`, `_y`, `_angle`, `_down`, `_color`, `_fill`, `_size`, `_filling`.

- **Recorder (`traceTurtle()`):** only when the current lesson has a `check`, before `Sk.importMainWithBody`, wrap the movement and style methods on that shared JS prototype. Each wrapper:
  1. takes a **snapshot** of `this` (`_x`, `_y`, `_angle`, `_down`, `_color`, `_fill`, `_filling`, plus a per-turtle id),
  2. calls the original with the same `this` and arguments,
  3. **returns the original's return value unchanged** (Skulpt may return a suspension or promise for animation).
  Recording is wrapped in `try/catch` and can never throw into the program.
- **Why snapshots at call entry:** Skulpt runs turtle commands one after another. When command *k+1* starts, command *k*, including its animation, has finished. So consecutive entry snapshots, plus one final snapshot of every turtle after the run, give exact segments without depending on animation internals or return values.
- **Restore:** the original methods are restored in `run()`'s `finally`, on every exit path (success, error, Stop, stale token), so no wrapper outlives the run. A run-token check ensures a stale run never evaluates.
- **No source rewriting:** the learner's Python is not changed, so Normal/Step parity, line mapping and error messages are unaffected. Step mode (`__tl_step__`) is orthogonal.
- **Limits:** the trace is capped at 5,000 events (beyond that: "drew a lot!" with no geometry checks), and evaluation is skipped if the run took more than 45 s.
- **Fallback:** if the probe doesn't find the expected prototype (for example after a Skulpt upgrade), recording is disabled and **no notes are shown**. A notes feature that fails silently is better than one that misjudges. `tools/check.mjs` plus a test pin Skulpt 1.2.0's prototype shape.

### 3. Evaluation (`evaluateCheck(check, trace, code)`)
Pure function, unit-testable in Node without a browser:
- Build per-turtle paths from snapshots; merge collinear consecutive pen-down moves; compute segments, turns (normalized to −180..180°), closure (tolerance `max(2px, 1% of path length)`), colors and fills.
- Static checks strip comments and strings with the same lightweight routine `instrumentCode()` uses, then match `^\s*(for|while)\b` and `^\s*def\b`.
- Output: `{ observations: [key, args][], suggestion: goalHint | null }`, with at most 3 observations, chosen from met checks in schema order.

### 4. False-positive policy (feedback must never call correct creative work wrong)
1. **No negative wording, ever.** There are no "wrong", "incorrect", ❌ or red styling, only ✅ observations and one optional 💡 invitation.
2. **Observations are facts** about what happened ("drew 4 lines"), never judgments of the drawing.
3. **A suggestion appears only if all of these hold:** a goal check is unmet; the program drew at least one segment; **and the creative-work rule** holds: the learner's code is still close to the starter (normalized edit distance ≤ 40%). Once a learner has clearly made their own design, only observations appear.
4. **When in doubt, say nothing:** if any part of the evaluation is uncertain (trace capped, unknown primitive, recorder unavailable), suggestions are suppressed.
5. **Conservative tolerances:** ±2° and ±2% for geometry; closure tolerance as above. These are tuned on all 38 starters plus the variations in the test plan, so no starter ever gets a suggestion.
6. **Lessons 26 and 27** (intentional errors) define no `check`, so they behave exactly as today.

### 5. UI and code touch points
- `run()`: after success and when `token === runToken`, call `renderNotes()`. `traceTurtle()` installs the recorder before execution, and `finally` restores it.
- New DOM: `#turtleNotes` (inside `#output`, after `#out`, `role="status"`, `aria-live="polite"`), filled with `esc()`-ed text only.
- Strings: the keys in the table above, in `I18N` (en/ar), plus the `goalHint` lesson field and its Arabic copy in `LESSON_AR`.
- Storage: **none**. Notes are not persisted.
- Performance: one snapshot per turtle command (O(1)); evaluation is O(n) over at most 5,000 events.

### 6. Initial check catalog (first PR; 12 lessons)

| Lesson id | `check` | `goalHint` (en) |
| --- | --- | --- |
| `l1-your-first-line` | `segments {min:1}` | Draw one straight line. |
| `l3-draw-a-square-step-by-step` | `segments {min:4,max:4}`, `closed`, `equalSides`, `turnAngle:90` | A square has 4 equal sides and 4 right turns. |
| `l9-thick-lines` | `segments {min:1}` | Try `t.pensize(5)` before drawing. |
| `l10-fill-a-shape` | `filled`, `closed` | Wrap the shape in `begin_fill()` and `end_fill()`. |
| `l11-move-without-drawing` | `penUpMove`, `segments {min:2}` | Use `penup()`, move, then `pendown()` and draw again. |
| `l12-a-better-square-with-loops` | `usesLoop`, `segments {min:4,max:4}`, `closed`, `equalSides`, `turnAngle:90` | Repeat forward + right(90) 4 times in a loop. |
| `l13-triangle-with-a-loop` | `usesLoop`, `segments {min:3,max:3}`, `closed`, `turnAngle:120` | A triangle needs 3 turns of 120 degrees. |
| `l14-pentagon-and-hexagon` | `usesLoop`, `closed`, `segments {min:5}` | Try 5 sides with 72-degree turns. |
| `l8-colorful-lines` | `colors {min:2}` | Change the color between lines. |
| `l28-create-a-square-function` | `usesFunction`, `closed` | Put the square inside `def square():` and call it. |
| `l31-first-list-of-colors` | `usesLoop`, `colors {min:2}` | Pick a new color from the list on each pass of the loop. |
| `l23-draw-a-simple-house` | `segments {min:7}`, `closed` | A house is a square with a triangle roof. |

Each check in this catalog must be met by its lesson's starter code (asserted by a test), so learners who run the starter only ever see ✅. This catalog is a proposal that hasn't been checked against the starters yet. During implementation, any check a starter doesn't meet is loosened. The starter is never changed to fit a check.

## Acceptance criteria
1. For the 12 catalog lessons, the starter code produces only observations and no suggestion, in English and Arabic.
2. A goal-missing variation (for example a triangle in l3) produces exactly one 💡 suggestion using that lesson's `goalHint`, localized.
3. A creative variation (starter changed by more than 40%, e.g. extra spiral) produces observations only.
4. Output, drawing, timing class, errors and line highlights are identical with and without the recorder. Asserted by running every lesson starter and example with checks forced on and comparing output text and canvas pixels.
5. After any exit (success, error, Stop, Stop then Run, stale token) the Skulpt turtle prototype methods are the originals.
6. With the recorder unavailable (prototype shape changed), no notes appear and nothing errors.
7. Notes never change stars, badges or progress.
8. `tools/check.mjs` rejects unknown `check` properties, out-of-range values and a `goalHint` without an Arabic copy.

## Test plan
- **Unit (Node, no browser):** `evaluateCheck()` against hand-built traces: square, triangle, open path, pen-up move, two turtles, fill, collinear merge, angle normalization, closure tolerance.
- **Browser (Playwright, `tests/challenge-checks.spec.js`):** for each of the 12 catalog lessons, run (a) the starter, expecting observations only; (b) a goal-missing fixture, expecting one suggestion; (c) a creative fixture, expecting no suggestion. Covers 12 lessons, above the required 10, in English plus Arabic for at least 3.
- **Parity:** AC4 over all 36 runnable starters and 13 examples (reuse `content.spec.js` with a "force recorder" flag).
- **Lifecycle:** AC5 using the F-005 helpers (Stop in Step mode, Stop then Run).
- **Named fixtures:** `fixtures/checks/l3-triangle.py`, `l3-square-with-extra-spiral.py`, `l12-no-loop-square.py`, `l13-square-instead.py`, and so on.

## Documentation updates
- [ ] SPEC.md §5.1 (`check`, `goalHint`), §7.2 (recorder in the run lifecycle), §2.3 BR-10 (optional notes, still no grading), §14
- [ ] README: a short "Turtle notes" description in both languages, saying they are hints and not grades
- [ ] docs/ROADMAP.md: F-011 status

## Open questions
1. **Placement:** notes in the Output tab (proposed), or in the Challenges tab next to **I did it!**?
2. **Creative-work threshold:** is 40% normalized edit distance right, or should suggestions appear only for unmodified starters?
3. **Arabic counting:** use a plural helper ("4 خطوط" / "11 خطًا") or neutral phrasing ("عدد الخطوط: 4")?
4. **Scope of the first PR:** the 12-lesson catalog above, or the mechanism plus 3 lessons first?
5. **Teacher visibility:** should Teacher & Parent describe what each lesson's check looks for (useful), or would that tempt learners to target the check instead of the goal?
