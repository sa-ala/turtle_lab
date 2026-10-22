// Run lifecycle hardening (ROADMAP F-005, SPEC.md §4.4, §7.2, §7.3; GAP-04..07).
import { test, expect, openApp, runAndWait, t, selectLesson, expectRunSucceeded } from "./fixtures.js";

const SHORT = "import turtle\nt = turtle.Turtle()\nt.forward(30)\nturtle.done()\n";

// Start a slow Step-mode run of lesson 12 without waiting for it; resolves once the first line is highlighted.
async function startSlowStepRun(page) {
  await selectLesson(page, 11);
  await page.selectOption("#runMode", "step");
  await page.selectOption("#stepSpeed", "900");
  await page.evaluate(() => { window.__runSettled = run().then(() => "settled", () => "rejected"); });
  await expect(page.locator("#rail .railLine.current")).toHaveCount(1);
  await expect(page.locator("#stopTop")).toBeEnabled();
}
const runIsIdle = async (page) => {
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#stopTop")).toBeDisabled();
  expect(await page.evaluate(() => ({ activeRun, timer: activeStepTimer, reject: activeStepReject }))).toEqual({ activeRun: null, timer: null, reject: null });
};

test("AC1: pressing Ctrl+Enter five times quickly starts exactly one run", async ({ page }) => {
  await openApp(page);
  const before = await page.evaluate(() => runToken);
  await page.locator("#code").focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press("Control+Enter");
  await expectRunSucceeded(page);
  expect(await page.evaluate(() => runToken) - before).toBe(1);
});

test("AC2: Stop then Run within 50 ms keeps the new drawing", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 33); // Spiral: long enough to stop mid-drawing
  await page.evaluate(() => { run(); });
  await expect(page.locator("#stopTop")).toBeEnabled();
  await page.waitForTimeout(300);
  await page.evaluate(async (code) => { stop(); E.code.value = code; await run(); }, SHORT);
  await expectRunSucceeded(page);
  await page.waitForTimeout(400); // well past Stop's 150 ms delayed reset
  await expect(page.locator("#target canvas").first()).toBeAttached();
  const inked = await page.evaluate(() => [...document.querySelectorAll("#target canvas")].some((c) => {
    if (!c.width || !c.height) return false;
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < d.length; i += 4) if (d[i]) return true;
    return false;
  }));
  expect(inked, "the new run's drawing should still be on the canvas").toBe(true);
});

test("AC3: Stop in Step mode settles the paused run; no timers or further highlights remain", async ({ page }) => {
  await openApp(page);
  await startSlowStepRun(page);
  await page.click("#stopTop");
  const settled = await page.evaluate(() => Promise.race([window.__runSettled, new Promise((r) => setTimeout(() => r("still pending"), 3000))]));
  expect(settled).toBe("settled");
  await runIsIdle(page);
  await expect(page.locator("#rail .railLine.current")).toHaveCount(0);
  await page.waitForTimeout(1200); // longer than one 900 ms step
  await expect(page.locator("#rail .railLine.current")).toHaveCount(0);
  await expect(page.locator("#err")).toHaveText(await t(page, "stopped"));
});

// AC4 and the related actions from the F-005 scope: each stops the run first, does its job, and Run works immediately.
const ACTIONS = [
  ["switching lesson (dropdown)", async (page) => { await page.selectOption("#lessonSelect", "2"); await expect(page.locator("#lessonSelect")).toHaveValue("2"); }],
  ["switching lesson (sidebar list)", async (page) => { await page.click('#lessonList .lesson[data-i="4"]'); await expect(page.locator("#lessonSelect")).toHaveValue("4"); }],
  ["loading an example", async (page) => { await page.selectOption("#examples", "1"); await expect(page.locator("#code")).toHaveValue(await page.evaluate(() => examples[1].code)); }],
  ["Reset Code", async (page) => { await page.click("#resetTop"); await expect(page.locator("#code")).toHaveValue(await page.evaluate(() => lessons[11].starterCode)); }],
  ["changing language", async (page) => { await page.selectOption("#langSelect", "ar"); await expect(page.locator("html")).toHaveAttribute("dir", "rtl"); }],
  ["Syntax Help Try it", async (page) => { await page.click('.learn .tab[data-tab="syntax"]'); await page.locator("#docGrid .try").first().click(); await expect(page.locator("#code")).toHaveValue(await page.evaluate(() => docs[0].example)); }],
];
for (const [name, act] of ACTIONS) {
  test(`AC4: ${name} during a run stops it first, then Run works immediately`, async ({ page }) => {
    await openApp(page);
    await startSlowStepRun(page);
    await act(page);
    expect(await page.evaluate(() => Promise.race([window.__runSettled, new Promise((r) => setTimeout(() => r("still pending"), 3000))]))).toBe("settled");
    await runIsIdle(page);
    await page.waitForTimeout(1200);
    await expect(page.locator("#rail .railLine.current")).toHaveCount(0);
    await page.selectOption("#runMode", "normal");
    await runAndWait(page);
    await expectRunSucceeded(page);
  });
}
