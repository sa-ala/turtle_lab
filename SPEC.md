# Turtle Lab: Business and Technical Specification
> How to work in this repo: see [AGENTS.md](AGENTS.md). Planned work: [docs/ROADMAP.md](docs/ROADMAP.md).

## 1. Purpose, authority, and scope

This is an implementation-derived reference for AI agents planning tests,
fixes, features, and enhancements. It describes the existing product, not an
approved roadmap or a guarantee of browser compatibility.

| Attribute | Baseline |
| --- | --- |
| Review date | 2026-10-20 |
| Source revision | `b2cc25f` |
| Primary sources | [index.html](index.html), [app.html](app.html) |
| Supporting sources | [README.md](README.md), [LICENSE](LICENSE) |
| Product | Turtle Lab |
| Published entry point | <https://sa-ala.github.io/turtle_lab> |
| Repository | <https://github.com/sa-ala/turtle_lab> |
| Maturity | Early public educational prototype, as described in README |
| Review method | Static inspection of both complete pages, their embedded data, styles, and scripts; extraction of curriculum inventories |

**Interpretation rules**

- **Implemented** means present in the reviewed source. It does not imply
  interactive browser verification.
- **Product intent** describes educational or marketing statements, not extra
  functionality that agents should assume exists.
- **Known limitation** identifies a source-observed behavior or risk to verify.
  Do not silently turn these into desired acceptance criteria.
- Numbered lessons in this document are **one-based**; JavaScript arrays,
  saved lesson selections, completion records, and badge rules are **zero-based**.
- The source remains authoritative if it changes after this baseline. Update this
  reference alongside behavior changes.

## 2. Business context

### 2.1 Problem and value proposition

Turtle Lab introduces programming through immediate visual feedback: learners
write Python Turtle-style code, run it in a browser, and observe lines, shapes,
colors, and patterns. It draws educational inspiration from Logo and turtle
graphics, using Python syntax rather than Logo syntax.

The learning model is guided experimentation: run a starter program, predict
and change a number/color/command, run again, and compare the result with a goal.
The product teaches sequencing, geometry, values, variables, loops, decisions,
functions, lists, debugging, and creative composition.

### 2.2 Audiences and roles

| Audience | Need | Existing capability |
| --- | --- | --- |
| Beginner learner | A low-friction, visual introduction to coding | Browser editor, runnable starters, lessons, examples, hints, friendly errors |
| Parent or teacher | Guide exploration and explain concepts | Lesson-specific notes, challenges, printable syntax reference |
| Coding club or STEM facilitator | Reusable classroom activities | Ordered course, self-reported progress, badges, download options |
| Maintainer or contributing agent | Extend the experience consistently | Inline curriculum, translation dictionaries, source-level configuration |

README suggests ages **10-18**, with adult guidance for younger children. This
is positioning, not an enforced age restriction. There are no authenticated
roles, teacher accounts, permissions, classroom rosters, or separate dashboards.

### 2.3 Business rules and exclusions

| ID | Rule |
| --- | --- |
| BR-01 | Learning activities run client-side without installing Python or using an application backend. |
| BR-02 | All 38 lessons are freely selectable; no prerequisite lock or enforced sequence exists. |
| BR-03 | Completion is self-reported using **I did it!** in Challenges. Running code, meeting a drawing goal, or passing a test is not required. |
| BR-04 | Each distinct completed lesson contributes one star. Repeating completion does not add another star. |
| BR-05 | Completion and preferences belong to the browser storage context, not a user account. |
| BR-06 | Code editing has one shared saved draft, not a per-lesson or per-project draft collection. |
| BR-07 | Switching lessons, loading examples, trying syntax samples, and resetting code replace the draft without a confirmation dialog. |
| BR-08 | Resetting progress requires confirmation and removes completion/badges, but preserves the selected lesson, code, and preferences. |
| BR-09 | English and Arabic are supported, with different language-selection models on the two pages. Their preferences are independent. |
| BR-10 | No grading, automatic goal checking, score beyond stars, certificate, collaboration, cloud sync, or project gallery is implemented. |
| BR-11 | No monetization, subscription, payment, analytics event collection, or account-registration flow appears in the reviewed source. |

No conversion targets, lesson-duration targets, learning-outcome metrics,
performance service levels, or formal accessibility conformance target are
defined. Do not invent these as existing requirements.

## 3. Page structure and navigation

### 3.1 Entry points and boundaries

`index.html` is the informational landing page. `app.html` is the interactive
learning environment. They are separate HTML documents with inline CSS and
JavaScript; there is no router, SPA framework, module bundler, or shared asset
module.

All landing-page app links navigate to the relative URL `app.html` in the same
tab. They do not transmit language, a selected example, or code. In particular,
**Try This in Turtle Lab** opens the app normally rather than preloading the
displayed blue-square example. The app restores its own stored state.

No in-app Home link back to the landing page is present. Learning-area tabs
and result tabs change CSS classes without changing the URL.

### 3.2 Landing-page inventory

| Anchor | Content and business purpose |
| --- | --- |
| `#top` | Hero, product promise, Start Coding and Learn More actions, decorative code/drawing illustration |
| `#about` | Playground description and Python/drawing/lessons/projects highlights |
| `#background` | Logo inspiration and visual-first educational approach |
| `#language` | Python introduction and illustrative Turtle code |
| `#technology` | Python, Turtle, Skulpt, HTML/CSS/JavaScript, Canvas/SVG, client-side execution |
| `#learn` | Eight learning themes: sequencing, movement/angles, loops, colors/creativity, variables, functions, projects, experimenting |
| `#how` | Choose lesson/example, edit code, run and observe; English and Arabic step cards |
| `#preview` | Static blue-square sample and link to the app |
| `#requirements` | Devices, JavaScript, screen space, CDN connectivity, no installed Python |
| `#browsers` | Chrome, Edge, Firefox, Safari, ChromeOS/Chromebook recommendations |
| `#parents` | Guided exploration and encouragement to change values and shapes |
| `#credits` | Attribution, non-affiliation notice, technology and repository links |
| `#start` | Final Open Turtle Lab call to action |

Header navigation exposes About, Background, Technology, Requirements, and
GitHub. The brand links to `#top`. Footer navigation exposes Start App, About,
Technology, Requirements, Credits & References, and GitHub Repository.
External links use a new tab and `rel="noopener noreferrer"`.

The landing page has an English skip-to-content link to `#main`, semantic
sections, a descriptive title/meta description, and a year populated with
`new Date().getFullYear()`. Its code previews and turtle illustration are static;
they do not execute Python.

### 3.3 App surface inventory

