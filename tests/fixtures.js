// Shared fixtures for the Turtle Lab smoke tests (ROADMAP F-001).
//
// Every test gets a fresh browser context (isolated localStorage). Requests are routed:
//   - http://turtle.test/<path>      -> the file at <path> in this repo (no web server needed)
//   - the two pinned Skulpt CDN URLs  -> offline/libs/ (same bytes, SHA-256 verified by tools/check.mjs)
//   - anything else                  -> aborted and reported as a test failure (golden rule 5: no new
//                                        third-party network requests)
// Uncaught page errors and console.error messages also fail the test.
import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { LIBS, LIB_DIR } from "../tools/build-offline.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const ORIGIN = "http://turtle.test";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const CDN = new Map(LIBS.map((l) => [l.url, resolve(ROOT, LIB_DIR, l.file)]));

async function fulfillFile(route, file) {
  try {
    await route.fulfill({ status: 200, contentType: TYPES[extname(file)] || "application/octet-stream", body: await readFile(file) });
  } catch {
    await route.fulfill({ status: 404, body: "not found" });
  }
}

export const test = base.extend({
  // Requests the app tried to make to hosts it should not contact.
  blocked: async ({}, use) => { await use([]); },
  // Page errors and console.error messages.
  problems: async ({}, use) => { await use([]); },

  page: async ({ page, blocked, problems }, use) => {
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin === ORIGIN) {
        const file = resolve(ROOT, "." + decodeURIComponent(url.pathname));
        return file.startsWith(ROOT + sep) ? fulfillFile(route, file) : route.fulfill({ status: 403 });
      }
      if (CDN.has(url.href)) return fulfillFile(route, CDN.get(url.href));
      blocked.push(url.href);
      return route.abort("blockedbyclient");
    });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") problems.push(`console.error: ${m.text()}`); });
    await use(page);
    expect(blocked, "unexpected network requests (AGENTS.md rule 5)").toEqual([]);
    expect(problems, "page errors / console errors").toEqual([]);
  },
});
export { expect };

// Open the app and wait until Skulpt and the lesson UI are ready.
export async function openApp(page, path = "/app.html") {
  await page.goto(path);
  await page.waitForFunction(() => typeof Sk !== "undefined" && Sk.builtinFiles && document.querySelectorAll("#lessonSelect option").length > 0);
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

export async function expectRunSucceeded(page) {
  await expect(page.locator("#out")).toContainText(await t(page, "success"));
  await expect(page.locator("#err")).toHaveText(await t(page, "successErr"));
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#stopTop")).toBeDisabled();
}
