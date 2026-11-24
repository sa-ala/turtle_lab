# F-024: Robot Buddy (an animated, customizable guide)

| Field | Value |
| --- | --- |
| Status | In progress (PR 1–2 done) |
| Priority | P2 |
| Size | L epic (3 PRs) |
| Depends on | F-013 (a11y baseline), F-014 (localization), F-019 / F-020 (lesson-first layout, card and editor header bar) |
| Related gaps | — |
| Owner / agent | |

## Problem
A first-time learner opens `app.html` and sees the full workspace at once: course sidebar, lesson card, editor with its Run group, drawing, results and seven learning tabs (SPEC §3.3). Nothing explains where to start or what each area is for. SPEC §4.1 describes the first visit as "load lesson 1 and wait". Kids aged 10–18, especially the younger ones, need a friendlier start. After that, the app reacts to milestones only with a short toast (`complete()` in SPEC §4.2) and badges that change silently (SPEC §6).

## Goals
- A **baby robot buddy**, drawn as an inline SVG with CSS animations, that lives in a corner dock and gives the app a friendly character.
- A short, skippable **welcome tour** on the first visit that introduces the main areas. The robot hops next to each one.
- **Contextual tips and celebrations** after the tour: first run, first error, lesson completed, badge earned, new level, and an occasional idle nudge.
- Learners can **customize** the robot's name, body color and parts. **Badges unlock extra parts.** The choices are saved locally like progress.
- Learners can **drag the robot** anywhere in the app (mouse, pen or touch), or move it with the keyboard. Its new spot becomes its home and is remembered.
- Full parity with the rest of the app: English and Arabic (RTL), high contrast, reduced motion, keyboard and screen reader, < 860 px, offline, print.

## Non-goals
- No voice or text-to-speech, no sound effects, no AI chat. The robot says only fixed, bilingual strings.
- No auto-grading or code analysis. Tips react to app events (run succeeded or failed, lesson marked done), never to the meaning of the learner's code (D3, AGENTS §8).
- No landing-page robot (possible follow-up).
- No accounts, sync or sharing of the robot. The name stays in local storage (rule 5).
- No change to lessons, badge rules, progress semantics, run lifecycle or Step-mode behavior.
- No free roaming. The robot moves by itself only when it has something to say; otherwise it stays where the learner put it.

## User experience

### The robot and its dock
- A ~72 px robot (~56 px below 860 px) sits in a fixed dock at the **bottom-right** (LTR) or **bottom-left** (RTL), above the footer and below the toast. It never shifts the page layout.
- Default look: round head, two round eyes, a bulb antenna and a teal body. Default name **Robo / روبو**.
- Idle animation: a blink every few seconds and a small bob every other blink. Both are short, timer-driven animations: an always-running CSS animation made every page slow to respond under load (found in PR 1), so there is no continuous bob and no antenna glow. Moods: *wave* (hello, tour start), *happy bounce* (celebrations), *head tilt* (error or thinking).
- **Reduced motion** (`prefers-reduced-motion: reduce`): no bob, no bounce and no flying. The robot fades out and back in at its new position, and blinking stays.
- **High contrast**: solid dark outline, the bubble uses the high-contrast palette, no reliance on color alone.
- **Print**: the dock, bubble and menu are hidden.

### Moving the robot yourself
- **Drag**: press on the robot and drag it (mouse, pen or touch). It follows the pointer with a little "carried" pose (legs dangling) and lands with a small bounce where it is dropped. A press that moves less than 6 px is a click and opens the menu as before.
- **Home**: the drop point becomes the robot's new **home**. Hops return there, and the welcome tour and tips start from there. The position persists across reloads.
- **Stays visible**: the robot is kept fully inside the window while dragging and after a resize or zoom. The position is stored as a fraction of the window (`x`, `y` from 0 to 1), so it adapts to other window sizes. Switching language does not move a custom position. Only the default corner mirrors.
- **Keyboard alternative** (WCAG 2.5.7): **Move robot** in the robot menu enters move mode. Arrow keys move it 16 px (Shift + arrow: 64 px), and Enter or Esc finish. The bubble shows "Use the arrow keys to move me. Press Enter when done.", and a screen-reader announcement confirms "Robot moved".
- **Return to corner** in the robot menu clears the custom position. It appears only when a custom position is set.
- Dragging is disabled during the welcome tour and while the robot is hopping. If a tip arrives during a drag, it waits until the drop.
- **Reduced motion**: dragging still works, without the landing bounce.

