// Python runtime loading (ROADMAP F-003, SPEC.md §7.1): local copies first, pinned CDN with SRI as fallback,
// a "Getting Python ready…" state, and a Retry button when both sources fail.
import { test, expect, openApp, runAndWait, t, expectRunSucceeded } from "./fixtures.js";
import { LIBS } from "../tools/build-offline.mjs";

const CDN_URLS = LIBS.filter((l) => l.file.endsWith(".js")).map((l) => l.url);
const LOCAL = "**/assets/libs/*.js";
const requests = (page) => { const urls = []; page.on("request", (r) => urls.push(r.url())); return urls; };

test("loads Skulpt from assets/libs without contacting the CDN (AC1)", async ({ page }) => {
  const urls = requests(page);
  for (const u of CDN_URLS) await page.route(u, (r) => r.abort("blockedbyclient")); // jsDelivr unreachable
  await openApp(page);
  await runAndWait(page);
  await expectRunSucceeded(page);
  expect(urls.filter((u) => u.includes("/assets/libs/")).length).toBe(2);
  expect(urls.filter((u) => u.includes("cdn.jsdelivr.net"))).toEqual([]);
});

test.describe("when local files are missing", () => {
  test.use({ ignoreConsole: /Failed to load resource|integrity/ });

  test("falls back to the pinned CDN with integrity checks and runs code (AC2)", async ({ page }) => {
    const urls = requests(page);
    await page.route(LOCAL, (r) => r.fulfill({ status: 404, body: "missing" }));
    await openApp(page);
    await runAndWait(page);
    await expectRunSucceeded(page);
    expect(urls.filter((u) => u.includes("cdn.jsdelivr.net")).length).toBe(2);
    const attrs = await page.evaluate(() => [...document.querySelectorAll("script[src*='cdn.jsdelivr.net']")].map((s) => [s.integrity.slice(0, 7), s.crossOrigin]));
    expect(attrs).toEqual([["sha384-", "anonymous"], ["sha384-", "anonymous"]]);
  });

  test("rejects a CDN file that fails its integrity check", async ({ page }) => {
    await page.route(LOCAL, (r) => r.fulfill({ status: 404, body: "missing" }));
    await page.route(CDN_URLS[0], (r) => r.fulfill({ status: 200, headers: { "access-control-allow-origin": "*" }, contentType: "text/javascript", body: "window.Sk = { tampered: true };" }));
    await page.goto("/app.html");
    await expect(page.locator("#pyRetry")).toBeVisible();
    expect(await page.evaluate(() => typeof Sk)).toBe("undefined");
  });

  test("shows the localized failure and a working Retry when both sources fail (AC3)", async ({ page }) => {
    let offline = true;
    await page.route(LOCAL, (r) => (offline ? r.fulfill({ status: 404, body: "missing" }) : r.fallback()));
    for (const u of CDN_URLS) await page.route(u, (r) => (offline ? r.abort("internetdisconnected") : r.fallback()));
    await page.goto("/app.html");

    await expect(page.locator("#pyRetry")).toBeVisible();
    await expect(page.locator("#err")).toContainText(await t(page, "pyFailed"));
    await expect(page.locator("#pyRetry")).toHaveText(await t(page, "retry"));
    await expect(page.locator("#debugInfo")).toHaveText(await t(page, "pyFailed"));
    await expect(page.locator("#runBtn")).toBeDisabled();
    await expect(page.locator("#runBtn")).toBeDisabled();

    // Arabic too.
    await page.selectOption("#langSelect", "ar");
    await expect(page.locator("#debugInfo")).toHaveText(await t(page, "pyFailed"));

    offline = false;
    await page.click("#pyRetry");
    await expect(page.locator("#runBtn")).toBeEnabled();
    await expect(page.locator("#err")).toHaveText(await t(page, "noErrors"));
    await runAndWait(page);
    await expectRunSucceeded(page);
  });
});

test("shows Getting Python ready… and keeps Run disabled while loading", async ({ page }) => {
  let release;
  const gate = new Promise((r) => { release = r; });
  await page.route(LOCAL, async (r) => { await gate; return r.fallback(); });
  await page.goto("/app.html", { waitUntil: "domcontentloaded" }); // "load" waits for the held-back script
  await expect(page.locator("#debugInfo")).toHaveText(await t(page, "pyLoading"));
  await expect(page.locator("#runBtn")).toBeDisabled();
  await expect(page.locator("#runBtn")).toBeDisabled();
  // Ctrl+Enter while loading does not start a run.
  await page.locator("#code").press("Control+Enter");
  await expect(page.locator("#err")).toHaveText(await t(page, "noErrors"));

  release();
  await expect(page.locator("#runBtn")).toBeEnabled();
  await expect(page.locator("#debugInfo")).toHaveText(await t(page, "debugNormal"));
  await runAndWait(page);
  await expectRunSucceeded(page);
});
