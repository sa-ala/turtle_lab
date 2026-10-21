# F-xxx: <Feature title>

| Field | Value |
| --- | --- |
| Status | Proposed / Approved / In progress / Done |
| Priority | P0 / P1 / P2 / P3 |
| Size | S / M / L |
| Depends on | F-xxx, or — |
| Related gaps | GAP-xx (SPEC.md §13), or — |
| Owner / agent | |

## Problem
What hurts today, for whom (learner, teacher/parent, maintainer). Cite current behavior from SPEC.md by section.

## Goals
- Bullet list of outcomes.

## Non-goals
- What this explicitly does not do. Agents must not expand scope beyond Goals.

## User experience
Step-by-step behavior in English, plus every new visible string in **English and Arabic**. Describe RTL, high-contrast and < 860 px behavior if UI changes.

| Key | en | ar |
| --- | --- | --- |
| `exampleKey` | Example text | نص مثال |

## Technical design
- Symbols/functions to change (by name, not line number).
- New DOM ids, `E` entries, handlers in `bind()`, strings in `I18N`/`DEBUG_I18N`.
- Storage: new or changed `K` keys, value schema, version, migration from old keys, validation on read.
- Run/step impact (token guard, timers, Normal/Step parity), if any.
- New dependencies: none expected; if unavoidable, exact version, host, size, license, offline impact.

## Acceptance criteria
Numbered, observable, testable. Include both languages and at least one failure/edge case.
1.
2.

## Test plan
Automated tests to add (once F-001 exists) and manual checks. Name fixtures for intentional errors or infinite loops.

## Documentation updates
- [ ] SPEC.md sections: …
- [ ] README / landing copy (both languages): …
- [ ] docs/ROADMAP.md status

## Open questions
Decisions the maintainer must make before or during implementation.
