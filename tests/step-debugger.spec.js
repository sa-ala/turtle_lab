// Pause / Next step / Continue debugger (ROADMAP F-010, SPEC.md §7.3).
import { test, expect, openApp, runAndWait, t, selectLesson, expectRunSucceeded } from "./fixtures.js";

const VARS_CODE = "import turtle\nt = turtle.Turtle()\nsize = 50\nname = 'Sam'\ncolors = ['red', 'blue']\nok = True\nratio = 1.5\nfor i in range(4):\n    t.forward(size)\n    t.right(90)\nturtle.done()\n";

// Slow steps (900 ms) by default, so Pause lands early in the program even on a busy machine.
async function startStep(page, { code, lesson = 11, speed = "900" } = {}) {
  if (code === undefined) await selectLesson(page, lesson); else await page.fill("#code", code);
  await page.selectOption("#runMode", "step");
  await page.selectOption("#stepSpeed", speed);
  await page.evaluate(() => { window.__runSettled = run().then(() => "settled", () => "rejected"); });
  await expect(page.locator("#stepControls")).toBeVisible();
  await expect(page.locator("#rail .railLine.current")).toHaveCount(1);
}
const steps = (page) => page.evaluate(() => activeStepCount);
const currentLine = (page) => page.locator("#rail .railLine.current").textContent();
const pauseAndSettle = async (page) => {
  await page.click("#pauseBtn");
  await page.waitForFunction(() => activeStepResolve !== null); // halted, waiting at a step
};
// Stop must settle the run almost at once; a run that continues to the end needs time for the turtle animation.
const settled = (page, ms = 4000) => page.evaluate((m) => Promise.race([window.__runSettled, new Promise((r) => setTimeout(() => r("still pending"), m))]), ms);

test("controls appear only during a Step-mode run, with labels in both languages", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#stepControls")).toBeHidden();
  await startStep(page);
  await expect(page.locator("#pauseBtn")).toHaveText(await t(page, "stepPause"));
  await expect(page.locator("#pauseBtn")).toBeEnabled();
  await expect(page.locator("#nextBtn")).toBeDisabled();
  await expect(page.locator("#continueBtn")).toBeDisabled();
  await page.click("#stopTop");
  await expect(page.locator("#stepControls")).toBeHidden();

  await page.selectOption("#langSelect", "ar");
  await startStep(page);
  for (const [id, key] of [["#pauseBtn", "stepPause"], ["#nextBtn", "stepNext"], ["#continueBtn", "stepContinue"]]) await expect(page.locator(id)).toHaveText(await t(page, key));
  await expect(page.locator("#stepControls")).toHaveAttribute("aria-label", await t(page, "stepControlsLabel"));
  await page.click("#stopTop");
});

test("AC1: Pause halts before the highlighted line and announces it", async ({ page }) => {
  await openApp(page);
  await startStep(page);
  await pauseAndSettle(page);
  const line = await currentLine(page);
  const count = await steps(page);
  await page.waitForTimeout(2000); // two 900 ms steps would have happened
  expect(await steps(page)).toBe(count);
  expect(await currentLine(page)).toBe(line);
  await expect(page.locator("#stepState")).toHaveText((await page.evaluate((n) => T("stepPausedAt")(n), Number(line))));
  await expect(page.locator("#stepState")).toHaveAttribute("aria-live", "polite");
  await page.click("#stopTop");
});

test("AC1: Next step advances exactly one step each time", async ({ page }) => {
  await openApp(page);
  await startStep(page);
  await pauseAndSettle(page);
  for (let i = 0; i < 3; i++) {
    const before = await steps(page);
    await page.click("#nextBtn");
    await expect.poll(() => steps(page)).toBe(before + 1);
    await page.waitForFunction(() => activeStepResolve !== null);
    await page.waitForTimeout(500);
    expect(await steps(page)).toBe(before + 1); // still paused afterwards
  }
  await page.click("#stopTop");
});

test("AC1: Continue resumes timed stepping and the program finishes", async ({ page }) => {
  await openApp(page);
  await startStep(page);
  await pauseAndSettle(page);
  await page.click("#continueBtn");
  await expect(page.locator("#stepState")).toHaveText(await t(page, "stepContinued"));
  await expect(page.locator("#pauseBtn")).toBeEnabled();
  expect(await settled(page, 30000)).toBe("settled");
  await expectRunSucceeded(page);
  await expect(page.locator("#stepControls")).toBeHidden();
});

