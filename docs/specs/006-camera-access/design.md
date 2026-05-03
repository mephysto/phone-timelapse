## UI States

### State 1: Idle (pre-tap)
- Dark background fills the viewport.
- "Arm Camera" button is visible and centred.
- `<video>` element exists in the DOM but is hidden.
- `#status` overlay is hidden.

### State 2: Requesting permission
- The OS permission dialog is shown by the browser — the page itself is obscured and no page-level UI change is needed.
- "Arm Camera" button remains visible (in case the user denies).

### State 3: Camera active (armed)
- `<video>` element is visible, covering the full viewport with the rear camera feed.
- "Arm Camera" button is hidden.
- `#status` overlay may become visible in a later task; for now it remains hidden.

### State 4: Permission denied / error
- "Arm Camera" button remains visible (user can try again).
- `#status` overlay is shown with a human-readable error message.
- Example message: "Camera access denied. Please allow camera permission in Settings and reload."

## Visual Assets

None. The camera feed is a live `<video>` element, not a static asset.

## State to Manage

```
stream: MediaStream | null   — the active camera stream; null before arming or after an error
```

Stored as a module-level variable in the page script so it can later be used by T-07 (NoSleep) and future capture tasks.

## Interfaces

### DOM elements

| Element | ID | Initial state | Armed state |
|---------|----|--------------|-------------|
| Arm button | `#arm-btn` | Visible | Hidden |
| Video feed | `#camera` | Hidden (`display: none`) | Visible, full viewport |
| Status overlay | `#status` | Hidden | Hidden (or visible on error) |

### `<video>` element attributes

```html
<video id="camera"
       autoplay
       muted
       playsinline
       style="display:none; width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0;">
</video>
```

### `getUserMedia` call

```js
const constraints = {
  video: { facingMode: 'environment' },
  audio: false,
};

async function armCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById('camera');
    video.srcObject = stream;
    await video.play();
    document.getElementById('arm-btn').style.display = 'none';
    video.style.display = 'block';
  } catch (err) {
    showStatus(`Camera error: ${err.message}`);
  }
}

document.getElementById('arm-btn').addEventListener('click', armCamera);
```

### Error display helper

```js
function showStatus(message) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.style.display = 'block';
}
```

### HTTPS / local IP note

`getUserMedia` requires a secure context. On the local IP, the server must be served over HTTPS or the iOS "Insecure origins treated as secure" flag must be set. The chosen mitigation must be documented in the project README or a setup note before this task is considered done.
