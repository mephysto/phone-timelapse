## UI States

**QR code loaded** — `<img src="/qr">` has loaded successfully. The scannable QR code image is displayed at a legible size (minimum 180 × 180 px). Label and note are visible below the image.

**QR code failed** — The `/qr` endpoint returned an error or the network request failed. The browser shows a broken-image icon. No JS error handling is shown — this is an infrastructure failure state. The label and note remain visible.

The QR Code panel has no other interactive states; it is display-only and does not respond to session state changes.

## Visual Assets

- `/qr` — server-generated PNG image. Dimensions determined by the `qrcode` library defaults; should be at least 200 × 200 px for reliable scanning. Background: white. Foreground: black. No logo overlay.

## State to Manage

None. The QR Code panel is entirely static after initial render. The image `src` never changes during the page's lifetime. No JS state is required.

## Interfaces

### HTTP endpoint

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| `GET` | `/qr` | `image/png` | Returns a QR code PNG encoding the phone page URL |

### Server-side generation

```js
const qrcode = require('qrcode');

// Called once at server startup or lazily on first /qr request
async function generateQrPng(localIp, port) {
  const url = `http://${localIp}:${port}/phone`;
  return qrcode.toBuffer(url, { type: 'png', width: 300 });
}

app.get('/qr', async (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.send(await getQrBuffer()); // cached buffer
});
```

### HTML structure (panel)

```html
<section id="panel-qr">
  <img src="/qr" alt="QR code for phone camera page" width="200" height="200">
  <p>Scan to open camera on your phone</p>
  <p class="note">Phone must be on the same WiFi network as this PC</p>
</section>
```

### Socket.IO events

None — this panel does not interact with Socket.IO.
