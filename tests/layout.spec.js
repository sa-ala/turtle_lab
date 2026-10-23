// Lesson-first layout (ROADMAP F-019 PR A): lesson card, one button per action, new-output notice.
import { test, expect, openApp, runAndWait, t, selectLesson, expectRunSucceeded } from "./fixtures.js";

const inViewport = (page, sel) => page.locator(sel).evaluate((e) => {
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
});

for (const [width, height] of [[1440, 900], [1280, 720]]) {
  for (const lang of ["en", "ar"]) {
    test(`AC1: goal, challenge and I did it! are visible without scrolling at ${width}x${height} (${lang})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openApp(page);
      if (lang === "ar") await page.selectOption("#langSelect", "ar");
      const l = await page.evaluate(() => lessonData(current));
      await expect(page.locator("#lessonCardGoal")).toHaveText(l.goal);
      await expect(page.locator("#lessonCardChallenge")).toHaveText(l.challenge);
      await expect(page.locator("#lessonCardDone")).toHaveText(await t(page, "didIt"));
      for (const sel of ["#lessonCardGoal", "#lessonCardChallenge", "#lessonCardDone", "#runBtn", "#stopTop"]) expect(await inViewport(page, sel), sel).toBe(true);
    });
  }
}

test("AC2: the card's I did it! completes the lesson like the Challenges button, and persists", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 2);
  await page.click("#lessonCardDone");
  await expect(page.locator("#progressText")).toHaveText(await page.evaluate(() => T("progress")(1, lessons.length)));
  await expect(page.locator('#lessonList .lesson[data-i="2"]')).toContainText("✓");
  await page.reload();
  await expect(page.locator('#lessonList .lesson[data-i="2"]')).toContainText("✓");
});

test("AC3: Run, Stop, Clear and Reset lesson code each exist once; Ctrl+Enter still runs", async ({ page }) => {
  await openApp(page);
  for (const id of ["runTop", "clearTop", "resetTop"]) await expect(page.locator("#" + id)).toHaveCount(0);
  await expect(page.locator("header button")).toHaveCount(1); // high contrast only
  for (const key of ["run", "stop", "clear", "resetLesson"]) {
    const label = await t(page, key);
    await expect(page.locator("button", { hasText: label }), key).toHaveCount(1);
  }
  await page.focus("#code");
  await page.keyboard.press("Control+Enter");
  await page.waitForFunction(() => activeRun === null && E.out.textContent.includes(T("success")));
  await expectRunSucceeded(page);
});

test("AC4: print() output below the fold shows a New output chip that scrolls to it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page);
  await selectLesson(page, 3); // Comments and Print Messages
  await runAndWait(page);
  await expect(page.locator("#newOutput")).toBeVisible();
  await expect(page.locator("#newOutput")).toHaveText(await t(page, "newOutput"));
  await expect(page.locator("#tab-output")).toHaveClass(/\bhasNew\b/);
  await page.click("#newOutput");
  await expect(page.locator("#newOutput")).toBeHidden();
  expect(await inViewport(page, "#out")).toBe(true);
});

test("AC4: no notice when nothing is printed", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openApp(page);
  await runAndWait(page); // lesson 1 prints nothing but the app's own success line
  await expect(page.locator("#newOutput")).toBeHidden();
});

test("the lesson card can be hidden, and stays hidden after reload, in both languages", async ({ page }) => {
  await openApp(page);
  await page.click("#lessonCardToggle");
  await expect(page.locator("#lessonCardBody")).toBeHidden();
  await expect(page.locator("#lessonCardToggle")).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#lessonCardToggle")).toHaveText(await t(page, "lessonCardShow"));
  await page.reload();
  await expect(page.locator("#lessonCardBody")).toBeHidden();
  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("#lessonCardToggle")).toHaveText(await t(page, "lessonCardShow"));
  await page.click("#lessonCardToggle");
  await expect(page.locator("#lessonCardBody")).toBeVisible();
});

test("More about this lesson opens the Lesson tab in the Learning Area", async ({ page }) => {
  await openApp(page);
  await page.click('.learn .tab[data-tab="syntax"]');
  await page.click("#lessonCardMore");
  await expect(page.locator('.learn .tab[data-tab="lesson"]')).toHaveAttribute("aria-selected", "true");
  expect(await inViewport(page, '.learn .tab[data-tab="lesson"]')).toBe(true);
});
