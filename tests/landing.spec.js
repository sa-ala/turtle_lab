// Landing page (index.html) smoke tests. Section numbers refer to SPEC.md.
import { test, expect } from "./fixtures.js";

test("language toggle switches views and persists across reload (§10.1)", async ({ page }) => {
  await page.goto("/index.html");
  const main = page.locator("main#main");
  const pressed = (view) => page.locator(`[data-set-view="${view}"]`);

  await expect(main).toHaveAttribute("data-view", "both");
  await expect(pressed("both")).toHaveAttribute("aria-pressed", "true");

  await pressed("ar").click();
  await expect(main).toHaveAttribute("data-view", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(pressed("ar")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main .en").first()).toBeHidden();

  await page.reload();
  await expect(main).toHaveAttribute("data-view", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await pressed("en").click();
  await page.reload();
  await expect(main).toHaveAttribute("data-view", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("main .ar").first()).toBeHidden();
});

test("Start Coding opens the app (§3.1)", async ({ page }) => {
  await page.goto("/index.html");
  const cta = page.locator('a[href="app.html"]:visible').first();
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/\/app\.html$/);
  await page.waitForFunction(() => typeof Sk !== "undefined" && typeof run === "function");
});
