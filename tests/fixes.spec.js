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

for (const [name, failWhich, expected, downloads] of [["one layer fails", "first", "pngPartial", true], ["every layer fails", "all", "pngFailed", false]]) {
  test(`GAP-13: PNG export reports a partial or failed save — ${name}`, async ({ page }) => {
    await openApp(page);
    await runAndWait(page);
    const layers = await page.locator("#stage canvas:not(#coordOverlay), #stage svg").count();
    test.skip(failWhich === "first" && layers < 2, "needs at least two drawing layers");
    await page.evaluate((which) => {
      const els = [...document.querySelectorAll("#stage canvas, #stage svg")].filter((el) => el.id !== "coordOverlay");
      (which === "all" ? els : els.slice(0, 1)).forEach((el) => { el.__bad = true; });
      const real = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (src, ...rest) { if (src && src.__bad) throw new Error("layer failed"); return real.call(this, src, ...rest); };
    }, failWhich);
    const download = page.waitForEvent("download", { timeout: 3000 }).then(() => true, () => false);
    await page.click("#pngBtn");
    await expect(page.locator("#toast")).toHaveText(await t(page, expected));
    expect(await download).toBe(downloads);
  });
}

test("GAP-17: each landing view shows exactly three How It Works cards", async ({ page }) => {
  await page.goto("/index.html");
  for (const view of ["en", "ar"]) {
    await page.click(`[data-set-view="${view}"]`);
    await expect(page.locator("#how .step:visible")).toHaveCount(3);
  }
  await page.click('[data-set-view="both"]');
  await expect(page.locator("#how .step:visible")).toHaveCount(6);
});

test("GAP-18: Arabic-only landing view uses the Arabic font stack on body", async ({ page }) => {
  await page.goto("/index.html");
  await page.click('[data-set-view="ar"]');
  const [font, arStack] = await page.evaluate(() => [getComputedStyle(document.body).fontFamily, getComputedStyle(document.body).getPropertyValue("--font-ar").trim()]);
  expect(arStack).not.toBe("");
  const norm = (v) => v.replace(/[\s"']/g, ""); // computed font-family may drop quotes
  expect(norm(font)).toBe(norm(arStack));
});
