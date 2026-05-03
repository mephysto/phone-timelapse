## UI States

### State 1: Initial (idle, not yet armed)
- Full-viewport page with a dark or neutral background.
- "Arm Camera" button centred in the viewport, clearly legible.
- Status overlay hidden.
- Socket.IO connected (invisible to user).

### State 2: (Future — defined here for reference only, not implemented in this task)
- Camera feed visible behind any overlay elements.
- "Arm Camera" button hidden.
- Status overlay visible with capture count and connection state.

Only State 1 is implemented in this task.

## Visual Assets

None. The page uses inline CSS or a `<style>` block — no external stylesheets or image assets in this task.

## State to Manage

The page-level JavaScript in this task manages only one piece of state:

- **Socket connection** — the `socket` object returned by `io()`. Used in later tasks to listen for and emit events.

No other state is tracked in this task.

## Interfaces

### HTTP endpoint

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/phone` | `express.static('public')` | Serves `public/phone.html` |

This endpoint requires no change to `server.js` — the existing `express.static('public')` middleware already handles it.

### Socket.IO (client side)

```js
const socket = io(); // connects to the page origin
```

No events are emitted or listened to in this task beyond the implicit `connect` and `disconnect`.

### DOM elements

| Element | ID / selector | Initial state |
|---------|--------------|---------------|
| Arm Camera button | `#arm-btn` | Visible, centred |
| Status overlay | `#status` | Hidden (`display: none`) |

### Minimum CSS rules

```css
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #111;
}
#arm-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* sizing, colour, font — stylistic choice */
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
#status {
  display: none;
}
```
