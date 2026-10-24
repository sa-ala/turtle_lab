# F-021: Gallery of inspiring pieces

| Field | Value |
| --- | --- |
| Status | Proposed |
| Priority | P2 |
| Size | L (one PR; split into A: content + tab, B: thumbnails + deep link if it grows past ~500 lines) |
| Depends on | F-007, F-008, F-017 |
| Related gaps | — |
| Owner / agent | |

## Problem
The app shows learners what they are doing now but not how far they can go. The 13 examples (`SPEC.md §5.3`) are beginner snippets (First Line, Square, Star, House…) behind a dropdown in the editor header, so there is no moment where a learner sees what Turtle can really do and thinks "I want to build that". Lessons end in a capstone (lesson 47), but nothing in between shows the payoff of loops, functions, randomness and recursion.

## Goals
- A **Gallery** tab in the learning area with about 10 curated pieces that are impressive to look at and still readable by a learner.
- Every piece shows **the path to it**: which level makes it reachable and which lessons teach the concepts it uses, each a link to that lesson.
- Every piece invites **remixing**: two or three "Remix ideas" that name a value to change and what will happen.
- One click opens the piece in the editor and runs it, with the same overwrite protection as examples (F-007).
- Works offline, in both languages, in high contrast and below 860 px.

## Non-goals
- A gallery of learners' own work, sharing, uploads or voting. That needs accounts or a network and conflicts with the privacy rules (AGENTS.md rule 5, `SPEC.md` BR-10).
- Badges, stars or progress for gallery pieces.
- Changing the existing examples list or the example selector.
- Auto-grading of remixes (see F-011).
- Saving a remix as a project directly from the card (see Open questions).

## User experience

### The tab
1. The learning area gets a **Gallery** tab after Challenges. Tab selection is not persisted (same as the other tabs, `SPEC.md §4`).
2. The tab opens with one intro line: "Big ideas built from the same blocks you are learning. Open one, run it, then make it yours."
3. Pieces appear as a grid of cards, ordered from most reachable to most advanced. The grid has 2 columns in the learning area at ≥ 1180 px and 1 column below that and below 860 px.

### A card
Each card shows, top to bottom:
- **Thumbnail**: a picture of the finished drawing (square, ~240 px).
- **Name** (heading) and **one-line description**.
- **Level chip**: "After Level 9", or "Beyond the lessons" for pieces that use something no lesson teaches yet.
- **"Built with"**: chips such as "Lesson 34: Spiral". Each chip is a link button that selects that lesson (normal lesson switch with its draft, `SPEC.md §7` / F-007) and switches to the Lesson tab.
- **▶ Open and run**: the main button (see below).
- **Remix ideas** (a `<details>` element, closed by default): 2–3 short prompts.

### Open and run
4. Clicking **▶ Open and run** goes through `okToReplace()` exactly like Load Example (F-007): if the editor code differs from the lesson starter, the Replace / Keep my code dialog appears. "Keep my code" cancels and changes nothing.
5. On replace, the piece's code goes into the editor, is saved like a loaded example (current lesson draft), and the program runs.
6. If Run Mode is Step-by-step, the piece runs in Step mode as selected, and the card area shows: "Tip: gallery pieces have thousands of steps. Switch Run Mode to Normal to see them draw quickly." (See Open question Q1 for the alternative.)
7. The selected lesson and lesson card stay as they were (same as examples).

### Deep link
8. `#gallery=<id>` (F-008) opens the app on the Gallery tab and loads that piece through the same protection, **without** running it (an opened link should not start a program by itself). Unknown ids are ignored like other unknown deep-link values. Order: lang, lesson, example, gallery.

### The pieces
All pieces are verified in the vendored Skulpt 1.2.0 (Normal mode, Chromium, 1280×900): each finishes in ≤ 5 s and fits the 320×320 safe box, which matches the minimum canvas size. Code is in the appendix.

