## User Story

Given a session is running and the dashboard is open,
When the phone disconnects from the server and later reconnects,
Then the Gap Log panel adds a new entry showing the disconnection time, and updates that entry with the gap duration and missed frame count once the phone reconnects.

## Acceptance Criteria

1. The Gap Log panel contains a scrollable list element (e.g. `<ul id="gap-log">`).
2. Entries are ordered newest-first — each new entry is prepended to the top of the list.
3. On receiving `gap-started` with payload `{ at }`, a new list item is added at the top reading: "Disconnected at HH:MM:SS" where HH:MM:SS is formatted from `at`.
4. The entry added in criterion 3 is marked with a unique identifier (e.g. a `data-gap-id` attribute using the `at` timestamp as a key) so it can be found and updated later.
5. On receiving `gap-ended` with payload `{ from, to, missed }`, the entry matching `from` is updated to read: "Gap: HH:MM:SS → HH:MM:SS (N frames missed)" where times are formatted from `from` and `to`.
6. If `missed` is 1, the text reads "1 frame missed" (singular); if 0 or more than 1, "N frames missed" (plural).
7. Entries are never removed from the log during a session — they accumulate.
8. On receiving `status-update`, any gaps in `session.gaps` are rendered as fully resolved entries (the `gap-ended` format) without a preceding `gap-started` partial entry.
9. If the dashboard connects mid-session after a `gap-started` was emitted but before `gap-ended`, the partial entry from `status-update` (if present) is shown as "Disconnected at HH:MM:SS (ongoing)".
10. The list is scrollable and constrained to a maximum height — new entries at the top are visible without scrolling.
11. When no gaps have occurred, the panel shows placeholder text: "No disconnections recorded."

## Gotchas & Edge Cases

- `gap-started` and `gap-ended` payloads carry ISO date strings — parse with `new Date()` before formatting.
- The `data-gap-id` key should be the raw `at` / `from` timestamp string (not a reformatted value) so the lookup is exact.
- There is no guaranteed `gap-started` event before a `gap-ended` if the dashboard connects late — the `status-update` path (criterion 8) must be able to render complete entries without having seen `gap-started` first.
- An "ongoing" gap (phone currently disconnected when dashboard loads) may not appear in `session.gaps` at all, or may appear as a partial entry depending on server implementation — document the expected server behaviour and handle both cases defensively.
- Time formatting should produce zero-padded `HH:MM:SS` using `toLocaleTimeString` or manual padding — avoid locale-dependent output that could produce `"9:05:03 AM"` instead of `"09:05:03"`.
- Prepending to the list with `list.prepend(item)` is more reliable than `insertBefore` and avoids index management.
