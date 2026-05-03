## UI States

N/A — this is a server-side HTTP endpoint. The response is a raw PNG image displayed directly by the browser. No interactive UI is introduced in this task.

The QR code may later be embedded in `dashboard.html` via an `<img src="/qr">` tag, but that is out of scope for this task.

## Visual Assets

None produced by this task. The QR code PNG is generated in memory on each request.

## State to Manage

This endpoint is stateless. It reads `LOCAL_IP` and `PORT` (both set at startup, treated as constants) and calls the `qrcode` library. No new state is introduced.

## Interfaces

### Dependencies

```js
const QRCode = require('qrcode');
```

### HTTP endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/qr` | Generates and serves a QR code PNG for the phone URL |

### Route handler

```js
app.get('/qr', async (req, res) => {
  const phoneUrl = `http://${LOCAL_IP}:${PORT}/phone`;
  try {
    const buffer = await QRCode.toBuffer(phoneUrl);
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    res.status(500).type('text').send(`QR generation failed: ${err.message}`);
  }
});
```

### `QRCode.toBuffer` signature (from `qrcode` package)

```js
QRCode.toBuffer(text: string, options?: object): Promise<Buffer>
```

Default options are sufficient. Relevant options if needed:
- `errorCorrectionLevel`: `'L' | 'M' | 'Q' | 'H'` (default `'M'`)
- `width`: pixel width of the output PNG (default auto-sized)

### Route registration order

This route must be registered after `express.static('public')` to avoid any hypothetical `public/qr` file shadowing it. In practice there will be no such file, but explicit ordering prevents confusion.
