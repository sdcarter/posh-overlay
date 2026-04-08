# Research: Timed Race Lap Countdown

## Findings

### Current Implementation
- `calculateEstimatedSessionTotal()` in `src/domain/telemetry/lap-count.ts` estimates total race laps for timed races by dividing `sessionTimeRemainSeconds` by `sessionLastLapTimeSeconds` (a single lap time).
- `lapVal()` in the iRacing adapter converts the SDK's 32767 "unlimited" sentinel to `null`, which correctly triggers the timed race path when `sessionLapsTotal` is null.
- The `lapsRemainingForDriver()` function has a guard for `sessionState >= 5 || leaderFinished` that returns 1, but there is no guard for the gap between "timer expired" and "leader crossed the line".

### Problem Analysis

#### 1. Estimation Volatility
`sessionLastLapTimeSeconds` is the iRacing SDK's `LapLastLapTime` — the player's single most recent lap time. In road racing, lap times vary significantly due to traffic, tire degradation, and track position. A single lap time can swing the estimate by 1-2 laps.

**Fix**: Use a rolling average of the player's last 3 lap times. The adapter already maintains a similar pattern for fuel (`fuelUsedHistory`). We add `lapTimeHistory` following the same approach.

#### 2. Timer-Expired Gap
When `sessionTimeRemainSeconds` hits 0, `calculateEstimatedSessionTotal()` computes `Math.round(elapsedLaps + 0)` = just the elapsed laps. This makes `lapsRemainingForDriver()` return 0, but the race isn't over — the leader still needs to cross the finish line.

**Fix**: In `lapsRemainingForDriver()`, when `sessionTimeRemainSeconds <= 0` and the race is still active (no checkered flag), return 1 — the driver must complete their current lap.

#### 3. No Timed Race Mock
All mock scenarios use `sessionLapsTotal: 20` or `12`. There's no way to visually test the timed race path.

**Fix**: Add a `timed` mock scenario with `sessionLapsTotal: null` and a decrementing `sessionTimeRemainSeconds`.

### Reference: How Other Tools Handle This
- **JRT (Joel Real Timing)**: Uses the last 5 laps average of both the leader and the driver to estimate remaining laps. Accounts for leader position relative to the finish line.
- **SDK Gaming Fuel Calculator**: Distinguishes time-limited vs lap-limited races. When time-limited only, "Laps to go" uses time-based estimation.
- **iRDashies**: Uses a session progress bar in standings that tracks session time remaining.

### Decisions

#### 1. Rolling Average in Adapter
Add `lapTimeHistory: number[]` (max 3) to `IRacingTelemetryProvider`. Compute `sessionAvgLapTimeSeconds` as the mean. Expose it on `TelemetrySnapshot`.

#### 2. Domain Uses Average
`calculateEstimatedSessionTotal()` prefers `sessionAvgLapTimeSeconds` over `sessionLastLapTimeSeconds`, falling back to the latter if the average isn't available yet.

#### 3. Timer-Expired Guard in Domain
Add a check in `lapsRemainingForDriver()`: if `sessionTimeRemainSeconds != null && sessionTimeRemainSeconds <= 0` and the race is still active, return 1.

#### 4. Minimal Scope
We do NOT attempt to track the leader's lap time or predict when the leader will cross the line. The player's own rolling average is a reasonable proxy for a personal overlay tool.