| Area | Controls/content | Main DOM identifiers |
| --- | --- | --- |
| Header | Run, Stop, Clear Drawing, Reset Code, High contrast, English/Arabic selector | `runTop`, `stopTop`, `clearTop`, `resetTop`, `hc`, `langSelect` |
| Course sidebar | Course heading, collapse/expand, completed count, stars, progress bar, lesson selector, Reset progress, level-grouped lesson buttons | `toggleLessons`, `progressText`, `starText`, `fill`, `lessonSelect`, `resetProgress`, `lessonList` |
| Editor header | Lesson number/title, level, concept, keyboard shortcut reminder | `lessonTitle`, `lessonLevel`, `lessonConcept` |
| Editor actions | Run, Reset lesson code, Copy code, Export .py, example selector | `runBtn`, `resetBtn`, `copyBtn`, `pyBtn`, `examples` |
| Execution controls | Explanation/status banner, Normal/Step-by-step selector, conditional step-speed selector | `debugInfo`, `runMode`, `stepSpeedControl`, `stepSpeed` |
| Editor | Plain textarea, line-number gutter, current/error-line overlays, autosave status, cursor location | `code`, `rail`, `codeHighlights`, `highlightInner`, `saveStatus`, `cursor` |
| Results below editor | Output and Errors tabs with separate content panels | `output`, `errors`, `out`, `err`; `[data-run-tab]` |
| Drawing | Stage, Skulpt target, coordinate helper, zoom controls, Clear, Save PNG | `stage`, `target`, `coordOverlay`, `coordToggle`, `zoomOut`, `zoomIn`, `zoomReset`, `zoomLabel`, `clearBtn`, `pngBtn` |
| Learning area | Lesson, Syntax Help, Challenges, Teacher & Parent, Badges | `[data-tab]`; `lesson`, `syntax`, `challenge`, `teacher`, `badges` |
| Print-only area | Syntax Cheat Sheet title and all reference commands/explanations | `printDocs` |
| Notifications | Transient status messages | `toast` |

The initial active tabs are Lesson and Output. Tab selection is not persisted.
The source includes handlers/translation strings for `saveTop` and
`focusExamples`, but there are no matching controls in the current markup.
Do not describe explicit Save Code or a header Load Example button as visible
features.

## 4. User journeys and state transitions

### 4.1 First visit and resume

1. The landing page restores its language view, defaults to Both, and updates
   the footer year.
2. Start Coding navigates to `app.html`.
3. The app reads selected lesson, progress, and preferences from local storage.
4. `init()` builds lessons/examples/docs, binds handlers, restores run settings
   and contrast, and loads the selected lesson.
5. A nonempty saved draft replaces starter code. Without one, the selected
   lesson's starter is loaded and saved.
6. The drawing target is empty; drawings and console results do not survive a
   reload. Zoom and coordinate preferences are reapplied.
7. Run is enabled, Stop is disabled, and output/error placeholders are shown.

On a clean storage context, defaults are lesson 1, English app UI, expanded
sidebar, normal contrast, Normal run mode, Medium step speed, 100% zoom,
coordinates off, zero completions, and all badges locked.

### 4.2 Learn, experiment, and complete

Selecting a lesson in either navigation surface sets `current`, saves its
zero-based index, replaces/saves editor code, updates metadata and all
lesson-specific learning panels, refreshes progress/badges, and marks the
active lesson button. It does not run or clear the existing drawing/results.

Lesson content shows goal, concept explanation, expected result, steps, hint,
and suggested changes. Challenges shows the lesson's challenge, creative
suggestion, badge tip, and completion button.

Clicking **I did it!** adds the selected index to a `Set`, persists it,
refreshes lesson checkmarks/progress/badges, preserves the draft, and shows a
completion toast. It does not advance to the next lesson.

### 4.3 Replace or recover code

| Action | Effect |
| --- | --- |
| Reset Code / Reset lesson code | Load the selected lesson's original English starter, save, clear highlights, rebuild gutter/cursor, reset debug guidance |
| Load Example | Replace/save code, clear highlights, reset debug guidance, retain selected lesson and learning content, reset example selector to placeholder |
| Syntax Help: Try it | Replace/save code with the entry's sample and rebuild lines; retain selected lesson |
| Edit textarea | Save immediately per input event, clear highlights, rebuild line display; reset debug guidance when no run is active |
| Tab in editor | Replace selected text with four spaces, move caret after spaces, save, rebuild lines; no outdent or multiline-indent behavior |

Code replacement does not automatically clear the drawing, output, or errors.
The Syntax Help Try it handler does not explicitly clear highlights or reset
debug guidance, unlike the example selector.

### 4.4 Run, inspect, and stop

Both Run buttons and Ctrl+Enter / Command+Enter invoke `run()`. A successful
run appends a localized encouragement message to print output, or uses that
message as output if nothing was printed. Errors are shown in the Errors tab,
with a friendly explanation and expandable technical details.

Stop is a cooperative stop request, not worker/process termination. It
invalidates the run token, requests tight Skulpt limits, clears the step timer,
resets button states, displays stopped guidance, switches to Errors, and
schedules drawing-target clearing after 150 ms.

### 4.5 Reset progress and classroom use

Reset progress is available in the sidebar and Teacher & Parent panel.
Cancellation makes no changes. Confirmation stores `[]`, updates counts and
badges, retains the current draft, and shows a toast.

Teacher & Parent includes lesson notes, a Print syntax sheet action,
progress-reset instructions, source-editing guidance for adding lessons, and
Debug Help. Printing calls `window.print()`; print CSS hides the interactive
workspace and shows all syntax cards in two columns without their runnable
examples or Try it buttons.

## 5. Curriculum and content model

### 5.1 Data contracts

`lessons` is an ordered array of **38** objects with these fields:

| Field | Type | Purpose |
| --- | --- | --- |
| `level` | string | Group heading and lesson metadata |
| `title` | string | Navigation title, editor title, basis for .py filename |
| `concept` | string | Short metadata summary |
| `goal` | string | What the learner is trying to achieve |
| `explanation` | string | Teaching explanation |
| `starterCode` | string | Original Python source used on selection/reset |
| `expected` | string | Expected-result guidance, not an executable assertion |
| `steps` | string[] | Ordered learner instructions |
| `hint` | string | Help for the activity |
| `challenge` | string | Extension task |
| `tryThis` | string | Suggested experimentation/creative idea |
| `teacherNote` | string | Adult-facing teaching guidance |

All baseline lessons have the same expected-result text: "Run the code and
compare the drawing with the goal." All share three steps: run the starter;
change one number, color, or command; run again and observe.

`LESSON_AR` contains **38 index-aligned objects**, translating every lesson
field above except `level` and `starterCode`. `LEVEL_AR` translates the ten
English level names. `lessonData(i)` merges the Arabic fields over the English
base when Arabic is selected, with the base available as fallback.

