## User Story

Given the phone's camera feed is active after tapping "Arm Camera",
When the timelapse session runs for an extended period,
Then the phone's screen does not dim or lock due to inactivity.

## Acceptance Criteria

1. On the same "Arm Camera" tap that starts the camera stream, a NoSleep video element is started.
2. The NoSleep video is a 2×2 pixel, silent, looping MP4 file (`public/nosleep.mp4`). (H.264 requires even-numbered dimensions — 1×1 is invalid.)
3. `nosleep.mp4` is a valid, minimal MP4 file that can be played by iOS Safari.
4. The NoSleep `<video>` element has `autoplay`, `muted`, `loop`, and `playsinline` attributes.
5. The NoSleep `<video>` element is visually invisible to the user (e.g., `width: 1px; height: 1px; position: absolute; opacity: 0` or similar).
6. The NoSleep video is started by calling `.play()` within the existing click event handler — the same user gesture as camera access — not in a separate event listener.
7. `nosleep.mp4` is served from `public/nosleep.mp4` by `express.static`.
8. After 5 minutes of the phone being armed, the screen has not dimmed or locked (manual test).
9. If `.play()` on the NoSleep video rejects (e.g., due to a codec issue), the error is caught and logged to the console — it must not prevent the camera from working.
10. No external libraries (e.g., NoSleep.js npm package) are used — the implementation is a plain `<video>` element.

## Gotchas & Edge Cases

- The NoSleep trick works because iOS considers a playing video element a reason to keep the display on, even if the video is invisible. This is the only reliable cross-browser approach on iOS Safari — the Web Screen Wake Lock API (`navigator.wakeLock`) is not supported on iOS Safari as of 2025.
- The `.play()` call for the NoSleep video must occur within the same synchronous call stack as the user gesture (the click event). If it is called after an `await` (e.g., after `getUserMedia` resolves), iOS Safari may refuse it. Call `nosleepVideo.play()` before the first `await` in `armCamera()`, or ensure it is called synchronously in the click handler.
- The MP4 file must use a codec supported by iOS Safari. H.264 Baseline Profile in an MP4 container is universally supported. A 1-frame or very short looping video is sufficient.
- The MP4 must be a real, playable file — an empty file or a renamed `.txt` will cause a media error, and the trick will not work.
- Including `nosleep.mp4` in the repository means it is a binary file in git. Keep it as small as possible (a few kilobytes). Document its origin or generation method so it can be recreated if lost.
- On desktop browsers, the NoSleep video may cause a brief flicker or an unmute icon — this is cosmetic and acceptable, as the phone is the target device.
- `loop` attribute ensures the video restarts when it ends (a 1-frame video ends almost immediately). Verify looping is working if testing shows the screen still dims after a few seconds.
