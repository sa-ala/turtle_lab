// Curriculum v2 (ROADMAP F-018): the "Beyond the basics" lessons 39-47 and the reordered debug lessons.
// Starters running in Normal mode is covered by content.spec.js; here they must also survive Step mode.
import { test, expect, openApp, runAndWait, selectLesson, expectRunSucceeded } from "./fixtures.js";

const FIRST_NEW = 38; // index of lesson 39

test("the Beyond-the-basics lessons are appended after the Final Project, with levels 11 and 12", async ({ page }) => {
  await openApp(page);
  const info = await page.evaluate(() => ({ ids: lessons.map((l) => l.id), levels: lessons.map((l) => l.level) }));
  expect(info.ids[37]).toBe("l38-final-project");
  expect(info.ids.slice(FIRST_NEW, FIRST_NEW + 9)).toEqual([
    "l39-random-colors", "l40-a-grid-of-shapes", "l41-loop-through-a-list", "l42-counting-by-steps", "l43-functions-that-give-back",
    "l44-words-on-the-canvas", "l45-f-strings-and-running-totals", "l46-recursion-fractal-tree", "l47-random-art-studio"]);
  expect(new Set(info.levels.slice(FIRST_NEW, FIRST_NEW + 9))).toEqual(new Set(["Level 11: Randomness and Patterns", "Level 12: Reuse, Text, and Recursion"]));
});

test.describe("Step mode, new lessons", () => {
  // GAP-32: under a heavily loaded parallel run, a Step-mode run with a 1 ms delay can stall inside a turtle
  // call and never finish (seen on lessons 43 and 46; never alone). Retry until the gap is fixed.
  test.describe.configure({ retries: 2 });
for (let i = FIRST_NEW; i < FIRST_NEW + 9; i++) {
  test(`lesson ${i + 1} runs to the end in Step mode`, async ({ page }) => {
    test.slow(); // hundreds of stepped lines; under a busy parallel run this can pass 60 s
    await openApp(page);
    await selectLesson(page, i);
    // Fastest delay the UI offers is 200 ms per line, far too slow to finish loops and recursion in a test.
    await page.evaluate(() => { const s = document.getElementById("stepSpeed"); s.add(new Option("1", "1")); s.value = "1"; });
    // The full tree is ~1,000 stepped lines (SPEC §5.2 note); a shorter tree exercises the same recursive code path.
    if (i === 45) await page.fill("#code", (await page.inputValue("#code")).replace("tree(80)", "tree(30)"));
    await page.selectOption("#runMode", "step");
    await runAndWait(page);
    await expectRunSucceeded(page);
  });
}
});

test("lesson 45 prints its f-string messages with the running total", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 44);
  await runAndWait(page);
  await expectRunSucceeded(page);
  await expect(page.locator("#out")).toContainText("Side 1: walked 50 steps");
  await expect(page.locator("#out")).toContainText("Side 5: walked 250 steps");
});
