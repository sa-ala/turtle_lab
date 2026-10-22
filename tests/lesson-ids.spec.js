// Stable lesson ids and v2 -> v3 progress migration (ROADMAP F-002, SPEC.md §5.1, §6, §9).
import { readFileSync } from "node:fs";
import { test, expect, openApp } from "./fixtures.js";

const APP = readFileSync(new URL("../app.html", import.meta.url), "utf8");
const arr = (src, name) => JSON.parse(src.match(new RegExp(`\\r?\\nconst ${name}=(.*);\\r?\\n`))[1]);
const IDS = arr(APP, "lessons").map((l) => l.id);
const TITLES = arr(APP, "lessons").map((l) => l.title);

async function seed(page, values) {
  await page.goto("/index.html");
  await page.evaluate((v) => { localStorage.clear(); for (const [k, val] of Object.entries(v)) localStorage.setItem(k, val); }, values);
}
const stored = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);
const completeTitles = (page) => page.locator("#lessonList .lesson").evaluateAll((els) => els.filter((b) => b.textContent.includes("✓")).map((b) => b.children[1].textContent));

// A test build with a new lesson inserted mid-array (index 5), as a future curriculum change would do.
function serveInsertedBuild(page) {
  const NEW = { id: "l39-test-inserted", level: "Level 2: Values, Output, and Variables", title: "Inserted Test Lesson", concept: "x", goal: "x", explanation: "x", starterCode: "import turtle\nt = turtle.Turtle()\nt.forward(10)\nturtle.done()", expected: "x", steps: ["x"], hint: "x", challenge: "x", tryThis: "x", teacherNote: "x" };
  const NEW_AR = { title: "درس مُدرج", concept: "x", goal: "x", explanation: "x", expected: "x", steps: ["x"], hint: "x", challenge: "x", tryThis: "x", teacherNote: "x" };
  const insert = (src, name, item) => src.replace(new RegExp(`(\\r?\\nconst ${name}=)(.*)(;\\r?\\n)`), (_, a, body, c) => { const list = JSON.parse(body); list.splice(5, 0, item); return a + JSON.stringify(list) + c; });
  const body = insert(insert(APP, "lessons", NEW), "LESSON_AR", NEW_AR);
  if (!body.includes("Inserted Test Lesson")) throw new Error("test build not created");
  return page.route("**/app.html", (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body }));
}

test("ids are unique and V2_LESSON_IDS matches the baseline order", async ({ page }) => {
  await openApp(page);
  const { ids, v2 } = await page.evaluate(() => ({ ids: lessons.map((l) => l.id), v2: V2_LESSON_IDS }));
  expect(new Set(ids).size).toBe(ids.length);
  expect(v2).toEqual(ids); // until a lesson is inserted, the baseline order is the current order
});

test("AC1: v2 progress [0,11,35] migrates to the same lessons and badges", async ({ page }) => {
  await seed(page, { "tl.lesson.v2": "11", "tl.progress.v2": "[0,11,35]" });
  await openApp(page);
  expect(await completeTitles(page)).toEqual([TITLES[0], TITLES[11], TITLES[35]]);
  await expect(page.locator("#starText")).toHaveText("3 ⭐");
  await expect(page.locator("#lessonSelect")).toHaveValue("11");
  // Same badges as the old index rules: First Line (0), Shapes (11), Loops (11), Final (35).
  await expect(page.locator("#badgeGrid .badge.earned")).toHaveCount(4);
  expect(JSON.parse(await stored(page, "tl.progress.v3")).sort()).toEqual([IDS[0], IDS[11], IDS[35]].sort());
  expect(await stored(page, "tl.lesson.v3")).toBe(IDS[11]);
  // v2 keys are left untouched for one release, so a rollback is harmless.
  expect(await stored(page, "tl.progress.v2")).toBe("[0,11,35]");
  expect(await stored(page, "tl.lesson.v2")).toBe("11");
});

test("existing v3 progress is not overwritten by v2 data", async ({ page }) => {
  await seed(page, { "tl.progress.v3": JSON.stringify([IDS[1]]), "tl.progress.v2": "[0,2,3]" });
  await openApp(page);
  expect(await completeTitles(page)).toEqual([TITLES[1]]);
});

test("AC2: inserting a lesson mid-array does not change which lessons are complete", async ({ page }) => {
  await serveInsertedBuild(page);
  await seed(page, { "tl.lesson.v3": IDS[11], "tl.progress.v3": JSON.stringify([IDS[0], IDS[11], IDS[35]]) });
  await openApp(page);
  await expect(page.locator("#lessonSelect option")).toHaveCount(39);
  expect(await completeTitles(page)).toEqual([TITLES[0], TITLES[11], TITLES[35]]);
  await expect(page.locator("#lessonSelect")).toHaveValue("12"); // same lesson, new position
  await expect(page.locator("#lessonTitle")).toContainText(TITLES[11]);
  await expect(page.locator("#badgeGrid .badge.earned")).toHaveCount(4);
});

test("AC2: v2 progress still migrates correctly after a lesson is inserted", async ({ page }) => {
  await serveInsertedBuild(page);
  await seed(page, { "tl.lesson.v2": "11", "tl.progress.v2": "[0,11,35]" });
  await openApp(page);
  expect(await completeTitles(page)).toEqual([TITLES[0], TITLES[11], TITLES[35]]);
  await expect(page.locator("#lessonTitle")).toContainText(TITLES[11]);
});

test("AC3: unknown ids are ignored and dropped on the next save", async ({ page }) => {
  await seed(page, { "tl.progress.v3": JSON.stringify([IDS[0], "l999-removed-lesson", 5, null, IDS[0]]) });
  await openApp(page);
  expect(await completeTitles(page)).toEqual([TITLES[0]]);
  await expect(page.locator("#starText")).toHaveText("1 ⭐");

  await page.selectOption("#lessonSelect", "1");
  await page.click('.learn .tab[data-tab="challenge"]');
  await page.click("#done");
  await expect(page.locator("#starText")).toHaveText("2 ⭐");
  expect(JSON.parse(await stored(page, "tl.progress.v3"))).toEqual([IDS[0], IDS[1]]);
});

test("an unknown saved lesson id falls back to lesson 1", async ({ page }) => {
  await seed(page, { "tl.lesson.v3": "l999-removed-lesson" });
  await openApp(page);
  await expect(page.locator("#lessonSelect")).toHaveValue("0");
});