for (const [state, prep] of [
  ["while stepping on the timer", async () => {}],
  ["while paused", async (page) => { await pauseAndSettle(page); }],
  ["after Next step", async (page) => { await pauseAndSettle(page); await page.click("#nextBtn"); }],
  ["right after Continue", async (page) => { await pauseAndSettle(page); await page.click("#continueBtn"); }],
]) {
  test(`AC1: Stop works ${state}`, async ({ page }) => {
    await openApp(page);
    await startStep(page);
    await prep(page);
    await page.click("#stopTop");
    expect(await settled(page)).toBe("settled");
    await expect(page.locator("#runBtn")).toBeEnabled();
    await expect(page.locator("#stepControls")).toBeHidden();
    await expect(page.locator("#varsPanel")).toBeHidden();
    expect(await page.evaluate(() => ({ stepPaused, resolve: activeStepResolve, reject: activeStepReject, timer: activeStepTimer }))).toEqual({ stepPaused: false, resolve: null, reject: null, timer: null });
    // A fresh run starts unpaused.
    await page.selectOption("#runMode", "normal");
    await runAndWait(page);
    await expectRunSucceeded(page);
  });
}

test("AC2: the controls work from the keyboard and keep focus", async ({ page }) => {
  await openApp(page);
  const code = await page.evaluate(() => lessons[11].starterCode);
  await startStep(page);
  await page.focus("#pauseBtn");
  await page.waitForTimeout(2000); // two steps happen; stepping must not steal focus to the editor
  expect(await page.evaluate(() => document.activeElement.id)).toBe("pauseBtn");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => activeStepResolve !== null);
  expect(await page.evaluate(() => document.activeElement.id)).toBe("nextBtn"); // Pause hands focus to Next
  const before = await steps(page);
  await page.keyboard.press("Space");
  await expect.poll(() => steps(page)).toBe(before + 1);
  expect(await page.evaluate(() => document.activeElement.id)).toBe("nextBtn");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("continueBtn");
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("pauseBtn"); // Continue hands focus to Pause
  expect(await settled(page, 30000)).toBe("settled");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("runBtn"); // controls hide; focus goes to Run
  await expect(page.locator("#code")).toHaveValue(code); // no key press leaked into the editor
});

test("the Variables panel shows simple globals while paused", async ({ page }) => {
  await openApp(page);
  await startStep(page, { code: VARS_CODE });
  await expect(page.locator("#varsPanel")).toBeHidden();
  // Step until the loop body runs, so every variable exists.
  await pauseAndSettle(page);
  for (let i = 0; i < 12 && (await currentLine(page)) !== "9"; i++) { const b = await steps(page); await page.click("#nextBtn"); await expect.poll(() => steps(page)).toBe(b + 1); }
  await expect(page.locator("#varsPanel")).toBeVisible();
  await expect(page.locator("#varsTitle")).toHaveText(await t(page, "varsTitle"));
  const vars = await page.locator("#varsList").evaluate((dl) => Object.fromEntries([...dl.querySelectorAll("dt")].map((dt) => [dt.textContent, dt.nextElementSibling.textContent])));
  expect(vars).toMatchObject({ size: "50", name: "'Sam'", colors: "['red', 'blue']", ok: "True", ratio: "1.5" });
  expect(vars.i).toMatch(/^[0-3]$/);
  expect(Object.keys(vars)).not.toContain("t"); // Turtle objects and modules are not listed
  expect(Object.keys(vars)).not.toContain("turtle");
  await page.click("#continueBtn");
  await expect(page.locator("#varsPanel")).toBeHidden();
  await page.click("#stopTop");
});

test("AC3: Normal mode is unchanged: no step controls, no instrumentation", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 11);
  await page.evaluate(() => { window.__sawControls = false; new MutationObserver(() => { if (!document.getElementById("stepControls").hidden) window.__sawControls = true; }).observe(document.getElementById("stepControls"), { attributes: true }); });
  await runAndWait(page);
  await expectRunSucceeded(page);
  expect(await page.evaluate(() => ({ saw: window.__sawControls, steps: activeStepCount }))).toEqual({ saw: false, steps: 0 });
});
