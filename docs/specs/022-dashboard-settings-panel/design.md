## UI States

**Idle — editable** — All inputs are enabled. The disk estimate updates live. The Save button is enabled.

**Running or stopped — locked** — All inputs are disabled. The disk estimate is still visible (read-only). The Save button is disabled. A note reads "Settings cannot be changed during a session."

**Validation error** — Inline error messages appear below the offending field(s). The Save button remains disabled until errors are resolved. Errors: interval below 5; end time not after start time.

## Visual Assets

None.

## State to Manage

```js
// Local form state (mirrors server values; updated on status-update)
let settings = {
  interval: 30,       // seconds
  format: 'jpg',      // 'png' | 'jpg'
  start: null,        // 'HH:MM' string or null
  end: null,          // 'HH:MM' string or null
};
```

The disk estimate is computed entirely from `settings.interval`, `settings.format`, `settings.start`, and `settings.end` — no server round-trip is needed to display it.

```js
const PER_FRAME_BYTES = {
  png: { min: 3 * 1024 * 1024, max: 5 * 1024 * 1024 },
  jpg: { min: 0.5 * 1024 * 1024, max: 1.5 * 1024 * 1024 },
};

function computeEstimate(interval, format, start, end) {
  const durationSeconds = durationFromTimes(start, end) ?? 12 * 60 * 60;
  if (interval <= 0) return null;
  const frames = durationSeconds / interval;
  const { min, max } = PER_FRAME_BYTES[format];
  return { minBytes: frames * min, maxBytes: frames * max };
}
```

## Interfaces

### Socket.IO events emitted

| Event | Payload | When |
|-------|---------|------|
| `update-settings` | `{ interval, format, start, end }` | User clicks Save with valid inputs while idle |

### Socket.IO events consumed

| Event | Payload | Action |
|-------|---------|--------|
| `status-update` | `{ session }` | Populate inputs; enable or disable based on `session.status` |

### HTML structure

```html
<section id="panel-settings">
  <label>
    Interval (seconds)
    <input id="setting-interval" type="number" min="5" value="30">
    <span class="field-error" id="error-interval" hidden></span>
  </label>
  <label>
    Start time
    <input id="setting-start" type="time">
  </label>
  <label>
    End time
    <input id="setting-end" type="time">
    <span class="field-error" id="error-times" hidden></span>
  </label>
  <div id="format-toggle" role="group" aria-label="Image format">
    <button id="btn-fmt-png" aria-pressed="false">PNG</button>
    <button id="btn-fmt-jpg" aria-pressed="true">JPG</button>
  </div>
  <p id="disk-estimate">Disk estimate: ~0.7 GB – 2.2 GB</p>
  <p id="settings-locked-note" hidden>Settings cannot be changed during a session.</p>
  <button id="btn-save-settings">Save</button>
</section>
```

### Disk estimate formatting helper

```js
function formatBytes(bytes) {
  const gb = bytes / (1024 ** 3);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(0)} MB`;
}
```
