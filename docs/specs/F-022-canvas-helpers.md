# F-022: Canvas helper tools (pointer coordinates and turtle state)

| Field | Value |
| --- | --- |
| Status | Done |
| Priority | P2 |
| Size | M |
| Depends on | F-010 (Variables panel), F-013 (a11y baseline) |
| Related gaps | GAP-15 (resize/overlay alignment, must not regress) |
| Owner / agent | |

## Problem
Positions and angles are the main stumbling block in the early levels. For example, a learner asks "how far right do I need to `goto`?" or "which way is the turtle facing now?". Today the XY overlay (SPEC §8.3) draws a labelled grid, but it "does not provide pointer coordinate readouts". The only way to learn where the turtle ended up is to `print(t.position())`. The F-010 Variables panel (SPEC §7.3) lists `int`/`float`/`str`/`bool`/`list` globals but skips turtles, so the turtle's own state is invisible.

## Goals
- When the pointer (mouse, pen or touch) is over the stage, show its position in turtle coordinates.
- Show each turtle's state (position, heading, pen up/down, pen color, fill color) after a run and at every step in Step mode.
- Work with zoom, high contrast, RTL, and the 860 px and 1180 px breakpoints. Keep axe free of serious or critical issues.

## Non-goals
- No click-to-insert-code (`goto(x, y)` into the editor). Possible follow-up.
- No measuring tools (ruler, protractor).
- No change to Python coordinates, Skulpt drawing dimensions, zoom behavior or PNG export (GAP-14 stays separate).
- No live readout during Normal runs. Normal runs update the readout only when they end.

## User experience

**Pointer coordinates.** A new toggle button "📍 Pointer" sits next to the XY button in the canvas toolbar. When it is on and the pointer moves over the stage, a small chip near the pointer shows `(x, y)`, rounded to whole units. The chip flips to stay inside the stage near its edges. It hides when the pointer leaves, and on touch it shows while the finger is down. The chip text is always LTR, even in Arabic. It works whether XY is on or off. With the keyboard, the readout is not needed: the turtle state panel provides the same information.

**Turtle state.** A collapsible "🐢 Turtle" section below the stage (closed by default) shows, after any run and at every step in Step mode:

| Field | Shown as |
| --- | --- |
| Position | `(120, -45)`, rounded to 1 decimal place |
| Heading | `90°` plus a direction word for 0/90/180/270 (right/up/left/down) |
| Pen | down / up |
| Pen color, fill color | color swatch + the value (`"red"`, `#ff8800`, `(1, 0.5, 0)`) |

If the program uses more than one turtle, each one appears under its global variable name, up to 4, followed by "+N more". Turtles that are not stored in a global variable are not listed. If there are none, the block shows "No turtle yet".

| Key | en | ar |
| --- | --- | --- |
| `pointerToggle` | Pointer | المؤشر |
| `pointerToggleLabel` | Show pointer coordinates on the canvas | إظهار إحداثيات المؤشر على اللوحة |
| `pointerOn` | Pointer coordinates on | إحداثيات المؤشر مفعّلة |
| `pointerOff` | Pointer coordinates off | إحداثيات المؤشر متوقفة |
| `turtleState` | Turtle | السلحفاة |
| `turtleNone` | No turtle yet | لا توجد سلحفاة بعد |
| `turtlePos` | Position | الموقع |
| `turtleHeading` | Heading | الاتجاه |
| `turtlePen` | Pen | القلم |
| `penDown` | down | للأسفل |
| `penUp` | up | للأعلى |
| `turtleColor` | Pen color | لون القلم |
| `turtleFill` | Fill color | لون التعبئة |
| `dirRight` / `dirUp` / `dirLeft` / `dirDown` | right / up / left / down | يمين / أعلى / يسار / أسفل |
| `turtleMore` | (n) => `+${n} more` | (n) => `+${n} أخرى` |

RTL: the panel follows the page direction, but values (coordinates, colors, degrees) are wrapped in `dir="ltr"` / `<bdi>`. High contrast: the chip uses the `body.hc` foreground and background with a solid border, and swatches get a 1 px outline. Below 860 px the toggle wraps with the existing canvas toolbar, and the chip is placed above the finger.

