## User Story

Given a session is running and the dashboard is open,
When the server saves a new frame and emits `frame-saved`,
Then the Live Preview panel updates its thumbnail to show the latest captured image within one second.

## Acceptance Criteria

1. The Live Preview panel contains an `<img>` element with `id="latest-frame"`.
2. On page load, `src` is set to `/latest-frame?t=0` (or left empty if no frame exists yet — the server returns 404 for an empty session, which the browser displays as a broken image; this is acceptable).
3. On each `frame-saved` event, the `src` is updated to `/latest-frame?t=[timestamp]`, where `[timestamp]` is the `timestamp` value from the event payload.
4. The `?t=` query parameter is the sole mechanism for cache-busting — no `Cache-Control` headers or other tricks are needed.
5. Each update triggers the browser to fetch the latest frame from the server (confirmed by a Network tab request in DevTools).
6. `GET /latest-frame` returns the most recently saved frame as an image (`Content-Type: image/jpeg` or `image/png` depending on format).
7. The image element has `alt="Latest captured frame"`.
8. The image is constrained to the panel width via CSS (`max-width: 100%`) so it does not overflow on any viewport.
9. On receiving `status-update` when a session is already running and `session.lastCaptureAt` is non-null, the thumbnail is initialised with `/latest-frame?t=[lastCaptureAt timestamp]`.
10. When no frame has been saved (fresh session), the panel shows a placeholder state (e.g. grey background, text "No frames yet") rather than a broken image icon.

## Gotchas & Edge Cases

- Using `Date.now()` as the cache-buster instead of the server-provided `timestamp` is tempting but wrong — it introduces a race condition if two events arrive rapidly, as the client's clock differs from the server's.
- The `frame-saved` payload's `timestamp` field should be used directly as the `t` value to ensure the cache-buster is deterministic and matches the saved file's time.
- `GET /latest-frame` must read the current value of the in-memory "latest frame path" variable on every request, not cache the file handle at server startup.
- If the session format changes between PNG and JPG (settings update before a session), the endpoint must serve the correct content type for the currently stored file.
- The `<img>` `src` update causes a brief flicker as the new image loads — this is acceptable for a local-network timelapse tool; no crossfade is required.
- Ensure the server returns a proper 404 (not a 500) when no frame has been saved yet, so the browser's broken-image state is predictable.
