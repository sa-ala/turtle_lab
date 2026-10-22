// Accessibility pass (ROADMAP F-013, SPEC.md §10.3; GAP-22).
import AxeBuilder from "@axe-core/playwright";
import { test, expect, openApp, runAndWait, t, selectLesson } from "./fixtures.js";

async function seriousViolations(page) {
  const r = await new AxeBuilder({ page }).analyze();
  return r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 5).join(", ")}`);
}

for (const view of ["both", "en", "ar"]) {
  test(`axe: landing page (${view} view) has no serious or critical issues`, async ({ page }) => {
    await page.goto("/index.html");
    await page.click(`[data-set-view="${view}"]`);
    expect(await seriousViolations(page)).toEqual([]);
  });
}

for (const lang of ["en", "ar"]) {
  test(`axe: app (${lang}) in its main states has no serious or critical issues`, async ({ page }) => {
    await openApp(page);
    if (lang === "ar") await page.selectOption("#langSelect", "ar");
    expect(await seriousViolations(page), "first load").toEqual([]);
    for (const tabId of ["syntax", "challenge", "teacher", "badges", "projects"]) {
      await page.click(`.learn .tab[data-tab="${tabId}"]`);
      expect(await seriousViolations(page), `tab ${tabId}`).toEqual([]);
    }
    await page.click("#hc");
    expect(await seriousViolations(page), "high contrast").toEqual([]);
    await selectLesson(page, 25);
    await runAndWait(page); // friendly error with details
    expect(await seriousViolations(page), "error shown").toEqual([]);
    await page.fill("#code", "print('mine')\n");
    await page.click("#resetTop");
    await expect(page.locator("#replaceDialog")).toBeVisible();
    expect(await seriousViolations(page), "dialog open").toEqual([]);
    await page.click("#replaceCancel");
  });
}

test("axe: Step mode while paused (controls and Variables panel)", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 11);
  await page.selectOption("#runMode", "step");
  await page.selectOption("#stepSpeed", "900");
  await page.evaluate(() => { run(); });
  await expect(page.locator("#stepControls")).toBeVisible();
  await page.click("#pauseBtn");
  await page.waitForFunction(() => activeStepResolve !== null);
  expect(await seriousViolations(page)).toEqual([]);
  await page.click("#stopTop");
});

test("tabs follow the ARIA tablist pattern with arrow keys, Home and End (mirrored in RTL)", async ({ page }) => {
  await openApp(page);
  const learn = page.locator(".learn [role=tablist]");
  await expect(learn).toHaveAttribute("aria-label", await t(page, "learningTabsLabel"));
  await expect(page.locator(".learn [role=tab]")).toHaveCount(6);
  const lessonTab = page.locator('.learn [data-tab="lesson"]');
  await expect(lessonTab).toHaveAttribute("aria-selected", "true");
  await expect(lessonTab).toHaveAttribute("tabindex", "0");
  await expect(page.locator('.learn [data-tab="syntax"]')).toHaveAttribute("tabindex", "-1");
  await expect(page.locator("#lesson")).toHaveAttribute("role", "tabpanel");
  await expect(page.locator("#lesson")).toHaveAttribute("aria-labelledby", "tab-lesson");

  await lessonTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('.learn [data-tab="syntax"]')).toBeFocused();
  await expect(page.locator('.learn [data-tab="syntax"]')).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#syntax")).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.locator('.learn [data-tab="projects"]')).toBeFocused();
  await page.keyboard.press("ArrowRight"); // wraps
  await expect(lessonTab).toBeFocused();
  await page.keyboard.press("ArrowLeft"); // wraps backwards
  await expect(page.locator('.learn [data-tab="projects"]')).toBeFocused();
  await page.keyboard.press("Home");
  await expect(lessonTab).toBeFocused();

  // RTL: ArrowLeft moves forward.
  await page.selectOption("#langSelect", "ar");
  await lessonTab.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('.learn [data-tab="syntax"]')).toBeFocused();

  // Result tabs too.
  await page.locator('.runTabs [data-run-tab="output"]').focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('.runTabs [data-run-tab="errors"]')).toHaveAttribute("aria-selected", "true");
});

test("course progress is exposed as a progressbar", async ({ page }) => {
  await openApp(page);
  const bar = page.locator('[role="progressbar"]');
  await expect(bar).toHaveAttribute("aria-valuenow", "0");
  await expect(bar).toHaveAttribute("aria-valuemin", "0");
  await expect(bar).toHaveAttribute("aria-valuemax", "38");
  await expect(bar).toHaveAttribute("aria-label", await t(page, "progressLabel"));
  await page.click('.learn .tab[data-tab="challenge"]');
  await page.click("#done");
  await expect(bar).toHaveAttribute("aria-valuenow", "1");
  await expect(bar).toHaveAttribute("aria-valuetext", "1 of 38 lessons complete");
});

test("screen readers hear run start, success, error and stop", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#stepState")).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#toast")).toHaveAttribute("aria-live", "polite");
  await page.evaluate(() => { window.__said = []; new MutationObserver(() => window.__said.push(document.getElementById("stepState").textContent)).observe(document.getElementById("stepState"), { childList: true, characterData: true, subtree: true }); });
  await runAndWait(page);
  const said = await page.evaluate(() => window.__said.filter(Boolean));
  expect(said).toEqual([await t(page, "runStarted"), await t(page, "success")]);

  await selectLesson(page, 25);
  await runAndWait(page);
  await expect(page.locator("#stepState")).toContainText(await t(page, "friendlyTitle"));
  await expect(page.locator("#stepState")).toContainText(await t(page, "friendlySyntax"));

  await selectLesson(page, 33);
  await page.evaluate(() => { run(); });
  await expect(page.locator("#stopTop")).toBeEnabled();
  await page.click("#stopTop");
  await expect(page.locator("#toast")).toHaveText(await t(page, "stopToast")); // toast is a polite live region
});

test("every control has a localized accessible name and is keyboard-focusable", async ({ page }) => {
  await openApp(page);
  for (const lang of ["en", "ar"]) {
    await page.selectOption("#langSelect", lang);
    await expect(page.locator("#code")).toHaveAttribute("aria-label", await t(page, "codeEditorLabel"));
    await expect(page.locator("#langSelect")).toHaveAttribute("aria-label", await t(page, "languageLabel"));
    await expect(page.locator("#examples")).toHaveAttribute("aria-label", await t(page, "examplesLabel"));
    await expect(page.locator(".zoomControls")).toHaveAttribute("aria-label", await t(page, "zoomControlsLabel"));
    await expect(page.locator(".runTabs")).toHaveAttribute("aria-label", await t(page, "runResultsLabel"));
  }
  // Every visible, enabled control can take keyboard focus (tabs use roving tabindex, so -1 is allowed there).
  const unreachable = await page.evaluate(() => [...document.querySelectorAll("button, select, input, textarea, a[href]")]
    .filter((el) => el.offsetParent !== null && !el.disabled && el.getAttribute("role") !== "tab" && el.tabIndex < 0)
    .map((el) => el.id || el.outerHTML.slice(0, 60)));
  expect(unreachable).toEqual([]);
});

test("prefers-reduced-motion: no turtle animation, and code still runs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openApp(page);
  await selectLesson(page, 33); // Spiral, normally a long animation
  const t0 = Date.now();
  await runAndWait(page);
  const fast = Date.now() - t0;
  await expect(page.locator("#out")).toContainText(await t(page, "success"));
  expect(await page.evaluate(() => Sk.TurtleGraphics.animate)).toBe(false);
  expect(fast).toBeLessThan(5000);
});
