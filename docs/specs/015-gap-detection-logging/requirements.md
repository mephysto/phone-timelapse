## User Story

Given a session is running and the phone disconnects from the network,
When the phone socket disconnects and later reconnects,
Then the server records the gap (start time, end time, missed frame count), updates the session state, and notifies the dashboard of both events.

## Acceptance Criteria

1. When the phone socket disconnects during an active session, the server records the current time as the gap start.
2. When the phone socket disconnects, the server emits a `gap-started` event to the dashboard with `{ at: <ISO timestamp> }`.
3. When the phone socket reconnects after a gap, the server calculates the number of missed frames based on the gap duration and the session interval.
4. Missed frames are calculated as `Math.floor(gapDurationSeconds / session.interval)`.
5. When the phone socket reconnects after a gap, the server pushes `{ from, to, missed }` to `session.gaps[]`.
6. When the phone socket reconnects after a gap, the server emits a `gap-ended` event to the dashboard with `{ from, to, missed }`.
7. A gap is only recorded if the session `status` is `'running'` at the time of disconnect; a phone disconnect after `stopSession()` does not create a gap entry.
8. A gap is only closed (entry pushed to `session.gaps`) if `gapStart` is non-null; a phone connect event at session start does not create a spurious gap entry.
9. The `from` and `to` fields in the gap object and event payload are ISO 8601 strings.

## Gotchas & Edge Cases

- The phone socket reference changes on each reconnect (new socket object); the `frame` listener from T-13 and the `frame-ack` from T-08 must be re-attached to the new socket.
- `gapStart` must be reset to `null` after a gap is closed to prevent duplicate gap entries on the next disconnect.
- If the session ends while a gap is open (phone never reconnected), the gap remains open-ended; `stopSession()` should close any open gap using the stop time.
- Missed frames computed during a gap do not affect `session.frameCount` (which only counts received frames), but they are reflected in `session.gaps[].missed`.
- `expectedFrames` is incremented by the scheduler regardless of phone connectivity (each tick counts as an expected frame), so gap information supplements rather than replaces `expectedFrames`.
- The server must not crash if a phone disconnect event fires with no active gap tracking variable.
