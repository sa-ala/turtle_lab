// Canvas helper tools: pointer coordinates and turtle state panel (ROADMAP F-022, SPEC.md §7.3, §8.3).
import { test, expect, openApp, runAndWait, t, expectRunSucceeded } from "./fixtures.js";

// Screen point for turtle coordinates (x, y), from the target's center and the current zoom.
const screenPoint = (page, x, y) => page.evaluate(([x, y]) => {
  const r = E.target.getBoundingClientRect();
  return { px: r.left + r.width / 2 + x * drawZoom, py: r.top + r.height / 2 - y * drawZoom };
}, [x, y]);
const chipXY = async (page) => {
  const m = (await page.locator("#pointerCoords").textContent()).match(/^\((-?\d+), (-?\d+)\)$/);
  expect(m, "chip reads (x, y)").not.toBeNull();
  return [Number(m[1]), Number(m[2])];
};
async function hover(page, x, y) {
  const p = await screenPoint(page, x, y);
  await page.mouse.move(p.px, p.py);
  await expect(page.locator("#pointerCoords")).toBeVisible();
  return chipXY(page);
}
// The turtle panel as [name, {label: value}] pairs.
const panel = (page) => page.evaluate(() => {
  const out = [];
  for (const p of document.querySelectorAll("#turtleList .tName")) {
    const rows = {}, dl = p.nextElementSibling;
    for (const dt of dl.querySelectorAll("dt")) rows[dt.textContent] = dt.nextElementSibling.textContent.trim();
    out.push([p.textContent, rows]);
  }
  return out;
});

test("AC1: Pointer shows turtle coordinates at 100%, 50% and 200% zoom", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#pointerToggle")).toHaveAttribute("aria-pressed", "false");
  await page.mouse.move(...Object.values(await screenPoint(page, 0, 0)));
  await expect(page.locator("#pointerCoords")).toBeHidden(); // off by default
  await page.click("#pointerToggle");
  await expect(page.locator("#pointerToggle")).toHaveAttribute("aria-pressed", "true");
  await runAndWait(page); // with Skulpt's canvases in place, as after any run
  for (const [zoom, pts] of [[1, [[0, 0], [100, 0], [-60, 80]]], [0.5, [[100, 0], [-200, -150]]], [2, [[50, 0], [-40, 60]]]]) {
    await page.evaluate((z) => { drawZoom = z; applyZoom(false); }, zoom);
    await page.waitForTimeout(250); // zoom transition
    for (const [x, y] of pts) {
      const [cx, cy] = await hover(page, x, y);
      expect(Math.abs(cx - x), `x at zoom ${zoom}`).toBeLessThanOrEqual(1);
      expect(Math.abs(cy - y), `y at zoom ${zoom}`).toBeLessThanOrEqual(1);
    }
  }
});

test("AC2: the chip stays inside the stage at every corner and hides on leave", async ({ page }) => {
  await openApp(page);
  await page.click("#pointerToggle");
  const s = await page.locator("#stage").boundingBox();
  for (const [x, y] of [[s.x + 14, s.y + 14], [s.x + s.width - 14, s.y + 14], [s.x + 14, s.y + s.height - 14], [s.x + s.width - 14, s.y + s.height - 14]]) { // inside the 20 px rounded corners
    await page.mouse.move(x, y);
    await expect(page.locator("#pointerCoords")).toBeVisible();
    const c = await page.locator("#pointerCoords").boundingBox();
    expect(c.x).toBeGreaterThanOrEqual(s.x);
    expect(c.y).toBeGreaterThanOrEqual(s.y);
    expect(c.x + c.width).toBeLessThanOrEqual(s.x + s.width);
    expect(c.y + c.height).toBeLessThanOrEqual(s.y + s.height);
  }
  await page.mouse.move(s.x - 40, s.y - 40);
  await expect(page.locator("#pointerCoords")).toBeHidden();
  await page.click("#pointerToggle");
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await expect(page.locator("#pointerCoords")).toBeHidden();
});

test("AC3/AC4: Arabic labels, LTR chip, and the toggle persists across reload", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("#pointerToggle")).toHaveText(await t(page, "pointerToggle"));
  await expect(page.locator("#pointerToggle")).toHaveAttribute("title", await t(page, "pointerHelper"));
  await page.click("#pointerToggle");
  await expect(page.locator("#toast")).toContainText(await t(page, "pointerOn"));
  const [x, y] = await hover(page, 100, 50);
  expect(Math.abs(x - 100)).toBeLessThanOrEqual(1);
  expect(Math.abs(y - 50)).toBeLessThanOrEqual(1);
  expect(await page.locator("#pointerCoords").evaluate((el) => getComputedStyle(el).direction)).toBe("ltr");
  await openApp(page); // same context, so storage is kept
  await expect(page.locator("#pointerToggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#pointerToggle")).toHaveText((await t(page, "pointerToggle")) + " ✓");
});

