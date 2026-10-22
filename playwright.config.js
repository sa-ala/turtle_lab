// Browser smoke tests (ROADMAP F-001). Run: npm test
// No web server: tests/fixtures.js serves the repo on a fake origin and routes the
// pinned Skulpt CDN URLs to the hash-verified copies in assets/libs/.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: { baseURL: "http://turtle.test", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    // F-009 requires the editor keys to work in Firefox too; only that spec runs there.
    { name: "firefox", testMatch: /editor\.spec\.js$/, use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 900 } } },
  ],
});
