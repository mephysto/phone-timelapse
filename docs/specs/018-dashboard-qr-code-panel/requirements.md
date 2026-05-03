## User Story

Given the dashboard is open in a browser on the PC,
When the user looks at the QR Code panel,
Then they see a scannable QR code image, a label, and a note — and scanning the QR code with the phone's camera opens the phone capture page.

## Acceptance Criteria

1. The QR Code panel contains an `<img>` element with `src="/qr"`.
2. The image renders as a visible, scannable QR code (not a broken image icon).
3. A text label reads exactly: "Scan to open camera on your phone".
4. A secondary note reads exactly: "Phone must be on the same WiFi network as this PC".
5. `GET /qr` returns HTTP 200 with `Content-Type: image/png`.
6. The QR code encodes the full URL to the phone page (e.g. `http://192.168.x.x:3000/phone`), using the PC's LAN IP, not `localhost`.
7. Scanning the QR code on a phone connected to the same WiFi network opens `phone.html` in the phone's browser.
8. The QR code image does not require cache-busting — `src="/qr"` with no query string is correct, as the URL it encodes does not change during a session.
9. If the `/qr` endpoint is unavailable (e.g. server error), the `<img>` element shows the browser's native broken-image state; no JS error handling is required.

## Gotchas & Edge Cases

- The LAN IP must be detected at server startup, not hardcoded — see T-03 (local IP detection). If detection fails, the server should fall back to `localhost` and log a warning.
- The `qrcode` npm package is suitable for generating the PNG on the server side.
- The QR code must be generated at server startup (or lazily on first request) and cached — regenerating it on every `/qr` request is wasteful but functionally acceptable.
- The note about WiFi is user-facing text; UK English preferred — "WiFi" not "Wifi".
- Do not add `crossOrigin` or authentication to the `/qr` endpoint — the phone browser must be able to open it without credentials.