`docs` contains 16 initial entries plus 9 `extraDocs`, for **25** total.
Each entry has string fields `category`, `command`, `explanation`, and
`example`. `docCommand()` converts literal `\n` sequences in command labels
to actual newlines.

`examples` contains **13** objects with string fields `name` and `code`.
There are no stable content IDs or schema-validation layer.

### 5.2 Ordered lesson catalog

The "Goal / exercise" column summarizes the implemented content; exact starter
programs, hints, teaching notes, and Arabic copy remain in the arrays above.

| Lesson | Level | Title | Goal / exercise |
| --- | --- | --- | --- |
| 1 | 1 | Your First Line | `forward(100)`; compare distances 50, 150, 250 |
| 2 | 1 | Turn the Turtle | Draw a corner with 90-degree turns; experiment with 45, 60, 120 and left |
| 3 | 1 | Draw a Square Step by Step | Four manual forward/right pairs; enlarge or alter a side |
| 4 | 2 | Comments and Print Messages | `#` comments and `print()` output; add a personal message |
| 5 | 2 | Numbers and Text | Strings and arithmetic; compute a distance and print a message |
| 6 | 2 | Change Size with Variables | Square controlled by `size`; add color and pen-size variables |
| 7 | 2 | Color and Pen Variables | Text/numeric variables controlling color and thickness |
| 8 | 3 | Colorful Lines | Red, blue, green lines; choose other colors |
| 9 | 3 | Thick Lines | Purple square using `pensize(8)`; compare thickness |
| 10 | 3 | Fill a Shape | Red outline/yellow filled square; adapt to a filled triangle |
| 11 | 3 | Move Without Drawing | Two lines separated with penup/pendown; add a third |
| 12 | 4 | A Better Square with Loops | `for`/`range(4)`/indentation; adapt to triangle or hexagon |
| 13 | 4 | Triangle with a Loop | Three sides and 120-degree turns; change color/thickness |
| 14 | 4 | Pentagon and Hexagon | `angle = 360 / sides`; vary polygon sides |
| 15 | 4 | Shape Generator | Parameter-like variables for sides/size; try 36 sides of length 20 |
| 16 | 5 | True or False? | Print `size > 100` and `size == 100`; vary size |
| 17 | 5 | If: Choose a Color | Conditional red line when size exceeds 100 |
| 18 | 5 | If / Else: Big or Small Shape | Red or blue square based on size |
| 19 | 5 | Elif: Pick a Shape | Select polygon color using if/elif/else |
| 20 | 5 | Boolean Logic | Combine size and `use_red` with `and`; try `False` and `or` |
| 21 | 6 | Go to a Position | Coordinate-defined square; vary coordinates |
| 22 | 6 | Home and Heading | `home()` and `setheading()`; explore 90/180/270 degrees |
| 23 | 6 | Draw a Simple House | Combine square body and roof; add door/window |
| 24 | 7 | While Loop Counter | Square with a condition and incrementing counter |
| 25 | 7 | Stop the Loop Safely | Bounded loop; intentionally remove increment and practice Stop |
| 26 | 7 | Debug the Turtle: Missing Colon | Intentionally invalid `for i in range(4)`; add colon |
| 27 | 7 | Debug the Turtle: Indentation | Intentionally unindented loop body; fix indentation |
| 28 | 8 | Create a Square Function | Define/call `square(size)`; draw multiple sizes |
| 29 | 8 | Draw Many Squares | Function inside a rotation loop; change repetitions and angle |
| 30 | 8 | Draw Any Polygon Function | `polygon(sides, size, color)`; add calls and reposition |
| 31 | 9 | First List of Colors | Index a list of red/blue/green; add a fourth |
| 32 | 9 | Rainbow Polygon Art | Cycle colors with `% len(colors)` over 60 repetitions |
| 33 | 9 | Star | Five repetitions with 144-degree turns; compare 72 degrees |
| 34 | 9 | Spiral | 80 iterations of increasing distance and 91-degree turns |
| 35 | 9 | Flower | 36 circles of radius 60, rotated by 10 degrees |
| 36 | 10 | Draw a Robot Face | Square head, coordinate-positioned eyes/mouth; add features |
| 37 | 10 | Design a Turtle Scene | Filled sun and house body using a function; extend scene |
| 38 | 10 | Final Project | Open template; suggested 3 colors, loop, function, filled shape, pattern |

| Level | Exact English heading | Lessons |
| --- | --- | --- |
| 1 | Level 1: Meet the Turtle | 1-3 |
| 2 | Level 2: Values, Output, and Variables | 4-7 |
| 3 | Level 3: Colors, Style, and Pen Control | 8-11 |
| 4 | Level 4: Loops Make Magic | 12-15 |
| 5 | Level 5: Decisions and Logic | 16-20 |
| 6 | Level 6: Positions and Coordinates | 21-23 |
| 7 | Level 7: While Loops and Debugging | 24-27 |
| 8 | Level 8: Functions and Reuse | 28-30 |
| 9 | Level 9: Lists and Pattern Art | 31-35 |
| 10 | Level 10: Creative Projects | 36-38 |

Lessons 26 and 27 must initially fail: their invalid code is a deliberate
teaching fixture, not a starter-code defect. Lesson 37's goal mentions ground,
sun, and house, but its starter only supplies the sun and house body; scene
completion is left to the learner. Some teacher notes retain obsolete lesson
numbers; the array order, not prose numbering, determines actual numbering.

### 5.3 Example library

In selector order: First Line, Square, Triangle, Pentagon, Colorful Square,
Filled Shape, Star, Spiral, Flower, House, Robot Face, Rainbow Art, and
Final Project Template.

The examples are complete snippets using `import turtle`, turtle construction,
and `turtle.done()`. Names and source remain English in Arabic UI.
Loading an example is not course navigation and does not award completion.

### 5.4 Syntax reference

