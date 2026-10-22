// Deep links: #lesson=<id>, #example=<slug|number>, #lang=en|ar (ROADMAP F-008, SPEC.md §3.1, §4.1).
import { test, expect, openApp, t } from "./fixtures.js";

const code = (page) => page.inputValue("#code");
const example = (page, i) => page.evaluate((n) => examples[n].code, i);
const starter = (page, i) => page.evaluate((n) => lessons[n].starterCode, i);

test("#lesson=<id> opens that lesson and the hash is cleared", async ({ page }) => {
  await openApp(page, "/app.html#lesson=l12-a-better-square-with-loops");
  await expect(page.locator("#lessonSelect")).toHaveValue("11");
  await expect(page.locator("#code")).toHaveValue(await starter(page, 11));
  expect(new URL(page.url()).hash).toBe("");
  await page.reload(); // the selection persists like a normal choice; nothing is re-applied
  await expect(page.locator("#lessonSelect")).toHaveValue("11");
});

test("#example=<slug> and #example=<number> load an example", async ({ page }) => {
  await openApp(page, "/app.html#example=square");
  await expect(page.locator("#code")).toHaveValue(await example(page, 1));
  // The Square example is now this lesson's draft, so the next link asks before replacing it (F-007).
  await openApp(page, "/app.html#example=7"); // 1-based: the 7th example (Star)
  await expect(page.locator("#replaceDialog")).toBeVisible();
  await page.click("#replaceOk");
  await expect(page.locator("#code")).toHaveValue(await example(page, 6));
});

test("#lang=ar switches the app to Arabic", async ({ page }) => {
  await openApp(page, "/app.html#lang=ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#langSelect")).toHaveValue("ar");
});

test("parameters combine: lesson, then example, in Arabic", async ({ page }) => {
  await openApp(page, "/app.html#lesson=l3-draw-a-square-step-by-step&example=spiral&lang=ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#lessonSelect")).toHaveValue("2");
  await expect(page.locator("#code")).toHaveValue(await example(page, 7));
  expect(new URL(page.url()).hash).toBe("");
});

for (const hash of ["#lesson=l999-nope", "#example=dragon", "#example=0", "#example=99", "#lang=fr", "#lesson=&example=&lang=", "#garbage%%%", "#lesson=12"]) {
  test(`invalid link ${hash} is ignored silently`, async ({ page }) => {
    await openApp(page, "/app.html" + hash);
    await expect(page.locator("#lessonSelect")).toHaveValue("0");
    await expect(page.locator("#code")).toHaveValue(await starter(page, 0));
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("#replaceDialog")).not.toBeVisible();
  });
}

test("a deep-linked example on edited code asks first (F-007 protection)", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", "print('my work')\n");
  await page.goto("/app.html#example=square");
  await expect(page.locator("#replaceDialog")).toBeVisible();
  await page.click("#replaceCancel");
  await expect(page.locator("#code")).toHaveValue("print('my work')\n");
  expect(new URL(page.url()).hash).toBe("");
});

test("a hash added while the app is open is applied too", async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => { location.hash = "lesson=l5-numbers-and-text"; });
  await expect(page.locator("#lessonSelect")).toHaveValue("4");
});

test("Copy link to this lesson copies an id-only link (never code) in both languages", async ({ page }) => {
  await page.addInitScript(() => { window.__copied = []; Object.defineProperty(navigator, "clipboard", { value: { writeText: (s) => { window.__copied.push(s); return Promise.resolve(); } }, configurable: true }); });
  await openApp(page);
  await page.fill("#code", "secret = 'my code'\n");
  await page.selectOption("#lessonSelect", "7");
  await page.click('.learn .tab[data-tab="teacher"]');
  await expect(page.locator("#copyLessonLink")).toHaveText(await t(page, "copyLink"));
  await page.click("#copyLessonLink");
  await expect(page.locator("#toast")).toHaveText(await t(page, "linkCopied"));
  await page.selectOption("#langSelect", "ar");
  await page.click('.learn .tab[data-tab="teacher"]');
  await page.click("#copyLessonLink");
  const copied = await page.evaluate(() => window.__copied);
  expect(copied).toEqual(["http://turtle.test/app.html#lesson=l8-colorful-lines", "http://turtle.test/app.html#lesson=l8-colorful-lines&lang=ar"]);
  for (const url of copied) expect(url).not.toContain("secret");
  // The copied link works.
  await openApp(page, copied[1].replace("http://turtle.test", ""));
  await expect(page.locator("#lessonSelect")).toHaveValue("7");
});

test("Copy link falls back and shows the link when copying is impossible", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true }); document.execCommand = () => false; });
  await openApp(page);
  await page.click('.learn .tab[data-tab="teacher"]');
  await page.click("#copyLessonLink");
  await expect(page.locator("#toast")).toContainText(await t(page, "linkCopyFailed"));
  await expect(page.locator("#toast")).toContainText("#lesson=l1-your-first-line");
});

test("landing Try This button opens the Square example, in Arabic from the Arabic view", async ({ page }) => {
  await page.goto("/index.html");
  await page.click('[data-set-view="en"]');
  await expect(page.locator("#tryPreview")).toHaveAttribute("href", "app.html#example=square");
  await page.click('[data-set-view="ar"]');
  await expect(page.locator("#tryPreview")).toHaveAttribute("href", "app.html#example=square&lang=ar");
  await page.click("#tryPreview");
  await page.waitForFunction(() => typeof pyState !== "undefined" && pyState === "ready");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#code")).toHaveValue(await example(page, 1));
});