| # | id | Name (en) | Name (ar) | Level chip | Built with (lesson ids) | Run time |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `g-rainbow-spiral` | Rainbow Spiral | دوّامة قوس قزح | After Level 9 | l12, l31, l34 | ~4.5 s, animated |
| 2 | `g-spirograph` | Spirograph | زهرة الدوائر | After Level 9 | l12, l31, l35 | ~3 s, animated |
| 3 | `g-mandala` | Mandala | ماندالا | After Level 9 | l28, l30, l35 | ~4.5 s, animated |
| 4 | `g-sunset` | Sunset at Sea | غروب على البحر | After Level 11 | l10, l21, l28, l41 | instant |
| 5 | `g-starry-night` | Starry Night | ليلة مليئة بالنجوم | After Level 11 | l28, l33, l39 | ~5 s, animated |
| 6 | `g-city-night` | City at Night | مدينة في الليل | After Level 11 | l24, l28, l39, l40, l42 | instant |
| 7 | `g-blossom-tree` | Blossom Tree | شجرة مزهرة | After Level 12 | l39, l46 | instant |
| 8 | `g-koch-snowflake` | Koch Snowflake | ندفة ثلج كوخ | After Level 12 | l46 | instant |
| 9 | `g-sierpinski` | Sierpinski Triangle | مثلث سيربنسكي | After Level 12 | l10, l46 | instant |
| 10 | `g-golden-galaxy` | Golden Galaxy | المجرّة الذهبية | Beyond the lessons | l41, l42 | instant |

"Instant" pieces use `screen.tracer(0)` and `screen.update()`. Animated pieces use `screen.tracer(2)` so they still draw visibly but twice as fast. Blossom Tree is a deliberate step beyond lesson 46 (which builds the plain fractal tree), not a copy of it.

Descriptions and remix ideas:

| id | Description (en) | Description (ar) | Remix ideas (en) | Remix ideas (ar) |
| --- | --- | --- | --- | --- |
| `g-rainbow-spiral` | One loop, one list of colors and a turn of 91 degrees. | حلقة واحدة وقائمة ألوان ودوران بزاوية 91 درجة. | Change `angle` to 89, 121 or 144. · Add `"pink"` to the `colors` list. · Change `range(100)` to `range(200)`. | غيّر `angle` إلى 89 أو 121 أو 144. · أضف `"pink"` إلى القائمة `colors`. · غيّر `range(100)` إلى `range(200)`. |
| `g-spirograph` | Draw one circle, turn a little, repeat. | ارسم دائرة، ثم استدر قليلًا، وكرّر. | Set `rings` to 12, then 72. · Change `size` to 40 or 100. · Use only two colors. | اجعل `rings` تساوي 12 ثم 72. · غيّر `size` إلى 40 أو 100. · استخدم لونين فقط. |
| `g-mandala` | A petal function inside a ring function, four rings deep. | دالة بتلة داخل دالة حلقة، بأربع حلقات. | Change the numbers in each `ring(...)` call. · Add a fifth ring. · Change 60 in `t.circle(size, 60)` to 90. | غيّر الأرقام في كل استدعاء `ring(...)`. · أضف حلقة خامسة. · غيّر 60 في `t.circle(size, 60)` إلى 90. |
| `g-sunset` | Bands of color from a list, a sun and its reflection. | أشرطة ألوان من قائمة، وشمس وانعكاسها. | Pick your own `sky` colors. · Move the sun with `t.goto(...)`. · Make it night: a white moon and dark colors. | اختر ألوان `sky` بنفسك. · حرّك الشمس باستخدام `t.goto(...)`. · اجعلها ليلًا: قمر أبيض وألوان داكنة. |
| `g-starry-night` | A star function placed at random spots. Different every run. | دالة نجمة توضع في أماكن عشوائية. تختلف في كل تشغيل. | Set `stars` to 100. · Add `"pink"` to the star colors. · Make the moon bigger. | اجعل `stars` تساوي 100. · أضف `"pink"` إلى ألوان النجوم. · كبّر القمر. |
| `g-city-night` | Random buildings with random lit windows. A new city every run. | مبانٍ عشوائية بنوافذ مضيئة عشوائيًا. مدينة جديدة في كل تشغيل. | Change 0.6 to 0.2 or 0.9 for fewer or more lights. · Make buildings taller. · Add stars to the sky. | غيّر 0.6 إلى 0.2 أو 0.9 لأضواء أقل أو أكثر. · اجعل المباني أطول. · أضف نجومًا إلى السماء. |
| `g-blossom-tree` | A function that calls itself to grow branches, with blossoms at the tips. | دالة تستدعي نفسها لتنمو الأغصان، مع أزهار في الأطراف. | Change the depth 8 to 5 or 10. · Change the spread range to `randint(10, 45)`. · Make autumn leaves: orange and red dots. | غيّر العمق 8 إلى 5 أو 10. · غيّر مدى الانفراج إلى `randint(10, 45)`. · اصنع أوراق الخريف: نقاط برتقالية وحمراء. |
| `g-koch-snowflake` | Each line becomes four smaller lines, again and again. | كل خط يصبح أربعة خطوط أصغر، مرة بعد مرة. | Set `level` to 0, 1, 2 and 3 to watch it grow. · Change `t.right(120)` in the last loop to `t.left(120)`. · Draw it in white on a dark background. | اجعل `level` تساوي 0 و1 و2 و3 لترى كيف تنمو. · غيّر `t.right(120)` في الحلقة الأخيرة إلى `t.left(120)`. · ارسمها بالأبيض على خلفية داكنة. |
| `g-sierpinski` | A triangle made of three smaller triangles, each made of three smaller ones. | مثلث مكوّن من ثلاثة مثلثات أصغر، وكل منها من ثلاثة أصغر. | Change the depth 5 to 2 or 6. · Use your own `colors`. · Try `half * 0.6` instead of `half * 0.866`. | غيّر العمق 5 إلى 2 أو 6. · استخدم ألوانك في `colors`. · جرّب `half * 0.6` بدلًا من `half * 0.866`. |
| `g-golden-galaxy` | 500 dots, each turned by the golden angle. Sunflowers grow seeds this way. | 500 نقطة، كل واحدة تدور بالزاوية الذهبية. هكذا تنمو بذور دوّار الشمس. | Change `turn` to 137, 138 or 90. · Change `range(500)` to `range(1000)`. · Make every dot the same size. | غيّر `turn` إلى 137 أو 138 أو 90. · غيّر `range(500)` إلى `range(1000)`. · اجعل كل النقاط بالحجم نفسه. |

### New strings (en / ar)

| Key | en | ar |
| --- | --- | --- |
| `tabGallery` | Gallery | المعرض |
| `galleryIntro` | Big ideas built from the same blocks you are learning. Open one, run it, then make it yours. | أفكار كبيرة مبنية من نفس الأدوات التي تتعلمها. افتح واحدة وشغّلها ثم اجعلها خاصة بك. |
| `galleryOpen` | ▶ Open and run | ▶ افتح وشغّل |
| `galleryOpenLabel` | (name) => `Open and run ${name}` | (name) => `افتح وشغّل ${name}` |
| `galleryAfter` | (n) => `After Level ${n}` | (n) => `بعد المستوى ${n}` |
| `galleryBeyond` | Beyond the lessons | ما بعد الدروس |
| `galleryBuiltWith` | Built with | مبني باستخدام |
| `galleryLessonChip` | (n, title) => `Lesson ${n}: ${title}` | (n, title) => `الدرس ${n}: ${title}` |
| `galleryRemix` | Remix ideas | أفكار للتعديل |
| `galleryImgAlt` | (name) => `Picture of ${name}` | (name) => `صورة ${name}` |
| `galleryStepTip` | Tip: gallery pieces have thousands of steps. Switch Run Mode to Normal to see them draw quickly. | نصيحة: أعمال المعرض فيها آلاف الخطوات. غيّر وضع التشغيل إلى عادي لتراها تُرسم بسرعة. |