| Category | Documented syntax |
| --- | --- |
| Getting Started | `import turtle`, `t = turtle.Turtle()` |
| Movement | `t.forward(100)`, `t.backward(50)` |
| Turning | `t.right(90)`, `t.left(90)` |
| Pen Control | `t.penup()`, `t.pendown()` |
| Colors | `t.color("red")`, `t.pencolor("blue")`, `t.fillcolor("yellow")` |
| Thickness | `t.pensize(5)` |
| Speed | `t.speed(1)`, `t.speed(5)`, `t.speed(10)`, `t.speed(0)` |
| Position | `t.goto(50, 100)`, `t.home()`, `t.setheading(90)` |
| Circles | `t.circle(50)` |
| Filling | `t.begin_fill()`, `t.end_fill()` |
| Clearing | `t.clear()`, `t.reset()` |
| Hide and Show | `t.hideturtle()`, `t.showturtle()` |
| Loops | `for i in range(4):` with indented body |
| Variables | `size = 100`, `t.forward(size)` |
| Functions | `def square(size):`, function call |
| Multiple Turtles | Separate `turtle.Turtle()` instances |
| Print and Comments | `print("Hello turtle!")`, `#` comments |
| Math Operators | `+`, `-`, `*`, `/`, `%` |
| If Statements | `if`, `elif`, `else` |
| Comparisons | `==`, `!=`, `>`, `<`, `>=`, `<=` |
| Boolean Logic | `and`, `or`, `not` |
| While Loops | `while` condition and changing counter |
| Lists | List literals |
| List Indexes | Zero-based indexing and modulo-based color cycling |
| Strings | Quoted text values |

Search lowercases/trims the query and performs substring matching over the
concatenated category, normalized command, and explanation. It does not search
the full runnable example, rank results, tokenize, or translate queries.
An empty query shows all entries; no matches shows localized feedback.
Printing always includes all 25 entries regardless of the search filter.

The reference documents intended teaching coverage, not complete CPython or
Skulpt API compatibility. Python Turtle documentation is an external reference,
not proof that every desktop Turtle API is supported in this browser runtime.

## 6. Progress, stars, and badge semantics

`progress` is a `Set` of lesson indexes. Completed count is `progress.size`;
stars equal that count; progress-bar width is `count / lessons.length * 100%`.
There is no separate badge persistence: badges are derived from progress.

Each badge unlocks when **any one** listed lesson is completed, not all of them.

| Badge | Source zero-based indexes | Displayed lesson numbers |
| --- | --- | --- |
| First Line Badge | `0` | 1 |
| Shape Builder Badge | `2, 11, 12, 13, 14` | 3, 12, 13, 14, 15 |
| Loop Hero Badge | `11, 12, 13, 14, 23, 24, 31, 32, 33, 34` | 12, 13, 14, 15, 24, 25, 32, 33, 34, 35 |
| Color Artist Badge | `7, 8, 9, 16, 19, 30, 31` | 8, 9, 10, 17, 20, 31, 32 |
| Function Master Badge | `27, 28, 29` | 28, 29, 30 |
| Turtle Creator Badge | `35, 36, 37` | 36, 37, 38 |

Earned badges use an `earned` class, a checkmark, and localized unlocked text.
Locked badges show a generic completion prompt. Completing all valid lessons
produces 38 stars and 100%; a run alone produces neither.

## 7. Execution architecture

### 7.1 Dependencies and runtime configuration

Only `app.html` loads external executable dependencies:

```text
https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js
https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js
```

Both are blocking script tags in the head, before app initialization. The
landing page loads no external scripts, fonts, or image files. Font names are
CSS font stacks, not downloaded font dependencies.

The generated offline bundle (`offline/app.html`, see §12.2) loads the same
Skulpt 1.2.0 files from `offline/libs/` instead of the CDN; it is otherwise
identical to `app.html`.

Skulpt executes Python in the browser using `Sk.python3`,
`Sk.importMainWithBody("<stdin>", false, code, true)`, and
`Sk.misceval.asyncToPromise`. This is not a native Python installation,
Pyodide, or a Web Worker execution service.

| Configuration | Value / behavior |
| --- | --- |
| Normal execution limit | `45000` ms |
| Step execution limit | `900000` ms |
| Step callback limit | `6000`; callback 6001 throws |
| `yieldLimit` | `100` during configuration |
| Loop interruption | `killableWhile: true`, `killableFor: true` |
| Turtle target | `target` |
| Turtle size | Measured target/stage dimensions, floored, minimum 320 per axis |
| Turtle animation | `animate: true` |
| Standard-library reads | From `Sk.builtinFiles.files`; missing paths throw `File not found: ...` |
| Output | Append text to `out.textContent` |

These are configured limits, not verified wall-clock guarantees.

### 7.2 Run lifecycle

1. Check `Sk` and standard-library availability. On failure show an explicit
   internet/refresh message in Errors; do not attempt execution.
2. Increment `runToken`; choose editor code unless it is whitespace-only,
   in which case run `DEFAULT_CODE`, the blue-square sample.
3. For step mode, instrument code and retain its generated-to-original line map.
4. Record the active token, clear stop/timer/highlight state, save the draft,
   empty the target, and wait one animation frame.
5. Verify the target exists; otherwise show a drawing-readiness error.
6. Clear output, set errors to the literal `Running...`, activate Output,
   update debug guidance, and disable both Run buttons and both run selectors.
   Enable Stop.
7. Configure Skulpt, then execute asynchronously.
8. On success for the current token, clear highlights, append success text,
   set the no-errors success message, and show success debug styling.
9. On failure for the current token, render friendly error details and
   activate Errors.
10. Clean up the active timer/run marker and restore controls when the token
    is still current. Stale success/error results are ignored.

Whitespace-only execution uses the fallback without putting it into the
editor; saving/exporting still uses the actual editor contents.
Successful code execution never automatically completes a lesson.

### 7.3 Step-by-step implementation

Step mode is automatic delayed execution, not a manual Next/Continue debugger.
There are no breakpoints, variable inspection, call-stack viewer, or pause/resume.

`instrumentCode()` inserts an indented `__tl_step__(originalLineNumber)`
before eligible source lines. It skips blanks, comments, `elif`, `else`,
`except`, `finally`, decorators, and lines inside bracket/backslash
continuations. It tracks bracket depth using a lightweight
string/comment-stripping routine, not a Python parser.

The callback checks cancellation, counts steps, highlights the original editor
line and gutter, scrolls/focuses the editor, and shows the original line plus
a heuristic explanation. It suspends execution with a timer when supported.

| Speed label | Delay |
| --- | --- |
| Slow | 900 ms |
| Medium, default | 500 ms |
| Fast | 200 ms |

The delay is per callback, not per turtle animation frame. Instrumented body
lines recur in loops; a callback inserted before a loop header is not a Python
trace event for every condition evaluation. The feature must not be treated
as exact statement-level tracing for arbitrary Python syntax.

`extractErrorLine()` prefers the active line for time-limit errors, otherwise
the last traceback entry, then the last textual `line N` match. Generated
line numbers are mapped back to source when available.

### 7.4 Error presentation

Errors use an "Almost there!" heading, localized guidance, an optional
"Check line N" suffix, and expandable Technical details containing escaped raw
error text. A resolved line receives red editor/gutter styling and focus.

