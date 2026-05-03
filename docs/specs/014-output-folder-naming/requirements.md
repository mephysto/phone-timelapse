## User Story

Given a session is being started,
When `startSession()` determines the output directory,
Then the folder is named after today's date and, if a folder for that date already exists, a numeric suffix is appended to avoid overwriting previous sessions.

## Acceptance Criteria

1. The base output folder path is `./output/YYYY-MM-DD/`, where the date components reflect the local date at session start time.
2. If `./output/YYYY-MM-DD/` does not exist, it is created and used as `session.outputDir`.
3. If `./output/YYYY-MM-DD/` already exists, the server tries `./output/YYYY-MM-DD (2)/`.
4. The server continues incrementing the suffix (`(3)`, `(4)`, …) until it finds a path that does not exist.
5. The first available (non-existing) path is created and assigned to `session.outputDir`.
6. The `./output/` root directory is created if it does not exist.
7. Directory creation uses `fs.mkdirSync` or `fs.promises.mkdir` with `recursive: true`.
8. `session.outputDir` is set to the absolute path of the created folder.

## Gotchas & Edge Cases

- The date string must reflect the local system date, not UTC; a session starting at 23:00 local time should not be placed in tomorrow's UTC folder.
- The loop checking for existing folders must be synchronous (or fully awaited) before `session.outputDir` is assigned; otherwise a race condition could cause two concurrent `startSession()` calls to pick the same folder.
- The suffix format is exactly ` (N)` with a space before the opening parenthesis: `2026-05-03 (2)`, not `2026-05-03(2)` or `2026-05-03-2`.
- The check-and-create step is not atomic at the OS level; for a local single-user app this is acceptable.
- `./output/` is relative to the server's working directory (`process.cwd()`); use `path.resolve` to produce an absolute path.
- If folder creation fails (e.g. permissions error), `startSession()` should propagate the error rather than silently continuing with an empty `outputDir`.
