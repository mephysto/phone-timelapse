## User Story

Given a session has been started and a phone is connected,
When `startSession()` is called,
Then the server begins emitting `capture` events to the phone socket at the configured interval, and stops doing so when `stopSession()` is called.

## Acceptance Criteria

1. When `startSession()` is called, a repeating timer starts that emits a `capture` event to the connected phone socket every `session.interval` seconds.
2. The `capture` event payload includes the `format` field from the session state.
3. `session.expectedFrames` is incremented by 1 each time a `capture` event is emitted.
4. When `stopSession()` is called, the repeating timer is cleared and no further `capture` events are emitted.
5. If no phone socket is connected when a `capture` event fires, the event is silently skipped (no error thrown).
6. If `startSession()` is called while a scheduler is already running, a second scheduler is not started.
7. The first `capture` event fires after one full interval, not immediately at session start.

## Gotchas & Edge Cases

- The phone socket reference must be tracked server-side; if the phone reconnects, the scheduler must emit to the new socket, not the old (stale) one.
- `setInterval` drift over many hours can cause slight timing inaccuracies; this is acceptable for timelapse use but the interval should not compound errors by recalculating from wall-clock time on each tick.
- Clearing an interval that has already been cleared (`clearInterval(null)` or with an undefined ID) must not throw; store the timer ID and null it out after clearing.
- `session.expectedFrames` must only increment when a `capture` is actually emitted to a connected phone, not on every tick — or it is acceptable to increment on every tick regardless of phone connection (decision: increment on every tick to represent what should have been captured).
- The scheduler must use the interval value that was active at session start; live changes to `session.interval` do not affect the running scheduler.
