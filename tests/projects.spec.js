// My Projects (ROADMAP F-012, SPEC.md §4.3, §9).
import { test, expect, openApp, runAndWait, t } from "./fixtures.js";

const MINE = "import turtle\nt = turtle.Turtle()\nt.circle(40)  # my flower\n";
const reopen = async (page) => { await page.reload(); await page.waitForFunction(() => typeof pyState !== "undefined" && pyState === "ready"); };
const openTab = (page) => page.click('.learn .tab[data-tab="projects"]');
const rows = (page) => page.locator("#projects .project");
const row = (page, name) => page.locator("#projects .project", { has: page.locator("strong").getByText(name, { exact: true }) });
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("tl.projects.v1") || "[]"));

async function createProject(page, name) {
  await openTab(page);
  await page.click("#newProject");
  await expect(page.locator("#nameDialog")).toBeVisible();
  await page.fill("#nameInput", name);
  await page.click("#nameOk");
  await expect(page.locator("#nameDialog")).not.toBeVisible();
  await expect(row(page, name)).toHaveCount(1);
}

test("create, then reload: the project and its code persist; a thumbnail is saved after a run", async ({ page }) => {
  await openApp(page);
  await openTab(page);
  await expect(page.locator("#projects .empty")).toHaveText(await t(page, "projectsEmpty"));
  await page.fill("#code", MINE);
  await runAndWait(page);
  await createProject(page, "Flower");
  const saved = await stored(page);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ name: "Flower", code: MINE });
  expect(saved[0].thumb).toMatch(/^data:image\/png;base64,/);
  await reopen(page);
  await openTab(page);
  await expect(row(page, "Flower")).toHaveCount(1);
  await expect(row(page, "Flower").locator("img.thumb")).toHaveCount(1);
});

test("the name dialog requires a name; Cancel and Esc create nothing", async ({ page }) => {
  await openApp(page);
  await openTab(page);
  await page.click("#newProject");
  await expect(page.locator("#nameInput")).toBeFocused();
  await expect(page.locator("#nameInput")).toHaveValue(await page.evaluate(() => T("projectDefaultName")(1)));
  await page.fill("#nameInput", "   ");
  await page.click("#nameOk");
  await expect(page.locator("#nameError")).toHaveText(await t(page, "nameRequired"));
  await page.click("#nameCancel");
  await page.click("#newProject");
  await page.keyboard.press("Escape");
  await expect(page.locator("#nameDialog")).not.toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  expect(await stored(page)).toEqual([]);
});

test("open asks before replacing edited code, then loads the project", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", MINE);
  await createProject(page, "Flower");
  await page.fill("#code", "print('other work')\n");
  await row(page, "Flower").locator('[data-act="open"]').click();
  await expect(page.locator("#replaceDialog")).toBeVisible();
  await page.click("#replaceCancel");
  await expect(page.locator("#code")).toHaveValue("print('other work')\n");
  await row(page, "Flower").locator('[data-act="open"]').click();
  await page.click("#replaceOk");
  await expect(page.locator("#code")).toHaveValue(MINE);
});

test("rename, duplicate, Save here and delete (with confirmation) work across reloads", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", MINE);
  await createProject(page, "Flower");

  await row(page, "Flower").locator('[data-act="rename"]').click();
  await expect(page.locator("#nameInput")).toHaveValue("Flower");
  await page.fill("#nameInput", "Big flower");
  await page.press("#nameInput", "Enter");
  await expect(row(page, "Big flower")).toHaveCount(1);

  await row(page, "Big flower").locator('[data-act="duplicate"]').click();
  const copyName = await page.evaluate(() => T("projectCopyName")("Big flower"));
  await expect(row(page, copyName)).toHaveCount(1);

  await page.fill("#code", "print('v2')\n");
  await openTab(page);
  await row(page, copyName).locator('[data-act="update"]').click();
  await expect(page.locator("#replaceTitle")).toHaveText(await t(page, "updateTitle"));
  await page.click("#replaceOk");

  await reopen(page);
  await openTab(page);
  const saved = await stored(page);
  expect(saved.map((p) => [p.name, p.code])).toEqual([["Big flower", MINE], [copyName, "print('v2')\n"]]);

  await row(page, "Big flower").locator('[data-act="delete"]').click();
  await expect(page.locator("#replaceTitle")).toHaveText(await t(page, "deleteTitle"));
  await expect(page.locator("#replaceCancel")).toBeFocused(); // safe default
  await page.click("#replaceCancel");
  await expect(rows(page)).toHaveCount(2);
  await row(page, "Big flower").locator('[data-act="delete"]').click();
  await page.click("#replaceOk");
  await expect(rows(page)).toHaveCount(1);
  await reopen(page);
  await openTab(page);
  await expect(rows(page)).toHaveCount(1);
  await expect(row(page, copyName)).toHaveCount(1);
});

