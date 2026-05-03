## User Story

Given a session is running and frames are being saved,
When each frame is written to disk,
Then the dashboard stats panel updates to show the cumulative actual bytes written, formatted in a human-readable size (e.g. "1.2 GB").

## Acceptance Criteria

1. The server includes the actual file size (in bytes) of the saved frame in the `frame-saved` Socket.IO event payload.
2. The dashboard accumulates byte counts by listening to `frame-saved` events and adding each frame's size to a running total.
3. The running total resets to zero when a new session starts (i.e. on receipt of `session-started`).
4. The running total is displayed in a dedicated "Disk usage" field in the stats panel on the dashboard.
5. The displayed value uses human-readable formatting with one decimal place: bytes → B, kilobytes → KB, megabytes → MB, gigabytes → GB (1 KB = 1024 bytes).
6. The display updates immediately after each `frame-saved` event — no polling or debounce is required.
7. If a frame write fails, no size is added to the total (only successfully written frames count).
8. The server obtains the actual file size from the file system after writing (e.g. from `fs.stat` or the known byte length of the buffer written), not from an estimate.
9. The "Disk usage" field is visible in the stats panel even when the value is zero (shows "0 B" at the start of a session).
10. The cumulative total is not persisted across server restarts — it is derived from the current session's `frame-saved` events only.

## Gotchas & Edge Cases

- Frame sizes vary between captures (compression differences for JPG, content changes for PNG); the counter must sum actual sizes, not use a fixed-per-frame estimate.
- If the dashboard page is reloaded mid-session, the running total resets to zero because past `frame-saved` events are not replayed. This is acceptable — document it in the UI as "since page load" or make the server include `session.totalBytes` in the session state broadcast (preferred, see design).
- Integer overflow is not a concern in JavaScript for realistic session sizes (even 10,000 × 5 MB = ~47 GB is well within `Number.MAX_SAFE_INTEGER`).
- The `frame-saved` payload must not include the raw image buffer — only metadata including the size in bytes.
- On Windows/WSL, `fs.stat().size` returns the correct byte count; no platform-specific handling needed.
