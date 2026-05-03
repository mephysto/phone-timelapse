## User Story

Given the server is running and the phone has scanned the QR code,
When the phone opens `http://[LOCAL-IP]:3000/phone` in Safari,
Then a full-viewport page loads with an "Arm Camera" button visible, and the page establishes a Socket.IO connection to the server without errors.

## Acceptance Criteria

1. `GET /phone` returns `public/phone.html` with HTTP 200.
2. The page fills the full viewport — no scrollbars, no white margins around the edges.
3. An "Arm Camera" button is visible and centred (horizontally and vertically) in the viewport on initial load.
4. A status overlay element exists in the DOM but is hidden (`display: none` or `visibility: hidden`) on initial load.
5. The page loads the Socket.IO client script from `/socket.io/socket.io.js` (served automatically by the server).
6. On load, the page connects to the Socket.IO server and the server logs "Client connected" for the phone's socket.
7. The page does not throw any JavaScript errors in Safari's Web Inspector console on load.
8. The page is mobile-optimised: `<meta name="viewport" content="width=device-width, initial-scale=1">` is present.
9. Safari's default tap highlight and text selection are suppressed on the button (the camera feed will eventually fill the screen behind it).
10. The page has no external network requests — all assets are served from the local server.

11. When the Socket.IO connection is established but the session status is `'idle'`, the status overlay is visible and shows "Waiting for session to start…".
12. A portrait-mode warning overlay element (`#portrait-overlay`) exists in the DOM, hidden by default, and is shown/hidden by a CSS `@media (orientation: portrait)` rule — no JavaScript required.

## Gotchas & Edge Cases

- iOS Safari adds a default margin/padding to `body`. Reset with `margin: 0; padding: 0; box-sizing: border-box` or a minimal CSS reset.
- The Socket.IO client URL must be `/socket.io/socket.io.js` exactly — this path is served automatically by the `socket.io` package via the HTTP server. Do not copy the file into `public/`.
- Safari on iOS may add a safe-area inset at the bottom (home indicator area). Use `padding-bottom: env(safe-area-inset-bottom)` if the button appears clipped on devices with no home button.
- The Socket.IO `io()` call (no arguments) connects to the page's origin by default — this is correct; do not hardcode the server URL.
- If `phone.html` is not found at `public/phone.html`, Express static serving will return 404 — the file must be in `public/`, not at the root.
- The status overlay should have an `id` so JavaScript can reference it without querying by class (faster and less error-prone when the file grows).