| Match, in evaluation order | Guidance category |
| --- | --- |
| `expected ':'` or `invalid syntax` | Syntax / missing colon |
| `indent` | Indentation |
| `attributeerror` | Unknown turtle command |
| `nameerror` | Unknown name / variable / missing quotes |
| `firstchild`, null-property error, drawing-readiness wording | Drawing surface readiness |
| `time` or `limit` | Execution taking too long / reduce loop |
| `stopped by user` | Stopped guidance |
| Otherwise | Generic check-and-retry guidance |

These are substring heuristics, not structured error-code classification.
Some errors may therefore receive broad or misleading advice. In particular,
Skulpt 1.2.0 reports both a missing colon and a missing indent as
`SyntaxError: bad input on line N`, which matches none of the specific rows,
so lessons 26 and 27 show the generic guidance plus "Check line N" and the
red line, not the colon/indentation guidance (GAP-25).

## 8. Drawing, coordinates, and exports

### 8.1 Drawing surface

`stage` contains Skulpt's `target`, a separate coordinate-overlay canvas, and
a small centered marker. The target is above the coordinate overlay; the
center marker is above both. Overflow is clipped with rounded borders.

With coordinates off, CSS supplies a center-aligned grid at 10 and 100 pixel
intervals. The turtle's intended origin is the center, positive x points
right, and positive y points up. Heading help describes 0 right, 90 up,
180 left, 270 down.

Clear Drawing empties target contents and resets error text to the initial
no-errors message. It does not clear the editor/output, change completion,
switch tabs, cancel an active run, or reset zoom/coordinates.
This differs from learner-code calls to `t.clear()` and `t.reset()`.

### 8.2 Zoom

Zoom buttons adjust by 0.1, rounded to one decimal place and clamped to
**0.5-2.5**: 50%-250% in 10-percentage-point increments. Reset returns to 100%.
The label displays the rounded percentage and has `aria-live="polite"`.

Zoom is a center-origin CSS transform on the target and coordinate overlay,
not a change to Python coordinates or Skulpt drawing dimensions. The stage
size stays fixed; enlarged content can be clipped. No pan, wheel zoom, pinch
handler, or fit-to-drawing calculation is implemented.

### 8.3 Coordinate helper

The XY button toggles the `coord-on` stage class and `aria-pressed`, updates
the button checkmark, saves its state, and shows a localized toast.
When enabled, it replaces the CSS grid with a device-pixel-ratio-aware overlay:

- Fine lines every 10 units, stronger minor lines every 50 units.
- Numeric labels and intersection dots every 100 units.
- Strong x/y axes, a marked origin labeled `(0, 0)`, and axis labels.
- High-contrast-specific colors.

The overlay redraws on zoom application, coordinate changes, contrast changes,
and window resize. It uses target/stage dimensions and does not alter Python
code or provide pointer coordinate readouts.

### 8.4 Copy and Python export

Copy attempts `navigator.clipboard.writeText()` and falls back on promise
rejection to selecting the textarea and `document.execCommand("copy")`.
It shows a copied toast. Clipboard permissions and secure-context policy can
affect behavior; fallback success is not checked.

Python export uses a Blob with type `text/x-python`, an object URL, and a
temporary anchor. The filename is the selected lesson's **English** title,
lowercased, with non-ASCII-alphanumeric runs replaced by underscores and edge
underscores removed, plus `.py`; empty names fall back to `turtle_lab.py`.
The content is exactly the editor draft, not a reconstructed starter.
The object URL is revoked after the click. Exporting an example still uses
the selected lesson's filename.

### 8.5 PNG export

Save PNG collects canvas/SVG descendants of the stage **excluding
`coordOverlay`**. If no drawing layers exist, it shows "Run a drawing first."
The output canvas uses stage bounding dimensions multiplied by device pixel
ratio, a white background, and a synthetic green grid every 40 CSS pixels.

Layers are sorted by parsed z-index, positioned from their current bounding
rectangles relative to the stage, and composited. SVG layers are cloned,
serialized, loaded as images, and drawn. The file is named
`turtle-lab-drawing.png` via a PNG data URL.

The export reflects transformed layer geometry, but it is not an exact
screenshot: it omits coordinate axes/labels, the DOM center marker, and CSS
chrome, and its 40-pixel grid differs from the on-screen grid. There is no
whole-drawing/offscreen export or export settings dialog.

## 9. Persistence and initialization contract

All persistence is `localStorage`, scoped by browser origin/storage policy.
There are no cookies, database, network save requests, or cross-device sync
in the app source. Different browser profiles, origins, ports, and
private-browsing contexts need not share data. `file:` storage behavior is
browser-dependent.

| Key | Stored representation | Default / consumer |
| --- | --- | --- |
| `turtleLabLandingLanguage` | `en`, `ar`, or `both` | `both`; landing only; invalid values normalize to `both` |
| `tl.code.v1` | Raw editor source string | Selected starter when no nonempty saved draft exists |
| `tl.lesson.v2` | Numeric zero-based index serialized as string | `0`; nonfinite/out-of-range values reset to 0 |
| `tl.progress.v2` | JSON array of completed indexes | `[]`; parsed into a Set |
| `tl.hc.v1` | `true` / `false` strings | Off unless exactly `true` |
| `tl.lang.v1` | `en` / `ar` | `en`; unknown language falls back to English |
| `tl.side.v1` | `1` collapsed / `0` expanded | Expanded unless exactly `1` |
| `tl.runMode.v1` | `normal` / `step` | `normal` |
| `tl.stepSpeed.v1` | `900`, `500`, or `200` | `500` |
| `tl.zoom.v1` | Numeric scale string | `1`; nonfinite/out-of-range values reset to 1, then rounded/clamped |
| `tl.coords.v1` | `1` on / `0` off | Off unless exactly `1` |

`save()` writes immediately and shows a localized Saved prefix plus a local
hour/minute timestamp. Initialization later displays the generic autosave
message. There is no debounce, revision history, unsaved-change warning,
multi-tab conflict resolution, or storage migration routine.

`safeParse()` tolerates malformed JSON and non-array progress values but
does not validate individual indexes. Empty-string drafts are not preserved
as empty after reload because resume uses truthiness. Fractional lesson
indexes inside the valid numeric range are not rejected by the initial guard.
Invalid mode/speed strings are not explicitly normalized against option values.
Storage access itself is not wrapped for denied access or quota exceptions.

## 10. Localization and accessibility

### 10.1 Landing language behavior

English, Arabic, and Both toggle visibility of `.en` and `.ar` blocks.
`setLanguageView()` writes `data-view` to `main` and `body`, sets root
`lang`/`dir` to `ar`/`rtl` for Arabic and `en`/`ltr` otherwise, persists the
choice, and updates button `aria-pressed`. Both displays English and Arabic
content together and uses English/LTR document defaults.

