// Level 13 "Make it interactive" lessons, the Game Maker badge and the interactive Gallery pieces (ROADMAP F-023 PR 3).
import { test, expect, openApp, t, selectLesson, finishInteractive } from "./fixtures.js";

const LEVEL13 = ["l48-ask-and-draw", "l49-drive-with-arrow-keys", "l50-click-to-draw", "l51-catch-the-dot"];
const index = (page, id) => page.evaluate((i) => lessons.findIndex((l) => l.id === i), id);
const pos = (page, name) => page.evaluate((n) => { const tu = Sk.globals[n].instance; return [Math.round(tu.$xcor()), Math.round(tu.$ycor())]; }, name);

test("Level 13 comes last with four lessons, Arabic titles and a level name", async ({ page }) => {
  await openApp(page);
  const info = await page.evaluate(() => ({ ids: lessons.slice(-4).map((l) => l.id), levels: lessons.slice(-4).map((l) => l.level), ar: LESSON_AR.slice(-4).map((l) => l.title) }));
  expect(info.ids).toEqual(LEVEL13);
  expect(new Set(info.levels)).toEqual(new Set(["Level 13: Make It Interactive"]));
  expect(info.ar.every((s) => /[؀-ۿ]/.test(s))).toBe(true);
  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("#lessonList .level").last()).toContainText("المستوى 13: اجعلها تفاعلية");
});

for (const mode of ["normal", "step"]) {
  test.describe(`${mode} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await openApp(page);
      await page.selectOption("#runMode", mode);
      if (mode === "step") await page.selectOption("#stepSpeed", "200");
    });

    test("Ask and Draw: the answers set the color and size", async ({ page }) => {
      await selectLesson(page, await index(page, "l48-ask-and-draw"));
      expect(await finishInteractive(page, ["green", "60"])).toBe("done");
      await expect(page.locator("#out")).toContainText("Here is your green square!");
      expect(await page.evaluate(() => Sk.globals.t.instance._color)).toBe("green");
    });

    test("Drive with Arrow Keys: each arrow moves the turtle 20 steps", async ({ page }) => {
      await selectLesson(page, await index(page, "l49-drive-with-arrow-keys"));
      await page.evaluate(() => run());
      await expect(page.locator("#err")).toHaveText(await t(page, "listening"));
      await expect(page.locator("#target")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect.poll(() => pos(page, "t")).toEqual([0, 20]);
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => pos(page, "t")).toEqual([20, 20]);
      await page.click("#stopTop");
    });

    test("Click to Draw: the turtle goes to the click", async ({ page }) => {
      await selectLesson(page, await index(page, "l50-click-to-draw"));
      await page.evaluate(() => run());
      await expect(page.locator("#err")).toHaveText(await t(page, "listening"));
      const r = await page.locator("#target").boundingBox();
      await page.mouse.click(r.x + r.width / 2 + 60, r.y + r.height / 2 - 40);
      await expect.poll(async () => { const [x, y] = await pos(page, "t"); return Math.abs(x - 60) <= 2 && Math.abs(y - 40) <= 2; }).toBe(true);
      await page.click("#stopTop");
    });

    test("Catch the Dot: catching scores and the countdown runs", async ({ page }) => {
      await selectLesson(page, await index(page, "l51-catch-the-dot"));
      await page.evaluate(() => run());
      await expect(page.locator("#err")).toHaveText(await t(page, "listening"));
      await page.evaluate(() => Sk.globals.target.instance._x = 0, null); // put the dot right above the player
      await page.evaluate(() => { const d = Sk.globals.target.instance; d._x = 0; d._y = 20; });
      await page.keyboard.press("ArrowUp");
      await expect(page.locator("#out")).toContainText("Caught it! Score: 1");
      await expect.poll(() => page.evaluate(() => Sk.globals.time_left.v), { timeout: 5000 }).toBeLessThan(20);
      await page.click("#stopTop");
      await expect(page.locator("#runBtn")).toBeEnabled();
    });
  });
}

test("finishing a Level 13 lesson earns the Game Maker badge", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, await index(page, "l50-click-to-draw"));
  await page.click('.learn .tab[data-tab="challenge"]');
  await page.click("#done");
  await page.click('.learn .tab[data-tab="badges"]');
  const badge = page.locator("#badgeGrid .badge").nth(6);
  await expect(badge).toHaveClass(/earned/);
  await expect(badge).toContainText(await page.evaluate(() => T("badges")[6]));
  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("#badgeGrid .badge").nth(6)).toContainText("شارة صانع الألعاب");
});

for (const id of ["g-sketch-pad", "g-firefly-night"]) {
  test(`Gallery ${id} runs in Step mode and listens`, async ({ page }) => {
    await openApp(page);
    await page.selectOption("#runMode", "step");
    await page.selectOption("#stepSpeed", "200");
    await page.evaluate((g) => { E.code.value = gallery.find((p) => p.id === g).code; }, id);
    test.slow(); // a few hundred stepped lines
    await page.evaluate(() => { const s = $("stepSpeed"); s.add(new Option("1", "1")); s.value = "1"; });
    expect(await finishInteractive(page)).toBe("listening");
  });
}

test("Sketch Pad: Space changes the color and the turtle stays inside the frame", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => { E.code.value = gallery.find((p) => p.id === "g-sketch-pad").code; run(); });
  await expect(page.locator("#err")).toHaveText(await t(page, "listening"));
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => Sk.globals.t.instance._color)).toBe("blue");
  for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowRight");
  await expect.poll(() => pos(page, "t").then(([x]) => x)).toBeLessThanOrEqual(135);
  await page.click("#stopTop");
});
