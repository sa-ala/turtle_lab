#!/usr/bin/env node
// Turtle Lab content authoring tool (ROADMAP F-017). No dependencies. Run from repo root.
//
//   node tools/content.mjs extract   writes app.html's content arrays to content/*.json (pretty-printed, for editing/review)
//   node tools/content.mjs check     validates content/*.json without writing anything
//   node tools/content.mjs inject    validates content/*.json, then writes them back into app.html as single-line literals
//
// Options: --app <path to app.html> (default app.html), --dir <content folder> (default content).
// After inject, run: node tools/build-offline.mjs && node tools/check.mjs && npm test
//
// The runtime stays a single file: content/ is a working copy and is git-ignored. V2_LESSON_IDS is deliberately not
// exported: it is frozen (AGENTS.md rule 7). Arrays are written back in the exact existing format
// (", " and ": " separators, non-ASCII kept as-is), so extract followed by inject with no edits is byte-identical.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const FILES = [
  { name: "lessons", file: "lessons.json" },
  { name: "LESSON_AR", file: "lessons.ar.json" },
  { name: "LEVEL_AR", file: "levels.ar.json" },
  { name: "docs", file: "docs.json" },
  { name: "extraDocs", file: "docs.extra.json" },
  { name: "DOCS_AR", file: "docs.ar.json" },
  { name: "examples", file: "examples.json" },
  { name: "EXAMPLE_NAMES_AR", file: "examples.names.ar.json" },
];
const LESSON_FIELDS = ["id", "level", "title", "concept", "goal", "explanation", "starterCode", "expected", "steps", "hint", "challenge", "tryThis", "teacherNote"];
const AR_FIELDS = LESSON_FIELDS.filter((f) => !["id", "level", "starterCode"].includes(f));

class ContentError extends Error {}
const lineRe = (name) => new RegExp(`(\\r?\\n)(const ${name}=)(.*)(;)(\\r?\\n)`);

// Same formatting as the hand-maintained single-line literals in app.html.
export const serialize = (v) => Array.isArray(v) ? "[" + v.map(serialize).join(", ") + "]"
  : v && typeof v === "object" ? "{" + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ": " + serialize(x)).join(", ") + "}"
  : JSON.stringify(v);

export function readArrays(appHtml) {
  const out = {};
  for (const { name } of FILES) {
    const m = appHtml.match(lineRe(name));
    if (!m) throw new ContentError(`app.html: "const ${name}=" not found on its own line`);
    try { out[name] = JSON.parse(m[3]); } catch (e) { throw new ContentError(`app.html: ${name} is not valid JSON (${e.message})`); }
  }
  return out;
}

