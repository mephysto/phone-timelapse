## UI States

**Connected (normal):**
- "Reconnecting…" banner: hidden
- Status dot: green (handled by T-09)
- All other UI elements: normal

**Disconnected / attempting reconnect:**
- "Reconnecting…" banner: visible, full-width, clearly readable
- Status dot: red (handled by T-09)
- Countdown timer: paused (no new `capture` events are arriving)
- Capture functionality: suspended until reconnect

**Reconnected:**
- "Reconnecting…" banner: hidden (transitions out or snaps hidden)
- Status dot: green
- Capture listener: active and ready

## Visual Assets

None — the banner is text-only, styled with CSS.

## State to Manage

- The Socket.IO client connection state itself is the source of truth; no extra boolean is needed beyond what Socket.IO manages internally.
- `capturing: boolean` (from T-08) — must be reset to `false` on `disconnect` to unblock future captures after reconnection.

## Interfaces

**Socket.IO client initialisation options:**

```js
const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1_000,       // start at 1s
  reconnectionDelayMax: 30_000,   // cap at 30s
  reconnectionFactor: 2,          // double each attempt
})
```

**Socket.IO events consumed (phone side):**

```
connect     ←  Socket.IO  (built-in)  → hide banner, set dot green, reset capturing flag
disconnect  ←  Socket.IO  (built-in)  → show banner, set dot red, reset capturing flag
```

**DOM elements required:**

```html
<div id="reconnecting-banner">Reconnecting…</div>
```

**CSS:**

```css
#reconnecting-banner {
  display: none;   /* or visibility: hidden */
}
#reconnecting-banner.visible {
  display: block;
}
```
