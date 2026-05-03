## User Story

Given a developer or photographer who has never used this project,
When they read the README at the project root,
Then they can set up and run a full timelapse session without needing to ask questions or read the source code.

## Acceptance Criteria

1. The README contains a "Requirements" section listing: Node.js (version), a PC and iPhone on the same WiFi network, FFmpeg (for post-processing), and approximately how much free disk space is needed.
2. The README contains a "Setup" section with numbered steps: clone the repo, `npm install`, `node server.js`.
3. The README explains how to connect the phone: open the dashboard, find the QR code, scan it with the iPhone camera, and open the link in Safari.
4. The README explains how to start a session: configure interval and format, press Start, leave the phone screen on.
5. The README contains a "Post-processing" section with the exact FFmpeg command to compile frames into a video.
6. The FFmpeg command in the README matches the canonical form: `ffmpeg -framerate 30 -i ./output/YYYY-MM-DD/frame_%04d.png -c:v libx264 -pix_fmt yuv420p timelapse.mp4`.
7. The README contains a "Known Limitations" section covering: getUserMedia iOS Safari resolution cap (~1080p), wake-lock not guaranteed on all iOS versions, disk space requirements for PNG vs JPG.
8. The README contains disk space estimates: PNG ~3–5 MB/frame (~4.3–7.2 GB for 12 h at 30 s interval); JPG ~0.5–1.5 MB/frame (~0.7–2.2 GB for the same session.
9. The README documents the output directory structure: `./output/YYYY-MM-DD/frame_0001.png` (sequential, zero-padded to 4 digits).
10. The README is written so that someone unfamiliar with the project can complete setup end-to-end without consulting any other file.
11. The README contains an "HTTPS Setup" section (before "Running a session") with step-by-step mkcert instructions: install mkcert, run `mkcert -install`, generate the cert for the local IP and localhost, install the mkcert CA on the iPhone via Settings → General → VPN & Device Management.
12. The README includes the FFmpeg command to generate `public/nosleep.mp4`: `ffmpeg -f lavfi -i color=c=black:size=2x2:duration=1 -c:v libx264 -profile:v baseline -level 3.0 -pix_fmt yuv420p -an -movflags +faststart public/nosleep.mp4`, with a note that this is a one-time step and the file should be committed to the repo.
13. The README notes that Windows users (including WSL2 with mirrored networking) may need to allow port 3000 through Windows Firewall: "If your phone cannot reach the dashboard, open Windows Firewall → Advanced Settings → Inbound Rules → New Rule → Port 3000 → Allow."

## Gotchas & Edge Cases

- Node.js version: specify a minimum version that supports the `fs/promises` API and modern ES syntax used in the project (Node 18+ is safe).
- WSL users need to know that `node server.js` is run inside WSL but the browser dashboard is opened in Windows — clarify this if the project is WSL-specific.
- The phone URL printed to the console (and shown as QR) uses the WSL host's LAN IP, not `localhost` — the README should explain why `localhost` does not work from the phone.
- FFmpeg must be installed separately; the README should note this and point to ffmpeg.org.
- The README should not document internal implementation details (Socket.IO events, server internals) — it is an operator-facing document, not a developer guide.
