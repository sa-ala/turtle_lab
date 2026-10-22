# CLAUDE.md

@AGENTS.md

Claude Code specifics:
- Follow AGENTS.md §7 workflow. Before editing, state your plan and the SPEC.md sections and GAP/F IDs it touches.
- Edit the single-line JSON content arrays in app.html with a throwaway Node script (AGENTS.md §4), not with string replacement on the 34 KB line. Delete the script before committing.
- After every change to app.html, run `node tools/build-offline.mjs` to regenerate `offline/app.html` (never edit files under `offline/` directly).
- Run `node tools/check.mjs` after every change to app.html or index.html.