The lesson chip uses the lesson's position number and localized title at render time, so it stays correct if lessons are reordered.

### RTL, high contrast, narrow screens
- RTL: the grid and chips flow right to left; thumbnails, code identifiers in remix ideas (`<code>`) and the Python code stay LTR.
- High contrast (`body.hc`): cards get a white border on black, chips and the Open button use the existing high-contrast button styles; thumbnails keep their colors.
- < 860 px: single column; the thumbnail shrinks to the card width with a 240 px maximum.

## Technical design

### Content
- New single-line content arrays in `app.html`, next to `examples`:
  - `gallery`: `[{id, level, uses, name, description, remix, code}]`. `id` is permanent (`g-<slug>`, same rules as lesson ids, AGENTS.md rule 7). `level` is a level number (1–12) or `null` for "Beyond the lessons". `uses` is an array of lesson ids. `remix` is an array of 2–3 strings. `code` uses real newlines, like `examples`.
  - `GALLERY_AR`: index-aligned `[{name, description, remix}]`.
- `tools/content.mjs`: export and inject `gallery.json` and `gallery.ar.json`; validate alignment, unique well-formed ids, `uses` pointing to existing lesson ids, 2–3 remix ideas in both languages, and a matching thumbnail file.
- `tools/check.mjs`: the same checks, plus `assets/gallery/` mirrored in `offline/assets/gallery/`.
- Remix strings may contain backtick-quoted code. Render it as `<code>` after `esc()` (AGENTS.md rule 4): escape first, then replace `` `…` `` pairs.

### Thumbnails
- Static JPEGs in `assets/gallery/<id>.jpg`, 240×240, quality ~80 (~10–20 KB each, ~150 KB total). Static images avoid running 10 programs when the tab opens.
- New dev-only `tools/gallery-thumbs.mjs` uses the existing Playwright devDependency to run each piece in the real app at a fixed canvas size and capture the centered 320×320 safe box. The site never needs it at runtime. Random pieces get a new picture each time the script runs, which is fine because thumbnails are committed and only regenerated when code changes.
- `tools/build-offline.mjs` copies `assets/gallery/` to `offline/assets/gallery/`. `tests/fixtures.js` serves `.jpg`.
- `<img loading="lazy" width="240" height="240" alt="…">`, same origin: no new network hosts (rule 5).

### UI and symbols
- Markup: a `gallery` button in the learning-area tabs (after `challenge`) and a `gallery` panel with `#galleryIntro`, `#galleryGrid`, `#galleryTip`.
- `buildGallery()` renders cards from `gallery`/`GALLERY_AR` for the current language. Call it from `init()` and `applyLang()`.
- `openGallery(i, {run})`: `okToReplace()` → `stopIfRunning()` → set code and save it like `loadExample()` → `run()` when `run` is true. Reuse `loadExample`'s internals instead of duplicating them.
- Lesson chips call the same path as selecting a lesson in the sidebar, then `tab("lesson")`.
- `applyDeepLink()`: add `gallery` after `example`, call `tab("gallery")` and `openGallery(i, {run:false})`.
- `galleryTip` shows when Open and run is used with Run Mode Step and hides on the next mode change or tab change.
- No storage changes: no new `K` keys.
- Run/step: no change to `run()`. Pieces are ordinary programs, so `runToken`, `stop()` and Step mode apply unchanged.