## Technical design
- **Mapping:** add `stageToTurtle(clientX, clientY)`. It uses the target's bounding rectangle, so the zoom transform is already applied, and the Skulpt width and height: `x = (px - rect.left - rect.width/2) / zoom`, `y = (rect.top + rect.height/2 - py) / zoom`. It reuses the size and zoom logic of `drawCoordinateOverlay()` / `applyZoom()` rather than duplicating constants.
- **Pointer chip:** a new `<output id="pointerCoords" aria-hidden="true">` inside `#stage`. It is visual only and not announced on every move, which would be noisy. A new button `#pointerToggle` with `aria-pressed`. The chip is positioned with pointer events (`pointermove`, `pointerleave`, `pointerdown`), throttled with `requestAnimationFrame`. Stage clicks are not captured, so F-023 event programs still receive them.
- **Turtle state:** add `renderTurtles()`, called wherever `renderVars()` runs (each step suspension, run end, Stop). It scans `Sk.globals` for values whose `tp$name` is `Turtle` and reads `position()`, `heading()`, `isdown()`, `pencolor()` and `fillcolor()` with `Sk.misceval.callsimArray` in try/catch. As implemented, the panel reads the same state straight from the JS turtle object (`$xcor`, `$ycor`, `$heading`, `_down`, `_color`, `_fill`), so it makes no Python calls and queues no animation. All values go through `esc()`. The new markup is `#turtlePanel`, `#turtleList` and `#turtleNone` inside or next to `#varsPanel`.
- **Strings:** the keys above go in `I18N` en/ar and are applied in `applyLang()`.
- **Storage:** the pointer toggle persists like XY: `K.pointer = "tl.pointer.v1"`, `1` on / `0` off, off unless exactly `1`.
- **Run/step impact:** read-only. `renderTurtles()` runs only for the current `runToken`. There are no new timers.
- **Dependencies:** none.

## Acceptance criteria
1. With Pointer on, hovering the stage center shows `(0, 0)` ±1, and hovering 100 units right of center shows `(100, 0)` ±1 at zoom 100%, 50% and 200%.
2. The chip stays inside the stage at all four corners and disappears on `pointerleave`.
3. In Arabic the toggle label and toast are Arabic and the chip still reads `(x, y)` left to right.
4. The Pointer state persists across reload. A malformed stored value falls back to off.
5. After running `t.goto(50, 60); t.left(90); t.penup(); t.color("red")`, the turtle panel shows position `(50, 60)`, heading `90°` up, pen up and pen color red.
6. In Step mode the turtle panel updates at every step and matches the highlighted line.
7. A program with two global turtles lists both by variable name. A program without turtles shows "No turtle yet".
8. Running, stopping and running again never shows the previous run's turtle.
9. axe reports no serious or critical issues with the toggle on and the panel populated, in both languages and in high contrast.

## Test plan
- New `tests/canvas-helpers.spec.js`: pointer mapping at three zoom levels (dispatch `pointermove` at computed client points), edge clamping, Arabic LTR chip, the turtle panel after a Normal run, at a paused step, with multiple turtles and with none, and stale panel after Stop/Run.
- `tests/storage.spec.js`: a malformed `tl.pointer.v1` case.
- `tests/a11y.spec.js`: add the new states.
- Manual: touch on a phone-width viewport (< 860 px), high contrast in both languages, window resize with Pointer on (GAP-15).

## Documentation updates
- [ ] SPEC.md §8.3 (pointer readout), §7.3 (turtle panel), §9 storage keys, §4.4 if the debug area changes, baseline table
- [ ] README feature list (both languages, if listed)
- [ ] docs/ROADMAP.md status

## Open questions
1. Should Pointer be on by default for first-time visitors? **Recommended: off**, so the canvas stays uncluttered. The lesson text can point to it.
2. Should the turtle panel show only in Step mode, as the Variables panel does today, or also after Normal runs? **Recommended: also after Normal runs**, collapsed under a "Turtle" disclosure.
