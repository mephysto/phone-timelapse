# Review — T-08 · Frame Capture and Send
Status: PASS

## Acceptance Criteria Results

| # | Criteria (condensed) | Result | Notes |
|---|----------------------|--------|-------|
| 1 | Listens for `capture` Socket.IO event | ✅ PASS | `const socket = io()` is at line 135; `socket.on('capture', …)` follows at line 146. Declaration order is correct — no TDZ issue. |
| 2 | Draws `<video>` frame onto hidden `<canvas>` at natural resolution | ✅ PASS | `canvas.width = video.videoWidth; canvas.height = video.videoHeight; ctx.drawImage(video, 0, 0)` — correct. |
| 3 | `canvas.toBlob()` called with MIME type matching `format` payload | ✅ PASS | `mimeType` derived from `format` and passed to `canvas.toBlob()`. |
| 4 | Blob converted to `ArrayBuffer` and emitted as `socket.emit('frame', arrayBuffer)` | ✅ PASS | `reader.result` (an `ArrayBuffer`) is emitted via `socket.emit('frame', reader.result)`. |
| 5 | Server receives non-empty `ArrayBuffer` on `frame` event | ⚠️ MANUAL | Requires running server and physical device. Deferred to T-30. |
| 6 | Guard: `if (video.readyState < 2) return` present before drawing | ✅ PASS | Present at line 148 inside the `capture` handler. |
| 7 | Canvas is never visible to the user | ✅ PASS | `<canvas id="capture-canvas" style="display:none;">` — hidden via inline style. |
| 8 | Format for `toBlob()` comes from `capture` payload `{ format }`, not hardcoded | ✅ PASS | `const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'` — driven by payload. |
| 9 | Blob-to-ArrayBuffer uses `FileReader.readAsArrayBuffer()` (iOS 11+ compat) | ✅ PASS | `new FileReader()`, `reader.onload`, `reader.readAsArrayBuffer(blob)` all present. |
| 10 | JPEG: `canvas.toBlob(cb, 'image/jpeg', 0.85)` — quality 0.85 | ✅ PASS | `quality = 0.85` when `format === 'jpg'`; passed as third arg to `toBlob`. |
| 11 | PNG: `canvas.toBlob(cb, 'image/png')` — no quality parameter | ✅ PASS | When format is not `'jpg'`, quality is `undefined` and the else-branch calls `canvas.toBlob(onBlob, mimeType)` with no third argument. |

## Verdict

PASS

## Issues Found

None. The previously reported TDZ ReferenceError has been resolved: `const socket = io()` now appears at line 135, and all `socket.on(…)` calls follow it (lines 137, 142, 146). AC 5 remains deferred to manual integration testing (T-30) as it requires a running server and physical device.

## Recommendation

SHIP

---

_Result key: ✅ PASS · ❌ FAIL · ⚠️ MANUAL (requires physical device or environment — deferred to T-30)_