Not every string is language-tagged: navigation, some labels, code,
attribution, footer copyright, and bilingual CTA text remain shared or
English. There is no cross-page language synchronization.

### 10.2 App language behavior

The app offers only English or Arabic. `applyLang(true)` updates visible UI
strings, direction, lesson content, example selector, docs, progress, and
badges while preserving the editor draft. `T()` falls back in order:
selected DEBUG dictionary, English DEBUG dictionary, selected UI dictionary,
English UI dictionary, then the key itself.

Arabic translates lesson prose and level headings, but Python source,
example names, syntax categories/explanations, print title, cursor
`Line N, Column N`, and some static accessibility labels remain English.
Existing output/error contents are not comprehensively retranslated when
the language changes. `Running...` is a literal English status.

Code, output, and preformatted examples remain LTR in Arabic UI. The editor
gutter moves to the right with matching textarea/highlight padding.

### 10.3 Existing support and limits

Existing support includes semantic buttons/selects/textarea, a labeled code
editor, a screen-reader-only app language label, run-mode/speed labels,
landing skip navigation, visible navigation focus states, collapsible sidebar
`aria-expanded`, XY `aria-pressed`, hidden decorative/highlight canvases, and
the live zoom label.

High contrast toggles a persisted `body.hc` theme for the app; it is not
available on the landing page. The landing page respects reduced motion for
smooth scrolling and CTA transitions. The app has no equivalent comprehensive
reduced-motion treatment.

Tabs are class-based buttons, not a full ARIA tablist/tab/tabpanel interaction
pattern. Progress lacks semantic progress attributes. Toasts are not live
regions; debug/status changes have limited screen-reader announcement.
Some select/search labels and focus treatments need review. Step execution
repeatedly focuses the editor; Tab inserts spaces instead of navigating out.
No formal keyboard-trap assessment or WCAG conformance is established.

## 11. Visual, responsive, and print requirements

The visual language is child-friendly: turtle emoji, rounded cards/buttons,
soft sky/mint/yellow accents, gradients, shadows, readable headings, dark
monospace editing/output areas, and encouraging feedback. No image assets
or official technology logos are used.

### 11.1 Landing page

The content shell has a maximum width of 1180px. Desktop uses a sticky,
translucent header, multi-column hero/content grids, and smooth anchors
with a 96px section scroll margin.

| Breakpoint | Effective adjustments |
| --- | --- |
| Width <= 1040px | Wrapped header; navigation below controls; hero, split layouts, and all content grids become single-column; footer stacks |
| Width <= 640px | Narrower margins, less section padding, hidden brand tagline, full-width language controls and CTA buttons, horizontally scrolling no-wrap navigation, simplified step-card spacing |

### 11.2 App

Later CSS blocks override earlier layout declarations. Read the full cascade
before changing dimensions; early values are not always effective.

| Width/state | Effective layout |
| --- | --- |
| Above 1180px | Sidebar `minmax(230px,18rem)`, editor `minmax(360px,1fr)`, drawing `minmax(380px,1fr)`; learning area under editor/drawing |
| Above 1180px, collapsed | Sidebar track 68px; editor/drawing retained |
| 861-1180px | Sidebar `minmax(220px,280px)` plus one main column; drawing below editor in column 2; learning area spans both |
| 861-1180px, collapsed | Sidebar track 68px plus main column |
| <= 860px | One-column flow; static header; sidebar list max-height 260px; drawing/learning area in column 1; debug controls stack |

The shell uses full available width and 10-18px clamped padding. Desktop
sidebar height is `calc(100dvh - 128px)` capped at 860px; collapsed desktop
sidebar is sticky at 96px. The editor viewport is fixed at 402px, with
16px monospace text, 24.8px line height, 15px top padding, and a 56px gutter
allowance shared by text/gutter/highlights.

The drawing stage is `clamp(420px,58dvh,640px)` with a 420px minimum above
860px. On smaller screens it is 430px with a 380px minimum. Output/error
panels have a 112px minimum and 230px maximum height, reduced to a 190px
maximum on smaller screens. Learning panels scroll at a 430px maximum.

Print styles hide header, grid workspace, tabs, and learning heading, then
show the separate syntax sheet. Interactive screen and print layouts are
different deliverables.

## 12. Technical organization and operating constraints

### 12.1 Source map for agents

Line ranges refer to the reviewed baseline and will drift after edits.
Function/constant names are better long-term search anchors.

| Source surface | Baseline location / symbols |
| --- | --- |
| Landing styling and language visibility | `index.html` styles, lines 10-795 |
| Landing structure/content | `index.html` lines 798-1303 |
| Landing behavior | `setLanguageView`, `savedView`, year update, lines 1305-1339 |
| App styling and successive overrides | `app.html` lines 8-1248 |
| App markup and accessible control IDs | `app.html` lines 1250-1260 |
| Content and storage keys | `DEFAULT_CODE`, `lessons`, `LESSON_AR`, `LEVEL_AR`, `docs`, `extraDocs`, `examples`, `K`, lines 1262-1274 |
| Localization dictionaries | `I18N`, `DEBUG_I18N`, lines 1275-1282 |
| DOM/state/utilities | `$`, `E`, `safeParse`, limit constants, state, `esc`, `toast`, `tab`, `runTab`, `T`, lines 1283-1292 |
| Debugger/highlights/instrumentation | `updateDebugControls`, `lineExplanation`, `renderEditorLines`, `instrumentCode`, `extractErrorLine`, `installStepBuiltin`, lines 1294-1308 |
| Localization and learning UI | `applyLang`, `buildLessons`, `buildExamples`, `buildDocs`, `loadLesson`, lines 1309-1315 |
| Saving/progression/badges | `save`, `cursor`, `progressUI`, `complete`, `badges`, `resetProgress`, lines 1316-1322 |
| Drawing/zoom/coordinates | `resetCanvas`, `clampZoom`, `applyZoom`, `drawCoordinateOverlay`, `applyCoordinates`, `clearDrawing`, lines 1323-1332 |
| Python lifecycle and errors | `output`, `builtinRead`, `nextFrame`, `run`, `friendly`, `stop`, `setRun`, lines 1333-1341 |
| Export/integration/startup | `copyCode`, `py`, `imgFromSvg`, `png`, `bind`, `init`, lines 1342-1348 |
| Offline bundle generation | `tools/build-offline.mjs` (`LIBS`, `offlineHtml`); output in `offline/` |

`E` caches key DOM elements. Script-level state holds the current lesson,
completion set, run token/cancellation state, step timer/map/count,
highlight state, zoom, coordinate visibility, and language. Handlers mutate
the DOM directly. This is not a component architecture with a centralized
reactive store.

