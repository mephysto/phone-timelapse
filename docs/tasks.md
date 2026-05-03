# Tasks — Phone Timelapse

Implementation order. Each task should be completable and testable independently before moving to the next.

---

## Phase 1 — Server Foundation

### T-01 · Project setup ✅
- Update `package.json` with description, scripts (`start`, `dev`), and dependencies
- Install: `express`, `socket.io`, `qrcode`
- Create folder structure: `public/`, `output/` (gitignored), `docs/`
- Add `.gitignore` (node_modules, output/)
- **Done when:** `npm install` runs clean

### T-02 · Basic Express + Socket.IO server ✅
- `server.js`: Express serves `public/` as static files
- Socket.IO attached to HTTP server
- Server listens on port 3000
- **Done when:** `node server.js` starts without errors; `http://localhost:3000` returns a file

### T-03 · Local IP detection ✅
- On startup, detect the machine's local IPv4 address using the `os` module
- Print to terminal: `Dashboard: http://[IP]:3000` and `Phone: http://[IP]:3000/phone`
- Expose IP as a server-side config value for QR code generation
- **Done when:** Terminal shows correct local IP on startup

### T-04 · QR code endpoint
- `GET /qr` generates and serves a QR code PNG for `http://[LOCAL-IP]:3000/phone`
- Uses the `qrcode` npm package
- **Done when:** Visiting `/qr` in the browser shows a scannable QR code that opens the correct URL

---

## Phase 2 — Phone Page

### T-05 · Phone page shell (`public/phone.html`)
- Full-viewport HTML page
- "Arm Camera" button, centred
- Minimal status overlay (hidden initially)
- Connect to Socket.IO server
- **Done when:** Page loads in Safari without errors; button visible

### T-06 · Camera access
- On "Arm Camera" tap: call `getUserMedia({ video: { facingMode: 'environment' }, audio: false })`
- Pipe stream to a `<video>` element (full viewport, landscape, object-fit: cover)
- Handle permission denied gracefully (show error message)
- **Done when:** Tapping the button shows the rear camera feed full-screen on iPhone

### T-07 · NoSleep wake-lock
- On the same tap as camera access (must be within a user gesture): start a 1×1 silent looping `<video>` element (`nosleep.mp4`)
- Generate or include a minimal valid MP4 file for `public/nosleep.mp4`
- **Done when:** Screen does not dim/lock during an extended session on the phone (test 5 min)

### T-08 · Frame capture and send
- Listen for `capture` event from server
- Snapshot `<video>` onto hidden `<canvas>` at video's natural dimensions
- `canvas.toBlob()` → send binary via `socket.emit('frame', buffer)`
- **Done when:** Server receives binary data on `frame` event when `capture` is emitted

### T-09 · Phone status UI
- Show countdown to next capture (counting down from interval)
- Show timestamp of last capture ("Last: 14:23:01")
- Show connection status indicator (green dot = connected, red = reconnecting)
- "Frame saved" overlay text fades out in 1.5s on `frame-ack` event
- Stop button emits `stop-session`
- **Done when:** All UI elements update correctly during a test capture sequence

### T-10 · WebSocket reconnection
- On disconnect: show "Reconnecting…" banner; attempt reconnect with exponential backoff (1s, 2s, 4s… max 30s)
- On reconnect: hide banner, resume listening for `capture` events
- **Done when:** Toggling WiFi on the phone causes the banner to appear then disappear; captures resume

---

## Phase 3 — Session Engine (Server)

### T-11 · Session state management
- Define session state object (see design.md)
- `startSession()` and `stopSession()` functions
- Validate that a session isn't started if one is already running
- **Done when:** State transitions work correctly in isolation (can be tested with console logs)

### T-12 · Capture scheduler
- On `startSession()`: start `setInterval` emitting `capture` to the phone socket at `session.interval` seconds
- Track expected frame count
- On `stopSession()`: clear interval
- **Done when:** Phone receives `capture` events at the correct interval

### T-13 · Frame receiver and disk writer
- On `frame` event: decode incoming `ArrayBuffer`
- Determine output path: `./output/[dir]/frame_[NNNN].[ext]`
- Write file with `fs.writeFile`
- Increment `session.frameCount`
- Emit `frame-ack` to phone and `frame-saved` to dashboard
- Track path of last saved frame (for `/latest-frame` endpoint)
- **Done when:** Files appear on disk with correct sequential names after test captures

### T-14 · Output folder naming
- On `startSession()`: determine output folder
- If `./output/YYYY-MM-DD/` exists, try `./output/YYYY-MM-DD (2)/`, `(3)`, etc.
- Create the folder
- **Done when:** Running two sessions on the same day creates two separate folders

