// Regression tests for the F-006 quick-fix bundle (one block per gap, SPEC.md §13).
import { test, expect, openApp, runAndWait, t, selectLesson, expectRunSucceeded } from "./fixtures.js";

test("GAP-09: step explanation for print() lines is the output explanation", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", 'print("hi")\nsquare()\nt.forward(5)\n');
  expect(await page.evaluate(() => [lineExplanation(1), lineExplanation(2), lineExplanation(3)]))
    .toEqual(await page.evaluate(() => [T("linePrint"), T("lineFunction"), T("lineForward")]));
});

test("GAP-10: Debug Help names the same colour as the current-line highlight", async ({ page }) => {
  await openApp(page);
  expect(await page.evaluate(() => I18N.en.debugReady || DEBUG_I18N.en.debugReady)).toContain("Green means running now");
  expect(await page.evaluate(() => I18N.ar.debugReady || DEBUG_I18N.ar.debugReady)).toContain("الأخضر");
  const bg = await page.evaluate(() => { const d = document.createElement("div"); d.className = "railLine current"; document.getElementById("rail").appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; });
  const [r, g, b] = bg.match(/\d+/g).map(Number);
  expect(g).toBeGreaterThan(r);
  expect(g).toBeGreaterThan(b);
});

test("GAP-11: Syntax Help Try it clears the red error line and status", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 25);
  await runAndWait(page);
  await expect(page.locator("#rail .railLine.error")).toHaveCount(1);
  await page.click('.learn .tab[data-tab="syntax"]');
  await page.locator("#docGrid .try").first().click();
  await expect(page.locator("#rail .railLine.error")).toHaveCount(0);
  await expect(page.locator("#debugInfo")).toHaveText(await t(page, "debugNormal"));
});

for (const [name, setup, expected] of [
  ["Clipboard API missing, fallback works", () => { Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }); document.execCommand = () => true; }, "codeCopied"],
  ["Clipboard API missing, fallback fails", () => { Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }); document.execCommand = () => false; }, "copyFailed"],
  ["Clipboard write rejected, fallback works", () => { Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) }, configurable: true }); document.execCommand = () => true; }, "codeCopied"],
]) {
  test(`GAP-12: copy reports the real result — ${name}`, async ({ page }) => {
    await page.addInitScript(setup);
    await openApp(page);
    await page.click("#copyBtn");
    await expect(page.locator("#toast")).toHaveText(await t(page, expected));
  });
}