### 12.2 Hosting and local operation

The tracked implementation has two HTML pages, README, and MIT license;
there is no build pipeline, application server, API configuration, or service
worker. A `package.json` exists for dev-only tooling (the Playwright test
suite in `tests/`, run with `npm test`); the site never requires `npm install`. README's suggested `assets/` and
`images/` structure is not the current implementation.

The only build-like step is `node tools/build-offline.mjs`, which generates
`offline/`: `offline/app.html` (a copy of `app.html` whose two Skulpt script
tags point to `libs/`), `offline/libs/` (vendored Skulpt 1.2.0 files and
license, SHA-256 verified), and `offline/README.txt`. The folder can be copied
and opened by double-clicking `offline/app.html` with no network access.
`tools/check.mjs` fails if `offline/app.html` is stale or a library hash
differs. Because browser storage is per origin, the offline copy (a `file://`
origin) does not share progress or drafts with the hosted site.

Open `index.html` directly for a basic entry point, or serve the repository
using a local static HTTP server such as `python -m http.server 8000`, then
open `http://localhost:8000`. HTTPS/localhost is preferable for Clipboard API
behavior. Static hosting must preserve both relative page paths.

JavaScript is required for the coding environment and dynamic language
controls. The root `app.html` still needs CDN access to obtain Skulpt and has no
local fallback; offline use is supported only through the generated
`offline/` bundle. There is no service worker or installable PWA.

Modern browser features include async functions, promises, optional chaining,
`matchAll`, Set, Blob/object URLs, SVG serialization, Canvas 2D, CSS grid,
CSS variables, clamp/min, and dynamic viewport units. Recommended browser
names on the landing page are not a verified version-support matrix.

### 12.3 Privacy, trust, and licensing

The source defines no account system, telemetry pipeline, tracking pixel,
or backend submission of code. Code/progress remain in local storage unless
the user copies or exports them. Shared-device users therefore share the
same draft and completion history in the same browser context.

CDN script requests still contact a third party, and those scripts execute
in the page context. No SRI hashes, CSP configuration, or network-isolation mechanism are
declared in these files. The vendored copies in `offline/libs/` are checked
against pinned SHA-256 hashes by the build and `tools/check.mjs`.
Client-side execution is not a claim of a hardened sandbox or a
children's-privacy compliance assessment. Evaluate runtime capabilities
before adding untrusted-code sharing or classroom management.

Dynamic lesson/doc/error HTML generally uses `esc()` for text interpolation;
print output uses `textContent`. Preserve these rendering boundaries.
Do not replace them with raw HTML insertion for learner input.

Project code is MIT-licensed, copyright 2026 sa-ala. Skulpt and other
third-party material retain their own licensing obligations. Credits state
no official affiliation with Python, the PSF, Skulpt, or Pyodide; Pyodide is
mentioned for disclaimer purposes, not used as the runtime.

## 13. Known limitations and enhancement decision points

The following are source-derived observations, not fixes made by this
documentation change. Browser-dependent effects must be reproduced before
filing or implementing a fix.

| ID | Observation | Impact / decision for future work |
| --- | --- | --- |
| GAP-01 | One draft slot; replacing code has no confirmation or draft history | Lesson/example changes can overwrite work; choose a draft model and migration before adding projects |
| GAP-02 | Empty saved drafts restore the starter; fractional lesson indexes and progress members lack full validation | Add explicit storage schemas, recovery behavior, and migrations if hardening persistence |
| GAP-03 | Storage get/set operations can throw; no quota/denial UI exists | Plan explicit user-visible failures rather than claiming durable save |
| GAP-04 | Run has no active-run guard; keyboard shortcut can invoke it while Run buttons are disabled | Token checks suppress stale completion UI, but concurrent Skulpt globals/output are not isolated |
| GAP-05 | Editing, lesson switching, reset, clear, and language controls remain usable during execution | Visible code/lesson may diverge from executing code; decide whether to lock, snapshot, or cancel |
| GAP-06 | Stop is cooperative; clearing an active suspension's timer leaves its promise unsettled | Verify stop/restart/timer lifecycle; do not assume the old interpreter was terminated |
| GAP-07 | Stop's delayed target reset is not token-guarded | Starting another run within 150ms can have its drawing target cleared by the previous stop |
| GAP-08 | Source rewriting is not parser-aware across all Python syntax, notably multiline/triple-quoted strings and decorator relationships | Compare Normal and Step semantics before broadening supported Python constructs |
| GAP-09 | `lineExplanation()` matches generic function calls before `print()` | Printed lines can receive the function explanation instead of the dedicated output explanation |
| GAP-10 | Debug Help says blue is running; current-line CSS is a green/blue gradient | Align explanatory copy and visual semantics if refining debugger UX |
| GAP-11 | Syntax Try it does not clear previous error/current highlight or debug status | Replaced code can retain stale highlights/status |
| GAP-12 | Clipboard fallback runs on write rejection, but a missing Clipboard API short-circuits the optional chain | No fallback copy/toast occurs when `navigator.clipboard` itself is absent; fallback result is also unchecked |
| GAP-13 | PNG catches per-layer drawing failures and can still report success | A download may be incomplete; define explicit partial/failure behavior |
| GAP-14 | PNG omits coordinates and uses a different grid; it captures the stage viewport rather than complete artwork | Decide whether export should preserve visual overlays, be clean artwork, or offer both |
| GAP-15 | Resize redraws the overlay, not existing Skulpt dimensions | Verify coordinate/drawing alignment after orientation or layout changes |
| GAP-16 | Landing navigation/static labels and app syntax/example content are not fully localized | Define the intended bilingual completeness before expanding translation scope |
| GAP-17 | Landing English How It Works cards lack `.en` on their containers | Arabic-only view hides their text but can leave empty decorated step cards and affected step numbering |
| GAP-18 | Landing selector `[data-view="ar"] body` has no matching ancestor because `data-view` is on body/main | Its intended whole-body Arabic font rule does not apply; explicit `.ar` fonts still apply |
| GAP-19 | Many static ARIA labels, cursor wording, and print heading remain English | Include assistive text and print output in localization work |
| GAP-20 | Completion is unchecked and badge rules use positional indexes | Reordering lessons can change saved progress/badge meaning; stable IDs require a migration |
| GAP-21 | Some teacher notes use old numbering; several early starters introduce loops before the formal loops level | Review pedagogy separately from fixing runtime behavior |
| GAP-22 | Class-only tabs, nonsemantic progress, limited live status, and intercepted Tab | Accessibility work needs defined interaction and announcement requirements |
| GAP-23 | No verified browser matrix or performance budgets. Automated Chromium smoke tests and CI were added by F-001 (`tests/`, `npm test`) | Extend coverage per §14; add other browsers or budgets only with explicit scope |
| GAP-25 | `friendly()` never shows the missing-colon or indentation guidance: Skulpt 1.2.0 reports both as `SyntaxError: bad input on line N` (found by F-001 tests) | Lessons 26/27 still fail with "Check line N" and a red line, but the teaching message is generic. Pinned by `test.fail()` tests in `tests/app.spec.js` |
| GAP-24 | Root `app.html` is CDN-only with no loading state/retry control or local fallback (a separate generated `offline/` bundle exists) | Dependency failure is detected on Run; classroom/offline reliability needs explicit scope |

