## UI States

**No frames yet** — The `<img>` is hidden or a placeholder `<div>` with grey background and text "No frames yet" is shown in its place. The `<img>` element is present in the DOM but its `src` has not been set to a valid endpoint, or it is set to a URL that returns 404.

**Frame available** — The `<img>` is visible and displays the latest captured frame. Its `src` is `/latest-frame?t=[timestamp]`.

**Loading next frame** — Between a `frame-saved` event and the browser completing the new image request, the previous frame remains visible (no blank flash). The browser handles this naturally when updating `src`.

## Visual Assets

- `/latest-frame` — server-served image file (JPEG or PNG depending on session format). Dimensions are the phone camera's native output (typically 1080p or higher). The `<img>` element is constrained by CSS to prevent overflow.

## State to Manage

The Live Preview panel tracks one value: `lastFrameTimestamp`. It is set to the `timestamp` field of the most recent `frame-saved` event and used to build the cache-busting `src`.

```js
let lastFrameTimestamp = null;

function updatePreview(timestamp) {
  lastFrameTimestamp = timestamp;
  const img = document.getElementById('latest-frame');
  img.src = `/latest-frame?t=${timestamp}`;
  img.hidden = false;
  document.getElementById('preview-placeholder')?.remove();
}
```

On `status-update`, if `session.lastCaptureAt` is non-null, call `updatePreview(new Date(session.lastCaptureAt).getTime())` to initialise the thumbnail.

## Interfaces

### Socket.IO events consumed

| Event | Payload | Action |
|-------|---------|--------|
| `frame-saved` | `{ frameNum, timestamp, path }` | Call `updatePreview(timestamp)` |
| `status-update` | `{ session }` | If `session.lastCaptureAt` is set, initialise thumbnail |

### HTTP endpoint consumed

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/latest-frame?t=[ts]` | Image file (`image/jpeg` or `image/png`); 404 if no frame saved yet |

### HTML structure

```html
<section id="panel-preview">
  <div id="preview-placeholder">No frames yet</div>
  <img id="latest-frame"
       alt="Latest captured frame"
       hidden
       style="max-width: 100%; display: block;">
</section>
```

### Server-side endpoint

```js
let latestFramePath = null; // set by frame-receiver (T-13)

app.get('/latest-frame', (req, res) => {
  if (!latestFramePath) return res.sendStatus(404);
  res.sendFile(latestFramePath);
});
```
