// Inline, non-blocking input() (ROADMAP F-023 PR 1, SPEC.md §7.1-7.3).
import { test, expect, openApp, t, selectLesson, expectRunSucceeded } from "./fixtures.js";

const ASK = "name = input('Name? ')\nprint('Hi', name)\n";

// Start a run without waiting for it, and fail the test if the browser prompt is ever used.
async function startRun(page, code) {
  await page.fill("#code", code);
  await page.evaluate(() => {
    window.__prompted = false;
    window.prompt = () => { window.__prompted = true; return "from prompt"; };
    window.__runSettled = run().then(() => "settled", () => "rejected");
  });
  await expect(page.locator("#inputRow")).toBeVisible();
}
const settled = (page) => page.evaluate(() => window.__runSettled);
const neverPrompted = async (page) => expect(await page.evaluate(() => window.__prompted)).toBe(false);

test("AC1: input() asks inline, echoes the answer and the program continues", async ({ page }) => {
  await openApp(page);
  await startRun(page, ASK);
  await expect(page.locator("#out")).toHaveText("Name? ");
  await expect(page.locator("#inputField")).toBeFocused();
  await expect(page.locator("#debugInfo")).toHaveText(await t(page, "inputWaiting"));
  await expect(page.locator("#stopTop")).toBeEnabled();
  await expect(page.locator("#runBtn")).toBeDisabled();
  await page.fill("#inputField", "Sara");
  await page.press("#inputField", "Enter");
  expect(await settled(page)).toBe("settled");
  await expect(page.locator("#inputRow")).toBeHidden();
  await expect(page.locator("#out")).toContainText("Name? Sara\nHi Sara");
  await expectRunSucceeded(page);
  await neverPrompted(page);
});

test("several inputs in a row, and the Enter button submits too", async ({ page }) => {
  await openApp(page);
  await startRun(page, "a = int(input('First: '))\nb = int(input('Second: '))\nprint(a + b)\n");
  await page.fill("#inputField", "3");
  await page.click("#inputSubmit");
  await expect(page.locator("#out")).toContainText("First: 3\nSecond: ");
  await expect(page.locator("#inputField")).toHaveValue("");
  await page.fill("#inputField", "4");
  await page.click("#inputSubmit");
  expect(await settled(page)).toBe("settled");
  await expect(page.locator("#out")).toContainText("First: 3\nSecond: 4\n7");
  await neverPrompted(page);
});

test("AC2: Stop while waiting ends the run, hides the field, and Run works again", async ({ page }) => {
  await openApp(page);
  await startRun(page, ASK);
  await page.click("#stopTop");
  expect(await settled(page)).toBe("settled");
  await expect(page.locator("#inputRow")).toBeHidden();
  await expect(page.locator("#err")).toHaveText(await t(page, "stopped"));
  await expect(page.locator("#runBtn")).toBeEnabled();
  await page.fill("#code", "print('next run')\n");
  await page.evaluate(() => run());
  await expect(page.locator("#out")).toContainText("next run");
  await expectRunSucceeded(page);
});

test("AC2: choosing another lesson while waiting stops the run first", async ({ page }) => {
  await openApp(page);
  await startRun(page, ASK);
  await selectLesson(page, 2);
  expect(await settled(page)).toBe("settled");
  await expect(page.locator("#inputRow")).toBeHidden();
  await expect(page.locator("#runBtn")).toBeEnabled();
});

test("AC2: Step mode waits on the input() line with Pause and Next disabled", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#runMode", "step");
  await page.selectOption("#stepSpeed", "200");
  await startRun(page, "import turtle\nt = turtle.Turtle()\nsize = int(input('Size? '))\nt.forward(size)\nprint('done', size)\n");
  await expect(page.locator("#rail .railLine.current")).toHaveText("3");
  await expect(page.locator("#pauseBtn")).toBeDisabled();
  await expect(page.locator("#nextBtn")).toBeDisabled();
  await page.fill("#inputField", "40");
  await page.press("#inputField", "Enter");
  await expect(page.locator("#pauseBtn")).toBeEnabled();
  expect(await settled(page)).toBe("settled");
  await expect(page.locator("#out")).toContainText("Size? 40\ndone 40");
  await neverPrompted(page);
});

test("Step mode: Stop while waiting for input settles the run", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#runMode", "step");
  await page.selectOption("#stepSpeed", "200");
  await startRun(page, ASK);
  await page.click("#stopTop");
  expect(await settled(page)).toBe("settled");
  await expect(page.locator("#inputRow")).toBeHidden();
  await expect(page.locator("#stepControls")).toBeHidden();
});

test("time spent waiting for an answer does not count toward the run time limit", async ({ page }) => {
  await openApp(page);
  await startRun(page, "x = input('Go? ')\ntotal = 0\nfor i in range(2000):\n    total = total + i\nprint(total)\n");
  // As if the program had already used 44 of its 45 seconds, then the learner takes 2 s to answer.
  await page.evaluate(() => { Sk.execStart = new Date(Date.now() - 44000); });
  await page.waitForTimeout(2000);
  await page.fill("#inputField", "yes");
  await page.press("#inputField", "Enter");
  expect(await settled(page)).toBe("settled");
  await expect(page.locator("#out")).toContainText("1999000");
  await expectRunSucceeded(page);
});

test("AC8: Arabic labels, and an Arabic answer is echoed as typed", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#langSelect", "ar");
  await startRun(page, ASK);
  await expect(page.locator("#inputLabel")).toHaveText(await t(page, "inputLabel"));
  await expect(page.locator("#inputSubmit")).toHaveText(await t(page, "inputSubmit"));
  await expect(page.locator("#debugInfo")).toHaveText(await t(page, "inputWaiting"));
  await expect(page.locator("#inputField")).toHaveAttribute("dir", "auto");
  await page.fill("#inputField", "سارة");
  await page.press("#inputField", "Enter");
  expect(await settled(page)).toBe("settled");
  await expect(page.locator("#out")).toContainText("Hi سارة");
});

test("the answer is shown as text, never as HTML", async ({ page }) => {
  await openApp(page);
  await startRun(page, ASK);
  await page.fill("#inputField", "<b>bold</b>");
  await page.press("#inputField", "Enter");
  expect(await settled(page)).toBe("settled");
  await expect(page.locator("#out b")).toHaveCount(0);
  await expect(page.locator("#out")).toContainText("Hi <b>bold</b>");
});
