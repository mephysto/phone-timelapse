## UI States

N/A — no UI in this task. The canvas is a hidden technical element, not a visible UI component.

## Visual Assets

None

## State to Manage

- `capturing: boolean` — flag to prevent concurrent encode operations. Set to `true` when `toBlob()` is called, reset to `false` in the callback. If a `capture` event arrives while `capturing` is `true`, the event is skipped (or queued, but skipping is simpler and preferred).
- The canvas element itself holds transient pixel data for the duration of each encode; it is not persistent state.

## Interfaces

**Socket.IO events consumed (phone side):**

```
capture  ←  Server
  payload: { format: 'png' | 'jpg' }
```

**Socket.IO events emitted (phone side):**

```
frame  →  Server
  payload: ArrayBuffer  (raw image bytes)
```

**DOM elements required:**

```js
const video  = document.querySelector('video')   // live camera stream
const canvas = document.querySelector('#capture-canvas')  // hidden
const ctx    = canvas.getContext('2d')
```

**Capture flow (pseudocode):**

```js
socket.on('capture', ({ format }) => {
  if (capturing) return
  if (video.readyState < 2) return

  capturing = true
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0)

  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
  canvas.toBlob(async (blob) => {
    if (!blob) { capturing = false; return }
    const buffer = await blob.arrayBuffer()
    socket.emit('frame', buffer)
    capturing = false
  }, mimeType)
})
```
