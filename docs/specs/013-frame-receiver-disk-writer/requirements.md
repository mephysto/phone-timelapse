## User Story

Given a session is running and the phone sends a frame,
When the server receives a `frame` event containing raw image bytes,
Then the server writes the image to the correct output path, updates the session frame count, confirms receipt to the phone, and notifies the dashboard.

## Acceptance Criteria

1. The server listens for the `frame` Socket.IO event on the phone socket.
2. The received payload is treated as raw binary (`ArrayBuffer` or `Buffer`) — no image library processing occurs.
3. The output file path is constructed as `<session.outputDir>/frame_<NNNN>.<ext>`, where `NNNN` is the current `session.frameCount + 1` zero-padded to 4 digits.
4. The file extension matches `session.format` (`'png'` → `.png`, `'jpg'` → `.jpg`).
5. The file is written to disk using `fs.writeFile` (or `fs.promises.writeFile`).
6. After a successful write, `session.frameCount` is incremented by 1.
7. After a successful write, `session.lastCaptureAt` is set to the current date.
8. After a successful write, a `frame-ack` event is emitted to the phone socket with `{ frameNum, timestamp }`.
9. After a successful write, a `frame-saved` event is emitted to the dashboard socket(s) with `{ frameNum, timestamp, path }`.
10. The path stored for tracking the latest frame is the absolute path of the most recently written file.
11. If `fs.writeFile` fails, the error is logged; `frameCount` is not incremented and no `frame-ack` is sent.
12. `frame` events received while `session.status` is not `'running'` are ignored.

## Gotchas & Edge Cases

- Socket.IO delivers binary data as a `Buffer` in Node.js by default; `fs.writeFile` accepts `Buffer` directly — no conversion to `ArrayBuffer` is needed on the server.
- Zero-padding must use 4 digits: frame 1 → `frame_0001`, frame 10 → `frame_0010`, frame 1000 → `frame_1000`.
- If two `frame` events arrive before the first write completes, frame numbers could collide. The frame number should be reserved (counter incremented) before the async write begins, not after.
- The `outputDir` must already exist before writing (created by T-14); this module does not create directories.
- The dashboard may not have a socket connected; emitting to a room or namespace rather than a specific socket handles zero-dashboard cases gracefully.
- `timestamp` in `frame-ack` and `frame-saved` should be a consistent ISO 8601 string generated once per frame and reused in both events.
