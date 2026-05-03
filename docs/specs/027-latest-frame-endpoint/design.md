## UI States

N/A — no UI in this task. The endpoint is consumed by the dashboard's live preview `<img>` tag (wired in a later task) and can be hit directly by a browser for testing.

## Visual Assets

None.

## State to Manage

Server-side (module-level variable, not part of the `session` object):
- `latestFramePath: string | null` — absolute path to the most recently written frame file. Initialised to `null` on server boot. Updated in the frame-write completion callback. Never reset to `null` on session stop (see AC 9).

This variable lives alongside the session object in `server.js`.

## Interfaces

**HTTP endpoint:**
```
GET /latest-frame
  → 200  Content-Type: image/png  | image/jpeg   (binary frame data)
  → 404  Content-Type: text/plain                 ("No frames saved yet")
  → 404  Content-Type: text/plain                 ("Frame file not found")   — if file deleted after save
```

**Internal integration point — frame writer (T-13):**

After each successful `fs.writeFile` / `fs.promises.writeFile` call, the frame writer must execute:
```js
latestFramePath = absolutePathToSavedFrame;
```

**Express route registration:**
```js
app.get('/latest-frame', handleLatestFrame);
```

```js
function handleLatestFrame(req, res) {
  // 1. If latestFramePath is null → 404 "No frames saved yet"
  // 2. Derive Content-Type from file extension
  // 3. res.sendFile(latestFramePath) with error handler for ENOENT → 404
}
```