test("AC5: after a run the Turtle panel shows position, heading, pen and colors", async ({ page }) => {
  await openApp(page);
  await page.click("#turtleTitle");
  await expect(page.locator("#turtleNone")).toHaveText(await t(page, "turtleNone"));
  await page.fill("#code", "import turtle\nt = turtle.Turtle()\nt.goto(50, 60)\nt.left(90)\nt.penup()\nt.pencolor('red')\nt.fillcolor('#ff8800')\n");
  await runAndWait(page);
  await expectRunSucceeded(page);
  await expect(page.locator("#turtleNone")).toBeHidden();
  expect(await panel(page)).toEqual([["t", { Position: "(50, 60)", Heading: "90° up", Pen: "up", "Pen color": "red", "Fill color": "#ff8800" }]]);
  expect(await page.locator("#turtleList .swatch").first().evaluate((el) => el.style.backgroundColor)).toBe("red");

  await page.selectOption("#langSelect", "ar"); // re-translated, values unchanged
  const ar = await page.evaluate(() => ["turtlePos", "turtleHeading", "turtlePen"].map((k) => T(k)));
  const [[, rows]] = await panel(page);
  expect(rows[ar[0]]).toBe("(50, 60)");
  expect(rows[ar[1]]).toBe("90° " + (await t(page, "dirUp")));
  expect(rows[ar[2]]).toBe(await t(page, "penUp"));
});

test("AC6: in Step mode the panel follows every step", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", "import turtle\nt = turtle.Turtle()\n" + "t.forward(10)\n".repeat(8));
  await page.selectOption("#runMode", "step");
  await page.selectOption("#stepSpeed", "900");
  await page.evaluate(() => { window.__runSettled = run(); });
  await expect(page.locator("#stepControls")).toBeVisible();
  await page.click("#pauseBtn");
  await page.waitForFunction(() => activeStepResolve !== null);
  await page.click("#turtleTitle");
  for (let i = 0; i < 3; i++) {
    const line = Number(await page.locator("#rail .railLine.current").textContent());
    if (line >= 3) expect((await panel(page))[0][1].Position).toBe(`(${10 * (line - 3)}, 0)`); // state before the highlighted line
    await page.click("#nextBtn");
    await page.waitForFunction((l) => activeStepResolve !== null && highlightLineNo !== l, line);
  }
  await page.click("#stopTop");
});

test("AC7: several turtles are listed by name; no turtle shows the empty message", async ({ page }) => {
  await openApp(page);
  await page.click("#turtleTitle");
  await page.fill("#code", "import turtle\nann = turtle.Turtle()\nbob = turtle.Turtle()\nbob.goto(10, 0)\nsame = bob\n");
  await runAndWait(page);
  const names = (await panel(page)).map(([n]) => n);
  expect(names).toEqual(["ann", "bob"]); // the same turtle under a second name is listed once
  await page.fill("#code", "print('hello')\n");
  await runAndWait(page);
  await expect(page.locator("#turtleNone")).toBeVisible();
  expect(await panel(page)).toEqual([]);
  await page.fill("#code", "import turtle\n" + Array.from({ length: 6 }, (_, i) => `t${i} = turtle.Turtle()\n`).join(""));
  await runAndWait(page);
  expect((await panel(page)).length).toBe(4);
  await expect(page.locator("#turtleList")).toContainText(await page.evaluate(() => T("turtleMore")(2)));
});

test("AC8: a new run or Stop never shows the previous run's turtle", async ({ page }) => {
  await openApp(page);
  await page.click("#turtleTitle");
  await page.fill("#code", "import turtle\nold = turtle.Turtle()\nold.goto(30, 30)\n");
  await runAndWait(page);
  expect((await panel(page))[0][0]).toBe("old");
  await page.fill("#code", "import turtle\nz = turtle.Turtle()\n" + "z.forward(5)\n".repeat(20));
  await page.selectOption("#runMode", "step");
  await page.selectOption("#stepSpeed", "900");
  await page.evaluate(() => { run(); });
  await expect(page.locator("#stepControls")).toBeVisible();
  await expect.poll(async () => (await panel(page)).map(([n]) => n).join()).not.toContain("old");
  await page.waitForFunction(() => highlightLineNo >= 3);
  expect((await panel(page)).map(([n]) => n)).toEqual(["z"]);
  await page.click("#stopTop");
  await expect(page.locator("#turtleNone")).toBeVisible();
  expect(await panel(page)).toEqual([]);
});
