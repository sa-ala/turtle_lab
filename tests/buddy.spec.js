// Robot buddy: dock, menu, Customize dialog, badge unlocks, dragging and keyboard move, Hide, Teacher switch (ROADMAP F-024 PR 1, SPEC.md §3.3, §9).
import AxeBuilder from "@axe-core/playwright";
import { test, expect, openApp, t } from "./fixtures.js";

const KEY = "tl.buddy.v1";
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
const reopen = async (page) => {
  await page.reload();
  await page.waitForFunction(() => typeof pyState !== "undefined" && pyState === "ready" && document.querySelectorAll("#lessonSelect option").length > 0);
};
// Whether a part group is drawn in the dock robot (or the dialog preview).
const drawn = (page, part, root = "#buddy") => page.evaluate(([r, p]) => document.querySelector(`${r} [data-part~="${p}"]`).getAttribute("display") === "inline", [root, part]);
const bodyColor = (page) => page.evaluate(() => document.querySelector("#buddy svg").style.getPropertyValue("--buddy-body"));
const dockBox = (page) => page.locator("#buddyDock").boundingBox();
const viewport = (page) => page.evaluate(() => ({ w: document.documentElement.clientWidth, h: window.innerHeight }));
const earn = (page, id) => page.evaluate((id) => complete(lessonIndex(id)), id);

