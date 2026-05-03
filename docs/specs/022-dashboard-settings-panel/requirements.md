## User Story

Given the session is idle and the dashboard is open,
When the user changes interval, start/end times, or format in the Settings panel and submits,
Then the new settings are sent to the server via `update-settings`, the server acknowledges them, and the disk estimate updates live as the user types.

## Acceptance Criteria

1. The Settings panel contains: an interval number input (seconds, minimum 1), a start time input (`type="time"`), an end time input (`type="time"`), and a format toggle with two options: "PNG" and "JPG".
2. All inputs are disabled when `session.status` is not `"idle"`.
3. All inputs are enabled when `session.status` is `"idle"`.
4. The inputs are populated with current server values on receiving `status-update`.
5. Changing the interval input live-updates the disk space estimate without submitting.
6. Changing the format toggle live-updates the disk space estimate without submitting.
7. The disk estimate is displayed as a range: e.g. "~4.3 GB – 7.2 GB" for PNG, "~0.7 GB – 2.2 GB" for JPG.
8. The estimate formula is: `(sessionDurationSeconds / intervalSeconds) * perFrameSizeBytes`, where PNG uses 3–5 MB/frame and JPG uses 0.5–1.5 MB/frame.
9. If no end time is set, session duration is treated as 12 hours (43 200 s) for the estimate.
10. If start time equals end time, or end time is before start time, the estimate shows "—" and an inline validation message is displayed.
11. Clicking a "Save" or "Apply" button emits `update-settings` with payload `{ interval, format, start, end }` where `start` and `end` are `"HH:MM"` strings or `null`.
12. The submit button is disabled when the session is not idle.
13. On receiving `status-update` with the new values after submission, the inputs reflect the confirmed server state.
14. When the interval is set below 5 seconds, an inline warning is shown: "Intervals below 5s may cause frame gaps on older devices." This is a warning only — the user may still save the setting.
15. The start time field is optional. When left empty, the session starts immediately when the Start button is pressed; only the end time is enforced.
16. When a start time is entered and it is in the future (today or tomorrow), the panel shows a live human-readable preview below the input: "Will start in 5h 32m" or "Will start tomorrow at 06:00". This updates every minute.
17. Start time comparison uses local time. A time that has already passed today is treated as "tomorrow" — the preview shows "Will start tomorrow at HH:MM".

## Gotchas & Edge Cases

- The `interval` input should be `type="number"` with `min="5"` — but also validate in JS because the browser's built-in validation only fires on form submit, not on custom button clicks.
- Time inputs return `"HH:MM"` strings; if the field is empty, the value is `""` — send `null` in the payload for empty time fields, not an empty string.
- The disk estimate must update on `input` events (as the user types), not only on `change` events, so the feedback is immediate.
- If `session.interval` is 0 (malformed state), guard against division by zero in the estimate.
- The format toggle should use radio inputs or a `<button>` pair with `aria-pressed` — not a `<select>`, which is less scannable for a two-option choice.
- Disabling inputs via the `disabled` attribute also prevents them from submitting via form — this is fine since the submit is handled in JS, not via native form submission.
- `update-settings` has no server ack in the current design; treat the subsequent `status-update` as confirmation.
