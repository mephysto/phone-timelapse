## User Story

Given the phone page is open during an active session,
When the server sends capture commands and acknowledgements,
Then the phone UI continuously shows the connection status, a countdown to the next capture, the timestamp of the last captured frame, and a transient confirmation when a frame is saved.

## Acceptance Criteria

1. A connection status indicator is visible at all times showing a green dot when connected and a red dot when disconnected or reconnecting.
2. A countdown timer displays the number of seconds remaining until the next capture, counting down from the session interval.
3. The countdown resets to the session interval immediately after a `capture` event is received.
4. A "Last captured" timestamp shows the time of the most recent capture in `HH:MM:SS` format (e.g. "Last: 14:23:01").
5. The "Last captured" timestamp updates each time a `frame-ack` event is received, using the `timestamp` field from the payload.
6. On receiving `frame-ack`, a "Frame saved" overlay text appears on screen.
7. The "Frame saved" overlay fades out and becomes invisible within 1.5 seconds of appearing.
8. A Stop button is visible on the phone page.
9. Clicking the Stop button emits a `stop-session` Socket.IO event to the server.
10. The countdown timer does not run (or shows "--") before the first `capture` event is received.

11. When the phone is in portrait orientation, `#portrait-overlay` is displayed and all other capture UI (countdown, last captured, stop button) is hidden beneath it. This is CSS-only via `@media (orientation: portrait)`.
12. If a `capture` event arrives while the phone is in portrait orientation, it is skipped (the `capturing` flag is not set; the server's gap detection handles the missed frame).
13. When the socket is connected but `session.status` is `'idle'` (received via `status-update`), the status overlay shows "Waiting for session to start…" instead of the countdown/last-captured UI.
14. When the session transitions to `'running'` (via `session-started` event), the "Waiting" message is replaced by the live capture UI (countdown resets, stop button becomes active).

## Gotchas & Edge Cases

- The countdown interval (using `setInterval`) must be cleared and restarted each time a `capture` event is received to avoid drift accumulation over a long session.
- The session interval length is not known to the phone page until the first `capture` event arrives; the UI must handle an uninitialised state.
- The `timestamp` in `frame-ack` is an ISO string or Unix ms value from the server — format it locally for display rather than relying on the server's locale.
- CSS fade-out must use a class toggle or animation, not `setTimeout` calling `display: none`, to allow the transition to play fully.
- If multiple `frame-ack` events arrive in quick succession, each one should restart the fade-out animation from the beginning rather than stacking.
- On iOS, `Date` formatting with `toLocaleTimeString` is reliable; avoid manual string splitting of ISO timestamps.
- The Stop button should be disabled or visually indicate it has been pressed to prevent double-emits.
