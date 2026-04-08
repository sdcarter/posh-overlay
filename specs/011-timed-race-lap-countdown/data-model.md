# Data Model: Timed Race Lap Countdown

## Domain Entities

### TelemetrySnapshot (updated)
New field added to support rolling average lap time:
- `sessionAvgLapTimeSeconds: number | null` — Rolling average of the player's last 3 completed lap times. Null when no laps have been completed.

## Adapter State

### IRacingTelemetryProvider (updated)
New private state:
- `lapTimeHistory: number[]` — Rolling window of the player's last 3 lap times (max size 3). Populated on each lap crossing by reading `sessionLastLapTimeSeconds`. Resets when the SDK disconnects.

## Logic Rules

### Rolling Average Calculation
- On each lap crossing (`currentLap > this.latest.currentLap`), push `sessionLastLapTimeSeconds` to `lapTimeHistory`.
- If `lapTimeHistory.length > 3`, shift the oldest entry.
- `sessionAvgLapTimeSeconds = sum(lapTimeHistory) / lapTimeHistory.length`.
- Discard lap times <= 0 (invalid).

### Estimation Priority
In `calculateEstimatedSessionTotal()`:
1. Use `sessionAvgLapTimeSeconds` if available (non-null, > 0).
2. Fall back to `sessionLastLapTimeSeconds` if the average isn't ready yet.

### Timer-Expired Guard
In `lapsRemainingForDriver()`, before the main calculation:
- If `sessionTimeRemainSeconds != null && sessionTimeRemainSeconds <= 0` AND `sessionState < 5` AND `!leaderFinished` AND `!playerFinished` → return 1.
