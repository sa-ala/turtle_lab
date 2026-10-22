## What and why
Implements / fixes: F-xxx / GAP-xx

## Plan followed
SPEC.md sections affected:
Storage keys changed (with migration):

## Verification
- [ ] `node tools/build-offline.mjs` run if `app.html` changed (offline bundle committed)
- [ ] `node tools/check.mjs` prints OK
- [ ] `npm test` passes; tests added or updated for changed behavior
- [ ] Remaining manual checks (AGENTS.md §3) — browser + width:
- [ ] Feature acceptance criteria checked in English **and** Arabic
- [ ] High contrast and < 860 px layout checked for touched UI
- [ ] No new network requests, trackers, or unpinned scripts
- [ ] SPEC.md / README / ROADMAP updated as needed
- [ ] Diff limited to the spec's scope
