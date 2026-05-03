## UI States

N/A — no UI in this task. Session state lives entirely on the server.

## Visual Assets

None

## State to Manage

The canonical session state object, held in server memory:

```js
const session = {
  status: 'idle',           // 'idle' | 'running' | 'stopped'
  startTime: null,          // Date | null
  scheduledStart: null,     // "HH:MM" string | null
  scheduledEnd: null,       // "HH:MM" string | null
  interval: 30,             // seconds
  format: 'jpg',            // 'png' | 'jpg'
  outputDir: '',            // absolute path, set at session start
  frameCount: 0,
  expectedFrames: 0,
  gaps: [],                 // [{ from: Date, to: Date, missed: number }]
  lastCaptureAt: null,      // Date | null
}
```

**State transitions:**

```
idle ──startSession()──▶ running ──stopSession()──▶ stopped
                                                       │
                         ◀──────────startSession()─────┘
```

`startSession()` while `running`: rejected (no transition).
`stopSession()` while `idle`: rejected or no-op.

## Interfaces

**Functions exported from the session module (or defined in `server.js`):**

```js
/**
 * Starts a new session. Returns { ok: true } on success or
 * { ok: false, reason: string } if a session is already running.
 */
function startSession(options = {}) { ... }

/**
 * Stops the current session. Returns { ok: true } on success or
 * { ok: false, reason: string } if no session is running.
 */
function stopSession() { ... }

/**
 * Returns a shallow copy of the current session state.
 */
function getSession() { ... }
```

**Options accepted by `startSession()`:**

```js
{
  interval: number,          // seconds, optional, defaults to session.interval
  format: 'png' | 'jpg',    // optional, defaults to session.format
  scheduledStart: string,    // "HH:MM", optional
  scheduledEnd: string,      // "HH:MM", optional
}
```

**Reset behaviour on `startSession()`:**

```js
session.status      = 'running'
session.startTime   = new Date()
session.frameCount  = 0
session.expectedFrames = 0
session.gaps        = []
session.lastCaptureAt = null
// outputDir set by T-14
```