## Acceptance criteria
1. The learning area shows a Gallery tab after Challenges, labelled "Gallery" in English and "المعرض" in Arabic, and the ARIA tab pattern from F-013 still holds.
2. The Gallery shows 10 cards in the table order. Each has a thumbnail with alt text, name, description, level chip, at least one lesson chip, Open and run, and 2–3 remix ideas, all in the current language. Switching language re-renders them with no English left in Arabic mode (code and identifiers excepted).
3. With the editor at the lesson starter, Open and run loads the piece and it runs successfully (`expectRunSucceeded`) in Normal mode. This holds for **every** piece.
4. With edited code, Open and run shows the F-007 dialog. "Keep my code" leaves the code and drawing untouched. "Replace" loads and runs.
5. A lesson chip selects that lesson (with its draft) and switches to the Lesson tab.
6. In Step mode, Open and run starts a Step run and shows the tip. Stop works and settles the run.
7. Open and run while another program is running stops it first and keeps only the new drawing (F-005).
8. `#gallery=g-koch-snowflake` opens on the Gallery tab with that code loaded and not running. `#gallery=nope` is ignored with no error.
9. The offline bundle shows thumbnails and runs a piece with no external requests.
10. axe reports no serious or critical issues on the Gallery tab in both languages. The tab is usable at < 860 px and in high contrast.
11. `node tools/content.mjs check` fails on a misaligned `GALLERY_AR`, a duplicate or malformed gallery id, a `uses` entry that is not a lesson id, or a missing thumbnail.

## Test plan
- New `tests/gallery.spec.js`: every piece runs (AC 3), card content per language (AC 2), overwrite dialog (AC 4), lesson chip (AC 5), Step tip and Stop (AC 6), run lifecycle (AC 7), deep links (AC 8).
- `tests/a11y.spec.js`: add the Gallery tab in both languages. `tests/localization.spec.js`: Gallery in Arabic. `tests/offline.spec.js`: a thumbnail loads and a piece runs.
- `tests/content-tool.spec.js`: each new validation error (AC 11).
- `tests/app.spec.js`: content counts include 10 gallery pieces.
- Manual: high contrast both languages, < 860 px, 1280 px Arabic tab row fits (7 tabs).

## Documentation updates
- [ ] SPEC.md: §4 learning-area tabs, new §5.5 Gallery inventory, §8 deep links, §12.1 source map (`gallery`, `GALLERY_AR`, `buildGallery`, `openGallery`), §14 inventory and baseline. BR-10: say a curated gallery exists and a learner-work gallery does not
- [ ] AGENTS.md: §1 document map (`assets/gallery/`, `tools/gallery-thumbs.mjs`), §3 test list, §5 recipe "Add a gallery piece"
- [ ] README and landing: optional one-line mention, both languages
- [ ] docs/ROADMAP.md status

## Open questions
- **Q1. Step mode.** Recommended: run in the selected mode and show the tip (above). Alternative: Open and run switches Run Mode to Normal and announces it. That is faster for kids, but it changes a setting they chose.
- **Q2. Auto-run.** Recommended: Open and run runs immediately, which is the "wow" moment. Alternative: a plain "Open" button that the learner then runs.
- **Q3. Where the code goes.** Recommended: same as examples (replaces the current lesson draft, behind the F-007 dialog). Alternative: open each piece as a new My Projects entry, so remixes never overwrite lesson work. That is safer but adds clutter.
- **Q4. Landing page.** Add a "See what you can build" strip linking to `app.html#gallery=…`? Out of scope unless approved.

## Appendix: verified piece code
Run in Skulpt 1.2.0 through the app's `run()` in Normal mode (Chromium, 1280×900, canvas ~430×520). Every piece stays inside a 320×320 box at the origin.

<details><summary><code>g-rainbow-spiral</code></summary>

```python
import turtle

t = turtle.Turtle()
screen = turtle.Screen()
screen.bgcolor("black")
t.speed(0)
screen.tracer(2)
t.width(2)

colors = ["red", "orange", "yellow", "green", "cyan", "blue", "purple"]
angle = 91   # Remix: try 89, 121 or 144

for i in range(100):
    t.pencolor(colors[i % len(colors)])
    t.forward(i * 2)
    t.left(angle)

t.hideturtle()
```

