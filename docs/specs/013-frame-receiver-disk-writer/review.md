# Review — T-13 · Frame Receiver and Disk Writer
Status: PASS

## Acceptance Criteria Results

| # | Criteria (condensed) | Result | Notes |
|---|----------------------|--------|-------|
| 1 | Server listens for `frame` event on phone socket | PASS | `socket.on('frame', ...)` registered inside the `referer.endsWith('/phone')` branch (server.js line 137) |
| 2 | Payload treated as raw binary — no image-library processing | PASS | `data` written directly via `fs.promises.writeFile`; no decode/encode step |
| 3 | Path is `<outputDir>/frame_<NNNN>.<ext>`; frameNum reserved before async write | PASS | `frameNum = session.frameCount + 1` computed before `await writeFile` (line 140); `padStart(4, '0')` applied (line 142) |
| 4 | Extension matches `session.format` | PASS | Template literal uses `session.format` directly (line 143) |
| 5 | File written with `fs.writeFile` / `fs.promises.writeFile` | PASS | `fs.promises.writeFile` used (line 146) |
| 6 | `session.frameCount` incremented after successful write | PASS | `session.frameCount = frameNum` inside `try`, after `await writeFile` (line 147) |
| 7 | `session.lastCaptureAt` set to current date after successful write | PASS | `session.lastCaptureAt = new Date(timestamp)` inside `try` (line 148) |
| 8 | `frame-ack` emitted to phone socket with `{ frameNum, timestamp }` | PASS | `socket.emit('frame-ack', { frameNum, timestamp })` (line 151) |
| 9 | `frame-saved` emitted to dashboard room with `{ frameNum, timestamp, path }` | PASS | `io.to('dashboard').emit('frame-saved', ...)` (line 152); non-phone sockets join `'dashboard'` on connect (line 166) |
| 10 | Latest frame tracked as absolute path | PASS | `latestFramePath = filePath` where `filePath` is an absolute path via `path.join` (line 149) |
| 11 | On write failure: error logged, no frameCount increment, no frame-ack | PASS | `catch` block calls `console.error` only; `session.frameCount` and `socket.emit('frame-ack', ...)` are inside `try` and never reached on failure |
| 12 | Guard: ignore `frame` events when `session.status !== 'running'` | PASS | `if (session.status !== 'running') return;` is the first statement in the handler (line 138) |

## Verdict

PASS

## Issues Found

None. All 12 acceptance criteria are satisfied. Two implementation details worth noting (both are correct):

- The `timestamp` ISO string is generated once before the `try` block and reused in both `frame-ack` and `frame-saved`, ensuring the two events carry a consistent timestamp as specified in the requirements gotchas.
- `frameNum` is reserved (`session.frameCount + 1`) before the async write, preventing collision if two frames arrive concurrently, but `session.frameCount` is only committed to `frameNum` on success — correctly satisfying both AC 3 (reservation) and AC 6/11 (only update on success).

The dashboard socket branch also wires `start-session`, `stop-session`, and `update-settings` handlers. These are early wiring for T-17–T-19 and are outside the scope of T-13's ACs; they do not conflict with any T-13 requirement.

## Recommendation

SHIP

---

_Result key: PASS · FAIL · MANUAL (requires physical device or environment — deferred to T-30)_
