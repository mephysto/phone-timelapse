# Review — T-09 · Phone Status UI
Status: PASS

## Acceptance Criteria Results

| # | Criteria (condensed) | Result | Notes |
|---|----------------------|--------|-------|
| 1 | Connection dot visible at all times (green/red) | ✅ PASS | `#status-dot` is now in a flex header row directly inside `#status-overlay` (sibling to `#capture-ui`), not inside `#capture-ui`. It becomes visible as soon as `showStatus()` is called (immediately after arming), covering both the waiting state and the running state. |
| 2 | Countdown timer counts down from session interval | ✅ PASS | `startCountdown()` uses `setInterval` and updates `#countdown` each second. |
| 3 | Countdown resets immediately on `capture` event | ✅ PASS | `capture` handler calls `startCountdown(sessionInterval)`, which clears the previous interval first. |
| 4 | "Last captured" shows time in HH:MM:SS format | ✅ PASS | `toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })` produces `HH:MM:SS`; displayed as `Last: HH:MM:SS`. |
| 5 | "Last captured" updates on `frame-ack` using payload `timestamp` | ✅ PASS | `frame-ack` handler reads `{ timestamp }`, formats it, and sets `lastCapturedEl.textContent`. |
| 6 | "Frame saved" overlay appears on `frame-ack` | ✅ PASS | `flashFrameSaved()` is called inside the `frame-ack` handler. |
| 7 | "Frame saved" overlay fades out within 1.5 s | ✅ PASS | `flashFrameSaved()` removes `.visible`, forces reflow with `void el.offsetWidth`, adds `.visible` (instant show via `transition: none`), then removes `.visible` after 50 ms — handing control back to the base `transition: opacity 1.5s ease` rule. Logic is correct and handles rapid re-triggering. |
| 8 | Stop button is visible on the phone page | ✅ PASS | `#stop-btn` exists in the DOM inside `#capture-ui`; visible whenever the live capture UI is shown (session running). |
| 9 | Stop button emits `stop-session` and disables to prevent double-emit | ✅ PASS | Click handler sets `stopBtn.disabled = true` before calling `socket.emit('stop-session')`. |
| 10 | Countdown shows "--" before first `capture` received | ✅ PASS | Initial HTML is `<span id="countdown">--</span>`; `startCountdown` is only called from within the `capture` handler. |
| 11 | Portrait overlay shown via CSS-only `@media (orientation: portrait)` | ✅ PASS | `@media (orientation: portrait) { #portrait-overlay { display: flex; } }` is the sole mechanism; `z-index: 100` covers all other UI. |
| 12 | `capture` handler returns before setting `capturing = true` in portrait | ✅ PASS | `if (window.matchMedia('(orientation: portrait)').matches) return;` is the first line of the handler, before the `capturing` guard and before `capturing = true`. |
| 13 | `status-update` with `session.status === 'idle'` shows waiting message | ✅ PASS | `socket.on('status-update', ...)` checks `session.status === 'idle'` and calls `showWaiting()`, which unhides `#waiting-msg` and hides `#capture-ui`. |
| 14 | `session-started` replaces waiting message with live capture UI | ✅ PASS | `socket.on('session-started', ...)` calls `showCaptureUi()`, which hides `#waiting-msg`, adds `.visible` to `#capture-ui`, and re-enables the stop button. |

## Verdict

PASS — all 14 acceptance criteria satisfied.

## Fix Confirmed

The previous PARTIAL verdict was caused solely by AC 1: `#status-dot` was a child of `#capture-ui` (`display: none` until a session is running). The fix restructures `#status-overlay` to include a flex header row containing both `#status-dot` and `#waiting-msg`, with `#capture-ui` as a separate sibling below. `#status-dot` is now visible for the entire lifetime of the status overlay — from the moment the camera is armed, through the idle waiting state, and throughout any running session. No JS changes were required; the existing `connect`/`disconnect` handlers correctly update `statusDot.className`.

---

_Result key: ✅ PASS · ❌ FAIL · ⚠️ MANUAL (requires physical device or environment — deferred to T-30)_
