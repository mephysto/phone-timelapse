# Design — Phone Timelapse

## Architecture Overview

```
┌─────────────────────────────┐        Local WiFi        ┌──────────────────────────────────┐
│        iPhone (Safari)      │ ◄──── WebSocket ────────► │   Node.js Server (WSL / PC)      │
│                             │                           │                                  │
│  /phone page                │                           │  Express + Socket.IO             │
│  - Live rear camera feed    │                           │  - Serves /phone and /dashboard  │
│  - Canvas frame capture     │                           │  - Session scheduler             │
│  - Status overlay           │                           │  - Frame receiver + disk writer  │
│  - Wake-lock trick          │                           │  - Local IP + QR code generator  │
└─────────────────────────────┘                           └──────┬───────────────────────────┘
                                                                 │
                                              ┌──────────────────┼───────────────────┐
                                              │                  │                   │
                                     ┌────────▼────────┐  ┌─────▼──────┐   ┌────────▼────────┐
                                     │  PC Dashboard   │  │  ./output/ │   │  session.log    │
                                     │  localhost:3000 │  │  frames    │   │  (on end)       │
                                     └─────────────────┘  └────────────┘   └─────────────────┘
```

---

## Components

### 1. Server (`server.js`)

Single entrypoint. Handles everything.

**Responsibilities:**
- Serve static files from `public/`
- Detect the machine's local network IP at startup and expose it as a config value
- Manage session state (idle / running / scheduled / stopped)
- Run the capture scheduler: emit `capture` to the connected phone socket every N seconds
- Receive `frame` events from the phone, decode, and write to disk
- Emit `frame-saved` (with thumbnail path and metadata) to the dashboard
- Detect WebSocket disconnects, log gaps, resume frame numbering on reconnect
- Write `session.log` when a session ends
- Expose `/latest-frame` HTTP endpoint serving the most recently saved frame

**Session state object:**
```js
{
  status: 'idle' | 'running' | 'stopped',
  startTime: Date | null,
  scheduledStart: string | null,   // "06:00"
  scheduledEnd: string | null,     // "18:00"
  interval: number,                // seconds, default 30
  format: 'png' | 'jpg',
  outputDir: string,               // resolved path for this session
  frameCount: number,
  expectedFrames: number,
  gaps: [{ from: Date, to: Date, missed: number }],
  lastCaptureAt: Date | null,
}
```

### 2. Phone Page (`public/phone.html`)

A single HTML file with inline JS (no build step).

**Responsibilities:**
- On load: show "Arm Camera" button (iOS requires a user gesture before `getUserMedia` and autoplay)
- On tap: request `getUserMedia({ video: { facingMode: 'environment' }, audio: false })` and connect WebSocket
- Render live camera feed into a `<video>` element (full viewport, landscape)
- Start the NoSleep looping video on the same tap
- Listen for `capture` events from server → snapshot `<video>` onto `<canvas>` → `canvas.toBlob()` → send as binary over WebSocket
- Listen for `frame-ack` from server → flash "Frame saved" overlay (fades out in ~1.5s)
- On WebSocket disconnect → show "Reconnecting…" banner → auto-reconnect with exponential backoff
- On reconnect → resume normal operation
- Show session controls (Stop button)

**No-Sleep trick:**
A 1×1 pixel transparent `.mp4` video element plays in a loop, muted, inline. Started on the same user tap. This is the most reliable browser-based screen-wake approach for iOS Safari.

### 3. PC Dashboard (`public/dashboard.html`)

A single HTML file with inline JS (no build step).

**Panels:**

| Panel | Contents |
|-------|----------|
| **Status** | Session status badge, Start/Stop buttons, session timer |
| **Live Preview** | Latest frame `<img>` — refreshed via Socket.IO event |
| **Stats** | Frame count, frames expected, next capture countdown, progress bar |
| **Settings** | Interval (s), start time, end time, format toggle (PNG/JPG) + live disk estimate |
| **QR Code** | Image served from `/qr` endpoint (phone page URL) |
| **Gap Log** | Scrollable list of disconnections and missed frames |
| **Session Summary** | Appears on session end: duration, captured/expected, gap count |

Dashboard connects to server via Socket.IO. All updates are server-pushed; no polling.

---

## Data Flow

### Happy Path (session running, phone connected)

```
Server timer fires
  → emit `capture` to phone socket
  → Phone: snapshot canvas → toBlob(PNG/JPG)
  → Phone: socket.emit('frame', blobArrayBuffer)
  → Server: decode buffer → write to ./output/YYYY-MM-DD/frame_NNNN.ext
  → Server: emit `frame-saved` to dashboard { frameNum, path, timestamp }
  → Server: emit `frame-ack` to phone
  → Dashboard: update thumbnail src, increment counters
  → Phone: flash "Frame saved" overlay
```

