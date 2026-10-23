// Safe storage layer (ROADMAP F-004, SPEC.md §9).
import { test, expect, openApp, runAndWait, t, selectLesson, expectRunSucceeded } from "./fixtures.js";

const reopen = async (page) => {
  await page.reload();
  await page.waitForFunction(() => typeof Sk !== "undefined" && document.querySelectorAll("#lessonSelect option").length > 0);
};

// Seed raw localStorage values on the app origin before the app script reads them.
async function seed(page, values) {
  await page.goto("/index.html");
  await page.evaluate((v) => { localStorage.clear(); for (const [k, val] of Object.entries(v)) localStorage.setItem(k, val); }, values);
  await openApp(page);
}

// Record toast messages from now on (toast is a global function in app.html).
const spyToasts = (page) => page.evaluate(() => {
  window.__toasts = [];
  const orig = window.toast;
  window.toast = (s, ms) => { window.__toasts.push(s); return orig(s, ms); };
});

for (const [name, block] of [
  ["access throws (blocked site data)", () => Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("The operation is insecure.", "SecurityError"); } })],
  ["every call throws", () => { for (const m of ["getItem", "setItem", "removeItem", "clear"]) Storage.prototype[m] = () => { throw new DOMException("Storage disabled", "SecurityError"); }; }],
]) {
  test(`app works without storage when ${name}, with a one-time warning (AC1)`, async ({ page }) => {
    await page.addInitScript(block);
    await openApp(page);
    await expect(page.locator("#toast")).toHaveText(await t(page, "storageOff"));
    await expect(page.locator("#saveStatus")).toHaveText(await t(page, "notSaved"));
    await expect(page.locator("#lessonSelect")).toHaveValue("0");

    await spyToasts(page);
    await runAndWait(page);
    await expectRunSucceeded(page);

    // Further failing writes (edit, lesson change, completion, preferences) do not repeat the warning.
    await page.fill("#code", "import turtle\nt = turtle.Turtle()\nt.forward(50)\n");
    await selectLesson(page, 3);
    await page.click('.learn .tab[data-tab="challenge"]');
    await page.click("#done");
    await expect(page.locator("#starText")).toHaveText("1 ⭐");
    await page.click("#zoomIn");
    await page.selectOption("#langSelect", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const storageOff = await page.evaluate(() => I18N.en.storageOff);
    const storageOffAr = await t(page, "storageOff");
    await page.fill("#code", "import turtle\n"); // the save status is refreshed on the next save, now in Arabic
    expect((await page.evaluate(() => window.__toasts)).filter((s) => s === storageOff || s === storageOffAr)).toEqual([]);
    await expect(page.locator("#saveStatus")).toHaveText(await t(page, "notSaved"));
  });
}

test("a failing write (e.g. quota full) warns once and shows Not saved (AC1)", async ({ page }) => {
  await page.addInitScript(() => {
    const real = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (window.__quotaFull) throw new DOMException("Quota exceeded", "QuotaExceededError"); return real.call(this, k, v); };
  });
  await openApp(page);
  await expect(page.locator("#saveStatus")).toHaveText(await t(page, "saved"));
  await spyToasts(page);
  await page.evaluate(() => { window.__quotaFull = true; });
  await page.fill("#code", "import turtle\n");
  await page.fill("#code", "import turtle\n\n");
  await expect(page.locator("#saveStatus")).toHaveText(await t(page, "notSaved"));
  expect(await page.evaluate(() => window.__toasts.filter((s) => s === T("storageOff")).length)).toBe(1);
});

