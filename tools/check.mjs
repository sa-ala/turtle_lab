#!/usr/bin/env node
// Turtle Lab invariant checker. No dependencies. Run from repo root:
//   node tools/check.mjs
// Exits 1 if any invariant in AGENTS.md section 6 is broken.
import { readFileSync, existsSync } from "node:fs";
import { offlineHtml, sha256, sri384, LIBS, OUT_DIR, LIB_DIR, OUT_LIB_DIR } from "./build-offline.mjs";

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

const LESSON_FIELDS = ["id","level","title","concept","goal","explanation","starterCode","expected","steps","hint","challenge","tryThis","teacherNote"];
const AR_FIELDS = LESSON_FIELDS.filter((f) => f !== "id" && f !== "level" && f !== "starterCode");
const v2Ids = json("V2_LESSON_IDS");

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
  // Stable lesson ids (F-002): present, well-formed, unique. Progress and badges are keyed by id.
  const ids = lessons.map((l) => l.id);
  ids.forEach((id, i) => { if (typeof id !== "string" || !/^l\d+-[a-z0-9-]+$/.test(id)) fail(`lessons[${i}].id "${id}" must look like "l12-short-title"`); });
  for (const id of new Set(ids)) if (ids.filter((x) => x === id).length > 1) fail(`duplicate lesson id "${id}"`);
  // V2_LESSON_IDS decodes progress saved before F-002 by index: frozen at the 38 baseline lessons.
  if (v2Ids) {
    if (v2Ids.length !== 38 || new Set(v2Ids).size !== 38) fail("V2_LESSON_IDS must hold exactly the 38 unique pre-F-002 ids; never edit it");
    if (v2Ids.some((id, i) => !/^l\d+-/.test(id) || !id.startsWith(`l${i + 1}-`))) fail("V2_LESSON_IDS order changed; it must stay in the pre-F-002 order");
  }
  // Badge rules reference lesson ids inside badges(); numeric index rules are no longer allowed.
  const b = app.match(/function badges\(\)\{[^\n]*/);
  if (!b) fail("function badges() not found");
  else {
    if (/\[[\d,\s]+\]\.some|progress\.has\(\d/.test(b[0])) fail("badges() uses lesson indexes; use lesson ids");
    const badgeIds = [...b[0].matchAll(/"(l\d+-[a-z0-9-]+)"/g)].map((m) => m[1]);
    if (!badgeIds.length) fail("badges() references no lesson ids");
    for (const id of badgeIds) if (!ids.includes(id)) fail(`badge rule references unknown lesson id "${id}"`);
  }
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
// Skulpt loader (F-003): each entry loads a vendored local file first, then a pinned CDN URL whose SRI matches that file.
const loader = [...app.matchAll(/\{local:"([^"]+)",cdn:"([^"]+)",sri:"([^"]+)"/g)];
if (loader.length !== 2) fail(`expected 2 SKULPT_FILES entries in app.html, found ${loader.length}`);
for (const [, local, cdn, sri] of loader) {
  const lib = LIBS.find((l) => `${LIB_DIR}/${l.file}` === local);
  if (!lib) { fail(`loader local path ${local} is not a vendored file in ${LIB_DIR}`); continue; }
  if (cdn !== lib.url) fail(`loader CDN URL for ${local} (${cdn}) differs from LIBS url ${lib.url}`);
  if (!/@\d+\.\d+\.\d+\//.test(cdn)) fail(`unpinned CDN URL: ${cdn}`);
  if (existsSync(local) && sri !== sri384(readFileSync(local))) fail(`SRI for ${cdn} does not match ${local}`);
}

// Offline bundle (offline/) must be regenerated after every app.html change: node tools/build-offline.mjs
try {
  const want = offlineHtml(app);
  if (!existsSync(`${OUT_DIR}/app.html`)) fail(`${OUT_DIR}/app.html missing; run node tools/build-offline.mjs`);
  else if (readFileSync(`${OUT_DIR}/app.html`, "utf8").replace(/\r\n/g, "\n") !== want) fail(`${OUT_DIR}/app.html is stale; run node tools/build-offline.mjs`);
  for (const { file, sha256: h } of LIBS) for (const dir of [LIB_DIR, OUT_LIB_DIR])
    if (!existsSync(`${dir}/${file}`) || sha256(readFileSync(`${dir}/${file}`)) !== h) fail(`${dir}/${file} missing or modified; run node tools/build-offline.mjs`);
} catch (e) { fail(`offline bundle: ${e.message}`); }

// The CI e2e container image must match the pinned Playwright version, or browsers will not match.
try {
  const pw = JSON.parse(readFileSync("package.json", "utf8")).devDependencies?.["@playwright/test"];
  const image = readFileSync(".github/workflows/check.yml", "utf8").match(/mcr\.microsoft\.com\/playwright:v([\d.]+)-/);
  if (!pw || !image) fail("could not find @playwright/test version or the Playwright CI image");
  else if (pw !== image[1]) fail(`Playwright CI image v${image[1]} does not match @playwright/test ${pw} in package.json`);
} catch (e) { fail(`Playwright version check: ${e.message}`); }

const summary = lessons && `${lessons.length} lessons, ${(docs||[]).length + (extraDocs||[]).length} docs, ${(examples||[]).length} examples`;
notes.forEach((n) => console.log("note:", n));
if (errors.length) { errors.forEach((e) => console.error("FAIL:", e)); console.error(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`OK: ${summary}. All invariants hold.`);
