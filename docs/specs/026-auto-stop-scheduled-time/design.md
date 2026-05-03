## UI States

The dashboard shows a "Scheduled End" time input field alongside the "Scheduled Start" field (introduced in T-25). UI states:

- **Unset**: field is empty; no badge visible.
- **Scheduled / session running**: field shows a time value; a status badge reads "Stops at HH:MM" in a warning/amber colour to signal the session will auto-terminate.
- **Triggered**: session transitions to `"stopped"`; the normal stopped state is displayed (total frames, duration, session log path). The "Stops at HH:MM" badge disappears.

The input field is editable while idle or running (the operator may adjust the end time mid-session). It becomes read-only once the session is stopped.

## Visual Assets

None.

## State to Manage

Server-side (`session` object):
- `scheduledEnd: string | null` — target stop time in `"HH:MM"` 24-hour format; `null` means no scheduled stop.
- `_scheduledEndFired: boolean` (internal, not broadcast) — set to `true` once auto-stop fires for the current minute; reset when the minute changes or `scheduledEnd` is updated.

The same polling loop from T-25 handles both `scheduledStart` and `scheduledEnd` checks on each tick.

## Interfaces

**Socket.IO events — received by server:**
```
'set-schedule'  { scheduledStart: string | null, scheduledEnd: string | null }
```
Updates `session.scheduledEnd` and resets `_scheduledEndFired = false`. Same event as T-25 — both fields are sent together.

**Socket.IO events — emitted by server:**
```
'session-ended'  { session: SessionState }
```
Emitted when auto-stop fires. Identical payload to a manual stop. `session.status` is `"stopped"`.

**Internal function:**
```js
function checkScheduledEnd()   // Called each tick alongside checkScheduledStart()
                               // Reads session.scheduledEnd and session.status
```

The existing manual-stop handler (e.g. `stopSession()`) must be extracted into a reusable function if it is currently inline, so both the manual stop path and `checkScheduledEnd()` call the same code.