export function validate(c) {
  const errs = [];
  const isStr = (v) => typeof v === "string";
  if (!Array.isArray(c.lessons)) errs.push("lessons.json must be an array");
  else {
    c.lessons.forEach((l, i) => {
      for (const f of LESSON_FIELDS) if (!(f in (l || {}))) errs.push(`lessons.json[${i}] is missing "${f}"`);
      if (l && !Array.isArray(l.steps)) errs.push(`lessons.json[${i}].steps must be an array`);
      if (l && (!isStr(l.id) || !/^l\d+-[a-z0-9-]+$/.test(l.id))) errs.push(`lessons.json[${i}].id "${l && l.id}" must look like "l12-short-title"`);
      if (l && c.LEVEL_AR && !(l.level in c.LEVEL_AR)) errs.push(`levels.ar.json has no Arabic for level "${l.level}" (lessons.json[${i}])`);
    });
    const ids = c.lessons.map((l) => l && l.id);
    ids.forEach((id, i) => { if (ids.indexOf(id) !== i) errs.push(`lessons.json[${i}] reuses id "${id}" (ids must be unique and never reused)`); });
  }
  if (!Array.isArray(c.LESSON_AR)) errs.push("lessons.ar.json must be an array");
  else {
    if (Array.isArray(c.lessons) && c.LESSON_AR.length !== c.lessons.length) errs.push(`lessons.ar.json has ${c.LESSON_AR.length} entries but lessons.json has ${c.lessons.length}: Arabic lessons must be index-aligned`);
    c.LESSON_AR.forEach((l, i) => { for (const f of AR_FIELDS) if (!(f in (l || {}))) errs.push(`lessons.ar.json[${i}] is missing "${f}"`); });
  }
  if (!c.LEVEL_AR || typeof c.LEVEL_AR !== "object" || Array.isArray(c.LEVEL_AR)) errs.push("levels.ar.json must be an object of English level -> Arabic level");
  for (const [file, arr, fields] of [["docs.json", c.docs, ["category", "command", "explanation", "example"]], ["docs.extra.json", c.extraDocs, ["category", "command", "explanation", "example"]], ["docs.ar.json", c.DOCS_AR, ["category", "explanation"]], ["examples.json", c.examples, ["name", "code"]]]) {
    if (!Array.isArray(arr)) { errs.push(`${file} must be an array`); continue; }
    arr.forEach((d, i) => { for (const f of fields) if (!isStr(d && d[f])) errs.push(`${file}[${i}].${f} is missing or not a string`); });
  }
  if (Array.isArray(c.docs) && Array.isArray(c.extraDocs) && Array.isArray(c.DOCS_AR) && c.DOCS_AR.length !== c.docs.length + c.extraDocs.length)
    errs.push(`docs.ar.json has ${c.DOCS_AR.length} entries but docs.json + docs.extra.json have ${c.docs.length + c.extraDocs.length}: Arabic syntax help must be index-aligned`);
  if (!Array.isArray(c.EXAMPLE_NAMES_AR)) errs.push("examples.names.ar.json must be an array");
  else {
    if (Array.isArray(c.examples) && c.EXAMPLE_NAMES_AR.length !== c.examples.length) errs.push(`examples.names.ar.json has ${c.EXAMPLE_NAMES_AR.length} entries but examples.json has ${c.examples.length}: Arabic example names must be index-aligned`);
    c.EXAMPLE_NAMES_AR.forEach((v, i) => { if (!isStr(v) || !v.trim()) errs.push(`examples.names.ar.json[${i}] is missing or empty`); });
  }
  return errs;
}

export function readContentDir(dir) {
  const c = {};
  for (const { name, file } of FILES) {
    const path = join(dir, file);
    if (!existsSync(path)) throw new ContentError(`${path} not found (run "node tools/content.mjs extract" first)`);
    const text = readFileSync(path, "utf8");
    try { c[name] = JSON.parse(text); } catch (e) { throw new ContentError(`${path} is not valid JSON: ${e.message}`); }
  }
  return c;
}

export function injectInto(appHtml, c) {
  let s = appHtml;
  for (const { name } of FILES) s = s.replace(lineRe(name), (_, nl1, decl, _body, semi, nl2) => nl1 + decl + serialize(c[name]) + semi + nl2);
  return s;
}

function main(argv) {
  const cmd = argv[0], opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const app = opt("--app", "app.html"), dir = opt("--dir", "content");
  if (cmd === "extract") {
    const c = readArrays(readFileSync(app, "utf8"));
    mkdirSync(dir, { recursive: true });
    for (const { name, file } of FILES) writeFileSync(join(dir, file), JSON.stringify(c[name], null, 2) + "\n");
    console.log(`OK: wrote ${FILES.length} files to ${dir}/ (edit them, then run "node tools/content.mjs inject")`);
  } else if (cmd === "check" || cmd === "inject") {
    const c = readContentDir(dir), errs = validate(c);
    if (errs.length) throw new ContentError(`content is invalid; ${cmd === "inject" ? "app.html was not changed" : "nothing written"}:\n  - ` + errs.join("\n  - "));
    if (cmd === "check") { console.log(`OK: ${dir}/ is valid (${c.lessons.length} lessons, ${c.docs.length + c.extraDocs.length} docs, ${c.examples.length} examples)`); return; }
    const before = readFileSync(app, "utf8"), after = injectInto(before, c);
    readArrays(after); // re-parse what was written, as a final safety net
    if (after === before) { console.log("OK: no changes; app.html is already up to date"); return; }
    writeFileSync(app, after);
    console.log(`OK: ${app} updated. Next: node tools/build-offline.mjs && node tools/check.mjs && npm test`);
  } else {
    throw new ContentError(`usage: node tools/content.mjs extract|check|inject [--app app.html] [--dir content]`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e instanceof ContentError ? `FAIL: ${e.message}` : e); process.exit(1); }
}
