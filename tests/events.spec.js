// Key, click and timer programs: the "listening" run state (ROADMAP F-023 PR 2, SPEC.md §7.2, §7.6; GAP-04).
import { test, expect, openApp, t, selectLesson, expectRunSucceeded } from "./fixtures.js";

const KEYS = `import turtle
t = turtle.Turtle()
screen = turtle.Screen()
def up():
    print('up')
screen.onkey(up, 'Up')
screen.listen()
`;
const TIMER = (label, ms = 100) => `import turtle
screen = turtle.Screen()
def tick():
    print('${label}')
    screen.ontimer(tick, ${ms})
screen.ontimer(tick, ${ms})
`;

async function startListening(page, code) {
  await page.fill("#code", code);
  await page.evaluate(() => run());
  await expect(page.locator("#debugInfo")).toContainText(await t(page, "listening"));
}
const count = (page, word) => page.evaluate((w) => (E.out.textContent.match(new RegExp(`^${w}$`, "gm")) || []).length, word);
const sendKey = (page, key) => page.evaluate((k) => { // dispatch straight at the drawing, whatever has focus
  const code = { ArrowUp: 38, ArrowDown: 40 }[k];
  for (const type of ["keydown", "keyup"]) E.target.dispatchEvent(new KeyboardEvent(type, { key: k, keyCode: code, bubbles: true, cancelable: true }));
}, key);

test("AC3: after the main program, keys reach the handler while the drawing has focus", async ({ page }) => {
  await openApp(page);
  await startListening(page, KEYS);
  await expect(page.locator("#err")).toHaveText(await t(page, "listening"));
  await expect(page.locator("#stopTop")).toBeEnabled();
  await expect(page.locator("#runBtn")).toBeDisabled();
  await expect(page.locator("#target")).toBeFocused(); // listen() moves focus to the drawing
  await expect(page.locator("#target")).toHaveAttribute("aria-label", await t(page, "stageListening"));
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => count(page, "up")).toBe(2);
  await page.locator("#code").focus(); // typing in the editor never reaches the program
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(300);
  expect(await count(page, "up")).toBe(2);
  await page.locator("#target").click(); // clicking the drawing gives it focus again
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => count(page, "up")).toBe(3);
  expect(await page.evaluate(() => !E.target.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", keyCode: 40, bubbles: true, cancelable: true })))).toBe(true); // no page scroll
  await page.click("#stopTop");
});

test("AC4: Stop while listening re-enables Run, and old keys and timers never fire again", async ({ page }) => {
  await openApp(page);
  await startListening(page, KEYS.replace("screen.listen()", "screen.listen()\n" + "def tick():\n    print('tick')\n    screen.ontimer(tick, 100)\nscreen.ontimer(tick, 100)"));
  await expect.poll(() => count(page, "tick")).toBeGreaterThan(1);
  await page.click("#stopTop");
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#target")).not.toHaveAttribute("tabindex", /.*/);
  const ticks = await count(page, "tick");
  await sendKey(page, "ArrowUp");
  await page.waitForTimeout(2000);
  expect(await count(page, "tick")).toBe(ticks);
  expect(await count(page, "up")).toBe(0);
  expect(await page.evaluate(() => listening)).toBe(false);
});

test("AC5: a later program never runs an earlier program's handlers", async ({ page }) => {
  await openApp(page);
  await startListening(page, KEYS + TIMER("A").replace("import turtle\nscreen = turtle.Screen()\n", ""));
  await page.click("#stopTop");
  await startListening(page, TIMER("B"));
  await expect.poll(() => count(page, "B")).toBeGreaterThan(3);
  await sendKey(page, "ArrowUp");
  await page.waitForTimeout(500);
  expect(await count(page, "A")).toBe(0);
  expect(await count(page, "up")).toBe(0);
  await page.click("#stopTop");

  // Stopped before listening: the timer was registered, the main program was still running.
  await page.fill("#code", TIMER("C") + "total = 0\nwhile True:\n    total = total + 1\n");
  await page.evaluate(() => { run(); });
  await page.waitForTimeout(400);
  await page.click("#stopTop");
  await page.fill("#code", "print('plain')\n");
  await page.evaluate(() => run());
  await expectRunSucceeded(page);
  const c = await count(page, "C");
  await page.waitForTimeout(600);
  expect(await count(page, "C")).toBe(c);
  expect(c).toBe(0); // output was cleared by the new run and nothing from C arrived since
});