</details>

<details><summary><code>g-spirograph</code></summary>

```python
import turtle

t = turtle.Turtle()
screen = turtle.Screen()
screen.bgcolor("midnightblue")
t.speed(0)

colors = ["hotpink", "gold", "cyan", "white"]
rings = 36    # Remix: try 12 or 72
size = 70     # Remix: try 40 or 100

for i in range(rings):
    t.pencolor(colors[i % len(colors)])
    t.circle(size)
    t.left(360 / rings)

t.hideturtle()
```

</details>

<details><summary><code>g-mandala</code></summary>

```python
import turtle

t = turtle.Turtle()
screen = turtle.Screen()
screen.bgcolor("white")
t.speed(0)
screen.tracer(2)

def petal(size):
    for side in range(2):
        t.circle(size, 60)
        t.left(120)

def ring(petals, size, color):
    t.pencolor(color)
    for i in range(petals):
        petal(size)
        t.left(360 / petals)

ring(12, 140, "purple")    # Remix: change the numbers
ring(18, 100, "teal")
ring(24, 60, "orange")
ring(8, 30, "crimson")

t.hideturtle()
```

</details>

<details><summary><code>g-sunset</code></summary>

```python
import turtle

t = turtle.Turtle()
screen = turtle.Screen()
screen.tracer(0)
t.hideturtle()

def band(y, height, color):
    t.penup()
    t.goto(-160, y)
    t.pendown()
    t.color(color)
    t.begin_fill()
    for i in range(2):
        t.forward(320)
        t.right(90)
        t.forward(height)
        t.right(90)
    t.end_fill()

# Sky: bands of color from top to bottom. Remix: pick your own colors
sky = ["midnightblue", "darkslateblue", "mediumpurple", "orchid", "salmon", "orange"]
y = 160
for color in sky:
    band(y, 40, color)
    y = y - 40

# The sun, sitting on the horizon
t.penup()
t.goto(0, -80)
t.pendown()
t.color("gold")
t.begin_fill()
t.circle(45)
t.end_fill()

# The sea, with stripes of sunlight
band(-80, 80, "darkblue")
t.color("gold")
for y in range(-90, -160, -15):
    w = 80 + y // 2
    t.penup()
    t.goto(-w // 2, y)
    t.pendown()
    t.forward(w)
screen.update()
```

</details>

<details><summary><code>g-starry-night</code></summary>

```python
import turtle
import random

t = turtle.Turtle()
screen = turtle.Screen()
screen.bgcolor("navy")
t.speed(0)
screen.tracer(2)
t.hideturtle()

def star(x, y, size, color):
    t.penup()
    t.goto(x, y)
    t.pendown()
    t.color(color)
    t.begin_fill()
    for i in range(5):
        t.forward(size)
        t.right(144)
    t.end_fill()

# The moon
t.penup()
t.goto(90, 70)
t.pendown()
t.color("lightyellow")
t.begin_fill()
t.circle(35)
t.end_fill()

stars = 30   # Remix: try 100
for i in range(stars):
    x = random.randint(-150, 150)
    y = random.randint(-140, 150)
    size = random.randint(4, 16)
    star(x, y, size, random.choice(["white", "yellow", "lightblue"]))
```

</details>

<details><summary><code>g-city-night</code></summary>

```python
import turtle
import random

t = turtle.Turtle()
screen = turtle.Screen()
screen.bgcolor("midnightblue")
screen.tracer(0)
t.hideturtle()

def rectangle(x, y, w, h, color):
    t.penup()
    t.goto(x, y)
    t.pendown()
    t.color(color)
    t.begin_fill()
    for i in range(2):
        t.forward(w)
        t.left(90)
        t.forward(h)
        t.left(90)
    t.end_fill()

def building(x, w, h):
    rectangle(x, -120, w, h, random.choice(["dimgray", "slategray", "darkslategray"]))
    for wy in range(-110, -120 + h - 15, 18):
        for wx in range(x + 6, x + w - 9, 12):
            if random.random() < 0.6:   # Remix: more or fewer lights
                rectangle(wx, wy, 6, 9, "gold")

rectangle(-160, -160, 320, 40, "black")   # the street
x = -160
while x < 130:
    w = random.randint(35, 60)
    w = min(w, 160 - x)
    h = random.randint(70, 240)
    building(x, w, h)
    x = x + w + 4
screen.update()
```

