## User Story

Given the full system is running with a real iPhone in Safari connected over WiFi,
When a 5-minute test session is executed with deliberate reconnection and gap scenarios,
Then all functional requirements (frame capture, gap detection, session log, FFmpeg output) are verified against real hardware and any defects are documented.

## Acceptance Criteria

1. Frames are saved to disk at the configured interval (±2 seconds tolerance) with sequential, zero-padded filenames.
2. A deliberate phone disconnection followed by reconnection is successfully handled: the socket reconnects, capture resumes, and the gap is recorded in `session.gaps`.
3. The session log (`session.log`) is written to the output directory when the session ends, containing: start time, end time, frame count, gap list, and interval.
4. Running the FFmpeg command from the README against the captured frames produces a playable `.mp4` video file with no encoding errors.
5. The video contains the expected number of frames (matching `frameCount` in the session log) and plays without visual corruption.
6. The dashboard displays accurate live stats throughout: frame count, elapsed time, and disk usage all update after each frame.
7. The `/latest-frame` endpoint serves the most recent frame image correctly at all points during the session.
8. Auto-start and auto-stop (if configured) trigger within 1 minute of the scheduled time.
9. No unhandled exceptions appear in the server console output during the test.
10. All issues found during testing are documented in a `issues.md` file in the test output folder or as notes in this task's tasks checklist.

## Gotchas & Edge Cases

- iOS auto-lock: if the phone screen locks mid-session, frames stop — testers must keep the screen on (adjust auto-lock to "Never" in iOS Settings during the test).
- WiFi stability: run the test on a stable network; if the test environment has intermittent WiFi, note that in findings rather than treating it as a bug.
- FFmpeg path: FFmpeg must be installed and on the PATH in the WSL environment — verify with `ffmpeg -version` before the test.
- Frame count mismatch: `expectedFrames` is calculated from elapsed time / interval; the actual count may be lower due to gaps or late reconnection — this is expected behaviour, not a bug.
- The output directory must not already contain frames from a previous session (or the FFmpeg command will interleave old and new frames) — delete or rename prior output before testing.
- WSL networking: the server binds to the WSL LAN IP; if the Windows host firewall blocks inbound TCP on port 3000, the phone cannot connect. Verify firewall rules before the test.
- Safari permission: camera permission must be granted on the phone page; if Safari shows a permission dialog, the tester must accept it before the session start is useful.