test("onscreenclick receives turtle coordinates", async ({ page }) => {
  await openApp(page);
  await startListening(page, "import turtle\nscreen = turtle.Screen()\ndef clicked(x, y):\n    print('click', round(x), round(y))\nscreen.onscreenclick(clicked)\n");
  const r = await page.locator("#target").boundingBox();
  await page.mouse.click(r.x + r.width / 2 + 50, r.y + r.height / 2 - 30);
  await expect(page.locator("#out")).toContainText(/click (4[89]|5[01]) (2[89]|3[01]|32)/);
  await page.click("#stopTop");
});

test("AC6: choosing a lesson, an example or another language while listening stops the run first", async ({ page }) => {
  await openApp(page);
  for (const change of [
    () => selectLesson(page, 2),
    () => page.selectOption("#examples", "0").then(async () => { if (await page.locator("#replaceDialog").isVisible()) await page.click("#replaceOk"); }),
    () => page.selectOption("#langSelect", "ar"),
  ]) {
    await startListening(page, TIMER("tick", 200));
    await change();
    await expect(page.locator("#runBtn")).toBeEnabled();
    expect(await page.evaluate(() => listening)).toBe(false);
  }
});

test("AC7: an error inside a handler is shown on its line and ends the run", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", "import turtle\nscreen = turtle.Screen()\ndef tick():\n    print('before')\n    x = 1 / 0\nscreen.ontimer(tick, 100)\n");
  await page.evaluate(() => run()); // the timer may fail before the listening banner can be read, so wait for the error itself
  await expect(page.locator("#out")).toContainText("before");
  await expect(page.locator("#err")).toContainText(await t(page, "friendlyTitle"));
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#stopTop")).toBeDisabled();
  await expect(page.locator("#rail .railLine.error")).toHaveText("5");
  expect(await page.evaluate(() => [listening, activeRun])).toEqual([false, null]);
});

test("Step mode: the main program is stepped, then handlers run at normal speed with a tip", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#runMode", "step");
  await page.selectOption("#stepSpeed", "200");
  await startListening(page, KEYS);
  await expect(page.locator("#debugInfo")).toContainText(await t(page, "stepHandlersTip"));
  await expect(page.locator("#stepControls")).toBeHidden();
  await expect(page.locator("#rail .railLine.current")).toHaveCount(0);
  const steps = await page.evaluate(() => activeStepCount);
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => count(page, "up")).toBe(1);
  expect(await page.evaluate(() => activeStepCount)).toBe(steps); // the handler was not stepped
  await page.click("#stopTop");
  await expect(page.locator("#runBtn")).toBeEnabled();
});

test("each handler gets its own time limit, so a long game keeps working", async ({ page }) => {
  await openApp(page);
  await startListening(page, KEYS);
  await page.evaluate(() => { Sk.execStart = new Date(Date.now() - 120000); }); // as if listening for 2 minutes
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => count(page, "up")).toBe(1);
  await expect(page.locator("#err")).toHaveText(await t(page, "listening"));
  await page.click("#stopTop");
});

test("a program without handlers still finishes normally", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", "import turtle\nscreen = turtle.Screen()\nscreen.listen()\nt = turtle.Turtle()\nt.forward(20)\n");
  await page.evaluate(() => run());
  await expectRunSucceeded(page);
  expect(await page.evaluate(() => listening)).toBe(false);
});

test("AC8: listening text is Arabic in Arabic mode", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#langSelect", "ar");
  await startListening(page, KEYS);
  await expect(page.locator("#target")).toHaveAttribute("aria-label", await t(page, "stageListening"));
  await page.keyboard.press("ArrowUp");
  await expect.poll(() => count(page, "up")).toBe(1);
  await page.click("#stopTop");
});