### T-15 · Gap detection and logging
- On phone socket disconnect: record gap start time; emit `gap-started` to dashboard
- On phone socket reconnect: calculate missed frames; push to `session.gaps[]`; emit `gap-ended` to dashboard
- **Done when:** Disconnecting phone mid-session creates a gap entry visible in server state

### T-16 · Session log writer
- On `stopSession()`: write `session.log` to output folder
- Format per design.md
- **Done when:** `session.log` file appears in the correct folder with accurate data after a session

---

## Phase 4 — PC Dashboard

### T-17 · Dashboard shell (`public/dashboard.html`)
- HTML layout with panels: Status, Live Preview, Stats, Settings, QR Code, Gap Log, Session Summary
- Connect to Socket.IO server
- On connect: server emits `status-update` with full session state; dashboard renders initial state
- **Done when:** Page loads and shows current session state

### T-18 · Dashboard — QR code panel
- `<img src="/qr">` — served from T-04
- Label: "Scan to open camera on your phone"
- Note: "Phone must be on the same WiFi network as this PC"
- **Done when:** QR code visible on dashboard; scanning opens phone page

### T-19 · Dashboard — session controls
- Start and Stop buttons
- Emit `start-session` / `stop-session` to server
- Buttons are enabled/disabled based on session status (can't start if running, can't stop if idle)
- **Done when:** Buttons correctly start and stop the session

### T-20 · Dashboard — live stats
- Frame count (live, increments on `frame-saved`)
- Countdown to next capture (client-side timer reset on each `frame-saved`)
- Session progress bar (frameCount / expectedFrames)
- Session elapsed time (ticking clock)
- **Done when:** All counters update in real time during a test session

### T-21 · Dashboard — live preview thumbnail
- `<img id="latest-frame">` with `src="/latest-frame?t=[timestamp]"` (cache-bust with timestamp)
- Update `src` on each `frame-saved` event
- **Done when:** Thumbnail updates after each capture in a test session

### T-22 · Dashboard — settings panel
- Fields: Interval (number input, seconds), Start time (time input), End time (time input), Format toggle (PNG / JPG)
- Disk space estimate updates live when interval or format changes
  - Formula: `(sessionDuration / interval) * perFrameSize`
  - PNG estimate: 4 MB/frame; JPG estimate: 1 MB/frame (show as range)
- On submit: emit `update-settings` to server (only allowed when session is idle)
- **Done when:** Changing format toggle updates disk estimate instantly; settings persist to server

### T-23 · Dashboard — gap log panel
- Scrollable list, newest first
- On `gap-started`: add entry "⚠ Disconnected at HH:MM:SS"
- On `gap-ended`: update entry "⚠ Gap: HH:MM:SS → HH:MM:SS (N frames missed)"
- **Done when:** Disconnect/reconnect cycle produces a correct log entry in the dashboard

### T-24 · Dashboard — session summary
- On `session-ended` event: show summary panel
  - Duration, frames captured, frames expected, number of gaps
- **Done when:** Summary appears after a session is stopped

---

## Phase 5 — Scheduled Sessions

### T-25 · Auto-start at scheduled time
- Server checks `session.scheduledStart` every minute (or uses `setTimeout` to the exact time)
- If current time matches and no session is running: auto-start
- **Done when:** Setting start time to 1 minute in the future auto-starts the session

### T-26 · Auto-stop at scheduled end time
- During a running session: if current time reaches `session.scheduledEnd`, auto-stop
- **Done when:** Setting end time to 1 minute after start auto-stops the session

---

## Phase 6 — Polish & Docs

### T-27 · `/latest-frame` HTTP endpoint
- `GET /latest-frame`: serves the most recently saved frame file
- Returns 404 if no frame has been saved yet
- **Done when:** URL returns the most recent frame image

### T-28 · Estimated disk usage in settings
- Show running total of actual bytes written in the stats panel (not just estimate)
- Update on each `frame-saved` event
- **Done when:** Actual disk usage counter visible and incrementing in dashboard

### T-29 · README
- Setup instructions (Node version, `npm install`, `node server.js`)
- WiFi requirement note
- How to open the dashboard and scan QR code
- Known limitations (iOS camera resolution cap at 1080p, wake-lock not guaranteed)
- FFmpeg command for compiling timelapse

### T-30 · End-to-end test
- Full 5-minute session with the actual iPhone in Safari
- Verify: frames saved at correct interval, reconnect works, gap logged, session log written, FFmpeg command produces valid video
- Document any issues found

---

## Deferred / Out of Scope

- Native iOS app (would unlock full sensor resolution and guaranteed wake-lock)
- Multiple simultaneous phone connections
- Remote access (non-local network)
- Video preview on dashboard
- Automatic FFmpeg compilation
