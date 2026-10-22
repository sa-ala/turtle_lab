// Localization completeness and language sync (ROADMAP F-014, SPEC.md §10; GAP-16, GAP-19).
import { test, expect, openApp, runAndWait, t, selectLesson } from "./fixtures.js";

// Visible text with Latin words but no Arabic at all. Mixed text (Arabic sentences naming Python code such as
// "حلقات while") is fine by design (D5). Allowed: "XY" (coordinate axes) and the "English" language option.
const ALLOWED = new Set(["📍 XY", "option: English"]);
const englishOnly = (page) => page.evaluate(() => {
  const out = new Set(), skip = (el) => el.closest("pre, code, textarea, #out, .codeHighlights, #rail, #varsList, script, style");
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    const el = n.parentElement; if (!el || skip(el)) continue;
    if (!el.offsetParent && getComputedStyle(el).position !== "fixed" && !el.closest(".srOnly")) continue;
    const s = n.textContent.trim(); if (/[A-Za-z]{2,}/.test(s) && !/[؀-ۿ]/.test(s)) out.add(s);
  }
  for (const el of document.querySelectorAll("[placeholder],[title],[aria-label]")) for (const a of ["placeholder", "title", "aria-label"]) {
    const v = el.getAttribute(a); if (v && /[A-Za-z]{2,}/.test(v) && !/[؀-ۿ]/.test(v) && !skip(el)) out.add(`@${a}: ${v}`);
  }
  for (const o of document.querySelectorAll("option")) if (/[A-Za-z]{2,}/.test(o.textContent) && !/[؀-ۿ]/.test(o.textContent)) out.add(`option: ${o.textContent}`);
  return [...out];
});

test("with Arabic selected, no English-only UI text remains (all tabs, running, error, edited)", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#langSelect", "ar");
  const found = new Set(await englishOnly(page));
  for (const tab of ["syntax", "challenge", "teacher", "badges", "projects"]) { await page.click(`.learn .tab[data-tab="${tab}"]`); (await englishOnly(page)).forEach((x) => found.add(x)); }
  await page.click('.runTabs .tab[data-run-tab="errors"]'); (await englishOnly(page)).forEach((x) => found.add(x));
  await page.evaluate(() => { run(); });
  await expect(page.locator("#err")).toHaveText(await t(page, "runningStatus"));
  (await englishOnly(page)).forEach((x) => found.add(x));
  await page.waitForFunction(() => activeRun === null);
  await selectLesson(page, 25); await runAndWait(page); (await englishOnly(page)).forEach((x) => found.add(x));
  await page.fill("#code", "x = 1\n"); (await englishOnly(page)).forEach((x) => found.add(x));
  expect([...found].filter((x) => !ALLOWED.has(x))).toEqual([]);
});

test("Syntax Help shows Arabic categories and explanations with Python unchanged; search matches both languages", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#langSelect", "ar");
  await page.click('.learn .tab[data-tab="syntax"]');
  const first = page.locator("#docGrid .doc").first();
  const [ar, en] = await page.evaluate(() => [DOCS_AR[0], docs[0]]);
  await expect(first.locator(".cat")).toHaveText(ar.category);
  await expect(first.locator("p")).toHaveText(ar.explanation);
  await expect(first.locator("pre")).toHaveText(en.example); // Python stays English
  await page.fill("#docSearch", "الدوائر");
  await expect(page.locator("#docGrid .doc")).toHaveCount(1);
  await expect(page.locator("#docGrid .doc code")).toContainText("circle");
  await page.fill("#docSearch", "circle"); // English search still works in Arabic mode
  await expect(page.locator("#docGrid .doc").first()).toContainText("الدوائر");
  await page.selectOption("#langSelect", "en");
  await page.fill("#docSearch", "دوائر"); // and Arabic search works in English mode
  await expect(page.locator("#docGrid .doc .cat")).toHaveText("Circles");
});

