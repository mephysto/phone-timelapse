## User Story

Given the dashboard operator has set `scheduledStart` to a future time (e.g. "06:00"),
When the server clock reaches that time,
Then the session starts automatically, exactly as if the operator had pressed the Start button manually.

## Acceptance Criteria

1. The server polls the current local time at least once per second and compares it to `session.scheduledStart` (format `"HH:MM"`).
2. Auto-start fires only when `session.status` is `"idle"` — it does not fire if a session is already `"running"` or `"stopped"`.
3. Auto-start fires exactly once per scheduled time; it does not restart the session if the session is later stopped and the clock is still within the same minute.
4. Setting `scheduledStart` before the server process starts is honoured — the check runs from server boot.
5. Setting `scheduledStart` while the server is already running (via the dashboard) is honoured — no restart of the server is required.
6. When auto-start fires, the server emits a `session-started` Socket.IO event with the full session state, identical to a manual start.
7. If `scheduledStart` is `null` or an empty string, no auto-start logic runs.
8. The scheduled start time is compared using the server's local time zone (not UTC), consistent with how the dashboard clock is displayed.
9. The auto-start check does not drift: if the polling interval is 1 second, the session starts within 1 second of the target minute.

10. If the scheduled start time has already passed for the current day (e.g., set to 06:00 but it is currently 09:00), the auto-start waits until tomorrow at 06:00 — it does not start immediately.
11. The server broadcasts the next scheduled start timestamp (as an ISO string or Unix ms) in the `status-update` payload so the dashboard can display a human-readable countdown.

## Gotchas & Edge Cases

- Clock rollover: if `scheduledStart` is "00:00", the check must fire at midnight without treating it as falsy.
- If the server boots after the scheduled time has already passed for the current day, it must NOT retroactively start the session — wait until tomorrow.
- Daylight saving time transitions: the server clock may skip or repeat a minute; the comparison must be idempotent within a minute.
- `scheduledStart` set to the current minute while the server is running: should start immediately (within the polling interval), not wait until tomorrow.
- Concurrent start: if the operator manually starts the session at the exact same second as the scheduled start fires, the check must see `status !== 'idle'` and skip gracefully.
- The polling mechanism (e.g. `setInterval`) must be cleared or restarted cleanly if `scheduledStart` is updated at runtime to avoid duplicate timers.
