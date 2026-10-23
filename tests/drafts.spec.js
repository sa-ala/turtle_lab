// Per-lesson drafts and overwrite protection (ROADMAP F-007, SPEC.md §4.2, §4.3, §9; GAP-01).
import { test, expect, openApp, t, selectLesson } from "./fixtures.js";

const stored = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);
const reopen = async (page) => { await page.reload(); await page.waitForFunction(() => typeof pyState !== "undefined" && pyState === "ready"); };
const starter = (page, i) => page.evaluate((n) => lessons[n].starterCode, i);
const dialog = (page) => page.locator("#replaceDialog");

test("AC1: each lesson keeps its own draft when switching back and forth (and across reload)", async ({ page }) => {
  await openApp(page);
  const one = (await starter(page, 0)) + "\n# my lesson 1 change\n";
  await page.fill("#code", one);
  await selectLesson(page, 1);
  await expect(page.locator("#code")).toHaveValue(await starter(page, 1));
  const two = (await starter(page, 1)) + "\n# my lesson 2 change\n";
  await page.fill("#code", two);
  await selectLesson(page, 0);
  await expect(page.locator("#code")).toHaveValue(one);
  await page.click('#lessonList .lesson[data-i="1"]');
  await expect(page.locator("#code")).toHaveValue(two);
  await reopen(page);
  await expect(page.locator("#code")).toHaveValue(two);
  await selectLesson(page, 0);
  await expect(page.locator("#code")).toHaveValue(one);
  // Unchanged lessons store nothing.
  expect(Object.keys(JSON.parse(await stored(page, "tl.drafts.v1"))).sort()).toEqual(["l1-your-first-line", "l2-turn-the-turtle"]);
});

test("AC2: an existing v1 draft is migrated into the current lesson; tl.code.v1 is left untouched", async ({ page }) => {
  await page.goto("/index.html");
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("tl.lesson.v3", "l5-numbers-and-text"); localStorage.setItem("tl.code.v1", "print('my old work')\n"); });
  await openApp(page);
  await expect(page.locator("#lessonSelect")).toHaveValue("4");
  await expect(page.locator("#code")).toHaveValue("print('my old work')\n");
  expect(JSON.parse(await stored(page, "tl.drafts.v1"))).toEqual({ "l5-numbers-and-text": "print('my old work')\n" });
  expect(await stored(page, "tl.code.v1")).toBe("print('my old work')\n");
  // Other lessons still start from their starter code.
  await selectLesson(page, 0);
  await expect(page.locator("#code")).toHaveValue(await starter(page, 0));
  // Migration runs once: a later reload does not re-import tl.code.v1 over newer work.
  await selectLesson(page, 4);
  await page.fill("#code", "print('newer work')\n");
  await reopen(page);
  await expect(page.locator("#code")).toHaveValue("print('newer work')\n");
});

for (const [name, act] of [
  ["loading an example", (page) => page.selectOption("#examples", "1")],
  ["Syntax Help Try it", async (page) => { await page.click('.learn .tab[data-tab="syntax"]'); await page.locator("#docGrid .try").nth(3).click(); }], // entry 0 equals lesson 1's starter
  ["Reset Code", (page) => page.click("#resetTop")],
]) {
  test(`AC3: ${name} replaces unmodified starter code without asking`, async ({ page }) => {
    await openApp(page);
    const before = await page.inputValue("#code");
    await act(page);
    await expect(dialog(page)).not.toBeVisible();
    if (name !== "Reset Code") await expect(page.locator("#code")).not.toHaveValue(before);
  });

  test(`${name} on edited code asks first; Keep my code cancels and Replace replaces`, async ({ page }) => {
    await openApp(page);
    const mine = "import turtle\nt = turtle.Turtle()\nt.circle(40)  # mine\n";
    await page.fill("#code", mine);

    await act(page);
    await expect(dialog(page)).toBeVisible();
    await expect(page.locator("#replaceTitle")).toHaveText(await t(page, "replaceTitle"));
    await expect(page.locator("#replaceCancel")).toBeFocused(); // safe default
    await page.click("#replaceCancel");
    await expect(dialog(page)).not.toBeVisible();
    await expect(page.locator("#code")).toHaveValue(mine);

    await act(page);
    await page.keyboard.press("Escape"); // Esc also keeps the code
    await expect(dialog(page)).not.toBeVisible();
    await expect(page.locator("#code")).toHaveValue(mine);

    await act(page);
    await page.click("#replaceOk");
    await expect(dialog(page)).not.toBeVisible();
    await expect(page.locator("#code")).not.toHaveValue(mine);
  });
}

test("the confirmation dialog is localized in Arabic", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#langSelect", "ar");
  await page.fill("#code", "print('x')\n");
  await page.click("#resetTop");
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator("#replaceTitle")).toHaveText(await t(page, "replaceTitle"));
  await expect(page.locator("#replaceOk")).toHaveText(await t(page, "replaceOk"));
  await expect(page.locator("#replaceCancel")).toHaveText(await t(page, "replaceCancel"));
  await page.click("#replaceOk");
  await expect(page.locator("#code")).toHaveValue(await starter(page, 0));
});

test("AC4: drafts for all 47 lessons stay well under 1 MB; a failing write shows Not saved", async ({ page }) => {
  await openApp(page);
  const size = await page.evaluate(() => {
    for (let i = 0; i < lessons.length; i++) { current = i; E.code.value = lessons[i].starterCode + "\n# typical learner change: bigger loops and colors\nfor i in range(36):\n    t.forward(100)\n    t.right(170)\n"; save(); }
    return localStorage.getItem("tl.drafts.v1").length;
  });
  expect(size).toBeLessThan(1024 * 1024);
  expect(size).toBeLessThan(64 * 1024);

  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException("Quota exceeded", "QuotaExceededError"); }; });
  await page.fill("#code", "print('too big')\n");
  await expect(page.locator("#saveStatus")).toHaveText(await t(page, "notSaved"));
  await expect(page.locator("#toast")).toHaveText(await t(page, "storageOff"));
});
