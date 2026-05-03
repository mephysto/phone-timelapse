## UI States

The dashboard shows a "Scheduled Start" time input field. UI states:

- **Unset**: field is empty; no schedule badge visible.
- **Scheduled / waiting**: field shows a time value; a status badge reads "Starts at HH:MM" in a neutral colour.
- **Triggered**: the session transitions to running; the badge disappears and the normal running state is displayed (elapsed timer, frame count, etc.).

The input field remains editable while a session is idle. It becomes read-only (or visually disabled) while a session is running, consistent with other settings fields.

## Visual Assets

None.

## State to Manage

Server-side (`session` object):
- `scheduledStart: string | null` — the target time in `"HH:MM"` 24-hour format; `null` means no schedule.
- `_scheduledStartFired: boolean` (internal, not serialised to clients) — flag set to `true` once auto-start fires for the current clock minute, reset to `false` when the minute changes or `scheduledStart` is updated. Prevents firing more than once per minute.

The polling loop reads `session.status`, `session.scheduledStart`, and the current local time on each tick. It has no additional state of its own.

## Interfaces

**Socket.IO events — received by server:**
```
'set-schedule'  { scheduledStart: string | null, scheduledEnd: string | null }
```
Updates `session.scheduledStart` (and `scheduledEnd`) and resets the `_scheduledStartFired` flag.

**Socket.IO events — emitted by server:**
```
'session-started'  { session: SessionState }
```
Emitted when auto-start fires. Identical payload to a manual start.

**Internal function:**
```js
function startPollingSchedule() // Sets up setInterval at 1-second cadence
function checkScheduledStart()  // Called each tick; reads local HH:MM and compares to session.scheduledStart
function getLocalHHMM(): string // Returns current local time as "HH:MM" zero-padded
```
