// Gallery of curated pieces (ROADMAP F-021, docs/specs/F-021-gallery.md).
import { test, expect, openApp, t, expectRunSucceeded } from "./fixtures.js";

const openTab = (page) => page.click('.learn .tab[data-tab="gallery"]');
const piece = (page, i) => page.evaluate((n) => ({ ...gallery[n], ar: GALLERY_AR[n] }), i);
const isIdle = (page) => page.evaluate(() => activeRun === null);

for (let i = 0; i < 10; i++) {
  test(`AC3: gallery piece ${i + 1} opens and runs successfully`, async ({ page }) => {
    await openApp(page);
    await openTab(page);
    const g = await piece(page, i);
    await page.locator("#gallery .gOpen").nth(i).click();
    await expectRunSucceeded(page);
    await expect(page.locator("#code")).toHaveValue(g.code);
    await expect(page.locator("#galleryTip")).toBeHidden();
  });
}

test("AC1, AC2: the Gallery tab sits after Challenges and every card is complete in English and Arabic", async ({ page }) => {
  await openApp(page);
  const tabs = await page.locator(".learn .tab").evaluateAll((els) => els.map((b) => b.dataset.tab));
  expect(tabs.indexOf("gallery")).toBe(tabs.indexOf("challenge") + 1);
  await openTab(page);
  await expect(page.locator(".learn .tab[data-tab='gallery']")).toHaveAttribute("aria-selected", "true");
  for (const lang of ["en", "ar"]) {
    if (lang === "ar") await page.selectOption("#langSelect", "ar");
    await expect(page.locator(".learn .tab[data-tab='gallery']")).toHaveText(await t(page, "galleryTab"));
    const cards = page.locator("#gallery .gPiece");
    await expect(cards).toHaveCount(10);
    for (let i = 0; i < 10; i++) {
      const g = await piece(page, i), card = cards.nth(i), name = lang === "ar" ? g.ar.name : g.name;
      await expect(card.locator("h3")).toHaveText(name);
      await expect(card.locator("p")).toHaveText(lang === "ar" ? g.ar.description : g.description);
      await expect(card.locator("img")).toHaveAttribute("src", `assets/gallery/${g.id}.jpg`);
      await expect(card.locator("img")).toHaveAttribute("alt", await page.evaluate((n) => T("galleryImgAlt")(n), name));
      await expect(card.locator(".gLevel")).toHaveText(await page.evaluate((l) => l === null ? T("galleryBeyond") : T("galleryAfter")(l), g.level));
      await expect(card.locator(".gChip")).toHaveCount(g.uses.length);
      await expect(card.locator(".gOpen")).toHaveAttribute("aria-label", await page.evaluate((n) => T("galleryOpenLabel")(n), name));
      await expect(card.locator("details li")).toHaveCount(g.remix.length);
    }
  }
  // Chips show the lesson's position and localized title; remix code is LTR <code>, not raw backticks.
  await expect(page.locator("#gallery .gPiece").first().locator(".gChip").first()).toHaveText(await page.evaluate(() => T("galleryLessonChip")(12, LESSON_AR[11].title)));
  const remix = page.locator("#gallery .gPiece").first().locator("details li").first();
  await expect(remix.locator("code")).toHaveText("angle");
  await expect(remix.locator("code")).toHaveAttribute("dir", "ltr");
  await expect(remix).not.toContainText("`");
});

test("thumbnails load from assets/gallery", async ({ page }) => {
  await openApp(page);
  await openTab(page);
  const imgs = page.locator("#gallery .gPiece img");
  for (let i = 0; i < 10; i++) {
    await imgs.nth(i).scrollIntoViewIfNeeded();
    await expect.poll(() => imgs.nth(i).evaluate((el) => el.complete && el.naturalWidth)).toBe(240);
  }
});

