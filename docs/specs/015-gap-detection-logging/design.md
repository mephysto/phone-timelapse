## UI States

N/A — gap detection is a server-side concern. The dashboard receives events and displays them, but dashboard UI rendering is out of scope for this task.

## Visual Assets

None

## State to Manage

- `gapStart: Date | null` — server-side variable tracking when the current gap began. Set on phone disconnect during a running session. Reset to `null` after the gap is closed on reconnect (or at session end).
- `session.gaps: Array<{ from: Date, to: Date, missed: number }>` — array that accumulates closed gap records throughout the session.

## Interfaces

**Socket.IO events emitted (server → dashboard):**

```
gap-started  →  Dashboard  { at: string }         // ISO 8601 timestamp
gap-ended    →  Dashboard  { from: string, to: string, missed: number }
```

**Phone socket lifecycle hooks:**

```js
// Called when a phone socket connects (inside io.on('connection', ...))
function onPhoneConnect(socket) {
  phoneSocket = socket

  // Close any open gap
  if (gapStart !== null && session.status === 'running') {
    const gapEnd        = new Date()
    const gapSecs       = (gapEnd - gapStart) / 1_000
    const missed        = Math.floor(gapSecs / session.interval)
    const gap           = { from: gapStart.toISOString(), to: gapEnd.toISOString(), missed }
    session.gaps.push(gap)
    gapStart = null
    io.to('dashboard').emit('gap-ended', gap)
  }

  // Re-attach frame listener (T-13)
  attachFrameListener(socket)

  socket.on('disconnect', () => onPhoneDisconnect())
}

function onPhoneDisconnect() {
  phoneSocket = null
  if (session.status !== 'running') return
  gapStart = new Date()
  io.to('dashboard').emit('gap-started', { at: gapStart.toISOString() })
}
```

**Handling open gaps at session end (called from `stopSession()`):**

```js
if (gapStart !== null) {
  const gapEnd  = new Date()
  const gapSecs = (gapEnd - gapStart) / 1_000
  const missed  = Math.floor(gapSecs / session.interval)
  session.gaps.push({ from: gapStart.toISOString(), to: gapEnd.toISOString(), missed })
  gapStart = null
}
```
