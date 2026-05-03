## UI States

The stats panel on the dashboard gains one new row:

- **Session idle / before first frame**: row reads "Disk usage: 0 B" (zeroed on `session-started`).
- **Session running, frames arriving**: row updates after each `frame-saved` event; e.g. "Disk usage: 47.3 MB".
- **Session stopped**: row holds the final value until the next session starts.
- **Page reload mid-session**: value starts from zero and increments from the next `frame-saved` event onward (acceptable limitation).

The "Disk usage" label and value sit alongside existing stats: frame count, elapsed time, interval, expected frames.

## Visual Assets

None.

## State to Manage

**Server-side (on `session` object):**
- `session.totalBytes: number` — cumulative bytes of all successfully written frames in the current session. Initialised to `0` when a session starts. Incremented by the actual file size after each successful write.
- Included in the `session-started`, `session-ended`, and `session-state` broadcast payloads so that a dashboard reload can pick up the current total.

**Client-side (dashboard.js):**
- `let totalBytes = 0` — local accumulator, reset to `session.totalBytes` (from the server state) on `session-started` and on initial `session-state` receipt.
- Updated by `+= event.fileSize` on each `frame-saved` event.

## Interfaces

**Socket.IO event — emitted by server:**
```
'frame-saved'  {
  frameNumber: number,
  filePath: string,
  fileSize: number,   // <-- new field: actual bytes written (integer)
  timestamp: string,
}
```

**Session state object additions:**
```js
session.totalBytes: number  // included in all session-state broadcasts
```

**Client-side formatting helper:**
```js
function formatBytes(bytes) // Returns string e.g. "0 B", "512 B", "1.2 KB", "3.7 MB", "1.1 GB"
                            // Uses 1024-based divisions, one decimal place for values >= 1 KB
```

**Dashboard HTML element:**
```html
<span id="disk-usage">0 B</span>
```
Updated via `document.getElementById('disk-usage').textContent = formatBytes(totalBytes)`.
