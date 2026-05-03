## UI States

**Connecting** — Socket.IO has not yet emitted `connect`. All panels show skeleton/placeholder content. A connection indicator (e.g. a small dot in the corner) shows grey/amber.

**Connected, idle** — `status-update` received with `session.status === "idle"`. All panels are populated with initial values. Status badge reads "Idle".

**Connected, running** — `session.status === "running"`. All panels are active, live timers ticking, thumbnail refreshing.

**Connected, stopped** — `session.status === "stopped"`. Session summary panel is visible; stats and timers are frozen.

**Disconnected** — Socket.IO emits `disconnect`. Connection indicator turns red. The UI does not clear — it shows stale data until reconnection.

## Visual Assets

None. The shell establishes layout only; no images or icons are introduced in this task.

## State to Manage

The shell itself manages one piece of top-level state: the current session object. All other panel components derive their display from this object.

```js
let session = {
  status: 'idle',          // 'idle' | 'running' | 'stopped'
  startTime: null,
  scheduledStart: null,
  scheduledEnd: null,
  interval: 30,
  format: 'jpg',
  outputDir: '',
  frameCount: 0,
  expectedFrames: 0,
  gaps: [],
  lastCaptureAt: null,
};
```

The session object is overwritten wholesale on each `status-update`. Individual fields are patched by subsequent events (`frame-saved` increments `frameCount`, etc.).

## Interfaces

### Socket.IO event consumed

| Event | Direction | Payload | Action |
|-------|-----------|---------|--------|
| `status-update` | Server → Dashboard | `{ session }` | Overwrite local session state; call all panel render functions |

### Socket.IO events emitted

None in this task — the shell only receives.

### HTTP endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Server must return `dashboard.html` with HTTP 200 |

### Panel element IDs (contract for subsequent tasks)

| Panel | Element ID |
|-------|-----------|
| Status | `panel-status` |
| Live Preview | `panel-preview` |
| Stats | `panel-stats` |
| Settings | `panel-settings` |
| QR Code | `panel-qr` |
| Gap Log | `panel-gap-log` |
| Session Summary | `panel-summary` |

### Server-side: join dashboard room on connect

```js
io.on('connection', (socket) => {
  socket.join('dashboard');
  socket.emit('status-update', { session: getCurrentSession() });
});
```
