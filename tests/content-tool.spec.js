// Content authoring tool (ROADMAP F-017). Node-only: no browser page is used.
import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const APP = readFileSync(join(ROOT, "app.html"), "utf8");

// Fresh temp copy of app.html (optionally with CRLF line endings) and an empty content dir.
function workspace(crlf = false) {
  const dir = mkdtempSync(join(tmpdir(), "tl-content-"));
  const app = join(dir, "app.html"), content = join(dir, "content");
  writeFileSync(app, crlf ? APP.replace(/\r?\n/g, "\r\n") : APP.replace(/\r\n/g, "\n"));
  const run = (...args) => spawnSync(process.execPath, [join(ROOT, "tools/content.mjs"), ...args, "--app", app, "--dir", content], { encoding: "utf8" });
  const json = (f) => JSON.parse(readFileSync(join(content, f), "utf8"));
  const put = (f, v) => writeFileSync(join(content, f), typeof v === "string" ? v : JSON.stringify(v, null, 2) + "\n");
  return { dir, app, content, run, json, put, read: () => readFileSync(app, "utf8"), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

for (const crlf of [false, true]) {
  test(`extract then inject with no edits is byte-identical (${crlf ? "CRLF" : "LF"} app.html)`, () => {
    const w = workspace(crlf);
    const before = w.read();
    expect(w.run("extract").status).toBe(0);
    for (const f of ["lessons.json", "lessons.ar.json", "levels.ar.json", "docs.json", "docs.extra.json", "docs.ar.json", "examples.json", "examples.names.ar.json"]) expect(existsSync(join(w.content, f))).toBe(true);
    const r = w.run("inject");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("no changes");
    expect(w.read()).toBe(before);
    w.cleanup();
  });
}

test("an edit round-trips: only the edited array's line changes and the result still parses", () => {
  const w = workspace();
  w.run("extract");
  const lessons = w.json("lessons.json");
  lessons[0].hint = "Try a longer line: t.forward(300)";
  w.put("lessons.json", lessons);
  const before = w.read().split("\n");
  const r = w.run("inject");
  expect(r.status, r.stderr).toBe(0);
  const after = w.read().split("\n");
  const changed = after.map((l, i) => (l !== before[i] ? i : -1)).filter((i) => i >= 0);
  expect(changed).toHaveLength(1);
  expect(after[changed[0]].startsWith("const lessons=")).toBe(true);
  expect(JSON.parse(after[changed[0]].slice("const lessons=".length, -1))[0].hint).toBe("Try a longer line: t.forward(300)");
  // Editing the pretty file again and injecting the original back restores the original bytes.
  w.run("extract");
  lessons[0].hint = JSON.parse(APP.match(/\r?\nconst lessons=(.*);\r?\n/)[1])[0].hint;
  w.put("lessons.json", lessons);
  w.run("inject");
  expect(w.read()).toBe(APP.replace(/\r\n/g, "\n"));
  w.cleanup();
});

test("V2_LESSON_IDS is not exported (it is frozen)", () => {
  const w = workspace();
  w.run("extract");
  expect(existsSync(join(w.content, "v2-lesson-ids.json"))).toBe(false);
  expect(readFileSync(join(w.content, "lessons.json"), "utf8")).not.toContain("V2_LESSON_IDS");
  w.cleanup();
});

const BROKEN = [
  ["invalid JSON", (w) => w.put("lessons.json", '[{"id": "l1-x",]'), /lessons\.json is not valid JSON/],
  ["Arabic lessons misaligned", (w) => { const a = w.json("lessons.ar.json"); a.pop(); w.put("lessons.ar.json", a); }, /lessons\.ar\.json has 37 entries but lessons\.json has 38/],
  ["Arabic syntax help misaligned", (w) => { const a = w.json("docs.ar.json"); a.push({ category: "x", explanation: "y" }); w.put("docs.ar.json", a); }, /docs\.ar\.json has 26 entries/],
  ["Arabic example names misaligned", (w) => { const a = w.json("examples.names.ar.json"); a.splice(2, 1); w.put("examples.names.ar.json", a); }, /examples\.names\.ar\.json has 12 entries but examples\.json has 13/],
  ["a new example without an Arabic name", (w) => { const a = w.json("examples.json"); a.push({ name: "Hexagon", code: "import turtle" }); w.put("examples.json", a); }, /index-aligned/],
  ["a duplicate lesson id", (w) => { const a = w.json("lessons.json"); a[1].id = a[0].id; w.put("lessons.json", a); }, /reuses id "l1-your-first-line"/],
  ["a malformed lesson id", (w) => { const a = w.json("lessons.json"); a[3].id = "Lesson 4"; w.put("lessons.json", a); }, /must look like "l12-short-title"/],
  ["a missing lesson field", (w) => { const a = w.json("lessons.json"); delete a[5].starterCode; w.put("lessons.json", a); }, /lessons\.json\[5\] is missing "starterCode"/],
  ["a level with no Arabic translation", (w) => { const a = w.json("lessons.json"); a[0].level = "Level 99: New"; w.put("lessons.json", a); }, /no Arabic for level "Level 99: New"/],
  ["a missing content file", (w) => rmSync(join(w.content, "docs.ar.json")), /docs\.ar\.json not found/],
];
for (const [name, breakIt, message] of BROKEN) {
  test(`inject aborts with a clear error on ${name}, leaving app.html unchanged`, () => {
    const w = workspace();
    w.run("extract");
    breakIt(w);
    const before = w.read();
    const r = w.run("inject");
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(message);
    expect(w.read()).toBe(before);
    const c = w.run("check"); // check reports the same problem without writing
    expect(c.status).toBe(1);
    expect(c.stderr).toMatch(message);
    w.cleanup();
  });
}