### Hopping and the speech bubble
- When the robot speaks about a control, it **hops** next to it with a short CSS transform animation (Run button, lesson card, error line, Badges tab, …). If the control is off screen, it scrolls into view first. A speech bubble with an arrow points at the control. When the bubble closes, the robot returns to its home (the corner dock or the spot the learner chose).
- The robot **never hops** while a program runs, is paused in Step mode, waits for `input()`, or listens for keys and clicks (F-023). Tips that arrive then wait until the run settles. Celebrations during those states show in the bubble at the dock without hopping.
- It never covers the editor while the editor has focus. In that case it speaks from the dock.
- The bubble closes with its ✕ button, Esc, or by itself after 8 s for tips. Tour steps stay until the learner acts.
- Bubble text is plain text (`textContent`). The robot's name is shown with `dir="auto"`, so any script displays correctly.

### Robot menu
Clicking the robot (or pressing Enter or Space when it has focus) opens a small menu:
- **Customize…**: opens the Customize dialog.
- **Replay tour**
- **Move robot**: keyboard move mode (see above).
- **Return to corner**: shown only when the learner has moved the robot.
- **Quiet mode** (toggle, `aria-pressed`, added with the tips in PR 3): no idle nudges, no one-time tips, no hopping. Celebrations still show as a bubble at the dock.
- **Hide robot**: the robot collapses to a small 🤖 tab at the dock edge. Clicking the tab brings it back. While hidden, the robot says nothing.

### Customize dialog
A `<dialog>` (same pattern as the existing project-name and replace dialogs) with a live preview of the robot.
- **Name**: text field, 1–20 characters after trimming, control characters removed. An empty name falls back to the localized default. Never rendered as HTML.
- **Body color**: 8 base colors (teal, blue, purple, pink, red, orange, green, gray), each with a localized name and a visible selected state. Picked to keep the outline and face readable.
- **Antenna**: bulb, spring, heart.
- **Eyes**: round, happy, visor.
- **Accessory**: none, bow, cap.
- **Badge unlocks**: one extra item per badge. Locked items show 🔒 and the badge's icon (as on the Badges tab), with "Earn the *Badge name*" as a tooltip and as screen-reader text; they are disabled radio buttons. One hint line under the pickers explains the icons while anything is locked.

| Badge (SPEC §6) | Unlocks |
| --- | --- |
| 📏 First Line | Star sticker (accessory) |
| 🔷 Shape Builder | Square eyes |
| 🔁 Loop Hero | Spiral antenna |
| 🎨 Color Artist | Gold and Rainbow body colors |
| 🧩 Function Master | Headphones (accessory) |
| 🏆 Turtle Creator | Crown (accessory) |
| 🎮 Game Maker | Gamer headset (accessory) |

- **Save** stores the choices and **Cancel** discards them. Unlocks are derived from progress, the same way badges are. If Reset progress makes an equipped item locked, the stored choice is **kept**, but the default part is drawn until the badge is earned again.

### Welcome tour (PR 2)
It starts after the lesson loads on a visit where the tour has never been finished or skipped, including after a deep link (`#lesson=`, `#example=`, `#gallery=`). It is non-modal: the page stays usable, and the bubble has Back, Next and Skip tour buttons, plus a step counter "2 / 8".

| # | Robot hops to | Says (en) |
| --- | --- | --- |
| 1 | Dock (wave) | Hi! I'm Robo, your robot buddy. Want to give me a name? *(inline name field, "Next" keeps the default)* |
| 2 | Lesson card | This card shows your goal and today's challenge. |
| 3 | Editor | This is your Python code. You can change anything here. |
| 4 | Run button | Press Run (or Ctrl+Enter) to make the turtle follow your code. |
| 5 | Drawing | Your turtle draws here. It starts in the middle. |
| 6 | Mark challenge done | Finished the challenge? Mark it done to earn stars. |
| 7 | Badges tab | Lessons, help and badges live down here. Collect them all! |
| 8 | Dock (happy) | Click me anytime to change my look. Have fun coding! |

