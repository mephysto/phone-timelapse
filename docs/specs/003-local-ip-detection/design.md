## UI States

N/A — no UI in this task. Output is terminal-only.

## Visual Assets

None.

## State to Manage

A single module-level constant `LOCAL_IP` is derived once at startup and never changes during the server's lifetime.

```
LOCAL_IP: string   — the detected IPv4 address, e.g. "192.168.1.42"
                     falls back to "127.0.0.1" if no LAN address is found
```

This value is used by:
- The startup log messages (this task)
- The QR code endpoint (T-04)

## Interfaces

### IP detection function

```js
/**
 * Returns the first non-loopback IPv4 address found on this machine,
 * or '127.0.0.1' if none is available.
 */
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    if (!iface) continue;
    for (const entry of iface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}
```

### Terminal output format

```
Dashboard: http://192.168.1.42:3000
Phone:     http://192.168.1.42:3000/phone
```

The two lines should align on the URL column (pad "Phone:" with spaces to match "Dashboard:" length).

### Module-level usage

```js
const os = require('os');
const LOCAL_IP = getLocalIp();
```

`LOCAL_IP` is referenced in the `server.listen` callback to print the URLs, and exported/referenced later in the QR code route.

No HTTP endpoints are introduced by this task.
