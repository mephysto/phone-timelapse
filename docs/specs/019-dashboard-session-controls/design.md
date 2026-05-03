## UI States

**Idle** — Start button enabled, Stop button disabled. Status badge class `status--idle`, text "Idle".

**Running** — Start button disabled, Stop button enabled. Status badge class `status--running`, text "Running".

**Stopped** — Both buttons disabled. Status badge class `status--stopped`, text "Stopped".

**Socket disconnected** — Both buttons remain in their last-known state visually, but the socket cannot emit. The connection indicator (from T-17 shell) signals the disconnection. No additional button state change is required.

## Visual Assets

None. Button and badge styling is handled with CSS only — no image assets.

## State to Manage

The controls derive all their state from the top-level `session.status` string managed by the dashboard shell (T-17). No additional local state is needed.

When `session-started` or `session-ended` events are received, update `session.status` locally and re-render the controls without waiting for a full `status-update`.

```js
// Minimal local state update on targeted events
socket.on('session-started', () => {
  session.status = 'running';
  renderControls(session.status);
});

socket.on('session-ended', () => {
  session.status = 'stopped';
  renderControls(session.status);
});
```

## Interfaces

### Socket.IO events emitted

| Event | Payload | When |
|-------|---------|------|
| `start-session` | `{}` | User clicks Start while status is idle |
| `stop-session` | `{}` | User clicks Stop while status is running |

### Socket.IO events consumed

| Event | Payload | Action |
|-------|---------|--------|
| `status-update` | `{ session }` | Set button states from `session.status` |
| `session-started` | `{ startTime, outputDir }` | Set status to "running", re-render |
| `session-ended` | `{ summary }` | Set status to "stopped", re-render |

### Render function signature

```js
function renderControls(status) {
  // status: 'idle' | 'running' | 'stopped'
  btnStart.disabled = status !== 'idle';
  btnStop.disabled  = status !== 'running';
  badge.dataset.status = status;
  badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}
```

### HTML structure

```html
<section id="panel-status">
  <span id="status-badge" data-status="idle">Idle</span>
  <button id="btn-start">Start</button>
  <button id="btn-stop" disabled>Stop</button>
</section>
```
