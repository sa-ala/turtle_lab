// App behavior smoke tests. Section numbers refer to SPEC.md.
import { test, expect, openApp, runAndWait, t, content, selectLesson, expectRunSucceeded } from "./fixtures.js";

test("first load uses clean defaults (§4.1, §14 first app load)", async ({ page }) => {
  await openApp(page);
  const { lessons } = await content(page);

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#lessonSelect")).toHaveValue("0");
  await expect(page.locator("#code")).toHaveValue(lessons[0].starterCode);
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#stopTop")).toBeDisabled();
  await expect(page.locator("#out")).toHaveText(await t(page, "outputPlaceholder"));
  await expect(page.locator("#err")).toHaveText(await t(page, "noErrors"));

  // Preferences
  await expect(page.locator("body")).not.toHaveClass(/\blessons-collapsed\b/);
  await expect(page.locator("body")).not.toHaveClass(/\bhc\b/);
  await expect(page.locator("#runMode")).toHaveValue("normal");
  await expect(page.locator("#stepSpeed")).toHaveValue("500");
  await expect(page.locator("#stepSpeedControl")).toBeHidden();
  await expect(page.locator("#zoomLabel")).toHaveText("100%");
  await expect(page.locator("#coordToggle")).toHaveAttribute("aria-pressed", "false");

  // Progress and badges
  await expect(page.locator("#progressText")).toHaveText(`0 of ${lessons.length} lessons complete`);
  await expect(page.locator("#starText")).toHaveText("0 ⭐");
  await expect(page.locator("#badgeGrid .badge")).toHaveCount(7);
  await expect(page.locator("#badgeGrid .badge.earned")).toHaveCount(0);

  // Content inventory (§5, §14): 51 lessons in 13 levels, 13 examples, 25 syntax entries, 12 gallery pieces
  await expect(page.locator("#lessonSelect option")).toHaveCount(51);
  await expect(page.locator("#lessonList .lesson")).toHaveCount(51);
  await expect(page.locator("#lessonList .level")).toHaveCount(13);
  await expect(page.locator("#examples option:not([value=''])")).toHaveCount(13);
  await expect(page.locator("#printDocs .doc")).toHaveCount(25);
  await expect(page.locator("#gallery .gPiece")).toHaveCount(12);
});

test("Run button draws lesson 1 and shows success (§4.4, §7.2)", async ({ page }) => {
  await openApp(page);
  await page.click("#runBtn");
  await expectRunSucceeded(page);
  await expect(page.locator("#target canvas").first()).toBeAttached();
  // Running code never completes a lesson by itself.
  await expect(page.locator("#starText")).toHaveText("0 ⭐");
});

test("lesson 13 fails on the missing colon with a red line; adding the colon fixes it (§7.4)", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 12);
  await runAndWait(page);

  await expect(page.locator("#err h3")).toHaveText(await t(page, "friendlyTitle"));
  await expect(page.locator("#err p")).toContainText("5");
  await expect(page.locator("#rail .railLine.error")).toHaveText("5");
  await expect(page.locator("#err details pre")).not.toBeEmpty();
  await expect(page.locator("#runBtn")).toBeEnabled();

  const fixed = (await page.inputValue("#code")).replace(/^(for .*\))\s*$/m, "$1:");
  expect(fixed, "lesson 13 starter should contain a for-loop header without a colon").not.toBe(await page.inputValue("#code"));
  await page.fill("#code", fixed);
  await runAndWait(page);
  await expectRunSucceeded(page);
  await expect(page.locator("#rail .railLine.error")).toHaveCount(0);
});

test("lesson 14 fails on the unindented loop body with a red line (§7.4)", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 13);
  await runAndWait(page);
  await expect(page.locator("#err h3")).toHaveText(await t(page, "friendlyTitle"));
  await expect(page.locator("#rail .railLine.error")).toHaveText("6");
  await expect(page.locator("#runBtn")).toBeEnabled();
});

// GAP-25 (fixed by F-006): Skulpt 1.2.0 reports both mistakes as "SyntaxError: bad input on line N";
// friendly() inspects the reported and previous lines to choose the colon or indentation guidance.
for (const [index, key] of [[12, "friendlySyntax"], [13, "friendlyIndent"]]) {
  test(`lesson ${index + 1} shows its specific ${key} guidance (GAP-25)`, async ({ page }) => {
    await openApp(page);
    await selectLesson(page, index);
    await runAndWait(page);
    await expect(page.locator("#err p")).toContainText(await t(page, key), { timeout: 2_000 });
  });
}

