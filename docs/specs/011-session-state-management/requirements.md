## User Story

Given the server is running,
When the dashboard triggers a session start or stop,
Then the server transitions the session state object correctly, preventing invalid transitions such as starting an already-running session.

## Acceptance Criteria

1. The server defines a session state object matching the schema: `status`, `startTime`, `scheduledStart`, `scheduledEnd`, `interval`, `format`, `outputDir`, `frameCount`, `expectedFrames`, `gaps`, `lastCaptureAt`.
2. Initial state has `status: 'idle'`, `frameCount: 0`, `expectedFrames: 0`, `gaps: []`, and all timestamps set to `null`.
3. The default value for `interval` is 30 (seconds).
4. The default value for `format` is `'jpg'`.
5. `startSession()` sets `status` to `'running'` and records `startTime` as the current date.
6. `startSession()` returns an error (or throws) if `status` is already `'running'`.
7. `stopSession()` sets `status` to `'stopped'`.
8. `stopSession()` is a no-op (or returns an error) if `status` is `'idle'` (session never started).
9. After `stopSession()`, `startSession()` can be called again to begin a new session, resetting `frameCount`, `gaps`, and `lastCaptureAt` to their initial values.
10. The session state object is a single shared object on the server — not recreated per request.

## Gotchas & Edge Cases

- Calling `startSession()` twice without an intervening `stopSession()` must not corrupt the state or spawn duplicate schedulers.
- `stopSession()` while `status` is `'idle'` (never started) should be handled gracefully; it is distinct from `status: 'stopped'` (ran and ended).
- When a new session starts after a previous one, `outputDir` and `startTime` must be reset to reflect the new session, not the previous one.
- `expectedFrames` is computed from the interval and session duration; it cannot be known at `startSession()` time and is updated over the course of the session (or calculated at stop time).
- The `scheduledStart` and `scheduledEnd` fields are optional; they may be `null` for manual-only sessions.
- State mutation must be synchronous to avoid race conditions — no async operations should touch the state object without appropriate guards.
