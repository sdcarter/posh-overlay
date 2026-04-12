# Research: Adaptive Dashboard Visibility

**Feature**: 014-adaptive-visibility  
**Phase**: 0 — Outline & Research  
**Date**: 2026-04-12

---

## Research 1: SDK Telemetry Variables for Visibility

### Decision
Use `IsOnTrack` (boolean) as the primary visibility gate. Use `IsReplayPlaying` (boolean) as the replay exclusion gate. `SessionState` is **not needed** as a primary gate — it was already mapped in the domain for lap-counting; `IsOnTrack` alone is sufficient for garage/menu detection.

### Rationale
- `IsOnTrack` is `true` only when the **player's car** is physically on the racing surface with active control. It goes `false` immediately when the driver presses Escape, enters the garage, or goes to the pit menu. This makes it the single cleanest gate available.
- `IsReplayPlaying` is `true` whenever iRacing is in replay mode (broadcast or driver-initiated). It is independent of `IsOnTrack`, so replays where the car is on track still correctly suppress the overlay.
- `SessionState` would add conditional complexity for no gain. The user's goal state is already captured cleanly by `IsOnTrack && !IsReplayPlaying`.
- **Source of truth**: `node_modules/@irsdk-node/types/dist/types/telemetry.gen.d.ts`, lines 252–270.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| `SessionState >= 2 && SessionState <= 5` | Overly complex; doesn't correctly capture "in pits on track" vs "in garage" |
| `IsOnTrackCar` | Applies to any car index, not just the player |
| Watching for `CarIdxTrackSurface[playerIdx] == 3` | More granular but adds a per-car index lookup; `IsOnTrack` is already player-scoped |

---

## Research 2: Where to Compute Visibility

### Decision
Compute `isOnTrack: boolean` inside the **existing `startTelemetryLoop()` poll in `src/main/index.ts`** (main process). Push the result as part of the existing `telemetry:update` IPC payload. Do **not** add a new IPC channel.

### Rationale
- The 16ms loop already reads a `TelemetrySnapshot`. The new fields (`isOnTrack`, `isReplayPlaying`) are read from the same telemetry object in the adapter at no extra cost.
- Keeping visibility logic in the main process avoids any renderer-side SDK dependency. The renderer stays purely presentational (constitution requirement: Clean Separation of Concerns).
- Piggybacking on `telemetry:update` avoids a new IPC channel, keeping app code minimal (constitution: Minimal Dependencies).
- When `tryReadSnapshot()` returns `null` (SDK not connected), the existing `telemetry:waiting` branch already fires — the renderer will show `null` frame and can treat it as `isVisible = false`.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| Dedicated `overlay:visibility` IPC channel | Extra complexity; no benefit at 60 Hz update rate |
| Computing visibility in the renderer | Violates Separation of Concerns; renderer must not read SDK data |
| `BrowserWindow.hide()` / `show()` in main | Causes DWM chrome recomposition on Windows; constitution forbids post-creation window toggles |

---

## Research 3: Hiding Strategy — CSS vs Window Flags

### Decision
Use **`visibility: hidden` + `pointer-events: none`** on the top-level React container in the renderer. Do **not** use `BrowserWindow.hide()/show()` or toggle `setIgnoreMouseEvents`.

### Rationale
- The Electron window is already `transparent: true` with `setIgnoreMouseEvents(true)` (locked mode). Hiding the React container via CSS means the window still exists but is completely invisible and non-interactive.
- `display: none` removes elements from the DOM layout and may cause React state resets; `visibility: hidden` is safer for preserving component state and is zero-cost.
- Toggling `BrowserWindow.show()/hide()` causes Windows DWM to recompose the window chrome, which can produce a visible flash and brief frame-time spike — against the "Performance is the Product" principle and the explicit `Electron Window Rules` in the constitution.
- `setIgnoreMouseEvents` is already managed by the lock/unlock system; it must not be repurposed for visibility to avoid interference.
- Zero mouse interception is already guaranteed when locked; when hidden (`visibility: hidden`), no user-perceptible difference exists.

### Alternatives Considered
| Alternative | Why Rejected |
|---|---|
| `BrowserWindow.hide()/show()` | DWM recomposition flash; violates window rules |
| `opacity: 0` | Doesn't remove from z-order interactability in some Electron versions |
| `display: none` | May affect React state; harder to animate later |
| Toggling `setIgnoreMouseEvents` | Already owned by lock system; coupling would cause conflicts |

---

## Research 4: Adapter Changes — Adding Fields

### Decision
Add `isOnTrack: boolean` and `isReplayPlaying: boolean` to `TelemetrySnapshot` in `src/domain/telemetry/types.ts`. Map them in both the iRacing adapter and the mock adapter.

### Rationale
- The domain snapshot is the established contract between adapters and use cases. Adding the two boolean fields here ensures the mock system gets the same treatment as the live adapter.
- The iRacing adapter reads `IsOnTrack` and `IsReplayPlaying` directly from `getTelemetry()`; both are native `boolean[]` SDK variables (no math or derived values needed).
- The mock adapter can default `isOnTrack: true` for most scenarios and add a `garage` scenario with `isOnTrack: false` for validation testing.

---

## Summary: Final Visibility Formula

```
isVisible = snapshot !== null && snapshot.isOnTrack === true && snapshot.isReplayPlaying === false
```

This formula evaluated in the **renderer** (`App.tsx`) against the data arriving via `telemetry:update`.  
No extra IPC, no extra intervals, no state machines.
