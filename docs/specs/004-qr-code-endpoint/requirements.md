## User Story

Given the server is running and a phone is on the same WiFi network,
When the developer visits `http://localhost:3000/qr` in a browser,
Then the browser displays a QR code image that, when scanned with the phone's camera, opens `http://[LOCAL-IP]:3000/phone` in Safari.

## Acceptance Criteria

1. `GET /qr` returns HTTP 200 with `Content-Type: image/png`.
2. The response body is a valid PNG file (begins with the PNG magic bytes `\x89PNG`).
3. The QR code encodes exactly the string `http://[LOCAL_IP]:[PORT]/phone` where `LOCAL_IP` and `PORT` are the values determined at startup.
4. The QR code is scannable by an iPhone's native camera app and by standard QR scanner apps.
5. Scanning the QR code on the phone opens `http://[LOCAL-IP]:3000/phone` in Safari.
6. The QR code is generated using the `qrcode` npm package — no other QR library.
7. The endpoint generates the PNG on every request (no caching required, but caching is acceptable).
8. If `qrcode` throws an error during generation, the server responds with HTTP 500 and a plain-text error message.
9. No query parameters or request body are needed — the URL encoded in the QR is always the phone URL.

## Gotchas & Edge Cases

- The `qrcode` package's `toBuffer()` method returns a Promise — the route handler must be `async` or use `.then()/.catch()`.
- QR code error-correction level defaults to `M` in the `qrcode` package, which is fine. Do not lower it to `L` — scanners on a phone screen at a distance need some redundancy.
- If `LOCAL_IP` is `127.0.0.1` (fallback), the QR code will encode a loopback address that is useless on the phone. This is an expected degraded state, not a bug — the startup warning in T-03 already covers it.
- The `qrcode` package can output SVG, data URL, or PNG buffer. Use `qrcode.toBuffer(url)` to get raw PNG bytes, then write them directly to the response — do not base64-encode.
- The generated QR image has no surrounding margin by default in some configurations; the `qrcode` package adds a quiet zone automatically, so no manual padding is needed.
- Do not serve the QR code as a file from `public/` — it would need to be regenerated if the IP changes, and the IP is only known at runtime.
