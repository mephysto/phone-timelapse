# Review — T-02 · Basic Express + Socket.IO Server
Status: PASS

## Acceptance Criteria Results

| # | Criteria (condensed) | Result | Notes |
|---|----------------------|--------|-------|
| 1 | `server.js` exists at project root as single entrypoint | ✅ PASS | File present at `/home/mephysto/projects/phone-timelapse/server.js` |
| 2 | `node server.js` runs without uncaught exceptions / does not immediately terminate | ⚠️ MANUAL | Requires mkcert certs + live server — deferred to T-30. Code has no syntax errors; clean exit-on-missing-certs is covered by AC13. |
| 3 | Express serves `public/` as static assets | ✅ PASS | `app.use(express.static('public'))` at server.js:26 |
| 4 | `GET http://localhost:3000/` returns HTTP 200 or 304 | ⚠️ MANUAL | Requires mkcert certs + live server — deferred to T-30. Placeholder `public/index.html` is present, so GET / will not 404 once server starts. |
| 5 | HTTP server and Socket.IO share the same port (3000) | ✅ PASS | `io = new Server(server, ...)` attached to the `https.Server` instance; `server.listen(PORT)` — single port, no separate WS port |
| 6 | Socket.IO client can connect and receive `connect` event | ⚠️ MANUAL | Requires mkcert certs + live server — deferred to T-30 |
| 7 | Server logs a ready message when listening | ✅ PASS | `console.log(\`Server listening on port ${PORT}\`)` at server.js:36 |
| 8 | Handles `connection` event and logs client connect | ✅ PASS | `io.on('connection', ...)` with `console.log('Client connected:', socket.id)` at server.js:28–29 |
| 9 | Handles `disconnect` event and logs client disconnect | ✅ PASS | `socket.on('disconnect', ...)` with `console.log('Client disconnected:', socket.id)` at server.js:30–32 |
| 10 | Port defined as constant or `process.env.PORT` with fallback — no hardcoded prod config | ✅ PASS | `const PORT = process.env.PORT \|\| 3000` at server.js:6 |
| 11 | Uses HTTPS (`https.createServer({ key, cert }, app)`); cert/key loaded from `cert.pem` / `key.pem` | ✅ PASS | `https.createServer({ key, cert }, app)` at server.js:23; files read via `fs.readFileSync` at server.js:19–20 |
| 12 | Socket.IO configured with `maxHttpBufferSize: 10e6` | ✅ PASS | `new Server(server, { maxHttpBufferSize: 10e6 })` at server.js:24 |
| 13 | Missing cert prints exact setup instructions and exits with non-zero code | ✅ PASS | Guard at server.js:8–17: checks both files, prints the required message verbatim, calls `process.exit(1)` |

## Verdict
PASS

## Issues Found
None. All statically verifiable ACs pass. Three ACs (2, 4, 6) require a live HTTPS server with mkcert certificates and are correctly deferred to T-30 — this is the expected third state, not a failure.

## Recommendation
SHIP

---

_Result key: ✅ PASS · ❌ FAIL · ⚠️ MANUAL (requires mkcert certs or physical device — deferred to T-30)_
