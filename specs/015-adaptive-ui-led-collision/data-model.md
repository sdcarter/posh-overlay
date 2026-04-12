# Data Model: Adaptive UI & Session Logic

## TelemetrySnapshot (Updated)

The `TelemetrySnapshot` remains the primary data transport between the main process and the renderer. New fields are added to support the "Source of Truth" requirement.

| Field | Type | Description |
|-------|------|-------------|
| `sessionLapsTotal` | `number \| null` | Raw `SessionLaps` from iRacing SDK. |
| `sessionTimeRemainSeconds` | `number \| null` | Raw `SessionTimeRemain` from iRacing SDK. |
| `isOnTrack` | `boolean` | Raw `IsOnTrack` from iRacing SDK. |
| `isReplayPlaying` | `boolean` | Raw `IsReplayPlaying` from iRacing SDK. |
| `sessionType` | `'lap-based' \| 'time-based'` | Computed: `'lap-based'` if `sessionLapsTotal` is a valid count (< 32767). |

## RibbonState (Updated)

The `RibbonState` is the computed result passed to the renderer for the rectangular info boxes.

| Field | Type | Description |
|-------|------|-------------|
| `lapInfoText` | `string` | Formatted as `Lap X/Y` or `HH:MM:SS` based on `sessionType`. |
| `positionText` | `string` | Formatted as `P[X]`. |
| `visible` | `boolean` | Computed: `isConnected && isOnTrack && !isReplay`. |

## RevStripState (Updated)

New geometry metadata to support dynamic scaling.

| Field | Type | Description |
|-------|------|-------------|
| `ledCount` | `number` | Total number of LEDs in the car's array. |
| `yOffset` | `number` | Calculated vertical shift to ensure 10px clearance. |
| `ledSpacingScale` | `number` | Scale factor (0.0 to 1.0) for LED width to prevent overlap. |
