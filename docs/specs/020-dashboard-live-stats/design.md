## UI States

**Idle / no session** — Frame count: "0". Countdown: "—". Elapsed: "00:00:00". Progress bar: 0% width. All timers are stopped.

**Running** — Frame count increments on `frame-saved`. Countdown ticks down from `session.interval` every second and resets to `session.interval` on each `frame-saved`. Elapsed time ticks up every second from `session.startTime`. Progress bar fills proportionally.

**Stopped** — Countdown display freezes at "—". Elapsed time freezes at final value. Frame count and progress bar remain at last values. Both `setInterval` timers are cleared.

## Visual Assets

None. The progress bar is a CSS-styled `<div>` — no image or SVG asset.

## State to Manage

```js
// Derived from session object; updated by events
let frameCount = 0;           // incremented on frame-saved
let expectedFrames = 0;       // set from session state
let intervalSeconds = 30;     // set from session state
let countdownSeconds = 30;    // decremented each tick, reset on frame-saved
let startTime = null;         // Date object, set on session-started / status-update

let countdownTimer = null;    // setInterval handle
let elapsedTimer = null;      // setInterval handle
```

Clearing timers:
```js
function stopTimers() {
  clearInterval(countdownTimer);
  clearInterval(elapsedTimer);
  countdownTimer = null;
  elapsedTimer = null;
}
```

## Interfaces

### Socket.IO events consumed

| Event | Payload | Action |
|-------|---------|--------|
| `status-update` | `{ session }` | Initialise all values; start or stop timers based on `session.status` |
| `frame-saved` | `{ frameNum, timestamp, path }` | Increment `frameCount`; reset countdown to `intervalSeconds`; update progress bar |
| `session-started` | `{ startTime, outputDir }` | Set `startTime`; start timers |
| `session-ended` | `{ summary }` | Stop timers; freeze display |

### Countdown reconstruction on reconnect

```js
// Use lastCaptureAt from status-update to position the countdown correctly
if (session.lastCaptureAt) {
  const elapsed = (Date.now() - new Date(session.lastCaptureAt)) / 1_000;
  countdownSeconds = Math.max(0, session.interval - elapsed);
}
```

### HTML structure

```html
<section id="panel-stats">
  <div id="stat-frame-count">0 frames</div>
  <div id="stat-countdown">—</div>
  <div id="stat-elapsed">00:00:00</div>
  <div id="progress-bar-track">
    <div id="progress-bar-fill" style="width: 0%"></div>
  </div>
</section>
```

### Progress bar update

```js
function updateProgressBar(frameCount, expectedFrames) {
  const pct = expectedFrames > 0
    ? Math.min(100, (frameCount / expectedFrames) * 100)
    : 0;
  document.getElementById('progress-bar-fill').style.width = `${pct}%`;
}
```