test("malformed values for every key fall back to defaults without errors (AC2)", async ({ page }) => {
  await seed(page, {
    "tl.lesson.v2": "2.5",
    "tl.progress.v2": '[1,1,"2",999,-1,2.5,null,{}]',
    "tl.hc.v1": "yes",
    "tl.lang.v1": "fr",
    "tl.side.v1": "maybe",
    "tl.runMode.v1": "turbo",
    "tl.stepSpeed.v1": "1",
    "tl.zoom.v1": "NaN",
    "tl.coords.v1": "x",
    "tl.lessonCard.v1": "sometimes",
  });
  await expect(page.locator("#lessonSelect")).toHaveValue("0");
  await expect(page.locator("#progressText")).toHaveText("1 of 47 lessons complete"); // only the valid, de-duplicated index 1
  await expect(page.locator('#lessonList .lesson[data-i="1"]')).toContainText("✓");
  await expect(page.locator("#starText")).toHaveText("1 ⭐");
  await expect(page.locator("body")).not.toHaveClass(/\bhc\b/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("body")).not.toHaveClass(/\blessons-collapsed\b/);
  await expect(page.locator("#runMode")).toHaveValue("normal");
  await expect(page.locator("#stepSpeed")).toHaveValue("500");
  await expect(page.locator("#zoomLabel")).toHaveText("100%");
  await expect(page.locator("#coordToggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#lessonCardBody")).toBeVisible(); // F-019: malformed card state means open
  await runAndWait(page);
  await expectRunSucceeded(page);
});

for (const raw of ["abc", "-1", "47", "2.5", " ", "1e400"]) {
  test(`invalid saved lesson ${JSON.stringify(raw)} falls back to lesson 1 (AC2)`, async ({ page }) => {
    await seed(page, { "tl.lesson.v2": raw });
    await expect(page.locator("#lessonSelect")).toHaveValue("0");
  });
}

for (const raw of ["not json", '{"0":true}', '"[0]"', "null", '["0","1"]']) {
  test(`invalid saved progress ${JSON.stringify(raw)} means no lessons complete (AC2)`, async ({ page }) => {
    await seed(page, { "tl.progress.v2": raw });
    await expect(page.locator("#progressText")).toHaveText("0 of 47 lessons complete");
  });
}

test("out-of-range zoom resets to 100%; in-range zoom is kept (AC2)", async ({ page }) => {
  await seed(page, { "tl.zoom.v1": "3" });
  await expect(page.locator("#zoomLabel")).toHaveText("100%");
  await seed(page, { "tl.zoom.v1": "1.5" });
  await expect(page.locator("#zoomLabel")).toHaveText("150%");
});

test("clearing the editor and reloading leaves it empty, and Run still works (AC3)", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 4);
  await page.fill("#code", "");
  await reopen(page);
  await expect(page.locator("#lessonSelect")).toHaveValue("4");
  await expect(page.locator("#code")).toHaveValue("");
  // Whitespace-only code runs the built-in sample without changing the editor (SPEC §7.2).
  await runAndWait(page);
  await expectRunSucceeded(page);
  await expect(page.locator("#code")).toHaveValue("");
});

test("valid preferences, progress and draft still persist across reload", async ({ page }) => {
  await openApp(page);
  await selectLesson(page, 5);
  const code = (await page.inputValue("#code")) + "\n# kept\n";
  await page.fill("#code", code);
  await page.selectOption("#runMode", "step");
  await page.selectOption("#stepSpeed", "900");
  await page.click("#zoomIn");
  await page.click("#zoomIn");
  await page.click("#coordToggle");
  await page.click("#hc");
  await page.click("#toggleLessons");
  await page.click('.learn .tab[data-tab="challenge"]');
  await page.click("#done");
  await page.selectOption("#langSelect", "ar");

  await reopen(page);
  await expect(page.locator("#lessonSelect")).toHaveValue("5");
  await expect(page.locator("#code")).toHaveValue(code);
  await expect(page.locator("#runMode")).toHaveValue("step");
  await expect(page.locator("#stepSpeed")).toHaveValue("900");
  await expect(page.locator("#zoomLabel")).toHaveText("120%");
  await expect(page.locator("#coordToggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("body")).toHaveClass(/\bhc\b/);
  await expect(page.locator("body")).toHaveClass(/\blessons-collapsed\b/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#starText")).toHaveText("1 ⭐");
  await expect(page.locator("#saveStatus")).toHaveText(await t(page, "saved"));
});

test("landing page works when storage is blocked", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("The operation is insecure.", "SecurityError"); } }));
  await page.goto("/index.html");
  await expect(page.locator("main#main")).toHaveAttribute("data-view", "both");
  await page.click('[data-set-view="ar"]');
  await expect(page.locator("main#main")).toHaveAttribute("data-view", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
