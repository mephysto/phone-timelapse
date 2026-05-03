## User Story

Given `server.js` is running and a browser navigates to `http://localhost:3000/`,
When the page loads,
Then `dashboard.html` is served, Socket.IO connects automatically, the server emits `status-update` with the current session state, and the dashboard renders that state into all panel placeholders without error.

## Acceptance Criteria

1. `GET /` returns HTTP 200 with `dashboard.html`.
2. `dashboard.html` is a single self-contained HTML file with no build step — it loads Socket.IO from the server via `<script src="/socket.io/socket.io.js">`.
3. The page contains clearly identified placeholder elements for all seven panels: Status, Live Preview, Stats, Settings, QR Code, Gap Log, and Session Summary.
4. Each panel has a unique `id` attribute that other tasks will target (e.g. `id="panel-status"`, `id="panel-preview"`, etc.).
5. On load, the dashboard connects to the Socket.IO server on the same origin without any manual configuration.
6. The server emits `status-update` with the full session state object to a newly connected dashboard socket.
7. The dashboard receives `status-update` and logs the payload to the console (full render is done in later tasks; logging proves the event is received).
8. If the socket disconnects and reconnects, `status-update` is received again and re-rendered.
9. The page title is "Timelapse Dashboard" (visible in the browser tab).
10. No JavaScript errors appear in the browser console on a clean load.
11. If the dashboard is loaded over plain HTTP (not HTTPS and not localhost), a prominent warning banner is shown at the top of the page: "⚠ Not running over HTTPS — the phone camera page will not work. See the README for mkcert setup instructions." The banner is not shown when accessed via HTTPS or localhost.

## Gotchas & Edge Cases

- The server must join dashboard sockets to a named room (e.g. `"dashboard"`) or track them separately from phone sockets, so `status-update` is only sent to dashboard clients — not to the phone.
- `status-update` must be emitted inside the `connection` handler so it fires for each new connection, including reconnections; emitting it outside the handler will miss late joiners.
- The Socket.IO client script is served automatically by the Socket.IO server at `/socket.io/socket.io.js` — no CDN or local copy needed.
- Panel placeholder elements must exist in the DOM before any other task's JS runs, or those tasks will get null references. Order of `<script>` tags matters if scripts are added inline.
- The Session Summary panel should be hidden by default (`display: none` or `hidden` attribute); it is shown only on `session-ended`.
- The HTTPS warning check uses `location.protocol !== 'https:' && location.hostname !== 'localhost'` — localhost is excluded because it is a valid secure context for local development.
