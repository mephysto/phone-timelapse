## User Story

Given a freshly cloned repository with no dependencies installed,
When the developer runs `npm install`,
Then all required packages are installed without errors and the project folder structure is ready for development.

## Acceptance Criteria

1. `package.json` exists at the project root and contains a `name`, `description`, `version`, and `"type": "module"` (or CommonJS — whichever is chosen must be consistent with `server.js`).
2. `package.json` includes a `"start"` script that runs `node server.js`.
3. `package.json` includes a `"dev"` script that runs `node --watch server.js`.
4. `package.json` lists `express`, `socket.io`, and `qrcode` as production dependencies.
5. Running `npm install` completes with exit code 0 and produces a `node_modules/` folder.
6. A `public/` directory exists at the project root (may be empty or contain a placeholder).
7. An `output/` directory exists at the project root (or is created on first run — either is acceptable, but if it exists it must be listed in `.gitignore`).
8. A `docs/` directory exists at the project root.
9. `.gitignore` exists and contains entries for `node_modules/` and `output/`.
10. No `package-lock.json` or `node_modules/` is committed to the repository.

## Gotchas & Edge Cases

- `output/` must not be committed. If the directory itself is checked in (to preserve the folder), the contents must be ignored via `output/*` with a `.gitkeep` inside.
- If the project uses ES modules (`"type": "module"`), all later `require()` calls must be replaced with `import`. Decide the module system now and document the decision so all subsequent tasks follow it.
- The `"dev"` script uses `--watch`, which requires Node.js 18+. If the environment runs an older Node, this flag silently does nothing — confirm Node version in the setup notes.
- `qrcode` has no peer dependencies beyond Node, but `socket.io` installs a large dependency tree; `npm install` may take 30–60 seconds on a fresh machine.
- Avoid committing a `package-lock.json` generated on one OS (WSL Linux) that could cause checksum mismatches on another OS — either commit it intentionally or add it to `.gitignore`.
