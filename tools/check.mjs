#!/usr/bin/env node
// Turtle Lab invariant checker. No dependencies. Run from repo root:
//   node tools/check.mjs
// Exits 1 if any invariant in AGENTS.md section 6 is broken.
import { readFileSync, existsSync } from "node:fs";
import { offlineHtml, sha256, LIBS, OUT_DIR, LIB_DIR } from "./build-offline.mjs";

const app = readFileSync("app.html", "utf8");
const landing = readFileSync("index.html", "utf8");
const errors = [], notes = [];
const fail = (m) => errors.push(m), note = (m) => notes.push(m);

// Content arrays are single-line JSON literals: `const NAME=[...];`
function json(name) {
  const m = app.match(new RegExp(`\\r?\\nconst ${name}=(.*);\\r?\\n`));
  if (!m) { fail(`const ${name} not found on its own line`); return null; }
  try { return JSON.parse(m[1]); } catch (e) { fail(`${name} is not valid JSON: ${e.message}`); return null; }
}
// I18N / DEBUG_I18N are JS object literals (they contain functions).
function literal(name) {
  const m = app.match(new RegExp(`\\r?\\nconst ${name}=(\\{[\\s\\S]*?\\r?\\n\\});`));
  if (!m) { fail(`const ${name} block not found`); return null; }
  try { return Function(`"use strict";return (${m[1]})`)(); } catch (e) { fail(`${name} does not evaluate: ${e.message}`); return null; }
}

const lessons = json("lessons"), lessonAr = json("LESSON_AR"), levelAr = json("LEVEL_AR");
const docs = json("docs"), extraDocs = json("extraDocs"), examples = json("examples");
const I18N = literal("I18N"), DEBUG = literal("DEBUG_I18N");

const LESSON_FIELDS = ["level","title","concept","goal","explanation","starterCode","expected","steps","hint","challenge","tryThis","teacherNote"];
const AR_FIELDS = LESSON_FIELDS.filter((f) => f !== "level" && f !== "starterCode");

if (lessons) {
  lessons.forEach((l, i) => {
    for (const f of LESSON_FIELDS) if (!(f in l)) fail(`lessons[${i}] missing "${f}"`);
    if (!Array.isArray(l.steps)) fail(`lessons[${i}].steps must be an array`);
    if (typeof l.starterCode === "string" && !/import turtle/.test(l.starterCode)) note(`lessons[${i}] starterCode has no "import turtle"`);
    if (levelAr && !(l.level in levelAr)) fail(`LEVEL_AR missing translation for "${l.level}"`);
  });
  if (lessonAr) {
    if (lessonAr.length !== lessons.length) fail(`LESSON_AR has ${lessonAr.length} entries, lessons has ${lessons.length} (must be index-aligned)`);
    lessonAr.forEach((l, i) => { for (const f of AR_FIELDS) if (!(f in l)) fail(`LESSON_AR[${i}] missing "${f}"`); });
  }
  // Badge rules reference zero-based lesson indexes inside badges().
  const b = app.match(/function badges\(\)\{[^\n]*/);
  if (b) for (const m of b[0].matchAll(/\[([\d,\s]+)\]\.some/g))
    for (const n of m[1].split(",").map(Number)) if (n >= lessons.length) fail(`badge rule references lesson index ${n} (only ${lessons.length} lessons)`);
}
for (const [name, arr, fields] of [["docs/extraDocs", [...(docs||[]), ...(extraDocs||[])], ["category","command","explanation","example"]], ["examples", examples||[], ["name","code"]]])
  arr.forEach((d, i) => { for (const f of fields) if (typeof d[f] !== "string") fail(`${name}[${i}].${f} missing or not a string`); });

for (const [name, dict] of [["I18N", I18N], ["DEBUG_I18N", DEBUG]]) {
  if (!dict) continue;
  const en = Object.keys(dict.en || {}), ar = new Set(Object.keys(dict.ar || {}));
  for (const k of en) if (!ar.has(k)) fail(`${name}.ar missing key "${k}"`);
  for (const k of ar) if (!(k in dict.en)) fail(`${name}.en missing key "${k}"`);
}

// Every id used via $("x") should exist in the markup (or be a known optional hook).
const ids = new Set([...app.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const KNOWN_OPTIONAL = new Set(["saveTop", "focusExamples"]); // see SPEC.md 3.3
for (const m of new Set([...app.matchAll(/\$\("([A-Za-z0-9_-]+)"\)/g)].map((m) => m[1])))
  if (!ids.has(m) && !KNOWN_OPTIONAL.has(m)) fail(`$("${m}") used but no element has id="${m}"`);

// Storage keys stay inside the K map (plus the landing key).
const kBlock = app.match(/\nconst K=\{([^}]*)\}/);
if (kBlock) {
  const keys = [...kBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (new Set(keys).size !== keys.length) fail("duplicate storage key in K");
  const stray = [...app.matchAll(/localStorage\.(?:get|set|remove)Item\("([^"]+)"/g)].map((m) => m[1]);
  if (stray.length) fail(`raw localStorage key literal(s) in app.html, use K: ${[...new Set(stray)].join(", ")}`);
}
// All app storage goes through store.get/store.set (F-004); localStorage may only appear inside `const store=`.
if (!/\r?\nconst store=\{/.test(app)) fail("const store helper not found in app.html");
app.split(/\r?\n/).forEach((l, i) => { if (/localStorage/.test(l) && !l.startsWith("const store=")) fail(`app.html line ${i + 1}: use store.get/store.set instead of localStorage`); });
// The landing page has no helper; each storage call must sit inside a try on the same line.
landing.split(/\r?\n/).forEach((l, i) => { if (/localStorage\./.test(l) && !/\btry\s*\{/.test(l)) fail(`index.html line ${i + 1}: wrap localStorage access in try { ... }`); });
if (!/turtleLabLandingLanguage/.test(landing)) fail("index.html landing language key changed");

// Every app link from the landing page must stay relative.
if (!/href="app\.html"/.test(landing)) fail('index.html no longer links to "app.html"');

// External scripts must be pinned to an exact version.
for (const m of app.matchAll(/<script src="([^"]+)"/g)) if (!/@\d+\.\d+\.\d+\//.test(m[1]) && !/^assets\//.test(m[1])) fail(`unpinned external script: ${m[1]}`);

// Offline bundle (offline/) must be regenerated after every app.html change: node tools/build-offline.mjs
try {
  const want = offlineHtml(app);
  if (!existsSync(`${OUT_DIR}/app.html`)) fail(`${OUT_DIR}/app.html missing; run node tools/build-offline.mjs`);
  else if (readFileSync(`${OUT_DIR}/app.html`, "utf8").replace(/\r\n/g, "\n") !== want) fail(`${OUT_DIR}/app.html is stale; run node tools/build-offline.mjs`);
  for (const { file, sha256: h } of LIBS)
    if (!existsSync(`${LIB_DIR}/${file}`) || sha256(readFileSync(`${LIB_DIR}/${file}`)) !== h) fail(`${LIB_DIR}/${file} missing or modified; run node tools/build-offline.mjs`);
} catch (e) { fail(`offline bundle: ${e.message}`); }

const summary = lessons && `${lessons.length} lessons, ${(docs||[]).length + (extraDocs||[]).length} docs, ${(examples||[]).length} examples`;
notes.forEach((n) => console.log("note:", n));
if (errors.length) { errors.forEach((e) => console.error("FAIL:", e)); console.error(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`OK: ${summary}. All invariants hold.`);
