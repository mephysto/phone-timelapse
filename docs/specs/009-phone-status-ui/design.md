## UI States

**Idle (not yet received a capture event):**
- Connection dot: green (connected) or red (disconnected)
- Countdown: shows "--" or is hidden
- Last captured: shows "--" or is hidden
- Frame saved overlay: hidden
- Stop button: visible and enabled

**Active (session running, between captures):**
- Connection dot: green
- Countdown: counting down from `interval` to 0 in whole seconds
- Last captured: shows time of most recent acknowledged frame, e.g. "Last: 14:23:01"
- Frame saved overlay: hidden (or fading out if recently acknowledged)
- Stop button: visible and enabled

**Frame just acknowledged (`frame-ack` received):**
- Frame saved overlay: visible, begins 1.5s fade-out immediately
- Last captured timestamp: updated to the new value
- Countdown: reset to full interval value

**Disconnected / reconnecting:**
- Connection dot: red
- Countdown: paused or hidden (capture events will not arrive)
- All other elements retain their last known values
- Stop button: visible (user may wish to stop the session)

**Stop pressed:**
- Stop button: disabled immediately to prevent double-emit
- No other UI changes on the phone side (server will handle session end)

## Visual Assets

- Green circle indicator (CSS only, no image asset needed)
- Red circle indicator (CSS only)
- "Frame saved" overlay text (styled with CSS opacity transition)

## State to Manage

- `connected: boolean` — drives the colour of the status dot; updated by Socket.IO `connect` / `disconnect` events.
- `interval: number | null` — the session capture interval in seconds; learned from the first `capture` event or a separate state sync; used to initialise the countdown.
- `countdown: number` — current seconds remaining; decremented each second by a `setInterval`; reset to `interval` on each `capture` event.
- `countdownTimer: ReturnType<setInterval> | null` — reference to the running countdown interval so it can be cleared and restarted.
- `lastCapturedAt: string | null` — formatted time string of the last `frame-ack` timestamp, displayed in the UI.

## Interfaces

**Socket.IO events consumed (phone side):**

```
capture    ←  Server  { format: 'png' | 'jpg' }
  → resets countdown; restarts countdownTimer

frame-ack  ←  Server  { frameNum: number, timestamp: string }
  → updates lastCapturedAt; triggers Frame saved overlay
```

**Socket.IO events emitted (phone side):**

```
stop-session  →  Server  {}
  → emitted on Stop button click
```

**Key DOM elements:**

```html
<span id="status-dot"></span>           <!-- green/red via CSS class -->
<span id="countdown">--</span>         <!-- seconds remaining -->
<span id="last-captured">--</span>     <!-- "Last: HH:MM:SS" -->
<div id="frame-saved-overlay">Frame saved</div>  <!-- fade-out overlay -->
<button id="stop-btn">Stop</button>
```

**CSS fade-out approach:**

```css
#frame-saved-overlay {
  opacity: 0;
  transition: opacity 1.5s ease;
}
#frame-saved-overlay.visible {
  opacity: 1;
  transition: none;   /* snap in instantly */
}
```

On `frame-ack`: remove `.visible`, force reflow, then add `.visible` — removing it again after a 50ms delay triggers the CSS transition.
