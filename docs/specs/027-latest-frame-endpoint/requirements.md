## User Story

Given a session is running and at least one frame has been saved to disk,
When a browser (or any HTTP client) sends `GET /latest-frame`,
Then the server responds with the most recently saved frame image as a binary image file with the correct MIME type.

## Acceptance Criteria

1. `GET /latest-frame` returns HTTP 200 with the body set to the binary content of the most recently saved frame file.
2. The `Content-Type` header is `image/png` when the session format is `"png"` and `image/jpeg` when the format is `"jpg"`.
3. `GET /latest-frame` returns HTTP 404 with a plain-text body (`"No frames saved yet"`) if no frame has been saved in the current or most recent session.
4. The server resolves "most recent frame" by tracking the file path of the last successfully written frame; it does not re-scan the output directory on every request.
5. The tracked path is updated immediately after each frame is confirmed written to disk (synchronously or in the `fs.writeFile` callback/promise resolution).
6. The endpoint is accessible from the phone's browser as well as the dashboard browser (same-network CORS is not an issue for `<img>` tags, but the response must not set restrictive CORS headers that block it).
7. The endpoint serves the file directly from disk, not from an in-memory buffer, so large PNG files do not bloat server RAM.
8. After a session stops and a new session starts, `/latest-frame` serves the first frame of the new session as soon as one is saved.
9. Between sessions (after a stop, before the next start), `/latest-frame` continues to return the last frame of the previous session — it does not reset to 404 on stop.

## Gotchas & Edge Cases

- Race condition: a frame write may still be in progress when the endpoint is hit. The tracked path should only be updated after the write fully completes.
- If the output file has been deleted from disk after being saved (e.g. user manually removed it), `res.sendFile` will return an error; handle this with a 404 rather than a 500.
- File path must be absolute when passed to `res.sendFile`, or the `root` option must be set — relative paths cause Express errors.
- Format can change between sessions (PNG one day, JPG the next); the endpoint must read the format from the tracked path's extension, not from `session.format`, to handle the between-session case correctly.
- The endpoint must not require a running session to function — it is useful for testing connectivity before a session starts (will 404 in that case, which is correct).
