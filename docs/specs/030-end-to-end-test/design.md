## UI States

N/A — no UI in this task. This task validates the UI of the entire system; it does not introduce new UI states.

## Visual Assets

None. The test may produce screenshots as supporting evidence, but these are optional and not required artefacts.

## State to Manage

N/A — this is a manual test task. State is managed by the system under test.

## Interfaces

This task exercises all existing interfaces end-to-end. Key ones under test:

**HTTP:**
```
GET /             → dashboard loads in browser
GET /phone        → phone page loads in Safari
GET /latest-frame → returns current frame image during session
GET /qr           → QR code rendered and scannable
```

**Socket.IO (observed via dashboard):**
```
'session-started'    → dashboard transitions to running state
'frame-saved'        → frame count and disk usage increment
'gap-detected'       → gap appears in dashboard gap list after reconnection
'session-ended'      → dashboard transitions to stopped state
```

**File system (verified after session):**
```
./output/YYYY-MM-DD/frame_0001.{png|jpg}   → first frame exists
./output/YYYY-MM-DD/frame_NNNN.{png|jpg}   → last frame exists, N matches frameCount
./output/YYYY-MM-DD/session.log            → log file exists and is valid JSON
```

**FFmpeg command (post-session):**
```
ffmpeg -framerate 30 -i ./output/YYYY-MM-DD/frame_%04d.png -c:v libx264 -pix_fmt yuv420p timelapse.mp4
```
Expected: exits 0, produces `timelapse.mp4`, file is playable.