Finishing, skipping or closing it (✕, or Esc while focus is in the bubble or on the robot; Esc elsewhere, for example in the editor, does nothing) saves `toured: true`. During the tour the robot can't be dragged, and clicking it moves focus to Next. In Arabic the step counter reads "2 من 8". **Replay tour** in the robot menu restarts it from step 1. On first load, focus is not moved (it would interrupt screen-reader users). The bubble is announced and is the next Tab stop after the robot. On Replay, focus moves to the bubble.

### Event tips (PR 3)
| Event | Once? | Hop to | Says (en) |
| --- | --- | --- | --- |
| First successful run | once | Drawing | Nice! Your turtle moved. Try changing a number and run again. |
| First error | once | Error line | Oops, a bug! Read the red line and the message under your code. |
| Lesson marked done | every time | — (dock) | You did it! ⭐ |
| Badge earned | every badge | Badges tab | New badge! You unlocked *part* for me. *(Customize button)* |
| First lesson of a new level | once per level | Lesson card | Welcome to *level name*! |
| Idle nudge | repeats, capped | — (dock) | one random tip from the idle list |

- **Idle nudge**: shown after 3 minutes with no typing, clicking or running, at most once every 5 minutes, never during a run, a dialog or the tour. Tips (en): "Stuck? The Syntax Help tab has examples." / "Try Step-by-step mode to watch Python read your code." / "Look in the Gallery for ideas to remix." / "Every coder makes bugs. Fixing them is how you learn!"
- **Quiet mode** suppresses idle nudges and one-time tips, and turns off hopping. Lesson and badge celebrations still appear at the dock.
- One-time tips are recorded in `seen`, so they don't repeat after a reload.

### Teacher & Parent
A "Show the robot buddy" checkbox for classrooms. Unchecked sets `off`, which removes the robot and its 🤖 tab (Hide robot keeps the tab). Checking it again also clears `hidden`.

