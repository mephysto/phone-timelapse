## User Story

Given a session is running and the dashboard is open,
When the user clicks Stop (or a scheduled session ends naturally) and the server emits `session-ended`,
Then the Session Summary panel becomes visible and displays the session duration, frames captured, frames expected, and the number of gaps.

## Acceptance Criteria

1. The Session Summary panel is hidden (`display: none`) on initial page load.
2. On receiving `session-ended` with payload `{ summary }`, the panel is made visible.
3. The summary displays total session duration formatted as HH:MM:SS.
4. The summary displays frames captured (e.g. "142 frames captured").
5. The summary displays frames expected (e.g. "144 frames expected").
6. The summary displays the number of gaps (e.g. "2 disconnections").
7. If `summary.gaps` is 1, the text reads "1 disconnection" (singular).
8. If `summary.gaps` is 0, the text reads "No disconnections".
9. The panel remains visible after being shown — it is not dismissed automatically.
10. The Start and Stop buttons are both disabled when the summary is visible (session status is "stopped").
11. On receiving `status-update` when `session.status` is `"stopped"`, the summary panel is shown using data from the session state (not only from the `session-ended` event), so a page reload after a completed session still shows the summary.
12. On receiving `status-update` when `session.status` is `"idle"` or `"running"`, the summary panel remains hidden.

## Gotchas & Edge Cases

- The `session-ended` payload `summary` object shape must be defined or agreed with the server task (T-16 or equivalent) — at minimum it needs `duration` (seconds), `frameCount`, `expectedFrames`, `gapCount`. If the shape differs, this task breaks silently.
- Duration may be delivered as a number of seconds (integer) — format it as HH:MM:SS client-side, not as a pre-formatted string, to avoid locale issues.
- If `status-update` fires after `session-ended`, the panel must not be hidden again — the `status-update` handler must check `session.status === "stopped"` and keep/re-show the panel.
- The summary panel and the gap log panel both show session outcome data — the summary is high-level; do not duplicate the per-gap list there. Keep summary to four headline numbers only.
- There is currently no "reset" or "new session" button in the spec — the user must reload the page to start a new session after viewing the summary. This constraint should be documented in the UI.
