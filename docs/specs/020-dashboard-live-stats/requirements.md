## User Story

Given a session is running and the dashboard is open,
When frames are captured and saved by the server,
Then the Stats panel updates in real time showing the current frame count, the countdown to the next capture, the session elapsed time, and the progress bar.

## Acceptance Criteria

1. The Stats panel displays a frame count that increments by 1 each time a `frame-saved` event is received.
2. The Stats panel displays a countdown timer (in whole seconds) counting down from `session.interval` to 0, reset to `session.interval` on each `frame-saved` event.
3. The countdown is driven by a client-side `setInterval` running every 1 000 ms — it does not rely on server events to tick.
4. The countdown displays "0s" (not negative) when it reaches zero, and does not go below zero.
5. The Stats panel displays a session elapsed time (HH:MM:SS) that increments every second from the `session.startTime` received in `status-update` or `session-started`.
6. The elapsed time is driven by a client-side `setInterval` running every 1 000 ms.
7. The Stats panel displays a progress bar whose fill width equals `frameCount / expectedFrames * 100%`, clamped to `[0, 100]`.
8. `expectedFrames` is taken from the session state (`session.expectedFrames`); if 0 or null the progress bar shows 0%.
9. On receiving `status-update`, all four values are initialised from the session state (not reset to zero).
10. When the session is `"idle"` or `"stopped"`, the countdown timer is stopped and displays a dash ("—") or zero.
11. When the session is `"stopped"`, the elapsed time ticker stops at the final value.
12. All `setInterval` timers are cleared when the session ends to prevent memory leaks.

## Gotchas & Edge Cases

- `session.startTime` arrives as an ISO string from JSON serialisation — parse it with `new Date(session.startTime)` before computing elapsed time.
- `expectedFrames` may be 0 when no scheduled end time is set; guard against division by zero in the progress bar calculation.
- The countdown timer will drift slightly from the server's actual capture schedule — this is cosmetic and acceptable; no synchronisation is required.
- If the dashboard reconnects mid-session, `status-update` carries `frameCount` and `lastCaptureAt`; use `lastCaptureAt` to reconstruct the countdown position (`interval - (now - lastCaptureAt) / 1000`), clamped to `[0, interval]`.
- Multiple `setInterval` calls without clearing previous ones will cause duplicate ticks if the component is re-initialised on reconnect — always clear before re-starting.
- The elapsed time display should use `String.prototype.padStart(2, '0')` for consistent HH:MM:SS formatting.
