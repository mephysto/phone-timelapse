## User Story

Given the phone page has lost its WiFi connection during an active session,
When the connection drops,
Then a "Reconnecting…" banner appears on screen and the client attempts to reconnect with exponential backoff; once the connection is restored the banner disappears and capture events resume normally.

## Acceptance Criteria

1. When the Socket.IO connection is lost, a "Reconnecting…" banner becomes visible on the phone page within one second.
2. The client attempts to reconnect automatically; it does not require a page refresh.
3. Reconnection attempts use exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped), 30s, … between attempts.
4. The maximum delay between reconnection attempts does not exceed 30 seconds.
5. When the connection is re-established, the "Reconnecting…" banner is hidden.
6. After reconnection, the phone resumes listening for `capture` events without any additional user action.
7. After reconnection, the connection status dot updates to the connected (green) state.
8. The reconnection logic does not require custom timer code — it uses Socket.IO client's built-in reconnection options.

## Gotchas & Edge Cases

- Socket.IO's default reconnection settings may not match the required backoff; the options `reconnectionDelay`, `reconnectionDelayMax`, and `reconnectionAttempts` must be explicitly set.
- `reconnectionFactor` controls the multiplier for exponential backoff in Socket.IO; it should be set to `2`.
- A `disconnect` event fires for intentional disconnects (e.g. server restart) as well as network drops — the banner should appear in all cases.
- The `connect_error` event fires on failed attempts but is separate from `disconnect`; showing the banner on `disconnect` alone is sufficient.
- If the phone navigates away (page unload), the socket should be cleanly disconnected rather than left to retry indefinitely.
- After a long reconnection gap, the server's session may have ended; the phone UI should be able to handle a reconnect where no session is active (the capture event simply won't arrive).
- The `capturing` flag from T-08 may be left as `true` if a disconnect happens mid-encode; it should be reset to `false` on disconnect.