### Disconnect / Reconnect

```
Phone WebSocket closes
  → Server: record gap start time, log to session.gaps[]
  → Server: emit `gap-started` to dashboard
  → Dashboard: add entry to gap log

Phone reconnects (auto-reconnect with backoff)
  → Server: record gap end time, calculate missed frames
  → Server: emit `gap-ended` { from, to, missed } to dashboard
  → Dashboard: update gap log entry
  → Capture resumes at next interval tick (frame numbering continues)
```

### Session End

```
Stop triggered (dashboard, phone, or scheduled end time)
  → Server: clear interval timer
  → Server: set session.status = 'stopped'
  → Server: write session.log to outputDir
  → Server: emit `session-ended` { summary } to dashboard and phone
  → Dashboard: display session summary panel
```

---

## File & Folder Structure

```
phone-timelapse/
├── server.js              # Single server entrypoint
├── package.json
├── public/
│   ├── dashboard.html     # PC dashboard (served at /)
│   ├── phone.html         # Phone capture page (served at /phone)
│   └── nosleep.mp4        # 1×1 transparent looping video for wake-lock
├── output/                # Created at runtime
│   └── 2026-05-03/
│       ├── frame_0001.png
│       ├── frame_0002.png
│       └── session.log
└── docs/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

---

## Output Folder Naming

```js
// Pseudocode for collision handling
let date = '2026-05-03'
let dir = `./output/${date}`
let n = 1
while (exists(dir)) {
  n++
  dir = `./output/${date} (${n})`
}
mkdir(dir)
```

---

## Session Log Format

```
Phone Timelapse — Session Log
==============================
Date:     2026-05-03
Start:    06:00:02
End:      18:00:01
Duration: 11h 59m 59s

Frames captured:  1438
Frames expected:  1440
Gaps:             2

Gap #1
  From:   08:23:01
  To:     08:23:32
  Missed: 1 frame

Gap #2
  From:   14:45:00
  To:     14:46:01
  Missed: 2 frames
```

---

## Socket.IO Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `capture` | Server → Phone | `{ format }` | "Take a photo now" |
| `frame` | Phone → Server | `ArrayBuffer` | Raw image bytes |
| `frame-ack` | Server → Phone | `{ frameNum, timestamp }` | Confirmation |
| `frame-saved` | Server → Dashboard | `{ frameNum, timestamp, path }` | Update dashboard |
| `gap-started` | Server → Dashboard | `{ at }` | Phone disconnected |
| `gap-ended` | Server → Dashboard | `{ from, to, missed }` | Phone reconnected |
| `session-started` | Server → All | `{ startTime, outputDir }` | Session began |
| `session-ended` | Server → All | `{ summary }` | Session complete |
| `status-update` | Server → Dashboard | `{ session }` | Full state sync on connect |
| `start-session` | Dashboard → Server | `{}` | Manual start |
| `stop-session` | Dashboard/Phone → Server | `{}` | Manual stop |
| `update-settings` | Dashboard → Server | `{ interval, format, start, end }` | Update config |

---

## HTTP Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Serve `dashboard.html` |
| `GET` | `/phone` | Serve `phone.html` |
| `GET` | `/latest-frame` | Serve most recently saved frame image |
| `GET` | `/qr` | Serve QR code PNG for phone URL |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `socket.io` | WebSocket layer |
| `qrcode` | Generate QR code PNG for dashboard |

No other runtime dependencies. Frame data arrives as binary and is written directly with `fs.writeFile` — no image processing library needed.

---

## FFmpeg Reference (post-session)

After a session, the user runs FFmpeg manually. Recommended command:

```bash
ffmpeg -framerate 30 -i ./output/2026-05-03/frame_%04d.png \
  -c:v libx264 -pix_fmt yuv420p \
  timelapse.mp4
```

If there are gaps in frame numbering, use the `-start_number` flag or rename frames to be fully sequential first.

---

## Network Setup Note

The server must be reachable from the phone. At startup, `server.js` detects the machine's local IPv4 address (e.g. `192.168.1.42`) and:

1. Prints it to the terminal: `Dashboard: http://192.168.1.42:3000`
2. Uses it to generate the QR code pointing to `http://192.168.1.42:3000/phone`

The phone must be on the same WiFi network as the PC. Mobile data (5G/LTE) will not work.
