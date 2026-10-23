// Every lesson starter and every example must run (AGENTS.md §6), except the two
// deliberately broken debugging lessons (indexes 12 and 13, AGENTS.md rule 8),
// which are covered in app.spec.js.
import { readFileSync } from "node:fs";
import { test, openApp, runAndWait, selectLesson, expectRunSucceeded } from "./fixtures.js";

// Read the content arrays from app.html at collection time so each item becomes its own test.
const app = readFileSync(new URL("../app.html", import.meta.url), "utf8");
const json = (name) => JSON.parse(app.match(new RegExp(`\\r?\\nconst ${name}=(.*);\\r?\\n`))[1]);
const lessons = json("lessons"), examples = json("examples");
const INTENTIONALLY_BROKEN = new Set([12, 13]);

test.describe("lesson starters run", () => {
  lessons.forEach((lesson, i) => {
    if (INTENTIONALLY_BROKEN.has(i)) return;
    test(`lesson ${i + 1}: ${lesson.title}`, async ({ page }) => {
      await openApp(page);
      await selectLesson(page, i);
      await runAndWait(page);
      await expectRunSucceeded(page);
    });
  });
});

test.describe("examples run", () => {
  examples.forEach((example, i) => {
    test(`example ${i + 1}: ${example.name}`, async ({ page }) => {
      await openApp(page);
      await page.selectOption("#examples", String(i));
      await test.expect(page.locator("#code")).toHaveValue(example.code);
      await runAndWait(page);
      await expectRunSucceeded(page);
    });
  });
});
