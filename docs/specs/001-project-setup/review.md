# Review — T-01 · Project Setup
Status: PARTIAL

## Acceptance Criteria Results

| # | Criteria (condensed) | Result | Notes |
|---|----------------------|--------|-------|
| 1 | `package.json` has `name`, `description`, `version`, and a consistent module type declaration | ⚠️ PARTIAL | Working-tree `package.json` has `name`, `description`, `version` — all correct. `"type"` field is absent (defaults to CommonJS). Acceptable only if `server.js` will use `require()`. Critical issue: the committed `package.json` (HEAD) is still the bare `npm init` default — it lacks `description` and has no matching fields. The working-tree file has not been staged or committed. |
| 2 | `package.json` has a `"start"` script running `node server.js` | ⚠️ PARTIAL | Present in the working-tree file. Not present in the committed version at HEAD. A fresh clone would not have this script. |
| 3 | `package.json` has a `"dev"` script running `node --watch server.js` | ⚠️ PARTIAL | Present in the working-tree file. Not present in the committed version at HEAD. A fresh clone would not have this script. |
| 4 | `package.json` lists `express`, `socket.io`, `qrcode` as production dependencies | ⚠️ PARTIAL | Present in the working-tree file. Not present in the committed version at HEAD. A fresh clone would install nothing. |
| 5 | `npm install` completes with exit code 0 and produces `node_modules/` | ✅ PASS | `node_modules/express`, `node_modules/socket.io`, and `node_modules/qrcode` are all present on disk. |
| 6 | `public/` directory exists at the project root | ✅ PASS | Directory exists (currently empty, which is permitted by the spec). |
| 7 | `output/` exists (or created on first run) and is listed in `.gitignore` | ✅ PASS | Directory exists with `.gitkeep` inside. `.gitignore` has `output/*` and `!output/.gitkeep`, which correctly ignores contents while preserving the folder. |
| 8 | `docs/` directory exists at the project root | ✅ PASS | Directory exists and contains spec files. |
| 9 | `.gitignore` exists with entries for `node_modules/` and `output/` | ⚠️ PARTIAL | File exists on disk and contains the correct entries (`node_modules/`, `output/*`). However, `.gitignore` itself is untracked and has not been committed. A fresh clone would have no `.gitignore`, meaning `node_modules/` and `output/` could be accidentally committed by another developer. |
| 10 | No `package-lock.json` or `node_modules/` committed to the repository | ✅ PASS | Neither is tracked by git (`git ls-files` returns empty for both). `package-lock.json` exists on disk but is correctly listed in `.gitignore`. |

## Verdict

PARTIAL

## Issues Found

1. **`package.json` changes not committed** — The working-tree `package.json` has all required fields (`name`, `description`, `version`, `start` script, `dev` script, all three dependencies). The committed version at HEAD is the bare `npm init` skeleton with none of these. ACs 1–4 pass only against the working tree; a fresh clone fails all four. File: `package.json` (compare `git show HEAD:package.json` vs the current file).

2. **`.gitignore` not committed** — `.gitignore` is untracked (shown under "Untracked files" in `git status`). Until committed, it provides no protection to other contributors and no guarantee for CI. This also means AC 9, while satisfied locally, is not guaranteed on a fresh clone.

3. **No `"type"` field in `package.json`** — The spec requires the module system to be declared explicitly and documented so all subsequent tasks follow it. Omitting `"type"` defaults to CommonJS, which is a valid choice, but it should be stated explicitly (e.g., add `"type": "commonjs"` or document the decision in the spec's design notes) to avoid ambiguity across the 29 remaining tasks.

## Recommendation

FIX: Stage and commit `package.json` and `.gitignore` so that a fresh clone satisfies all 10 acceptance criteria. Optionally add `"type": "commonjs"` to `package.json` to make the module system decision explicit before subsequent tasks begin.
