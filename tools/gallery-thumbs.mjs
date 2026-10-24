#!/usr/bin/env node
// Regenerates the Gallery thumbnails (ROADMAP F-021) in assets/gallery/<id>.jpg. Dev-only: uses the Playwright
// devDependency (first time: npm ci && npx playwright install chromium). The site never runs this. Run from repo root:
//   node tools/gallery-thumbs.mjs            all pieces
//   node tools/gallery-thumbs.mjs g-mandala  only the named ids
// Each piece runs through the app's own run() in Normal mode; the picture is the centered 320x320 safe box
// (turtle coordinates -160..160), captured at 0.75x so the file is 240x240. Random pieces differ on every run.
// Afterwards run: node tools/build-offline.mjs && node tools/check.mjs
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readArrays } from "./content.mjs";

export const GALLERY_DIR = "assets/gallery";
const only = process.argv.slice(2);
const { gallery } = readArrays(readFileSync("app.html", "utf8"));
const pieces = gallery.filter((g) => !only.length || only.includes(g.id));
if (!pieces.length) { console.error(`FAIL: no gallery ids match ${only.join(", ")}`); process.exit(1); }

mkdirSync(GALLERY_DIR, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 0.75, reducedMotion: "reduce" });
  await page.goto(pathToFileURL(resolve("app.html")).href);
  await page.waitForFunction(() => typeof pyState !== "undefined" && pyState === "ready", null, { timeout: 30_000 });
  for (const g of pieces) {
    await page.evaluate(async (code) => { E.code.value = code; await run(); }, g.code);
    const err = await page.evaluate(() => E.err.textContent);
    if (err !== (await page.evaluate(() => T("successErr")))) throw new Error(`${g.id} did not run cleanly: ${err}`);
    const box = await page.locator("#target").boundingBox();
    const x = box.x + box.width / 2 - 160, y = box.y + box.height / 2 - 160;
    await page.screenshot({ path: `${GALLERY_DIR}/${g.id}.jpg`, type: "jpeg", quality: 80, clip: { x, y, width: 320, height: 320 } });
    console.log(`wrote ${GALLERY_DIR}/${g.id}.jpg`);
  }
} finally {
  await browser.close();
}
console.log("OK: thumbnails written. Next: node tools/build-offline.mjs && node tools/check.mjs");