test("AC4: Open and run on edited code asks first; Keep my code changes nothing, Replace loads and runs", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", "print('my work')\n");
  await openTab(page);
  await page.locator("#gallery .gOpen").nth(3).click();
  await expect(page.locator("#replaceDialog")).toBeVisible();
  await page.click("#replaceCancel");
  await expect(page.locator("#code")).toHaveValue("print('my work')\n");
  await expect(page.locator("#err")).toHaveText(await t(page, "noErrors"));
  expect(await isIdle(page)).toBe(true);
  await page.locator("#gallery .gOpen").nth(3).click();
  await page.click("#replaceOk");
  await expectRunSucceeded(page);
  await expect(page.locator("#code")).toHaveValue((await piece(page, 3)).code);
  await expect(page.locator("#lessonSelect")).toHaveValue("0"); // the selected lesson stays
});

test("AC5: a lesson chip opens that lesson on the Lesson tab", async ({ page }) => {
  await openApp(page);
  await openTab(page);
  await page.locator("#gallery .gPiece").nth(6).locator(".gChip").last().click(); // Blossom Tree -> lesson 46
  await expect(page.locator("#lessonSelect")).toHaveValue("45");
  await expect(page.locator("#code")).toHaveValue(await page.evaluate(() => lessons[45].starterCode));
  await expect(page.locator(".learn .tab[data-tab='lesson']")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".learn .tab[data-tab='lesson']")).toBeFocused();
  await expect(page.locator("#lesson")).toBeVisible();
});

test("AC6: in Step mode, Open and run starts a Step run with a tip; Stop settles it; Normal mode hides the tip", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#runMode", "step");
  await openTab(page);
  await page.locator("#gallery .gOpen").nth(0).click();
  await expect(page.locator("#galleryTip")).toBeVisible();
  await expect(page.locator("#galleryTip")).toHaveText(await t(page, "galleryStepTip"));
  await expect(page.locator("#rail .railLine.current")).toHaveCount(1);
  await page.click("#stopTop");
  await expect(page.locator("#runBtn")).toBeEnabled();
  expect(await isIdle(page)).toBe(true);
  await page.selectOption("#runMode", "normal");
  await expect(page.locator("#galleryTip")).toBeHidden();
});

test("AC7: Open and run during a run stops it first and keeps only the new run", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", "import turtle\nt = turtle.Turtle()\nfor i in range(3000):\n    t.forward(1)\n    t.left(1)\n");
  await page.evaluate(() => { window.__first = run().then(() => "settled"); });
  await expect(page.locator("#stopTop")).toBeEnabled();
  await openTab(page);
  await page.locator("#gallery .gOpen").nth(7).click(); // Koch Snowflake
  await page.click("#replaceOk");
  expect(await page.evaluate(() => window.__first)).toBe("settled");
  await expectRunSucceeded(page);
  await expect(page.locator("#code")).toHaveValue((await piece(page, 7)).code);
});

test("AC8: #gallery=<id> opens the Gallery tab with that piece loaded but not running", async ({ page }) => {
  await openApp(page, "/app.html#gallery=g-koch-snowflake&lang=ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".learn .tab[data-tab='gallery']")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#code")).toHaveValue((await piece(page, 7)).code);
  expect(await isIdle(page)).toBe(true);
  await expect(page.locator("#out")).toHaveText(await t(page, "outputPlaceholder"));
  expect(new URL(page.url()).hash).toBe("");
});

for (const hash of ["#gallery=nope", "#gallery=", "#gallery=G-KOCH-SNOWFLAKE", "#gallery=1"]) {
  test(`AC8: invalid link ${hash} is ignored`, async ({ page }) => {
    await openApp(page, "/app.html" + hash);
    await expect(page.locator(".learn .tab[data-tab='lesson']")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#code")).toHaveValue(await page.evaluate(() => lessons[0].starterCode));
    await expect(page.locator("#replaceDialog")).not.toBeVisible();
  });
}
