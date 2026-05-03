# Phone Timelapse

Capture long-running timelapses using an old iPhone as a camera. A Node.js server on your PC triggers frame captures over WebSocket; the phone runs a Safari web page that snapshots its camera and sends frames back to be saved to disk.

## Requirements

- **Node.js** 18 or later
- **iPhone** with Safari on the same WiFi network as the PC
- **mkcert** for HTTPS certificates (iOS requires HTTPS for camera access)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Generate HTTPS certificates

Camera access over getUserMedia requires HTTPS on iOS Safari.

```bash
# Install mkcert (https://github.com/FiloSottile/mkcert#installation)
mkcert -install
mkcert -key-file key.pem -cert-file cert.pem 192.168.x.x localhost 127.0.0.1
```

Replace `192.168.x.x` with your PC's actual LAN IP address.

On your iPhone: **Settings → General → VPN & Device Management** → trust the mkcert CA certificate.

### 3. Start the server

```bash
node server.js
# or with auto-restart on file changes:
npm run dev
```

The terminal will print the dashboard and phone URLs, e.g.:

```
Dashboard: https://192.168.1.50:3000
Phone:     https://192.168.1.50:3000/phone
```

### 4. Open the dashboard

Open the dashboard URL in a browser on your PC.

### 5. Connect the phone

Scan the QR code shown in the dashboard, or manually open the phone URL in Safari on your iPhone. Both devices must be on the same WiFi network.

Tap **Arm Camera** and grant camera permission.

### 6. Start a session

Click **Start** on the dashboard. The phone will receive capture commands at the configured interval. Frames are saved to `./output/YYYY-MM-DD/`.

## Scheduled sessions

Set a **Scheduled start** and **Scheduled end** time in the Settings panel. The server will automatically start and stop the session at those times. If the start time is already past for today, the session will start at that time tomorrow.

## Output

Frames are saved as `./output/YYYY-MM-DD/frame_0001.jpg` (sequential, gap-safe). If you run a second session on the same day the folder becomes `./output/YYYY-MM-DD (2)/`.

A `session.log` file is written to the output folder when the session ends.

## Compiling the timelapse with FFmpeg

```bash
ffmpeg -framerate 24 -i output/2026-05-04/frame_%04d.jpg -c:v libx264 -pix_fmt yuv420p timelapse.mp4
```

Adjust `-framerate` to control playback speed. For a 12-hour session at 30s intervals (1440 frames) played at 24 fps, the video will be about 60 seconds long.

## Known limitations

- **iOS camera resolution cap:** getUserMedia on iOS Safari tops out at ~1080p, not full sensor resolution.
- **Wake-lock not guaranteed:** The NoSleep MP4 trick prevents sleep on most iOS versions, but is not a system-level guarantee. Keep the phone plugged in and screen brightness up.
- **Single phone connection:** Only one phone can be connected at a time.
- **Local network only:** The server is not accessible from outside your LAN.
