## User Story

Given the phone has loaded `phone.html` and the "Arm Camera" button is visible,
When the user taps "Arm Camera",
Then the rear camera feed appears full-screen and the button is hidden.

## Acceptance Criteria

1. Tapping "Arm Camera" calls `navigator.mediaDevices.getUserMedia` with `{ video: { facingMode: 'environment' }, audio: false }`.
2. The returned media stream is assigned to a `<video>` element's `srcObject` and played back via `video.play()`.
3. The `<video>` element covers the full viewport (width: 100%, height: 100%, object-fit: cover).
4. The camera feed shows the rear-facing camera, not the front-facing camera.
5. The `<video>` element is muted (`muted` attribute) and has `autoplay` and `playsinline` attributes to comply with iOS Safari's autoplay policy.
6. After the stream starts, the "Arm Camera" button is hidden.
7. If the user denies camera permission, the button remains visible and an error message is shown to the user (inside `#status` or an alert — precise UX is a stylistic choice, but the error must be visible).
8. If `getUserMedia` is not available (the page is not served over HTTPS), the error message reads: "Camera not available — page must be loaded over HTTPS. See the README for mkcert setup instructions."
9. The `<video>` element exists in the HTML markup before the button tap — it is hidden initially and made visible when the stream starts.
10. No camera access is requested before the user taps the button — the `getUserMedia` call must be inside the tap event handler.

11. When the phone is held in portrait orientation, a full-viewport overlay (`#portrait-overlay`) blocks the camera feed and displays a rotation prompt. This is controlled by `@media (orientation: portrait)` CSS — no JS.
12. The `#portrait-overlay` message reads: "↺ Rotate your phone to landscape" and is styled to be clearly visible (large text, centred).

## Gotchas & Edge Cases

- iOS Safari requires `getUserMedia` to be called within a user gesture (touch/click event). Do not call it on `DOMContentLoaded` or `window.onload`.
- `playsinline` is mandatory on iOS Safari to prevent the video from entering fullscreen mode automatically and to keep it inline in the page layout.
- `getUserMedia` only works on HTTPS or `localhost`. On a local IP (`192.168.x.x`) without HTTPS, iOS Safari 15+ will deny it. This is the single most significant risk for the whole project. Mitigation options: (a) self-signed TLS cert with `mkcert`, (b) iOS Settings → Safari → Advanced → Experimental Features → "Insecure origins treated as secure" (not user-facing), (c) use a reverse proxy with a valid cert. Document the chosen approach.
- `facingMode: 'environment'` is a preference, not a constraint. If the device has only one camera, it will be used regardless. This is fine.
- The video element must have `muted` as an HTML attribute (not just set via JS) for iOS autoplay to work reliably.
- `video.play()` returns a Promise on modern browsers — attach a `.catch()` to handle autoplay errors without an unhandled rejection.
- If the user revokes camera permission after the stream starts, the track will end. Handle `track.onended` if robust recovery is needed (out of scope for this task, but note it as a future improvement).
- `getUserMedia` with `facingMode: 'environment'` on a MacBook or desktop will use the built-in webcam (front-facing). This is expected behaviour in a dev/testing context.