## 14. Test-planning reference

This section is a coverage map for test plans. The automated suite in
`tests/` (F-001) currently covers landing languages, first app load, every
lesson starter and example, teaching errors, step execution and Stop, Arabic
localization, progress, and the offline bundle; the remaining rows are not
yet automated. Separate existing behavior from proposed fixes
for the limitations above.

| Area / requirement | Minimum observable checks |
| --- | --- |
| Landing navigation | Every internal anchor resolves; all app CTAs reach `app.html`; external references use correct URLs/new-tab isolation; preview CTA does not preload code |
| Landing languages | Clean default Both; English/Arabic/Both visibility, root direction/language, pressed states, reload persistence, invalid preference normalization; inspect GAP-17/18 |
| First app load / resume | Clean defaults, 38 selectable lessons, 10 headings, 13 examples, 25 docs; restore draft/lesson/preferences; drawing/results not persisted |
| Lesson content | Matching titles/metadata/prose/starter on sidebar and selector changes; no automatic run/advance; complete lesson overlays in both languages |
| Teaching errors | Lesson 26 missing colon and lesson 27 indentation fail intentionally; corrected versions draw the square |
| Code editing | Immediate storage write, gutter line count, caret line/column, scroll alignment, four-space Tab replacement, reset behavior, no implicit outdent |
| Code replacement | All 13 examples and 25 Try it samples replace/save draft without lesson navigation; reset restores current starter; identify stale highlight case |
| Normal execution | First line, square, loops, conditionals, functions, lists, multiple turtles, print output, empty/whitespace fallback; success does not grant completion |
| Step execution | Delays 900/500/200ms, speed control hidden in Normal, control disabling, original-line mapping, multiline expressions, repeated body highlights, focus/scroll behavior |
| Execution boundaries | Configured 45000/900000ms limits and 6000 callbacks; callback 6001 errors; measure actual behavior with deterministic fixtures and tolerances rather than hard wall-clock assumptions |
| Error handling | Syntax/indent/name/attribute/time/default categories, expandable escaped raw details, red source-line mapping, CDN failure, missing drawing target |
| Cancellation / concurrency | Stop during drawing and step delay, rerun after stop, repeated keyboard Run, clear/reset/lesson/language changes during run; inspect token/timer races |
| Drawing clear | Clears target/error text but preserves code, output, selection, progress, zoom and coordinates |
| Zoom boundaries | Repeated decrement/increment clamps at 50%/250%, intermediate 10-point changes, reset 100%, persistence, centered overlay/drawing alignment |
| Coordinates | Off/on state/ARIA, origin and sign conventions, 10/50/100 spacing, high contrast, zoom, resize, pixel ratios 1 and 2 |
| Progress | Self-complete without running; no duplicate stars; all 38 => 38 stars/100%; each badge's OR condition, reset confirm/cancel, retained draft/preferences |
| Syntax search | Empty query, mixed case, whitespace trim, matching category/command/explanation, example-only text excluded, no-match text, Arabic query limitations |
| Export | Exact draft in .py with English-derived filename; clipboard permitted/rejected/absent; PNG no-layer guard, canvas/SVG layers, grid/overlay contract, zoom and DPR |
| Localization | LTR code/output in RTL layout, right gutter, translated lesson panels and controls, preserved draft, independent landing/app preferences, known untranslated strings |
| Responsive layout | Widths around 640/860/1040/1180 boundaries, collapsed/expanded sidebar, narrow screens, long code/content, orientation changes, print-only sheet |
| Accessibility | Keyboard/focus traversal, Tab escape behavior, ARIA state correctness, screen-reader labels/status, zoom announcement, contrast, reduced motion, print readability |
| Persistence resilience | Malformed JSON, non-array progress, duplicate/invalid indexes, fractional selection, invalid mode/speed/zoom, empty draft, storage denial/quota, multiple tabs |

Use isolated storage contexts for independent scenarios and named fixtures for
intentional errors, infinite loops, nested/multiline Python, and export layers.
Assert DOM/state/content contracts before relying on pixel screenshots.
Allow for asynchronous turtle animation, promise settlement, browser download
policies, and print dialogs.

Tests should distinguish three separate outcomes: **Python execution succeeded**,
**the drawing matches the learner's goal**, and **the learner marked the lesson
complete**. Only the first and third have implemented app status mechanisms;
drawing-goal correctness has no built-in evaluator.

## 15. Change guidance for future agents

Before implementing a feature, map it to the relevant rules and limitations
above and identify any behavior intentionally being changed. Do not treat
README suggestions or gaps as approval to add unrelated scope.

| Change type | Surfaces that must remain consistent |
| --- | --- |
| Add/reorder/remove lessons | `lessons`, aligned `LESSON_AR`, `LEVEL_AR`, starter/error expectations, badge index rules, persisted lesson/progress semantics, counts in this spec |
| Add syntax entry/example | Content arrays, search/print behavior, bilingual expectations, execution compatibility, inventories |
| Add user-facing control | Markup ID, `E` cache when needed, handler binding, `applyLang`, both translation dictionaries, keyboard/ARIA, responsive and contrast styles |
| Change run/debug behavior | Run lifecycle, Skulpt configuration, source maps, timer/cancellation cleanup, button states, friendly errors, Normal/Step parity |
| Change editor geometry | Textarea, rail, highlight padding/font/line height, RTL overrides, scroll/focus logic |
| Change drawing behavior | Skulpt target sizing, CSS transforms, coordinate overlay, resize behavior, PNG composition and high contrast |
| Change persistence | Explicit key/schema/version policy, migration and invalid-data behavior, shared-device and multi-tab implications |
| Change product claims | Landing copy in both languages, README, dependency/offline/privacy claims, this specification |

Preserve English Python source and safe text rendering unless a deliberate
requirement changes them. Prefer targeted modifications over unrelated
framework migration; the current architecture is two standalone static pages.
New architecture, grading, accounts, per-project persistence, comprehensive
offline support, or automated tracing require explicit design decisions rather
than assumptions about the current product.
