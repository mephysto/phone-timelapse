## User Story

Given a session is running and `scheduledEnd` has been set to a future time,
When the server clock reaches that time,
Then the session stops automatically, the session log is written, and a `session-ended` event is emitted — exactly as if the operator had pressed Stop manually.

## Acceptance Criteria

1. The server's schedule-polling loop (established in T-25) also checks `session.scheduledEnd` on each tick.
2. Auto-stop fires only when `session.status` is `"running"`.
3. Auto-stop fires exactly once per scheduled time; it does not repeatedly attempt to stop an already-stopped session.
4. When auto-stop fires, the server calls the same session-stop routine used for manual stops, including writing `session.log` and emitting `session-ended` with the full session state.
5. Setting `scheduledEnd` before the session starts is honoured — the check begins running as soon as the session becomes `"running"`.
6. Setting `scheduledEnd` while a session is already running is honoured without restarting the server.
7. If `scheduledEnd` is `null` or an empty string, no auto-stop logic runs.
8. `scheduledEnd` is compared using the server's local time zone, consistent with T-25.
9. If `scheduledEnd` is earlier than or equal to `scheduledStart`, the server still auto-stops at `scheduledEnd` (even if the session started late); it does not validate the ordering.
10. After auto-stop, the session status transitions to `"stopped"` and `session.scheduledEnd` is preserved in the emitted state so the dashboard can display it.

## Gotchas & Edge Cases

- `scheduledEnd` set to "00:00" must work (midnight); must not be treated as falsy.
- If the operator manually stops the session before `scheduledEnd` is reached, the auto-stop check must see `status !== 'running'` and skip silently.
- `scheduledEnd` set to the same time as `scheduledStart`: the auto-stop fires in the same minute as auto-start, which means the session may run for less than the capture interval — this is valid and must not crash.
- If no frames were captured before auto-stop fires (e.g. phone not connected), the session log must still be written with `frameCount: 0`.
- The `_scheduledEndFired` guard flag (analogous to T-25's `_scheduledStartFired`) must be reset when `scheduledEnd` is updated at runtime.
- Do not use wall-clock duration to detect the end time — always compare the current `HH:MM` string; this avoids drift over long sessions.
