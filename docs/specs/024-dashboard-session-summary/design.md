## UI States

**Hidden** — Default state on page load. The panel has `hidden` attribute or `display: none`. Applies when `session.status` is `"idle"` or `"running"`.

**Visible** — Shown after `session-ended` is received, or when `status-update` arrives with `session.status === "stopped"`. All four summary values are populated. The panel cannot be dismissed.

There are no interactive elements in this panel — it is display-only.

## Visual Assets

None.

## State to Manage

The summary panel has no local state of its own. It reads from the `session-ended` event payload or reconstructs display values from the session state object on `status-update`.

```js
// Values needed for display (all sourced from summary payload or session object)
// duration: total seconds (number)
// frameCount: number
// expectedFrames: number
// gapCount: number
```

Duration formatting:

```js
function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3_600);
  const m = Math.floor((totalSeconds % 3_600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}
```

## Interfaces

### Socket.IO events consumed

| Event | Payload | Action |
|-------|---------|--------|
| `session-ended` | `{ summary }` | Show panel; populate values from `summary` |
| `status-update` | `{ session }` | If `session.status === "stopped"`, show panel using session fields; otherwise ensure panel is hidden |

### Expected `summary` object shape (from server)

```js
{
  duration: 3720,        // total seconds the session ran
  frameCount: 122,       // frames actually saved
  expectedFrames: 124,   // frames that should have been saved
  gapCount: 2,           // number of disconnection gaps
}
```

### HTML structure

```html
<section id="panel-summary" hidden>
  <h2>Session Complete</h2>
  <p id="summary-duration">Duration: 01:02:00</p>
  <p id="summary-frames-captured">122 frames captured</p>
  <p id="summary-frames-expected">124 frames expected</p>
  <p id="summary-gaps">2 disconnections</p>
  <p class="note">Reload the page to start a new session.</p>
</section>
```

### Render function

```js
function renderSummary({ duration, frameCount, expectedFrames, gapCount }) {
  document.getElementById('summary-duration').textContent =
    `Duration: ${formatDuration(duration)}`;
  document.getElementById('summary-frames-captured').textContent =
    `${frameCount} frames captured`;
  document.getElementById('summary-frames-expected').textContent =
    `${expectedFrames} frames expected`;
  const gapText = gapCount === 0
    ? 'No disconnections'
    : gapCount === 1
      ? '1 disconnection'
      : `${gapCount} disconnections`;
  document.getElementById('summary-gaps').textContent = gapText;
  document.getElementById('panel-summary').hidden = false;
}
```
