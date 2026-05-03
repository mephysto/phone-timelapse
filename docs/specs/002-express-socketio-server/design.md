## UI States

N/A — no UI in this task. A placeholder `public/index.html` is created only as a test fixture to confirm static file serving works.

## Visual Assets

None.

## State to Manage

The server itself is stateless at this stage. The only runtime data is the set of currently connected Socket.IO sockets, which Socket.IO manages internally via `io.sockets`.

Logging of connect/disconnect events to `console.log` is sufficient for this task — no persistent state needed yet.

## Interfaces

### Module imports

```js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
```

### Server construction

```js
const app = express();
const server = http.createServer(app);
const io = new Server(server);
```

### Static file middleware

```js
app.use(express.static('public'));
```

### Server startup

```js
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```

### Socket.IO connection handler (stub)

```js
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
```

### HTTP endpoints (this task)

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/*` | `express.static('public')` | Serve any file from `public/` |

Socket.IO events handled in this task: `connection`, `disconnect` (logging only).
