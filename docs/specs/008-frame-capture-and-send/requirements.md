## User Story

Given the phone page is open and connected to the server,
When the server emits a `capture` event,
Then the phone captures a frame from the video stream and sends the raw image bytes back to the server as a binary `frame` event.

## Acceptance Criteria

1. The phone page listens for the `capture` Socket.IO event.
2. On receiving `capture`, the phone draws the current `<video>` frame onto a hidden `<canvas>` element at the video's natural resolution (`videoWidth` × `videoHeight`).
3. `canvas.toBlob()` is called with the MIME type matching the `format` field from the `capture` payload (`image/png` or `image/jpeg`).
4. The resulting `Blob` is converted to an `ArrayBuffer` and emitted to the server via `socket.emit('frame', arrayBuffer)`.
5. The server receives data on the `frame` event that is a non-empty `ArrayBuffer`.
6. The capture does not occur if the video stream is not yet playing (i.e. `video.readyState < 2`).
7. The canvas element is not visible to the user at any point.
8. The format used for `toBlob()` is determined by the `format` field in the `capture` event payload, not a hardcoded value.

9. The Blob-to-ArrayBuffer conversion uses `FileReader.readAsArrayBuffer()` for iOS 11+ compatibility. `blob.arrayBuffer()` may be used as a fast path if available, with FileReader as the fallback.
10. When format is `'jpg'`, `canvas.toBlob()` is called with quality `0.85`: `canvas.toBlob(cb, 'image/jpeg', 0.85)`.
11. When format is `'png'`, `canvas.toBlob()` is called with no quality parameter (PNG is always lossless): `canvas.toBlob(cb, 'image/png')`.

## Gotchas & Edge Cases

- `video.readyState` may be less than `HAVE_CURRENT_DATA` (2) if the camera hasn't fully started; the capture must guard against drawing a blank frame.
- `canvas.toBlob()` is asynchronous — the emit must happen inside the callback, not after it.
- iOS Safari may call the `toBlob()` callback with `null` if the canvas is tainted or the operation fails; this case must be handled gracefully (log the error, do not emit).
- The canvas dimensions must be set to `video.videoWidth` and `video.videoHeight` each time a capture fires, in case the stream resolution changes after initialisation.
- Large frames (e.g. 1920×1080 PNG) may take a moment to encode; rapid back-to-back `capture` events should not queue multiple concurrent encodes — the previous one should be allowed to complete or be skipped.
- `Blob.arrayBuffer()` is the modern API; older iOS Safari versions may require `FileReader` as a fallback.
