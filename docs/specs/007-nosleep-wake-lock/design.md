## UI States

### State 1: Idle (pre-tap)
- NoSleep `<video>` element exists in the DOM but is not playing.
- The element is invisible (zero visual footprint).
- No change to the visible UI from T-05.

### State 2: Armed (post-tap)
- Camera feed is visible (from T-06).
- NoSleep video is playing silently in the background.
- No visible indication to the user that the NoSleep video is active — this is intentional.

### State 3: Error (NoSleep play() rejected)
- Camera feed is still visible (NoSleep failure must not block camera).
- A `console.warn` or `console.error` message is written. No user-visible error is shown for this specific failure.

## Visual Assets

`public/nosleep.mp4` — a minimal valid MP4 file. The file must:
- Be a valid ISO Base Media File Format (ISOBMFF / MP4) container.
- Contain one H.264-encoded video track.
- Have a resolution of at least 1×1 pixel (can be exactly 1×1).
- Have a duration of at least 1 frame (can be a fraction of a second; looping handles replay).
- Have no audio track.
- Be as small as possible.

**Generation method (one of the following):**
- Use `ffmpeg` to generate a minimal MP4 from a single black frame: `ffmpeg -f lavfi -i color=c=black:size=1x1:duration=1 -c:v libx264 -profile:v baseline -pix_fmt yuv420p public/nosleep.mp4`
- Use a pre-built minimal MP4 binary (e.g., from the NoSleep.js project source) and commit it directly.

Document the chosen method in a comment near the `nosleep.mp4` reference in `phone.html`.

## State to Manage

```
nosleepVideo: HTMLVideoElement   — reference to the invisible looping video element
                                   used only to call .play() on arm
```

No additional state beyond what exists in T-06.

## Interfaces

### DOM element

```html
<video id="nosleep"
       loop
       muted
       playsinline
       src="/nosleep.mp4"
       style="position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;">
</video>
```

Placed anywhere in `<body>` — visual position does not matter since it is invisible.

### Updated `armCamera()` function

The NoSleep `.play()` call is added **before** the first `await` to stay within the synchronous portion of the user gesture:

```js
async function armCamera() {
  // Must be before any await — iOS Safari requires play() in a sync user-gesture context
  const nosleep = document.getElementById('nosleep');
  nosleep.play().catch((err) => console.warn('NoSleep play failed:', err));

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    const video = document.getElementById('camera');
    video.srcObject = stream;
    await video.play();
    document.getElementById('arm-btn').style.display = 'none';
    video.style.display = 'block';
  } catch (err) {
    showStatus(`Camera error: ${err.message}`);
  }
}
```

### HTTP endpoint

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/nosleep.mp4` | `express.static('public')` | Serves the NoSleep MP4 |

No changes to `server.js` are required — `express.static` handles this automatically.
