// Shared fixtures for the Turtle Lab smoke tests (ROADMAP F-001).
//
// Every test gets a fresh browser context (isolated localStorage). Requests are routed:
//   - http://turtle.test/<path>      -> the file at <path> in this repo (no web server needed)
//   - the two pinned Skulpt CDN URLs  -> assets/libs/ (same bytes, SHA-256 verified by tools/check.mjs), with the CORS
//                                        header jsDelivr sends, so the app's SRI check runs for real
//   - anything else                  -> aborted and reported as a test failure (golden rule 5: no new
//                                        third-party network requests)
// Uncaught page errors and console.error messages also fail the test.
import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { LIBS, LIB_DIR } from "../tools/build-offline.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const ORIGIN = "http://turtle.test";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
const CDN = new Map(LIBS.map((l) => [l.url, resolve(ROOT, LIB_DIR, l.file)]));

async function fulfillFile(route, file, headers = {}) {
  try {
    await route.fulfill({ status: 200, headers, contentType: TYPES[extname(file)] || "application/octet-stream", body: await readFile(file) });
  } catch {
    await route.fulfill({ status: 404, body: "not found" });
  }
}

export const test = base.extend({
  // Requests the app tried to make to hosts it should not contact.
  blocked: async ({}, use) => { await use([]); },
  // Page errors and console.error messages.
  problems: async ({}, use) => { await use([]); },
  // Console errors matching this RegExp are expected by the test (e.g. a deliberately missing file); set with test.use().
  ignoreConsole: [null, { option: true }],

  page: async ({ page, blocked, problems, ignoreConsole }, use) => {
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === ORIGIN) {
        const file = resolve(ROOT, "." + decodeURIComponent(url.pathname));
        return file.startsWith(ROOT + sep) ? fulfillFile(route, file) : route.fulfill({ status: 403 });
      }
      if (CDN.has(url.href)) return fulfillFile(route, CDN.get(url.href), { "access-control-allow-origin": "*" });
      blocked.push(url.href);
      return route.abort("blockedbyclient");
    });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !(ignoreConsole && ignoreConsole.test(m.text()))) problems.push(`console.error: ${m.text()}`); });
    await use(page);
    expect(blocked, "unexpected network requests (AGENTS.md rule 5)").toEqual([]);
    expect(problems, "page errors / console errors").toEqual([]);
  },
});
export { expect };

// Open the app and wait until Skulpt and the lesson UI are ready.
export async function openApp(page, path = "/app.html") {
  await page.goto(path);
  await page.waitForFunction(() => typeof pyState !== "undefined" && pyState === "ready" && document.querySelectorAll("#lessonSelect option").length > 0);
}

// Run the editor code through the app's own run() (what both Run buttons call) and wait for it to settle.
export const runAndWait = (page) => page.evaluate(() => run());

// Translated UI string, read from the app so assertions follow the current language.
export const t = (page, key) => page.evaluate((k) => T(k), key);

// The app's content arrays, read from the page.
export const content = (page) => page.evaluate(() => ({ lessons, LESSON_AR, examples, docs, extraDocs }));

export async function selectLesson(page, index) {
  await page.selectOption("#lessonSelect", String(index));
  await expect(page.locator("#lessonSelect")).toHaveValue(String(index));
}

// F-023: run the editor code; answer every input() with the given answers, and if the program keeps listening for
// keys, clicks or timers, check it is listening without errors and Stop it. Otherwise expect a normal success.
export async function finishInteractive(page, answers = ["blue", "80"]) {
  await page.evaluate(() => { window.__runSettled = run(); });
  for (;;) {
    await page.waitForFunction(() => activeRun === null || listening || inputWaiting, null, { timeout: 30_000 });
    const state = await page.evaluate(() => (inputWaiting ? "input" : listening ? "listening" : "done"));
    if (state === "input") {
      const answer = String(answers.shift() ?? "1"), echoed = await page.evaluate(() => E.out.textContent.length);
      await page.fill("#inputField", answer);
      await page.press("#inputField", "Enter");
      // the next input() can start at once, so wait for the echo rather than for the field to close
      await page.waitForFunction(([a, n]) => E.out.textContent.slice(n).includes(a + "\n"), [answer, echoed]);
      continue;
    }
    if (state === "listening") {
      await expect(page.locator("#err")).toHaveText(await t(page, "listening"));
      await page.click("#stopTop");
      await expect(page.locator("#runBtn")).toBeEnabled();
      return "listening";
    }
    await page.evaluate(() => window.__runSettled);
    await expectRunSucceeded(page);
    return "done";
  }
}

export async function expectRunSucceeded(page) {
  await expect(page.locator("#out")).toContainText(await t(page, "success"));
  await expect(page.locator("#err")).toHaveText(await t(page, "successErr"));
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#stopTop")).toBeDisabled();
}