test("example names, the example-loaded toast and the print sheet are localized", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#langSelect", "ar");
  const names = await page.evaluate(() => EXAMPLE_NAMES_AR);
  await expect(page.locator('#examples option[value="7"]')).toHaveText(names[7]);
  await page.selectOption("#examples", "7");
  await expect(page.locator("#toast")).toHaveText(await page.evaluate((n) => T("exampleLoaded")(n), names[7]));
  await expect(page.locator("#printTitle")).toHaveText(await t(page, "printTitle"));
  await expect(page.locator("#printDocs .doc .cat").first()).toHaveText(await page.evaluate(() => DOCS_AR[0].category));
});

test("cursor, save status and placeholders re-translate when switching language", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#saveStatus")).toHaveText("Auto-save is on");
  await expect(page.locator("#out")).toHaveText("Output from print() will appear here.");
  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("#saveStatus")).toHaveText(await t(page, "saved"));
  await expect(page.locator("#out")).toHaveText(await t(page, "outputPlaceholder"));
  await expect(page.locator("#err")).toHaveText(await t(page, "noErrors"));
  await expect(page.locator("#cursor")).toContainText("السطر");
  await page.fill("#code", "x = 1\n");
  await expect(page.locator("#saveStatus")).toContainText("تم الحفظ");
  await page.selectOption("#langSelect", "en");
  await expect(page.locator("#saveStatus")).toContainText("Saved ");
  await expect(page.locator("#cursor")).toContainText("Line");
});

for (const [landing, stored, expected, writes] of [["ar", null, "ar", true], ["en", null, "en", true], ["both", null, "en", true], [null, null, "en", false], ["ar", "en", "en", false]]) {
  test(`first visit language: landing=${landing}, saved app language=${stored} -> ${expected}`, async ({ page }) => {
    await page.goto("/index.html");
    await page.evaluate(([l, a]) => { localStorage.clear(); if (l) localStorage.setItem("turtleLabLandingLanguage", l); if (a) localStorage.setItem("tl.lang.v1", a); }, [landing, stored]);
    await openApp(page);
    await expect(page.locator("html")).toHaveAttribute("lang", expected);
    const saved = await page.evaluate(() => localStorage.getItem("tl.lang.v1"));
    if (writes) expect(saved).toBe(expected); else expect(saved).toBe(stored);
  });
}

test("landing page Arabic view: navigation, chips, buttons, footer and accessible names are Arabic", async ({ page }) => {
  await page.goto("/index.html");
  await page.click('[data-set-view="ar"]');
  const visible = (sel) => page.locator(sel).evaluateAll((els) => els.filter((e) => e.offsetParent !== null).map((e) => e.innerText.replace(/\s+/g, " ").trim())); // flex items report line breaks
  // "GitHub" is a brand name and stays as-is.
  expect((await visible('nav[aria-label] a, .footer-links a')).filter((x) => x !== "GitHub")).not.toContainEqual(expect.stringMatching(/^[^؀-ۿ]*[A-Za-z]{3,}[^؀-ۿ]*$/));
  expect(await visible(".pill-list li")).toEqual(["💻 بايثون", "🎨 الرسم", "📚 الدروس", "🚀 المشاريع"]);
  expect(await visible("a.btn")).toEqual(expect.arrayContaining(["ابدأ البرمجة", "اعرف المزيد"]));
  await expect(page.locator(".site-header nav, header nav").first()).toHaveAttribute("aria-label", "التنقل الرئيسي");
  // Both view keeps the bilingual buttons with a separator; English view is English-only.
  await page.click('[data-set-view="both"]');
  expect(await visible("a.btn")).toEqual(expect.arrayContaining(["Start Coding | ابدأ البرمجة"]));
  await page.click('[data-set-view="en"]');
  expect(await visible("a.btn")).toEqual(expect.arrayContaining(["Start Coding", "Learn More"]));
  await expect(page.locator(".site-header nav, header nav").first()).toHaveAttribute("aria-label", "Main navigation");
});
