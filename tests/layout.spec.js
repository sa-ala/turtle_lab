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
      await expect(page.locator("#lessonCardDone")).toHaveText(await t(page, "cardMark"));
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
  await expect(page.locator("#lessonCardToggle")).toHaveAttribute("aria-label", await t(page, "lessonCardShow"));
  await page.reload();
  await expect(page.locator("#lessonCardBody")).toBeHidden();
  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("#lessonCardToggle")).toHaveAttribute("aria-label", await t(page, "lessonCardShow"));
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

// F-019 PR B
test("AC5: only the current level is open; headings show done/total and aria-expanded", async ({ page }) => {
  await openApp(page);
  const groups = page.locator("#lessonList .levelGroup");
  await expect(groups).toHaveCount(12);
  await expect(page.locator("#levelBtn-0")).toHaveAttribute("aria-expanded", "true");
  for (let k = 1; k < 12; k++) await expect(page.locator(`#levelBtn-${k}`)).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator('#lessonList .lesson[data-i="0"]')).toBeVisible();
  await expect(page.locator('#lessonList .lesson[data-i="3"]')).toBeHidden();
  await expect(page.locator("#levelBtn-0 .lvCount")).toHaveText(await page.evaluate(() => T("levelProgress")(0, 3)));

  await page.selectOption("#lessonSelect", "29"); // lesson 30, Level 8
  await expect(page.locator("#levelBtn-7")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator('#lessonList .lesson[data-i="29"]')).toBeVisible();

  await page.click("#lessonCardDone");
  await expect(page.locator("#levelBtn-7 .lvCount")).toHaveText(await page.evaluate(() => T("levelProgress")(1, 3)));
  await expect(page.locator("#levelBtn-7")).toHaveAttribute("aria-expanded", "true"); // rebuild keeps it open

  await page.click("#levelBtn-1");
  await expect(page.locator('#lessonList .lesson[data-i="3"]')).toBeVisible();
  await page.click("#levelBtn-1");
  await expect(page.locator('#lessonList .lesson[data-i="3"]')).toBeHidden();
});

test("AC5: level headings are translated and keep their state in Arabic", async ({ page }) => {
  await openApp(page);
  await page.click("#levelBtn-2");
  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("#levelBtn-0 .lvName")).toHaveText(await page.evaluate(() => LEVEL_AR[lessons[0].level]));
  await expect(page.locator("#levelBtn-0 .lvCount")).toHaveText(await page.evaluate(() => T("levelProgress")(0, 3)));
  await expect(page.locator("#levelBtn-2")).toHaveAttribute("aria-expanded", "true");
});

test("AC6: Reset progress is not in the sidebar and still works from Teacher & Parent", async ({ page }) => {
  await openApp(page);
  await expect(page.locator(".side #resetProgress")).toHaveCount(0);
  await page.click("#lessonCardDone");
  await expect(page.locator("#progressText")).toHaveText(await page.evaluate(() => T("progress")(1, lessons.length)));
  await page.click('.learn .tab[data-tab="teacher"]');
  page.once("dialog", (d) => d.accept());
  await page.click("#resetTeacher");
  await expect(page.locator("#progressText")).toHaveText(await page.evaluate(() => T("progress")(0, lessons.length)));
});

test("the start marker is an arrow that hides once a run draws, and returns after Clear", async ({ page }) => {
  await openApp(page);
  const marker = page.locator("#stage .center");
  await expect(marker).toBeVisible();
  expect(await marker.evaluate((e) => getComputedStyle(e).borderLeftWidth)).toBe("16px");
  await runAndWait(page);
  await expect(marker).toBeHidden();
  await page.click("#clearBtn");
  await expect(marker).toBeVisible();
});

// F-020 PR A: lesson card clarity
test("F-020: completion is a Mark challenge done button, not a second green button; Done! after completing", async ({ page }) => {
  await openApp(page);
  const done = page.locator("#lessonCardDone");
  await expect(done).toHaveText(await t(page, "cardMark"));
  await expect(done).toHaveAttribute("aria-pressed", "false");
  const [runBg, doneBg] = await page.evaluate(() => [getComputedStyle(runBtn).backgroundImage + getComputedStyle(runBtn).backgroundColor, getComputedStyle(lessonCardDone).backgroundImage + getComputedStyle(lessonCardDone).backgroundColor]);
  expect(doneBg).not.toBe(runBg);
  await done.click();
  await expect(done).toHaveText(await t(page, "cardDone"));
  await expect(done).toHaveAttribute("aria-pressed", "true");
  await done.click(); // a second click changes nothing
  await expect(page.locator("#starText")).toHaveText(await page.evaluate(() => T("stars")(1)));
});

for (const lang of ["en", "ar"]) {
  test(`F-020: a successful run nudges the challenge until the lesson changes or is marked done (${lang})`, async ({ page }) => {
    await openApp(page);
    if (lang === "ar") await page.selectOption("#langSelect", "ar");
    await expect(page.locator("#lessonCardNudge")).toBeHidden();
    await runAndWait(page);
    await expect(page.locator("#lessonCardNudge")).toBeVisible();
    await expect(page.locator("#lessonCardNudge")).toHaveText(await t(page, "cardNudge"));
    await expect(page.locator("#lessonCard")).toHaveClass(/(^| )nudge( |$)/);
    await selectLesson(page, 1);
    await expect(page.locator("#lessonCardNudge")).toBeHidden();
    await runAndWait(page);
    await page.click("#lessonCardDone");
    await expect(page.locator("#lessonCardNudge")).toBeHidden();
  });
}

test("F-020: a failed run does not nudge", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 12); // missing colon
  await runAndWait(page);
  await expect(page.locator("#lessonCardNudge")).toBeHidden();
});

test("F-020: the idle banner is hidden in Normal mode and shown in Step mode, during runs and on errors", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#debugInfo")).toBeHidden();
  await page.selectOption("#runMode", "step");
  await expect(page.locator("#debugInfo")).toBeVisible();
  await expect(page.locator("#debugInfo")).toHaveText(await t(page, "debugStep"));
  await page.selectOption("#runMode", "normal");
  await expect(page.locator("#debugInfo")).toBeHidden();
  await selectLesson(page, 12);
  await runAndWait(page);
  await expect(page.locator("#debugInfo")).toBeVisible();
});

test("F-020: the card toggle is a chevron with an accessible name", async ({ page }) => {
  await openApp(page);
  const tg = page.locator("#lessonCardToggle");
  await expect(tg).toHaveText("▾");
  await expect(tg).toHaveAttribute("aria-label", await t(page, "lessonCardHide"));
  await tg.click();
  await expect(tg).toHaveText("▸");
  await expect(tg).toHaveAttribute("aria-label", await t(page, "lessonCardShow"));
});
