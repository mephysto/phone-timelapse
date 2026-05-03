## User Story

Given a session has ended,
When `stopSession()` is called,
Then a plain-text `session.log` file is written to the session's output directory containing a human-readable summary of the session, including timing, frame counts, and any gaps.

## Acceptance Criteria

1. `stopSession()` writes a file named `session.log` inside `session.outputDir`.
2. The file contains the header `Phone Timelapse — Session Log` followed by a separator line of `=` characters (30 of them).
3. The log includes the session date formatted as `YYYY-MM-DD`.
4. The log includes the start time formatted as `HH:MM:SS`.
5. The log includes the end time formatted as `HH:MM:SS`.
6. The log includes the total duration formatted as `XhYmZs` (e.g. `11h 59m 59s`).
7. The log includes `Frames captured:` equal to `session.frameCount`.
8. The log includes `Frames expected:` equal to `session.expectedFrames`.
9. The log includes `Gaps:` equal to `session.gaps.length`.
10. Each gap is listed with its index (1-based), `From:`, `To:` times (`HH:MM:SS`), and `Missed:` frame count.
11. If there are no gaps, the gap section is omitted (only the `Gaps: 0` line appears).
12. The file is written asynchronously using `fs.promises.writeFile`.
13. If the write fails, the error is logged to the console but does not prevent the session from being marked as `'stopped'`.

## Gotchas & Edge Cases

- `session.startTime` is a `Date` object; the end time must be captured as `new Date()` at the moment `stopSession()` is called, before any async operations.
- Time formatting must use local time methods (`getHours()`, `getMinutes()`, `getSeconds()`) — not UTC — to match the wall-clock times shown in the UI.
- Duration calculation: `endTime - startTime` yields milliseconds; divide to get total seconds, then extract hours, minutes, and seconds with modulo arithmetic.
- `session.outputDir` could be an empty string if `startSession()` never completed successfully; guard against writing to an invalid path.
- The log file must use Unix line endings (`\n`) for consistency on the WSL environment.
- Gap `from` and `to` fields in `session.gaps` are stored as ISO strings (per T-15); they must be parsed back to `Date` objects to extract local `HH:MM:SS` for the log.
- The session log is a summary only — it does not need to list individual frame timestamps.
