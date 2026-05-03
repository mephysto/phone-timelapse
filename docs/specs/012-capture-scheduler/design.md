## UI States

N/A — no UI in this task. The scheduler runs entirely on the server.

## Visual Assets

None

## State to Manage

- `captureTimer: ReturnType<setInterval> | null` — server-side reference to the running interval. `null` when no session is active. Set when `startSession()` is called, cleared (and nulled) when `stopSession()` is called.
- `phoneSocket: Socket | null` — reference to the currently connected phone's Socket.IO socket. Updated when the phone connects or disconnects.
- `session.expectedFrames` — incremented on every tick of the capture timer.

## Interfaces

**Server-side socket tracking:**

```js
let phoneSocket = null

io.on('connection', (socket) => {
  if (socket.handshake.headers.referer?.endsWith('/phone')) {
    phoneSocket = socket
    socket.on('disconnect', () => { phoneSocket = null })
  }
})
```

**Scheduler start / stop (called from `startSession` / `stopSession`):**

```js
let captureTimer = null

function startCaptureScheduler() {
  if (captureTimer !== null) return   // already running
  const intervalMs = session.interval * 1_000
  captureTimer = setInterval(() => {
    session.expectedFrames++
    if (phoneSocket) {
      phoneSocket.emit('capture', { format: session.format })
    }
  }, intervalMs)
}

function stopCaptureScheduler() {
  clearInterval(captureTimer)
  captureTimer = null
}
```

**Socket.IO events emitted (server → phone):**

```
capture  →  Phone  { format: 'png' | 'jpg' }
```

**Integration with `startSession()` / `stopSession()`:**

- `startSession()` calls `startCaptureScheduler()` after setting state.
- `stopSession()` calls `stopCaptureScheduler()` before finalising state.
