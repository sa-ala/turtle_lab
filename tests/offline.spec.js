// The generated offline bundle (SPEC.md §12.2) must run with no external requests at all.
// The fixture fails the test if any request leaves http://turtle.test, including to the CDN.
import { test, expect, openApp, runAndWait, expectRunSucceeded } from "./fixtures.js";

test("offline/app.html runs lesson 1 using only local files", async ({ page }) => {
  const external = [];
  page.on("request", (r) => { if (!r.url().startsWith("http://turtle.test/") && !/^(data|blob):/.test(r.url())) external.push(r.url()); });
  await openApp(page, "/offline/app.html");
  await runAndWait(page);
  await expectRunSucceeded(page);
  expect(external).toEqual([]);
});
