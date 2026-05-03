## UI States

N/A — no UI in this task.

## Visual Assets

None.

## State to Manage

No runtime state. This task is purely configuration and file system scaffolding.

The choices made here become fixed constraints for all later tasks:

- **Module system** — CommonJS (`require`) or ES modules (`import`). Must be decided once. Recommended: CommonJS (no transpile step, simpler for a no-build project).
- **Node version assumption** — `--watch` flag requires Node 18+. Record this in a comment or in `package.json` `engines` field.

## Interfaces

### `package.json` scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  }
}
```

### `package.json` dependencies (minimum)

```json
{
  "dependencies": {
    "express": "^4.x",
    "socket.io": "^4.x",
    "qrcode": "^1.x"
  }
}
```

### Folder structure produced by this task

```
phone-timelapse/
├── docs/
├── output/          ← gitignored
├── public/
├── .gitignore
├── package.json
└── package-lock.json
```

### `.gitignore` minimum entries

```
node_modules/
output/
```
