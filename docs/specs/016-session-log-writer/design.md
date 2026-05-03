## UI States

N/A — no UI in this task. The log file is written to disk on the server.

## Visual Assets

None

## State to Manage

No new state is introduced by this task. The log writer reads from the existing `session` object at the moment `stopSession()` is called.

## Interfaces

**Helper: format a Date as `HH:MM:SS` in local time:**

```js
function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}
```

**Helper: format a Date as `YYYY-MM-DD` in local time:**

```js
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
```

**Helper: format duration in seconds as `Xh Ym Zs`:**

```js
function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3_600)
  const m = Math.floor((totalSeconds % 3_600) / 60)
  const s = totalSeconds % 60
  return `${h}h ${m}m ${s}s`
}
```

**Log content template:**

```
Phone Timelapse — Session Log
==============================
Date:     YYYY-MM-DD
Start:    HH:MM:SS
End:      HH:MM:SS
Duration: Xh Ym Zs

Frames captured:  <frameCount>
Frames expected:  <expectedFrames>
Gaps:             <gaps.length>

Gap #1
  From:   HH:MM:SS
  To:     HH:MM:SS
  Missed: N frame[s]

Gap #2
  ...
```

Note: the blank line before each `Gap #N` block is present only when gaps exist.

**Write call:**

```js
async function writeSessionLog(endTime) {
  if (!session.outputDir) return

  const content = buildLogContent(endTime)
  const logPath = path.join(session.outputDir, 'session.log')

  try {
    await fs.promises.writeFile(logPath, content, 'utf8')
  } catch (err) {
    console.error('Failed to write session log:', err)
  }
}
```

Called from `stopSession()` as:

```js
const endTime = new Date()
session.status = 'stopped'
await writeSessionLog(endTime)
```