### Strings (en / ar)
| Key | en | ar |
| --- | --- | --- |
| `buddyDefaultName` | Robo | روبو |
| `buddyButton(name)` | *name*, your robot buddy. Open menu | *name*، صديقك الروبوت. افتح القائمة |
| `buddyCustomize` | Customize… | تخصيص… |
| `buddyReplay` | Replay tour | أعِد الجولة |
| `buddyQuiet` | Quiet mode | الوضع الهادئ |
| `buddyHide` | Hide robot | إخفاء الروبوت |
| `buddyShow` | Show robot | إظهار الروبوت |
| `buddyClose` | Close | إغلاق |
| `buddyMove` | Move robot | تحريك الروبوت |
| `buddyMoveHelp` | Use the arrow keys to move me. Press Enter when done. | استخدم مفاتيح الأسهم لتحريكي. اضغط Enter عند الانتهاء. |
| `buddyMoved` | Robot moved | تم تحريك الروبوت |
| `buddyCorner` | Return to corner | أعِده إلى الزاوية |
| `buddyDialogTitle` | Customize your robot | خصّص روبوتك |
| `buddyName` | Name | الاسم |
| `buddyColor` | Body color | لون الجسم |
| `buddyAntenna` | Antenna | الهوائي |
| `buddyEyes` | Eyes | العيون |
| `buddyAccessory` | Accessory | الإكسسوار |
| `buddySave` / `buddyCancel` | Save / Cancel | حفظ / إلغاء |
| `buddyLocked(badge)` | Earn the *badge* badge | اربح وسام *badge* |
| `colors` | Teal, Blue, Purple, Pink, Red, Orange, Green, Gray, Gold, Rainbow | فيروزي، أزرق، بنفسجي، وردي، أحمر، برتقالي، أخضر، رمادي، ذهبي، قوس قزح |
| `antennas` | Bulb, Spring, Heart, Spiral | مصباح، نابض، قلب، حلزون |
| `eyes` | Round, Happy, Visor, Square | مستديرة، سعيدة، نظارة واقية، مربعة |
| `accessories` | None, Bow, Cap, Star sticker, Headphones, Crown, Gamer headset | بلا، فيونكة، قبعة، ملصق نجمة، سماعات، تاج، سماعة ألعاب |
| `tourNext` / `tourBack` / `tourSkip` / `tourDone` | Next / Back / Skip tour / Let's go! | التالي / السابق / تخطَّ الجولة / هيا بنا! |
| `tourStep(n, total)` | *n* / *total* | *n* / *total* |
| `tour1(name)` | Hi! I'm *name*, your robot buddy. Want to give me a name? | مرحبًا! أنا *name*، صديقك الروبوت. هل تريد أن تختار لي اسمًا؟ |
| `tour2` | This card shows your goal and today's challenge. | تعرض هذه البطاقة هدفك وتحدّي اليوم. |
| `tour3` | This is your Python code. You can change anything here. | هذا هو كود بايثون الخاص بك. يمكنك تغيير أي شيء هنا. |
| `tour4` | Press Run (or Ctrl+Enter) to make the turtle follow your code. | اضغط تشغيل (أو Ctrl+Enter) لتتبع السلحفاة الكود الخاص بك. |
| `tour5` | Your turtle draws here. It starts in the middle. | ترسم سلحفاتك هنا، وتبدأ من المنتصف. |
| `tour6` | Finished the challenge? Mark it done to earn stars. | أنهيت التحدي؟ علّمه منجزًا لتربح النجوم. |
| `tour7` | Lessons, help and badges live down here. Collect them all! | الدروس والمساعدة والأوسمة موجودة هنا في الأسفل. اجمعها كلها! |
| `tour8` | Click me anytime to change my look. Have fun coding! | اضغط عليّ في أي وقت لتغيير شكلي. استمتع بالبرمجة! |
| `tipFirstRun` | Nice! Your turtle moved. Try changing a number and run again. | رائع! تحركت سلحفاتك. جرّب تغيير رقم وشغّل مرة أخرى. |
| `tipFirstError` | Oops, a bug! Read the red line and the message under your code. | أوبس، خطأ! اقرأ السطر الأحمر والرسالة تحت الكود. |
| `tipDone` | You did it! ⭐ | أحسنت! ⭐ |
| `tipBadge(part)` | New badge! You unlocked *part* for me. | وسام جديد! لقد فتحت لي *part*. |
| `tipLevel(level)` | Welcome to *level*! | أهلًا بك في *level*! |
| `idleTips` | (4 tips above) | تحتاج مساعدة؟ في تبويب مساعدة الصياغة أمثلة. / جرّب وضع خطوة بخطوة لترى كيف يقرأ بايثون الكود. / ابحث في المعرض عن أفكار لتعديلها. / كل المبرمجين يقعون في الأخطاء، وإصلاحها هو طريقة التعلم! |
| `buddyTeacher` | 🤖 Robot buddy | 🤖 الصديق الروبوت |
| `buddyOn` / `buddyOff` | On / Off | يعمل / متوقف |

Final wording may be polished in each PR. Every key keeps `en`/`ar` parity (`check.mjs`). Arguments go through function-valued strings, never concatenation (AGENTS §5).

### Responsive
- < 860 px: a 56 px robot. The bubble is at most `calc(100vw - 32px)` wide and sits above or below its target instead of beside it.
- 860–1180 px: the bubble is at most 280 px wide.