async function seriousViolations(page) {
  const r = await new AxeBuilder({ page }).analyze();
  return r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 5).join(", ")}`);
}

test("AC1: the robot sits bottom-right in English and bottom-left in Arabic, named Robo / روبو", async ({ page }) => {
  await openApp(page);
  const robot = page.locator("#buddy");
  await expect(robot).toBeVisible();
  await expect(robot).toHaveAttribute("aria-label", /Robo.*robot buddy/);
  await expect(robot).toHaveAttribute("aria-haspopup", "menu");
  let box = await dockBox(page), vp = await viewport(page);
  expect(vp.w - (box.x + box.width)).toBeLessThan(40);
  expect(vp.h - (box.y + box.height)).toBeLessThan(40);
  expect(await drawn(page, "antenna:bulb")).toBe(true);
  expect(await drawn(page, "eyes:round")).toBe(true);
  expect(await drawn(page, "accessory:crown")).toBe(false);

  await page.selectOption("#langSelect", "ar");
  await expect(robot).toHaveAttribute("aria-label", /روبو/);
  box = await dockBox(page);
  expect(box.x).toBeLessThan(40);
  // the robot is fixed: it does not change the page layout
  await expect(page.locator("#lessonCard")).toBeInViewport();
});

test("AC2: the menu works with the mouse and the keyboard", async ({ page }) => {
  await openApp(page);
  await page.click("#buddy");
  const menu = page.locator("#buddyMenu");
  await expect(menu).toBeVisible();
  await expect(page.locator("#buddy")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#buddyCustomize")).toBeFocused();
  await expect(page.locator("#buddyCorner")).toBeHidden(); // only after the robot was moved
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#buddyReplay")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#buddyMove")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#buddyHide")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#buddyCustomize")).toBeFocused(); // wraps
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.locator("#buddy")).toBeFocused();
  await expect(page.locator("#buddy")).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  await page.mouse.click(20, 400); // outside closes
  await expect(menu).toBeHidden();
});

test("AC3: Customize previews live, Save persists across reload, Cancel discards", async ({ page }) => {
  await openApp(page);
  await page.click("#buddy");
  await page.click("#buddyCustomize");
  const dlg = page.locator("#buddyDialog");
  await expect(dlg).toBeVisible();
  await expect(page.locator("#buddyNameInput")).toBeFocused();
  await expect(page.locator("#bp-color-teal")).toBeChecked();
  await page.check("#bp-color-purple", { force: true });
  await page.check("#bp-accessory-bow", { force: true });
  await page.fill("#buddyNameInput", "  Zed  ");
  expect(await drawn(page, "accessory:bow", "#buddyPreview")).toBe(true);
  expect(await drawn(page, "accessory:bow")).toBe(false); // dock unchanged until Save
  await expect(page.locator("#buddyPreviewName")).toHaveText("Zed");
  await page.click("#buddySave");
  await expect(dlg).toBeHidden();
  await expect(page.locator("#buddy")).toBeFocused();
  await expect(page.locator("#buddyBubble")).toContainText("Zed");
  expect(await bodyColor(page)).toBe("#9b5de5");
  expect(await drawn(page, "accessory:bow")).toBe(true);
  expect(await stored(page)).toMatchObject({ name: "Zed", color: "purple", accessory: "bow" });

  await reopen(page);
  expect(await bodyColor(page)).toBe("#9b5de5");
  expect(await drawn(page, "accessory:bow")).toBe(true);
  await expect(page.locator("#buddy")).toHaveAttribute("aria-label", /Zed/);

  await page.click("#buddy");
  await page.click("#buddyCustomize");
  await page.check("#bp-color-red", { force: true });
  await page.keyboard.press("Escape");
  await expect(dlg).toBeHidden();
  expect(await bodyColor(page)).toBe("#9b5de5");
  expect((await stored(page)).color).toBe("purple");
});

test("AC3: names are plain text, capped at 20 characters, and empty falls back to the default per language", async ({ page }) => {
  await openApp(page);
  await page.click("#buddy");
  await page.click("#buddyCustomize");
  await page.fill("#buddyNameInput", "<b>Hi</b>");
  await page.click("#buddySave");
  await expect(page.locator("#buddyBubble")).toContainText("<b>Hi</b>");
  expect(await page.locator("#buddyBubble b, #buddyPreviewName b").count()).toBe(0);
  await expect(page.locator("#buddy")).toHaveAttribute("aria-label", /<b>Hi<\/b>/);

  await page.click("#buddy");
  await page.click("#buddyCustomize");
  await page.fill("#buddyNameInput", "   ");
  await expect(page.locator("#buddyPreviewName")).toHaveText("Robo");
  await page.click("#buddySave");
  expect((await stored(page)).name).toBe("");
  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("#buddy")).toHaveAttribute("aria-label", /روبو/);

  // a long stored name is cut to 20 characters on read
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ name: "x".repeat(500) })), KEY);
  await reopen(page);
  expect(await page.evaluate(() => buddy.name.length)).toBe(20);
});

test("AC4: badges unlock parts; a progress reset keeps the stored choice but draws the default", async ({ page }) => {
  await openApp(page);
  await page.click("#buddy");
  await page.click("#buddyCustomize");
  await expect(page.locator("#bp-accessory-crown")).toBeDisabled();
  await expect(page.locator('label[for="bp-accessory-crown"]')).toHaveAttribute("title", "Earn the Turtle Creator Badge");
  await expect(page.locator("#buddyLockedHint")).toBeVisible();
  await page.click("#buddyCancel");

  await earn(page, "l36-draw-a-robot-face"); // Turtle Creator
  await page.click("#buddy");
  await page.click("#buddyCustomize");
  await expect(page.locator("#bp-accessory-crown")).toBeEnabled();
  await expect(page.locator("#bp-eyes-square")).toBeDisabled(); // Shape Builder not earned yet
  await page.check("#bp-accessory-crown", { force: true });
  await page.click("#buddySave");
  expect(await drawn(page, "accessory:crown")).toBe(true);

  page.once("dialog", (d) => d.accept());
  await page.click('.learn .tab[data-tab="teacher"]');
  await page.click("#resetTeacher");
  await expect(page.locator("#starText")).toHaveText("0 ⭐");
  expect(await drawn(page, "accessory:crown")).toBe(false);
  expect((await stored(page)).accessory).toBe("crown");

  // opening and saving the dialog without touching the accessory keeps the stored crown
  await page.click("#buddy");
  await page.click("#buddyCustomize");
  await expect(page.locator("#bp-accessory-none")).toBeChecked();
  await page.check("#bp-color-blue", { force: true });
  await page.click("#buddySave");
  expect((await stored(page)).accessory).toBe("crown");

  await earn(page, "l37-design-a-turtle-scene");
  expect(await drawn(page, "accessory:crown")).toBe(true);
});

test("AC5: malformed tl.buddy.v1 never throws and each bad field falls back on its own", async ({ page }) => {
  await openApp(page);
  for (const raw of ["{not json", "null", "[1,2]", "42", '"text"']) {
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, raw]);
    await reopen(page);
    expect(await page.evaluate(() => ({ ...buddy }))).toMatchObject({ name: "", color: "teal", antenna: "bulb", hidden: false, pos: null });
    await expect(page.locator("#buddy")).toBeVisible();
  }
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ name: 7, color: "plaid", antenna: "spring", eyes: null, accessory: "bow", hidden: "yes", off: 1, seen: ["ok", 3, "BAD!", "ok"], pos: { x: "1", y: 0.5 } })), KEY);
  await reopen(page);
  expect(await page.evaluate(() => ({ ...buddy }))).toMatchObject({ name: "", color: "teal", antenna: "spring", eyes: "round", accessory: "bow", hidden: false, off: false, seen: ["ok"], pos: null });
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ pos: { x: 5, y: -2 } })), KEY);
  await reopen(page);
  expect(await page.evaluate(() => buddy.pos)).toEqual({ x: 1, y: 0 });
  await expect(page.locator("#buddyDock")).toBeInViewport({ ratio: 1 });
});

test("AC8: dragging moves the robot, a short press still opens the menu, and the spot persists", async ({ page }) => {
  await openApp(page);
  let b = await dockBox(page);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 3, b.y + b.height / 2 + 2); // under 6 px: still a click
  await page.mouse.up();
  await expect(page.locator("#buddyMenu")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(400, 300, { steps: 10 });
  await expect(page.locator("#buddyDock")).toHaveClass(/dragging/);
  await page.mouse.up();
  await expect(page.locator("#buddyMenu")).toBeHidden(); // a drag is not a click
  b = await dockBox(page);
  expect(Math.abs(b.x + b.width / 2 - 400)).toBeLessThan(4);
  expect(Math.abs(b.y + b.height / 2 - 300)).toBeLessThan(4);
  const pos = (await stored(page)).pos;
  expect(pos.x).toBeGreaterThan(0);
  expect(pos.x).toBeLessThan(1);

  await reopen(page);
  const again = await dockBox(page);
  expect(Math.abs(again.x - b.x)).toBeLessThan(2);
  expect(Math.abs(again.y - b.y)).toBeLessThan(2);

  // a custom spot does not mirror in Arabic
  await page.selectOption("#langSelect", "ar");
  expect(Math.abs((await dockBox(page)).x - b.x)).toBeLessThan(2);

  // dragging past the edge keeps it fully visible, also after the window shrinks
  await page.mouse.move(again.x + 30, again.y + 30);
  await page.mouse.down();
  await page.mouse.move(5000, 5000, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator("#buddyDock")).toBeInViewport({ ratio: 1 });
  await page.setViewportSize({ width: 700, height: 500 });
  await expect(page.locator("#buddyDock")).toBeInViewport({ ratio: 1 });
  const vp = await viewport(page), small = await dockBox(page);
  expect(vp.w - (small.x + small.width)).toBeLessThan(2);
  expect(vp.h - (small.y + small.height)).toBeLessThan(2);
});

test("AC8: Move robot with the arrow keys, then Return to corner", async ({ page }) => {
  await openApp(page);
  const start = await dockBox(page);
  await page.click("#buddy");
  await page.click("#buddyMove");
  await expect(page.locator("#buddy")).toBeFocused();
  await expect(page.locator("#buddyBubble")).toHaveText(new RegExp(await t(page, "buddyMoveHelp")));
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Shift+ArrowUp");
  await page.keyboard.press("Enter");
  await expect(page.locator("#buddyMenu")).toBeHidden(); // Enter finished moving, it did not open the menu
  await expect(page.locator("#buddyBubble")).toBeHidden();
  await expect(page.locator("#buddyLive")).toHaveText(await t(page, "buddyMoved"));
  const moved = await dockBox(page);
  expect(Math.round(start.x - moved.x)).toBe(32);
  expect(Math.round(start.y - moved.y)).toBe(64);
  expect((await stored(page)).pos).not.toBeNull();

  await page.click("#buddy");
  await expect(page.locator("#buddyCorner")).toBeVisible();
  await page.click("#buddyCorner");
  expect((await stored(page)).pos).toBeNull();
  const back = await dockBox(page);
  expect(Math.round(back.x)).toBe(Math.round(start.x));
  expect(Math.round(back.y)).toBe(Math.round(start.y));
});

test("AC8: Hide robot and the Teacher & Parent switch persist", async ({ page }) => {
  await openApp(page);
  await page.click("#buddy");
  await page.click("#buddyHide");
  await expect(page.locator("#buddyDock")).toBeHidden();
  await expect(page.locator("#buddyTab")).toBeVisible();
  await expect(page.locator("#buddyTab")).toBeFocused();
  await reopen(page);
  await expect(page.locator("#buddyDock")).toBeHidden();
  await page.click("#buddyTab");
  await expect(page.locator("#buddyDock")).toBeVisible();
  await expect(page.locator("#buddy")).toBeFocused();
  expect((await stored(page)).hidden).toBe(false);

  await page.click('.learn .tab[data-tab="teacher"]');
  const sw = page.locator("#buddyTeacherOn");
  await expect(sw).toBeChecked();
  await sw.uncheck();
  await expect(page.locator("#buddyDock")).toBeHidden();
  await expect(page.locator("#buddyTab")).toBeHidden();
  await expect(page.locator("#toast")).toHaveText(await t(page, "buddyOffToast"));
  await reopen(page);
  await expect(page.locator("#buddyDock")).toBeHidden();
  await page.click('.learn .tab[data-tab="teacher"]');
  await expect(sw).not.toBeChecked();
  await sw.check();
  await expect(page.locator("#buddyDock")).toBeVisible();
});

test("AC9: the robot is not printed", async ({ page }) => {
  await openApp(page);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("#buddyDock")).toBeHidden();
});

for (const lang of ["en", "ar"]) {
  test(`AC10: axe (${lang}) with the robot, its menu and the Customize dialog`, async ({ page }) => {
    await openApp(page);
    if (lang === "ar") await page.selectOption("#langSelect", "ar");
    await page.click("#buddy");
    await expect(page.locator("#buddyMenu")).toBeVisible();
    expect(await seriousViolations(page), "menu open").toEqual([]);
    await page.click("#buddyCustomize");
    await expect(page.locator("#buddyDialog")).toBeVisible();
    expect(await seriousViolations(page), "dialog open").toEqual([]);
    await page.click("#buddySave");
    await expect(page.locator("#buddyBubble")).toBeVisible();
    expect(await seriousViolations(page), "bubble shown").toEqual([]);
    await page.click("#hc");
    expect(await seriousViolations(page), "high contrast").toEqual([]);
  });
}

// ---------- Welcome tour (F-024 PR 2) ----------
const TARGETS = [null, "#lessonCard", ".editwrap", "#runBtn", "#stage", "#lessonCardDone", ".learn nav.tabs", null];
const tourText = (page) => page.locator("#buddyText");
const next = (page) => page.locator('#buddyActions [data-tour="next"]');
const inBubble = (page) => page.evaluate(() => document.getElementById("buddyBubble").contains(document.activeElement));

test("AC6: Replay tour from the menu restarts at step 1 and moves focus to Next", async ({ page }) => {
  await openApp(page); // the fixture seeds a finished tour
  await page.waitForTimeout(1000);
  await expect(page.locator("#buddyBubble")).toBeHidden();
  await page.click("#buddy");
  await page.click("#buddyReplay");
  await expect(tourText(page)).toHaveText(/Robo/);
  await expect(next(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tourText(page)).toHaveText(await t(page, "tour2"));
  await expect(next(page)).toBeFocused(); // focus stays in the bubble from step to step
});

test.describe("first visit", () => {
  test.use({ buddy: null });

  test("AC6: the 8-step tour hops to each area; Back, Next and the name field work; finishing persists", async ({ page }) => {
    await openApp(page);
    await expect(page.locator("#buddyActions")).toBeVisible();
    const hello = await page.evaluate(() => T("tour1")(iso(buddyName())));
    await expect(tourText(page)).toHaveText(hello);
    await expect(page.locator("#buddyLive")).toHaveText(hello);
    expect(await inBubble(page), "focus is not moved on first load").toBe(false);
    await expect(page.locator(".tourCount")).toHaveText("1 / 8");
    await expect(page.locator('#buddyActions [data-tour="back"]')).toHaveCount(0);

    await page.fill("#buddyTourName", "Bolt");
    await page.press("#buddyTourName", "Enter");
    await expect(tourText(page)).toHaveText(await t(page, "tour2"));
    await expect(page.locator("#buddy")).toHaveAttribute("aria-label", /Bolt/);
    expect((await stored(page)).name).toBe("Bolt");
    await page.click('#buddyActions [data-tour="back"]');
    await expect(page.locator("#buddyTourName")).toHaveValue("Bolt");
    await expect(tourText(page)).toHaveText(/Bolt/);

    for (let i = 1; i < 8; i++) {
      await next(page).click();
      await expect(tourText(page)).toHaveText(await t(page, `tour${i + 1}`));
      await expect(page.locator(".tourCount")).toHaveText(`${i + 1} / 8`);
      await expect(page.locator("#buddyDock")).toBeInViewport({ ratio: 1 });
      await expect(page.locator("#buddyBubble")).toBeInViewport({ ratio: 1 });
      if (TARGETS[i]) {
        await expect(page.locator(TARGETS[i]).first()).toBeInViewport();
        // the robot lands next to (or inside) the control it talks about
        const [r, b] = await Promise.all([page.evaluate(() => buddyAt), page.locator(TARGETS[i]).first().boundingBox()]);
        expect(r, `step ${i + 1} hopped`).not.toBeNull();
        const gapX = Math.max(0, b.x - r.right, r.left - (b.x + b.width)), gapY = Math.max(0, b.y - r.bottom, r.top - (b.y + b.height));
        expect(Math.max(gapX, gapY), `step ${i + 1} distance`).toBeLessThan(20);
      } else expect(await page.evaluate(() => buddyAt)).toBeNull();
    }
    await expect(next(page)).toHaveText(await t(page, "tourDone"));
    await expect(page.locator('#buddyActions [data-tour="skip"]')).toHaveCount(0);
    await next(page).click();
    await expect(page.locator("#buddyBubble")).toBeHidden();
    expect((await stored(page)).toured).toBe(true);
    expect(await page.evaluate(() => [buddyAt, document.getElementById("buddyDock").style.transform])).toEqual([null, ""]);

    await reopen(page);
    await page.waitForTimeout(1500);
    await expect(page.locator("#buddyBubble")).toBeHidden();
  });

  test("AC6: Skip tour, the close button and Esc end the tour; Esc in the editor does not", async ({ page }) => {
    await openApp(page);
    await expect(page.locator("#buddyActions")).toBeVisible();
    await next(page).click();
    await next(page).click();
    await page.focus("#code");
    await page.keyboard.press("Escape");
    await expect(page.locator("#buddyActions")).toBeVisible();
    await page.click('#buddyActions [data-tour="skip"]');
    await expect(page.locator("#buddyBubble")).toBeHidden();
    expect((await stored(page)).toured).toBe(true);

    for (const how of ["close", "escape"]) {
      await page.click("#buddy");
      await page.click("#buddyReplay");
      await next(page).click();
      if (how === "close") await page.click("#buddyBubbleClose");
      else { await next(page).focus(); await page.keyboard.press("Escape"); }
      await expect(page.locator("#buddyBubble")).toBeHidden();
      expect(await page.evaluate(() => [tourIdx, buddyAt])).toEqual([-1, null]);
    }
  });

  test("AC6: during the tour the robot can't be dragged and clicking it focuses Next", async ({ page }) => {
    await openApp(page);
    await expect(page.locator("#buddyActions")).toBeVisible();
    const b = await dockBox(page);
    await page.mouse.move(b.x + 30, b.y + 30);
    await page.mouse.down();
    await page.mouse.move(400, 300, { steps: 8 });
    await page.mouse.up();
    expect(await page.evaluate(() => buddy.pos)).toBeNull();
    await page.click("#buddy");
    await expect(page.locator("#buddyMenu")).toBeHidden();
    await expect(next(page)).toBeFocused();
  });

  test("AC6: a deep link opens its lesson and the tour starts afterwards", async ({ page }) => {
    await openApp(page, "/app.html#lesson=l3-draw-a-square-step-by-step");
    await expect(page.locator("#lessonSelect")).toHaveValue("2");
    await expect(page.locator("#buddyActions")).toBeVisible();
  });

  test("AC6: Arabic at 800 px: translated steps, every robot spot and bubble on screen", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await openApp(page, "/app.html#lang=ar");
    await expect(page.locator("#buddyActions")).toBeVisible();
    await expect(tourText(page)).toHaveText(/روبو/);
    await expect(page.locator(".tourCount")).toHaveText("1 من 8");
    for (let i = 1; i < 8; i++) {
      await next(page).click();
      await expect(tourText(page)).toHaveText(await t(page, `tour${i + 1}`));
      await expect(page.locator("#buddyDock")).toBeInViewport({ ratio: 1 });
      await expect(page.locator("#buddyBubble")).toBeInViewport({ ratio: 1 });
      if (TARGETS[i]) await expect(page.locator(TARGETS[i]).first()).toBeInViewport();
    }
    await expect(next(page)).toHaveText("هيا بنا!");
  });

  test("AC6: the tour does not start while the robot is turned off", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("tl.buddy.v1", JSON.stringify({ off: true })));
    await openApp(page);
    await page.waitForTimeout(1500);
    await expect(page.locator("#buddyBubble")).toBeHidden();
    expect(await page.evaluate(() => tourIdx)).toBe(-1);
  });

  for (const lang of ["en", "ar"]) {
    test(`AC10: axe (${lang}) with a tour step open`, async ({ page }) => {
      await openApp(page, lang === "ar" ? "/app.html#lang=ar" : "/app.html");
      await expect(page.locator("#buddyActions")).toBeVisible();
      expect(await seriousViolations(page), "step 1 with the name field").toEqual([]);
      await next(page).click();
      expect(await seriousViolations(page), "step 2").toEqual([]);
    });
  }
});
