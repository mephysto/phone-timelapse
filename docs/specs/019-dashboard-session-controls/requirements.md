## User Story

Given the dashboard is open and connected to the server,
When the user clicks Start or Stop,
Then the appropriate Socket.IO event is emitted and the button states update to reflect the new session status.

## Acceptance Criteria

1. The Status panel contains a Start button and a Stop button.
2. Clicking Start emits `start-session` to the server (payload: `{}`).
3. Clicking Stop emits `stop-session` to the server (payload: `{}`).
4. When `session.status` is `"idle"`, Start is enabled and Stop is disabled.
5. When `session.status` is `"running"`, Stop is enabled and Start is disabled.
6. When `session.status` is `"stopped"`, both buttons are disabled.
7. The status badge in the Status panel reflects the current `session.status`: "Idle", "Running", or "Stopped".
8. On receiving `status-update`, the buttons and badge are updated to match the received session state.
9. On receiving `session-started`, the status updates to "Running" without waiting for a full `status-update`.
10. On receiving `session-ended`, the status updates to "Stopped" without waiting for a full `status-update`.
11. Clicking Start a second time while a session is already running has no effect (the button is disabled, so no event is emitted).
12. Disabled buttons must be visually distinct from enabled buttons (e.g. reduced opacity, `cursor: not-allowed`).

## Gotchas & Edge Cases

- Button disabled state must be set via the `disabled` attribute on `<button>`, not just via CSS — keyboard and form submission can still trigger click events on CSS-only "disabled" buttons.
- The status badge should use a data attribute or class to reflect state (e.g. `data-status="running"`) so CSS can style each variant without inline styles.
- `start-session` and `stop-session` payloads are empty objects `{}` — do not omit the argument entirely, as some Socket.IO versions may behave differently.
- There is no server-side ack for these events in the current design; the dashboard learns the new state from `session-started` / `session-ended` events.
- If the socket is disconnected when the user clicks, the emit will be queued by Socket.IO and sent on reconnect — this is acceptable behaviour, not a bug.
- "Stopped" is a terminal state per session; the user cannot restart without a page reload or a future "reset" feature. Spec defensively against double-clicks on Stop.