## Technical design
- **Markup** (near `#toast`): `#buddy` (a `<button>` wrapping the SVG, `aria-haspopup="menu"`), `#buddyBubble` (`role="status"`, `aria-live="polite"`; tour controls inside), `#buddyMenu` (`role="menu"` with `menuitem` / `menuitemcheckbox` buttons), `#buddyTab` (shown when hidden), `#buddyDialog` (`<dialog>` with preview, name `<input>`, `role="radiogroup"` pickers).
- **SVG**: one `<symbol>`-free inline SVG. Parts are `<g data-part="antenna-bulb">` and similar. `renderBuddy(root, cfg)` sets `data-antenna`, `data-eyes`, `data-accessory` and `--buddy-body` on the root, and CSS shows the matching groups. It is reused for the dock and the dialog preview.
- **CSS**: one commented block appended at the end of `<style>` with keyframes (`buddyBob`, `buddyBlink`, `buddyWave`, `buddyBounce`, `buddyTilt`), hop transitions, `[dir="rtl"]` dock side, `body.hc` outline and bubble colors, the 860 and 1180 px rules, `prefers-reduced-motion`, and `@media print { display:none }`. Z-order: dock < toast < dialogs.
- **Script** (compact style):
  - `K.buddy:"tl.buddy.v1"`. `BUDDY_DEFAULT`, `BUDDY_PARTS` (base and unlockable items, each with the badge index that unlocks it).
  - `loadBuddy()` uses `store.get(K.buddy, null)`, then `sanitizeBuddy()` checks each field: `name` is a string, trimmed, control characters stripped, at most 20 characters, else `""` (the localized default is drawn); `color` / `antenna` / `eyes` / `accessory` must be a known id, else the default; `quiet` / `hidden` / `toured` are booleans; `seen` is an array of known tip ids, de-duplicated; `pos` is `null` (default corner) or `{x, y}` with finite numbers clamped to 0–1, else `null`. `saveBuddy()` uses `store.set`.
  - `badgeData()`: extracted from `badges()` and returns `[icon, name, earned]`. `badges()` renders from it, and `unlocked(itemId)` reads it. No change to badge rules.
  - `effectiveBuddy()` replaces locked choices with the defaults for drawing only.
  - `buddySay(text, {target, mood, actions, sticky})`, `buddyHop(el)`, `buddyHome()`, `buddyBusy()` (true while running, paused, waiting for input, listening, or a dialog is open). A small queue holds tips until `buddyBusy()` is false.
  - PR 2: `TOUR` (step → target id, string key), `startTour(replay)`, `tourStep(n)`, `endTour()`.
  - PR 3: `buddyEvent(name, data)`, called from the run settle path in `run()` (success or error, only for the current `runToken`), `complete(i)` (compares `badgeData()` before and after to find new badges), `loadLesson()` (first visit to a level), and an idle timer reset on `input` / `keydown` / `pointerdown` and paused while `buddyBusy()`.
  - Dragging: `pointerdown` / `pointermove` / `pointerup` on `#buddy` with `setPointerCapture` and `touch-action: none`, a 6 px click threshold, `buddyPlace(pos)` (fraction to clamped pixels), `buddyMoveMode()` for the keyboard, and a `resize` listener that re-clamps. Saving happens on drop, not on every move.
  - `bind()`: robot, tab, menu items, dialog Save/Cancel, Esc. `applyLang()`: all labels, plus a re-render of an open bubble or dialog. `init()`: `loadBuddy()`, render, and schedule the tour once `pyState`/lesson is ready (PR 2).
- **Storage**: new key `tl.buddy.v1`, JSON `{name, color, antenna, eyes, accessory, quiet, hidden, off, toured, seen, pos}`. It is new, so there is no migration. Invalid fields fall back one by one, so a single bad field never resets the rest. If storage is blocked, the robot uses the defaults and the tour may reappear each visit, which is acceptable.
- **Run/step impact**: none on program semantics. The robot only observes run results and never touches `runToken`, `setRun()`, timers or handlers. Its idle timer is its own and is cleared on page hide.
- **Dependencies**: none. No assets, so the offline bundle needs only the regenerated `offline/app.html`.

## Acceptance criteria
1. On a clean profile the robot appears in the dock (bottom-right in English, bottom-left in Arabic) without changing the layout. The F-019 layout tests stay green at 1440 and 1280 px.
2. Clicking the robot or pressing Enter on it opens the menu, and every menu item works with the mouse and the keyboard. Esc closes the menu and the bubble.
3. Customize: changes show in the preview right away. Save persists them across a reload and Cancel discards them. A name such as `<b>Hi</b>` is shown literally. An empty name shows "Robo" or "روبو" depending on the language.
4. Locked items show the badge they need and can't be chosen. Completing a lesson that earns a badge unlocks its item. After Reset progress, the robot is drawn with defaults but the stored choice is kept, and it comes back when the badge is earned again.
5. Malformed `tl.buddy.v1` (bad JSON, wrong types, unknown ids, a 500-character name) never throws. Each bad field falls back to its default.
6. (PR 2) A first visit shows the 8-step tour in the current language. Back, Next and Skip work. Finishing or skipping persists, and the tour doesn't return after a reload. Replay restarts it. A deep link still opens its target, and the tour starts afterwards. The tour works at 800 px width.
7. (PR 3) The first successful run, the first error (the robot points at the error line), lesson completion, a new badge and the first lesson of a new level each show the right bubble once (celebrations every time). No hop happens during a Normal or Step run, an `input()` wait or a listening program. An idle nudge appears after 3 min idle and at most once per 5 min.
8. Dragging the robot with the mouse or touch moves it, and it stays where dropped after a reload. A short press without movement still opens the menu. After the window shrinks, the robot is still fully visible. Move robot plus the arrow keys moves it, and Enter finishes. Return to corner restores the default corner (bottom-left in Arabic). Hops return to the chosen spot. Malformed `pos` values fall back to the corner.
9. Quiet mode stops idle nudges, one-time tips and hopping, but keeps the celebrations. Hide removes the robot until it is shown again. Both persist. The Teacher & Parent switch turns the robot off and on.
10. Reduced motion shows no bobbing or flying. High contrast is legible in both languages. The print preview has no robot.
11. axe reports no serious or critical issues with the robot, menu, bubble, dialog and tour open, in both languages. There is no English-only text in Arabic mode.
12. No network requests. `offline/app.html` shows the robot. `check.mjs` prints OK.

