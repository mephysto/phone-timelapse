## UI States

**Empty** — No gaps have been logged. The list is empty and a placeholder element reads "No disconnections recorded."

**Partial entry (gap open)** — A `gap-started` event has been received but the corresponding `gap-ended` has not yet arrived. The top entry shows "Disconnected at HH:MM:SS". This is the active, unresolved gap.

**Resolved entry** — A `gap-ended` event has been received. The entry is updated in place to show "Gap: HH:MM:SS → HH:MM:SS (N frames missed)".

**Multiple entries** — Multiple resolved entries stacked newest-first. The panel scrolls if there are enough entries to exceed the maximum height.

## Visual Assets

None.

## State to Manage

```js
// Map from gap start timestamp string → <li> DOM element
// Used to look up and update partial entries on gap-ended
const gapEntries = new Map(); // key: at (ISO string), value: <li> element
```

The map is populated on `gap-started` and used for lookup on `gap-ended`. On `status-update`, gaps from `session.gaps` are rendered directly as resolved entries — the map is not used for those.

## Interfaces

### Socket.IO events consumed

| Event | Payload | Action |
|-------|---------|--------|
| `gap-started` | `{ at }` | Prepend partial `<li>` entry; store in `gapEntries` map with key `at` |
| `gap-ended` | `{ from, to, missed }` | Look up `<li>` by key `from`; update text to resolved format |
| `status-update` | `{ session }` | Render all `session.gaps` as resolved entries; clear and rebuild list |

### Time formatting helper

```js
function formatTime(isoString) {
  const d = new Date(isoString);
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}
```

### Entry text formats

```
Partial:  "Disconnected at 09:15:42"
Resolved: "Gap: 09:15:42 → 09:17:03 (3 frames missed)"
          "Gap: 09:15:42 → 09:17:03 (1 frame missed)"
          "Gap: 09:15:42 → 09:15:58 (0 frames missed)"
```

### HTML structure

```html
<section id="panel-gap-log">
  <h2>Gap Log</h2>
  <ul id="gap-log" style="max-height: 200px; overflow-y: auto; list-style: none;">
    <!-- entries prepended here -->
  </ul>
  <p id="gap-log-empty">No disconnections recorded.</p>
</section>
```

### Entry creation

```js
function createGapEntry(atString) {
  const li = document.createElement('li');
  li.dataset.gapId = atString;
  li.textContent = `Disconnected at ${formatTime(atString)}`;
  return li;
}

function resolveGapEntry(li, from, to, missed) {
  const unit = missed === 1 ? 'frame' : 'frames';
  li.textContent = `Gap: ${formatTime(from)} → ${formatTime(to)} (${missed} ${unit} missed)`;
}
```