test("Step-by-step highlights lines in order, Stop re-enables Run, and Run works again (§7.3, §4.4)", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 11); // Lesson 12: square with a for loop
  await page.selectOption("#runMode", "step");
  await expect(page.locator("#stepSpeedControl")).toBeVisible();
  await page.selectOption("#stepSpeed", "200");

  // Record every highlighted "current" line while the program steps.
  await page.evaluate(() => {
    window.__seen = [];
    new MutationObserver(() => {
      const cur = document.querySelector("#rail .railLine.current");
      const n = cur && Number(cur.textContent);
      if (n && window.__seen.at(-1) !== n) window.__seen.push(n);
    }).observe(document.getElementById("rail"), { childList: true, subtree: true });
  });
  await page.click("#runBtn");
  await expect(page.locator("#stopTop")).toBeEnabled();
  await expect(page.locator("#runBtn")).toBeDisabled();
  await expect(page.locator("#runMode")).toBeDisabled();
  await page.waitForFunction(() => window.__seen.length >= 6);

  // Lesson 12: 1 import, 3 creates the turtle, 5 the loop header, 6-7 its body (repeated).
  const seen = await page.evaluate(() => window.__seen.slice());
  expect(seen.slice(0, 6)).toEqual([1, 3, 5, 6, 7, 6]);

  await page.click("#stopTop");
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#stopTop")).toBeDisabled();
  await expect(page.locator("#err")).toHaveText(await t(page, "stopped"));
  await expect(page.locator("#rail .railLine.current")).toHaveCount(0);

  // No further steps after Stop.
  const afterStop = await page.evaluate(() => window.__seen.length);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__seen.length)).toBe(afterStop);

  // Run again immediately (Normal mode) and it succeeds.
  await page.selectOption("#runMode", "normal");
  await runAndWait(page);
  await expectRunSucceeded(page);
});

test("switching to Arabic is RTL, translates the lesson and preserves code (§10.2)", async ({ page }) => {
  await openApp(page);
  const { LESSON_AR } = await content(page);
  await selectLesson(page, 2);
  const edited = (await page.inputValue("#code")) + "\n# my change\n";
  await page.fill("#code", edited);

  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("#lessonTitle")).toContainText(LESSON_AR[2].title);
  await expect(page.locator("#runBtn")).toHaveText(await t(page, "run"));
  await expect(page.locator("#code")).toHaveValue(edited);
  await expect(page.locator("#code")).toHaveCSS("direction", "ltr");
  await expect(page.locator("#out")).toHaveCSS("direction", "ltr");

  // Code still runs in Arabic mode, with Arabic success text.
  await runAndWait(page);
  await expectRunSucceeded(page);
  expect(await t(page, "success")).not.toMatch(/[A-Za-z]{4}/);

  // Language, lesson and code survive reload.
  await page.reload();
  await page.waitForFunction(() => typeof Sk !== "undefined");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#lessonSelect")).toHaveValue("2");
  await expect(page.locator("#code")).toHaveValue(edited);
});

test("I did it! updates progress, stars and badges and survives reload (§4.2, §6)", async ({ page }) => {
  await openApp(page);
  const { lessons } = await content(page);
  await page.click('.learn .tab[data-tab="challenge"]');
  await page.click("#done");

  const expectOneComplete = async () => {
    await expect(page.locator("#progressText")).toHaveText(`1 of ${lessons.length} lessons complete`);
    await expect(page.locator("#starText")).toHaveText("1 ⭐");
    await expect(page.locator('#lessonList .lesson[data-i="0"]')).toContainText("✓");
    await expect(page.locator("#badgeGrid .badge.earned")).toHaveCount(1);
    const width = await page.locator("#fill").evaluate((el) => el.style.width);
    expect(parseFloat(width)).toBeCloseTo(100 / lessons.length, 5);
  };
  await expectOneComplete();

  // Completing the same lesson again does not add a second star.
  await page.click("#done");
  await expectOneComplete();

  await page.reload();
  await page.waitForFunction(() => typeof Sk !== "undefined");
  await expectOneComplete();
});