</details>

<details><summary><code>g-blossom-tree</code></summary>

```python
import turtle
import random

t = turtle.Turtle()
screen = turtle.Screen()
screen.bgcolor("lavenderblush")
screen.tracer(0)
t.hideturtle()

def tree(length, depth):
    if depth == 0:
        t.dot(random.randint(5, 9), random.choice(["pink", "hotpink", "white"]))
        return
    t.width(depth)
    t.pencolor("saddlebrown")
    t.forward(length)
    spread = random.randint(15, 35)     # Remix: try 10 or 45
    t.left(spread)
    tree(length * 0.72, depth - 1)
    t.right(spread * 2)
    tree(length * 0.72, depth - 1)
    t.left(spread)
    t.penup()
    t.backward(length)
    t.pendown()

t.penup()
t.goto(0, -160)
t.left(90)
t.pendown()
tree(75, 8)                             # Remix: depth 5 or 10
screen.update()
```

</details>

<details><summary><code>g-koch-snowflake</code></summary>

```python
import turtle

t = turtle.Turtle()
screen = turtle.Screen()
screen.bgcolor("aliceblue")
screen.tracer(0)
t.hideturtle()
t.pencolor("steelblue")
t.width(2)

def koch(length, level):
    if level == 0:
        t.forward(length)
        return
    length = length / 3
    koch(length, level - 1)
    t.left(60)
    koch(length, level - 1)
    t.right(120)
    koch(length, level - 1)
    t.left(60)
    koch(length, level - 1)

level = 4   # Remix: try 0, 1, 2, 3
t.penup()
t.goto(-150, 90)
t.pendown()
for side in range(3):
    koch(300, level)
    t.right(120)
screen.update()
```

</details>

<details><summary><code>g-sierpinski</code></summary>

```python
import turtle

t = turtle.Turtle()
screen = turtle.Screen()
screen.tracer(0)
t.hideturtle()

colors = ["crimson", "orange", "gold", "seagreen", "royalblue", "purple"]

def triangle(x, y, size, color):
    t.penup()
    t.goto(x, y)
    t.pendown()
    t.color(color)
    t.begin_fill()
    for i in range(3):
        t.forward(size)
        t.left(120)
    t.end_fill()

def sierpinski(x, y, size, depth):
    if depth == 0:
        triangle(x, y, size, colors[int(x + y + 400) // 50 % len(colors)])
        return
    half = size / 2
    sierpinski(x, y, half, depth - 1)
    sierpinski(x + half, y, half, depth - 1)
    sierpinski(x + half / 2, y + half * 0.866, half, depth - 1)

sierpinski(-150, -130, 300, 5)   # Remix: depth 2 or 6
screen.update()
```

</details>

<details><summary><code>g-golden-galaxy</code></summary>

```python
import turtle
import math

t = turtle.Turtle()
screen = turtle.Screen()
screen.bgcolor("black")
screen.tracer(0)
t.hideturtle()
t.penup()

colors = ["white", "lightblue", "violet", "gold"]
turn = 137.5   # the golden angle. Remix: try 137, 138 or 90

for i in range(500):
    angle = math.radians(i * turn)
    distance = 6.5 * math.sqrt(i)
    t.goto(distance * math.cos(angle), distance * math.sin(angle))
    t.dot(3 + i // 100, colors[i % len(colors)])
screen.update()
```

</details>
