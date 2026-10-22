// Editor ergonomics (ROADMAP F-009, SPEC.md §4.3, §10.3). Runs in Chromium and Firefox (see playwright.config.js).
import { test, expect, openApp, t } from "./fixtures.js";

const code = (page) => page.inputValue("#code");
// Put text in the editor and place the selection; [start, end] default to the end of the text.
async function setCode(page, text, start = text.length, end = start) {
  await page.fill("#code", text);
  await page.evaluate(([s, e]) => { E.code.focus(); E.code.setSelectionRange(s, e); }, [start, end]);
}
const selection = (page) => page.evaluate(() => [E.code.selectionStart, E.code.selectionEnd]);
const undo = (page) => page.keyboard.press("Control+z");

test("Enter keeps the indent and adds 4 spaces after a colon; Ctrl+Z undoes it", async ({ page }) => {
  await openApp(page);
  await setCode(page, "for i in range(3):");
  await page.keyboard.press("Enter");
  expect(await code(page)).toBe("for i in range(3):\n    ");
  await page.keyboard.type("t.forward(10)");
  await page.keyboard.press("Enter");
  expect(await code(page)).toBe("for i in range(3):\n    t.forward(10)\n    ");
  await page.keyboard.type("if i == 1:   # comment");
  await page.keyboard.press("Enter");
  expect(await code(page)).toBe("for i in range(3):\n    t.forward(10)\n    if i == 1:   # comment\n        ");
  await undo(page);
  expect(await code(page)).toBe("for i in range(3):\n    t.forward(10)\n    if i == 1:   # comment");
});

test("Enter on a line without a colon keeps the same indent (or none)", async ({ page }) => {
  await openApp(page);
  await setCode(page, "import turtle");
  await page.keyboard.press("Enter");
  expect(await code(page)).toBe("import turtle\n");
  await setCode(page, "def f():\n    x = 1", 14); // caret after "    x" (mid-line split keeps the indent)
  await page.keyboard.press("Enter");
  expect(await code(page)).toBe("def f():\n    x\n     = 1");
});

test("Tab inserts 4 spaces; on a multi-line selection it indents every line; Ctrl+Z undoes it", async ({ page }) => {
  await openApp(page);
  await setCode(page, "t.forward(10)", 0);
  await page.keyboard.press("Tab");
  expect(await code(page)).toBe("    t.forward(10)");
  await undo(page);
  expect(await code(page)).toBe("t.forward(10)");

  const src = "a = 1\nb = 2\nc = 3";
  await setCode(page, src, 2, 9); // from inside line 1 to inside line 2
  await page.keyboard.press("Tab");
  expect(await code(page)).toBe("    a = 1\n    b = 2\nc = 3");
  const [s, e] = await selection(page);
  expect([s, e]).toEqual([6, 17]); // selection follows the moved text
  await undo(page);
  expect(await code(page)).toBe(src);
});

test("Shift+Tab outdents the current line or every selected line by up to 4 spaces", async ({ page }) => {
  await openApp(page);
  await setCode(page, "x = 1\n      y = 2", 13); // caret inside the 6-space line
  await page.keyboard.press("Shift+Tab");
  expect(await code(page)).toBe("x = 1\n  y = 2");
  expect(await selection(page)).toEqual([9, 9]);
  await page.keyboard.press("Shift+Tab");
  expect(await code(page)).toBe("x = 1\ny = 2"); // only 2 left to remove
  await page.keyboard.press("Shift+Tab");
  expect(await code(page)).toBe("x = 1\ny = 2"); // nothing to remove: no change

  await setCode(page, "    a\n        b\nc", 0, 16);
  await page.keyboard.press("Shift+Tab");
  expect(await code(page)).toBe("a\n    b\nc");
  await undo(page);
  expect(await code(page)).toBe("    a\n        b\nc");
});

test("Esc then Tab leaves the editor; plain Tab stays in it", async ({ page }) => {
  await openApp(page);
  await setCode(page, "x = 1");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.id)).toBe("code");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement.id)).not.toBe("code");
  expect(await code(page)).toBe("x = 1    ");
  // Esc, then Shift+Tab leaves backwards (Shift alone does not cancel the escape).
  await page.focus("#code");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => document.activeElement.id)).not.toBe("code");
  expect(await code(page)).toBe("x = 1    ");
});

test("the editor explains its keys to screen readers, in both languages", async ({ page }) => {
  await openApp(page);
  await expect(page.locator("#code")).toHaveAttribute("aria-describedby", "editorHelp");
  await expect(page.locator("#editorHelp")).toHaveText(await t(page, "editorHelp"));
  await page.selectOption("#langSelect", "ar");
  await expect(page.locator("#editorHelp")).toHaveText(await t(page, "editorHelp"));
});

test("gutter, cursor display and autosave stay correct, also with the Arabic (RTL) UI", async ({ page }) => {
  await openApp(page);
  await page.selectOption("#langSelect", "ar");
  await setCode(page, "for i in range(2):");
  await page.keyboard.press("Enter");
  await page.keyboard.type("t.left(90)");
  await expect(page.locator("#rail .railLine")).toHaveCount(2);
  await expect(page.locator("#cursor")).toContainText("2");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("tl.drafts.v1"))["l1-your-first-line"]);
  expect(saved).toBe("for i in range(2):\n    t.left(90)");
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#code")).toHaveValue("for i in range(2):\nt.left(90)");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("tl.drafts.v1"))["l1-your-first-line"])).toBe("for i in range(2):\nt.left(90)");
});
