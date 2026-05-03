## UI States

N/A — no UI in this task. Folder naming is a server-side operation at session start.

## Visual Assets

None

## State to Manage

- `session.outputDir: string` — set once per session by this logic; read by the frame writer (T-13) and log writer (T-16).

## Interfaces

**Helper function:**

```js
/**
 * Determines and creates the output directory for a new session.
 * Returns the absolute path of the created folder.
 * Throws if the folder cannot be created.
 *
 * @returns {string} absolute path
 */
function resolveOutputDir() {
  const now    = new Date()
  const year   = now.getFullYear()
  const month  = String(now.getMonth() + 1).padStart(2, '0')
  const day    = String(now.getDate()).padStart(2, '0')
  const base   = `${year}-${month}-${day}`

  const root   = path.resolve(process.cwd(), 'output')
  fs.mkdirSync(root, { recursive: true })

  let candidate = path.join(root, base)
  let suffix    = 2

  while (fs.existsSync(candidate)) {
    candidate = path.join(root, `${base} (${suffix})`)
    suffix++
  }

  fs.mkdirSync(candidate)
  return candidate
}
```

**Integration point:**

Called inside `startSession()` before the session state is marked as `'running'`:

```js
session.outputDir = resolveOutputDir()
```

**Date formatting:**
Use `Date` local methods (`getFullYear()`, `getMonth()`, `getDate()`) — do not use `toISOString()` as it returns UTC.

**Expected folder names:**

| Scenario | Resulting path |
|----------|----------------|
| First session of the day | `./output/2026-05-03/` |
| Second session same day | `./output/2026-05-03 (2)/` |
| Third session same day | `./output/2026-05-03 (3)/` |