## Test plan
- **Fixture**: `tests/fixtures.js` seeds `tl.buddy.v1 = {"toured":true,"quiet":true}` with `addInitScript` (in a try, so blocked-storage tests still work) through a `buddy` option, default on. `tests/buddy.spec.js` opts out to test real first visits. Existing specs are unaffected.
- **New `tests/buddy.spec.js`**: dock side per language, menu (mouse and keyboard), customize and persist, name escaping and fallback, locked/unlocked parts and the reset behavior, Hide/Show and Quiet persistence, the Teacher switch, drag (mouse and touch) with persistence, the click-vs-drag threshold, clamping after a viewport resize, keyboard move mode, Return to corner, hops returning to the custom home. PR 2: tour steps, Skip, Replay, deep link, 800 px. PR 3: each event, no hop while busy (Step run, `input()` wait), idle nudge with `page.clock`, Quiet mode.
- **`tests/storage.spec.js`**: malformed `tl.buddy.v1` cases.
- **`tests/a11y.spec.js`**: axe with the menu, dialog and tour bubble open in both languages, the accessible name of the robot button, `aria-pressed` on Quiet.
- **`tests/localization.spec.js`**: the robot UI in Arabic mode.
- **`tests/offline.spec.js`**: the robot renders in the offline bundle.
- **Manual**: high contrast in both languages, < 860 px, OS reduced motion, print preview, a clean profile at `http://localhost:8000` and `offline/app.html`.

## Documentation updates
- [ ] SPEC.md §3.3 (app surface: dock, menu, dialog, Teacher switch), §4.1 (first visit: tour), §6 (badge unlocks), §9 (`tl.buddy.v1` row), §10 (a11y and i18n), §11.2 (CSS block), §12.1 (symbols), §14 (test map), baseline table
- [ ] README: mention the robot buddy (both languages if the landing copy changes; landing is out of scope)
- [ ] AGENTS.md §3 test list: `tests/buddy.spec.js`
- [ ] docs/ROADMAP.md status

## Delivery
1. **PR 1 `feat/F-024-buddy-character`**: robot, dock, moods, menu, drag and keyboard move, Customize dialog, badge unlocks, Quiet, Hide, Teacher switch, storage, fixture seeding.
2. **PR 2 `feat/F-024-welcome-tour`**: the tour, `buddySay` hopping to targets, Replay.
3. **PR 3 `feat/F-024-event-tips`**: event hooks, idle nudges, the busy queue.

Each PR is based on `main`. Each runs `node tools/build-offline.mjs`, `node tools/check.mjs` and `npm test`, and updates SPEC.md for what it ships.

## Open questions
1. ~~Default name~~ **Decided** (maintainer, 2026-11-24): **Robo / روبو**.
2. ~~Teacher & Parent switch~~ **Decided** (maintainer, 2026-11-24): yes, a "Robot buddy On/Off" switch, in PR 1.
3. Should the robot ever show on the landing page? (Recommended: no, out of scope here.)
4. ~~Idle timing~~ **Decided** (maintainer, 2026-11-24): 3 min idle, at most once per 5 min.
5. ~~Manual positioning~~ **Decided** (maintainer, 2026-11-24): kids can drag the robot anywhere (keyboard alternative included), and the spot is remembered.
