# Review — T-06 · Camera Access
Status: PASS

## Acceptance Criteria Results

| # | Criteria (condensed) | Result | Notes |
|---|----------------------|--------|-------|
| 1 | `getUserMedia` called with `{ video: { facingMode: 'environment' }, audio: false }` | ✅ PASS | Exact constraint object on line 107–110 of `phone.html` |
| 2 | Stream assigned to `video.srcObject`; `video.play()` called | ✅ PASS | Lines 112–113; `.catch(() => {})` suppresses unhandled rejection |
| 3 | `<video>` covers full viewport (`width: 100%`, `height: 100%`, `object-fit: cover`) | ✅ PASS | CSS lines 22–30 |
| 4 | Rear-facing camera used on device | ⚠️ MANUAL | `facingMode: 'environment'` is set; physical device required to confirm |
| 5 | `<video>` has `muted`, `autoplay`, `playsinline` as HTML attributes | ✅ PASS | All three on line 86 |
| 6 | Button hidden after stream starts | ✅ PASS | `arm-btn` set to `display: none` on line 114 |
| 7 | Permission denial shows visible error in `#status` | ✅ PASS | `catch` block calls `showStatus()` with descriptive message (line 117) |
| 8 | HTTPS guard message exact wording | ✅ PASS | Line 103 matches spec verbatim |
| 9 | `<video>` exists in markup before tap; hidden initially | ✅ PASS | Line 86 + CSS `display: none` on line 23 |
| 10 | `getUserMedia` not called on page load; only inside click handler | ✅ PASS | `armCamera` wired only to `click` event (line 121); no eager call |
| 11 | Portrait overlay via `@media (orientation: portrait)` CSS, no JS | ✅ PASS | Lines 77–81; JS never references `#portrait-overlay` |
| 12 | Overlay reads "↺ Rotate your phone to landscape"; large, centred | ✅ PASS | Line 89 exact text; `font-size: 28px`, flex centering in CSS |

**Additional check — `stream` at module level:** `let stream = null;` declared on line 93, outside all functions. ✅ PASS

## Verdict

PASS

## Issues Found

None. All 11 automatable ACs pass. AC 4 (rear-camera confirmation) is deferred to T-30 as it requires a physical iOS device under HTTPS.

## Recommendation

SHIP — implementation is complete and correct. Schedule physical-device smoke-test under T-30 to confirm AC 4.

---

_Result key: ✅ PASS · ❌ FAIL · ⚠️ MANUAL (requires physical device or environment — deferred to T-30)_