test("export downloads the project as .py; import creates a project from a .py file", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", MINE);
  await createProject(page, "My Flower!");
  const [download] = await Promise.all([page.waitForEvent("download"), row(page, "My Flower!").locator('[data-act="export"]').click()]);
  expect(download.suggestedFilename()).toBe("my_flower.py");

  await page.setInputFiles("#importFile", { name: "stars.py", mimeType: "text/x-python", buffer: Buffer.from("import turtle\r\nt = turtle.Turtle()\r\nt.dot(20)\r\n") });
  await expect(row(page, "stars")).toHaveCount(1);
  expect((await stored(page))[0]).toMatchObject({ name: "stars", code: "import turtle\nt = turtle.Turtle()\nt.dot(20)\n" });

  await page.setInputFiles("#importFile", { name: "huge.py", mimeType: "text/x-python", buffer: Buffer.alloc(201 * 1024, 120) });
  await expect(page.locator("#toast")).toHaveText(await t(page, "importTooBig"));
  await expect(rows(page)).toHaveCount(2);
});

test("a failed save is rolled back and reported (storage full)", async ({ page }) => {
  await openApp(page);
  await page.fill("#code", MINE);
  await page.evaluate(() => { const real = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === "tl.projects.v1") throw new DOMException("full", "QuotaExceededError"); return real.call(this, k, v); }; });
  await openTab(page);
  await page.click("#newProject");
  await page.fill("#nameInput", "Too big");
  await page.click("#nameOk");
  await expect(page.locator("#toast")).toHaveText(await t(page, "projectNotSaved"));
  await expect(rows(page)).toHaveCount(0);
});

test("malformed stored projects are ignored", async ({ page }) => {
  await page.goto("/index.html");
  await page.evaluate(() => localStorage.setItem("tl.projects.v1", JSON.stringify([{ id: "p1", name: "Good", code: "print(1)" }, { id: 5, name: "bad id", code: "" }, null, "junk", { id: "p2", name: "No code" }, { id: "p3", name: "Bad thumb", code: "x=1", thumb: "javascript:alert(1)" }])));
  await openApp(page);
  await openTab(page);
  await expect(rows(page)).toHaveCount(2);
  await expect(row(page, "Bad thumb").locator("img")).toHaveCount(0);
});

test("fully bilingual and keyboard accessible", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#langSelect", "ar");
  await openTab(page);
  await expect(page.locator('.learn .tab[data-tab="projects"]')).toHaveText(await t(page, "projectsTab"));
  await expect(page.locator("#newProject")).toHaveText(await t(page, "projectNew"));
  await page.focus("#newProject");
  await page.keyboard.press("Enter");
  await expect(page.locator("#nameTitle")).toHaveText(await t(page, "nameNewTitle"));
  await page.keyboard.type("مشروع الزهرة");
  await page.keyboard.press("Enter");
  await expect(row(page, "مشروع الزهرة")).toHaveCount(1);
  // Focus lands on the new project's Open button, whose accessible name includes the project name.
  const open = row(page, "مشروع الزهرة").locator('[data-act="open"]');
  await expect(open).toBeFocused();
  await expect(open).toHaveAttribute("aria-label", await page.evaluate(() => T("projectActionFor")(T("projectOpen"), "مشروع الزهرة")));
  await expect(row(page, "مشروع الزهرة").locator('[data-act="delete"]')).toHaveText(await t(page, "projectDelete"));
});
