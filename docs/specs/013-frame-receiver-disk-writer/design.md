## UI States

N/A — no UI in this task. Frame writing is a server-side operation.

## Visual Assets

None

## State to Manage

- `session.frameCount: number` — incremented after each successful write; reserved before the write begins to avoid collision on concurrent frames.
- `session.lastCaptureAt: Date | null` — updated to `new Date()` on each successful write.
- `latestFramePath: string | null` — server-side variable tracking the absolute path of the most recently saved frame; used by the `GET /latest-frame` endpoint (T-xx).

## Interfaces

**Socket.IO event consumed (server side):**

```
frame  ←  Phone  Buffer (raw image bytes)
```

**Socket.IO events emitted (server side):**

```
frame-ack   →  Phone      { frameNum: number, timestamp: string }
frame-saved →  Dashboard  { frameNum: number, timestamp: string, path: string }
```

**File path construction:**

```js
const frameNum  = session.frameCount + 1          // reserve number first
const padded    = String(frameNum).padStart(4, '0')
const ext       = session.format                  // 'png' or 'jpg'
const filename  = `frame_${padded}.${ext}`
const filePath  = path.join(session.outputDir, filename)
```

**Frame handler (pseudocode):**

```js
phoneSocket.on('frame', async (data) => {
  if (session.status !== 'running') return

  const frameNum  = session.frameCount + 1
  const timestamp = new Date().toISOString()
  const padded    = String(frameNum).padStart(4, '0')
  const filePath  = path.join(session.outputDir, `frame_${padded}.${session.format}`)

  try {
    await fs.promises.writeFile(filePath, data)
    session.frameCount     = frameNum
    session.lastCaptureAt  = new Date(timestamp)
    latestFramePath        = filePath

    phoneSocket.emit('frame-ack', { frameNum, timestamp })
    io.to('dashboard').emit('frame-saved', { frameNum, timestamp, path: filePath })
  } catch (err) {
    console.error('Failed to write frame:', err)
  }
})
```

**Dashboard room:**
Dashboard sockets join a `'dashboard'` room on connect so `io.to('dashboard').emit(...)` reaches all dashboard connections without needing a stored socket reference.
