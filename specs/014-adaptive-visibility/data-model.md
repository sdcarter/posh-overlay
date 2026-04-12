# Data Model: Adaptive Dashboard Visibility

**Feature**: 014-adaptive-visibility  
**Phase**: 1 — Design & Contracts  
**Date**: 2026-04-12

---

## Modified Entity: `TelemetrySnapshot`

**File**: `src/domain/telemetry/types.ts`

Two new boolean fields are added to the existing `TelemetrySnapshot` interface:

| Field | Type | Source | Description |
|---|---|---|---|
| `isOnTrack` | `boolean` | `IsOnTrack` (SDK variable) | True if the player's car is on the racing surface with active control |
| `isReplayPlaying` | `boolean` | `IsReplayPlaying` (SDK variable) | True if iRacing is currently in replay mode |

**Validation Rules:**
- `isOnTrack` defaults to `false` when the SDK is disconnected or telemetry is unavailable.
- `isReplayPlaying` defaults to `false` when the SDK is disconnected.
- Both are sourced from the **player-scoped** SDK booleans (not per-car-index arrays).

---

## Derived State: `isVisible`

**Computed in**: `src/renderer/App.tsx`  
**Not stored** — evaluated inline on each `telemetry:update` event.

```
isVisible = frame !== null && frame.snapshot.isOnTrack && !frame.snapshot.isReplayPlaying
```

| Condition | `isOnTrack` | `isReplayPlaying` | `frame` | Result |
|---|---|---|---|---|
| Connected, driving on track | `true` | `false` | present | **Visible** ✅ |
| Connected, in garage / menus | `false` | `false` | present | **Hidden** 🚫 |
| Connected, in pit lane (on track) | `true` | `false` | present | **Visible** ✅ |
| Connected, watching replay | varies | `true` | present | **Hidden** 🚫 |
| iRacing not running | N/A | N/A | `null` | **Hidden** 🚫 |

---

## State Transitions

```
            iRacing closed
[LISTENING] ──────────────→ [LISTENING]
     │
     │ IsSimRunning = true
     ↓
[CONNECTED, WAITING]  (tryReadSnapshot → null → telemetry:waiting IPC)
     │
     │ IsOnTrack = true && IsReplayPlaying = false
     ↓
[VISIBLE]  ←──────────────────────────────────────────┐
     │                                                  │
     │ IsOnTrack = false  OR  IsReplayPlaying = true   │
     ↓                                                  │
[HIDDEN, LISTENING]  ─── IsOnTrack = true, !Replay ───┘
```

---

## IPC Payload Change: `telemetry:update`

The existing `TelemetryFrame` payload sent over `telemetry:update` gains the new fields transparently because `snapshot` is the full `TelemetrySnapshot`:

```typescript
// No structural change to the IPC message — snapshot carries the new fields.
interface TelemetryFrame {
  snapshot: TelemetrySnapshot;  // now includes isOnTrack + isReplayPlaying
  revStrip: RevStripState;
  ribbon: RibbonState;
  useMock: boolean;
}
```

No new IPC channels are introduced.

---

## Mock Scenarios

| Scenario | `isOnTrack` | `isReplayPlaying` | Purpose |
|---|---|---|---|
| `default` (all existing) | `true` | `false` | Normal driving — overlay visible |
| `garage` (new) | `false` | `false` | Driver in garage — verify overlay hides |
| `replay` (new) | `true` | `true` | Replay mode — verify overlay stays hidden |
