// Regression tests for the F-006 quick-fix bundle (one block per gap, SPEC.md §13).
import { test, expect, openApp, runAndWait, t, selectLesson, expectRunSucceeded } from "./fixtures.js";

test("GAP-09: step explanation for print() lines is the output explanation", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", 'print("hi")\nsquare()\nt.forward(5)\n');
  expect(await page.evaluate(() => [lineExplanation(1), lineExplanation(2), lineExplanation(3)]))
    .toEqual(await page.evaluate(() => [T("linePrint"), T("lineFunction"), T("lineForward")]));
});
